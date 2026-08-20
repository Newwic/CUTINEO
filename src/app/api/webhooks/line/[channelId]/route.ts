import { NextRequest, NextResponse } from 'next/server';
import { AIAgentService } from '@/core/ai/agent.service';
import { LineAdapter } from '@/core/adapters/line.adapter';
import { requireRedis } from '@/lib/redis';
import { requireSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === '23505';
}

async function findOrCreateIdentity(
  db: ReturnType<typeof requireSupabaseServer>,
  channel: { id: string; tenant_id: string },
  platformUserId: string,
) {
  const existing = await db
    .from('channel_identities')
    .select('*, contacts(*)')
    .eq('channel_id', channel.id)
    .eq('platform_user_id', platformUserId)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data) return existing.data;

  const contact = await db
    .from('contacts')
    .insert({
      tenant_id: channel.tenant_id,
      display_name: `LINE User (${platformUserId.slice(-4)})`,
    })
    .select()
    .single();

  if (contact.error || !contact.data) throw contact.error ?? new Error('Contact creation failed.');

  const identity = await db
    .from('channel_identities')
    .insert({
      tenant_id: channel.tenant_id,
      contact_id: contact.data.id,
      channel_id: channel.id,
      platform_user_id: platformUserId,
    })
    .select('*, contacts(*)')
    .single();

  if (!identity.error && identity.data) return identity.data;

  if (isUniqueViolation(identity.error)) {
    const retry = await db
      .from('channel_identities')
      .select('*, contacts(*)')
      .eq('channel_id', channel.id)
      .eq('platform_user_id', platformUserId)
      .single();
    if (retry.error || !retry.data) throw retry.error ?? new Error('Identity lookup failed.');
    return retry.data;
  }

  throw identity.error ?? new Error('Identity creation failed.');
}

async function findOrCreateConversation(
  db: ReturnType<typeof requireSupabaseServer>,
  channel: { id: string; tenant_id: string },
  contactId: string,
) {
  const existing = await db
    .from('conversations')
    .select('*')
    .eq('channel_id', channel.id)
    .eq('contact_id', contactId)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data) return existing.data;

  const conversation = await db
    .from('conversations')
    .insert({
      tenant_id: channel.tenant_id,
      channel_id: channel.id,
      contact_id: contactId,
      assigned_to: 'ai_agent',
      status: 'open',
    })
    .select()
    .single();

  if (!conversation.error && conversation.data) return conversation.data;

  if (isUniqueViolation(conversation.error)) {
    const retry = await db
      .from('conversations')
      .select('*')
      .eq('channel_id', channel.id)
      .eq('contact_id', contactId)
      .single();
    if (retry.error || !retry.data) {
      throw retry.error ?? new Error('Conversation lookup failed.');
    }
    return retry.data;
  }

  throw conversation.error ?? new Error('Conversation creation failed.');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { channelId: string } },
) {
  try {
    const bodyText = await request.text();
    const signature = request.headers.get('x-line-signature') ?? '';
    const db = requireSupabaseServer();
    const dedup = requireRedis();

    const { data: channel, error: channelError } = await db
      .from('channels')
      .select('*')
      .eq('id', params.channelId)
      .eq('platform', 'line')
      .eq('is_active', true)
      .maybeSingle();

    if (channelError) throw channelError;
    if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });

    const credentials = channel.credentials as {
      channelSecret?: string;
      channelAccessToken?: string;
    };

    if (
      !LineAdapter.verifySignature(bodyText, signature, credentials.channelSecret ?? '')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload: { events?: unknown[] };
    try {
      payload = JSON.parse(bodyText) as { events?: unknown[] };
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const messages = await LineAdapter.normalize(payload, channel.id, channel.tenant_id);

    for (const message of messages) {
      const isNew = await dedup.set(`dedup:${message.platformMessageId}`, '1', {
        nx: true,
        ex: 86_400,
      });
      if (!isNew) continue;

      const identity = await findOrCreateIdentity(db, channel, message.platformUserId);
      const conversation = await findOrCreateConversation(db, channel, identity.contact_id);

      const { error: messageError } = await db.from('messages').insert({
        tenant_id: channel.tenant_id,
        conversation_id: conversation.id,
        sender_type: 'customer',
        sender_id: message.platformUserId,
        message_type: message.messageType,
        content: message.content,
        attachments: message.attachments,
        platform_message_id: message.platformMessageId,
        is_read: false,
        created_at: new Date(message.timestamp).toISOString(),
      });

      if (messageError && !isUniqueViolation(messageError)) throw messageError;

      const { error: conversationError } = await db
        .from('conversations')
        .update({
          last_message_preview: message.content.slice(0, 500),
          last_message_at: new Date(message.timestamp).toISOString(),
          status: 'open',
        })
        .eq('id', conversation.id)
        .eq('tenant_id', channel.tenant_id);

      if (conversationError) throw conversationError;

      if (conversation.assigned_to === 'ai_agent') {
        try {
          await AIAgentService.processMessage(channel, conversation, message);
        } catch (error) {
          console.error('[LINE webhook] AI processing failed', error);
          await db
            .from('conversations')
            .update({ assigned_to: 'human_agent', status: 'pending_human' })
            .eq('id', conversation.id)
            .eq('tenant_id', channel.tenant_id);
        }
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('[LINE webhook] request failed', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
