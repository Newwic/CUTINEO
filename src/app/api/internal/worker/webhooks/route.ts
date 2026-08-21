import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseServer } from '@/lib/supabase/server';
import { AIAgentService } from '@/core/ai/agent.service';
import type { UnifiedIncomingMessage } from '@/core/types/unified';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_JOBS_PER_RUN = 10;

function hasValidWorkerSecret(request: NextRequest): boolean {
  const configured = [process.env.WORKER_SECRET, process.env.CRON_SECRET]
    .filter((value): value is string => Boolean(value && value.length >= 16));
  if (configured.length === 0) return false;

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ?? '';
  if (!token) return false;

  return configured.some((secret) => {
    const received = Buffer.from(token, 'utf8');
    const expected = Buffer.from(secret, 'utf8');
    return received.length === expected.length && crypto.timingSafeEqual(received, expected);
  });
}

function messageType(value: unknown): UnifiedIncomingMessage['messageType'] {
  return value === 'image' ? 'image' : value === 'file' ? 'file' : 'text';
}

async function markJob(
  jobId: string,
  status: 'completed' | 'pending' | 'failed',
  retryAt?: string,
) {
  const db = requireSupabaseServer();
  await db
    .from('webhook_jobs')
    .update({
      status,
      available_at: retryAt ?? new Date().toISOString(),
      completed_at: status === 'completed' ? new Date().toISOString() : null,
      locked_at: null,
      last_error: status === 'completed' ? null : 'Background processing failed.',
    })
    .eq('id', jobId);
}

async function processJob(job: { id: string; tenant_id: string; channel_id: string; conversation_id: string; message_id: string; attempts: number }) {
  const db = requireSupabaseServer();

  const [{ data: channel, error: channelError }, { data: conversation, error: conversationError }, { data: storedMessage, error: messageError }] = await Promise.all([
    db.from('channels').select('id, tenant_id, platform, credentials').eq('id', job.channel_id).eq('tenant_id', job.tenant_id).maybeSingle(),
    db.from('conversations').select('id, tenant_id, contact_id, assigned_to').eq('id', job.conversation_id).eq('tenant_id', job.tenant_id).maybeSingle(),
    db.from('messages').select('id, tenant_id, message_type, content, attachments, platform_message_id, created_at, sender_type').eq('id', job.message_id).eq('tenant_id', job.tenant_id).maybeSingle(),
  ]);

  if (channelError) throw channelError;
  if (conversationError) throw conversationError;
  if (messageError) throw messageError;
  if (!channel || !conversation || !storedMessage) throw new Error('Queued webhook records are missing.');

  if (channel.platform !== 'line' || storedMessage.sender_type !== 'customer') {
    await markJob(job.id, 'completed');
    return;
  }

  // A human handoff that happened after queueing must win over an older AI job.
  if (conversation.assigned_to !== 'ai_agent') {
    await markJob(job.id, 'completed');
    return;
  }

  const { data: identity, error: identityError } = await db
    .from('channel_identities')
    .select('platform_user_id')
    .eq('tenant_id', job.tenant_id)
    .eq('channel_id', job.channel_id)
    .eq('contact_id', conversation.contact_id)
    .maybeSingle();

  if (identityError) throw identityError;
  if (!identity) throw new Error('Queued channel identity is missing.');

  const inbound: UnifiedIncomingMessage = {
    tenantId: job.tenant_id,
    channelId: job.channel_id,
    platform: 'line',
    platformUserId: identity.platform_user_id,
    platformMessageId: storedMessage.platform_message_id ?? storedMessage.id,
    messageType: messageType(storedMessage.message_type),
    content: storedMessage.content ?? '',
    attachments: Array.isArray(storedMessage.attachments) ? storedMessage.attachments : [],
    rawPayload: { queuedMessageId: storedMessage.id },
    timestamp: new Date(storedMessage.created_at).getTime(),
  };

  await AIAgentService.processMessage(channel, conversation, inbound);
  await markJob(job.id, 'completed');
}

async function handle(request: NextRequest) {
  if (!hasValidWorkerSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = requireSupabaseServer();
  const { data: jobs, error: claimError } = await db.rpc('claim_webhook_jobs', {
    p_limit: MAX_JOBS_PER_RUN,
  });
  if (claimError) {
    console.error('[webhook worker] claim failed');
    return NextResponse.json({ error: 'Worker queue unavailable' }, { status: 503 });
  }

  let completed = 0;
  let retried = 0;
  let failed = 0;

  for (const job of (jobs ?? []) as Array<{ id: string; tenant_id: string; channel_id: string; conversation_id: string; message_id: string; attempts: number }>) {
    try {
      await processJob(job);
      completed += 1;
    } catch {
      const attempts = Number(job.attempts ?? 1);
      if (attempts >= 5) {
        await markJob(job.id, 'failed');
        failed += 1;
      } else {
        const delaySeconds = Math.min(300, 2 ** Math.max(0, attempts - 1) * 10);
        await markJob(job.id, 'pending', new Date(Date.now() + delaySeconds * 1000).toISOString());
        retried += 1;
      }
    }
  }

  return NextResponse.json({ claimed: jobs?.length ?? 0, completed, retried, failed });
}

export async function POST(request: NextRequest) {
  return handle(request);
}

export async function GET(request: NextRequest) {
  return handle(request);
}
