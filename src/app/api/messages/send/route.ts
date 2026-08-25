import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { LineAdapter } from '@/core/adapters/line.adapter';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { enforceRateLimit } from '@/lib/rate-limit';
import { requireSupabaseServer } from '@/lib/supabase/server';
import { getTenantMemberships } from '@/lib/tenant-access';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 16 * 1024;

const SendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().trim().min(1).max(4_000),
  messageType: z.enum(['text', 'internal_note']).default('text'),
  // This is accepted only as a consistency check. Authorization is always
  // derived from the conversation and the authenticated user's membership.
  tenantId: z.string().uuid().optional(),
}).strict();

function clientAddress(request: NextRequest): string {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

function getRelatedRecord<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function POST(request: NextRequest) {
  try {
    const declaredLength = Number(request.headers.get('content-length') ?? 0);
    if (declaredLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request is too large' }, { status: 413 });
    }

    const ipRate = await enforceRateLimit(`messages:send:ip:${clientAddress(request)}`, 60, 60);
    if (!ipRate.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(ipRate.retryAfter) } },
      );
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request is too large' }, { status: 413 });
    }

    let rawBody: unknown;
    try {
      rawBody = JSON.parse(bodyText);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsedBody = SendMessageSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid message payload' }, { status: 400 });
    }

    const { conversationId, content, messageType, tenantId } = parsedBody.data;

    const db = requireSupabaseServer();
    const memberships = await getTenantMemberships(db, user.id);
    const tenantIds = memberships.map((membership) => membership.tenantId);
    if (tenantIds.length === 0) {
      return NextResponse.json({ error: 'You are not a member of a workspace' }, { status: 403 });
    }
    const { data: conversation, error: conversationError } = await db
      .from('conversations')
      .select(
        'id, tenant_id, channel_id, contact_id, channels(id, tenant_id, platform, credentials)',
      )
      .eq('id', conversationId)
      .in('tenant_id', tenantIds)
      .maybeSingle();

    if (conversationError) throw conversationError;
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (tenantId && tenantId !== conversation.tenant_id) {
      return NextResponse.json({ error: 'Tenant scope mismatch' }, { status: 403 });
    }

    const { data: membership, error: membershipError } = await db
      .from('tenant_members')
      .select('role')
      .eq('tenant_id', conversation.tenant_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this workspace' }, { status: 403 });
    }

    const userRate = await enforceRateLimit(
      `messages:send:user:${user.id}:tenant:${conversation.tenant_id}`,
      120,
      60,
    );
    if (!userRate.allowed) {
      return NextResponse.json(
        { error: 'User message rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': String(userRate.retryAfter) } },
      );
    }

    const tenantRate = await enforceRateLimit(
      `messages:send:tenant:${conversation.tenant_id}`,
      300,
      60,
    );
    if (!tenantRate.allowed) {
      return NextResponse.json(
        { error: 'Tenant message rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': String(tenantRate.retryAfter) } },
      );
    }

    const channel = getRelatedRecord<{
      id: string;
      tenant_id: string;
      platform: string;
      credentials: { channelAccessToken?: string };
    }>(conversation.channels);

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }
    if (channel.tenant_id !== conversation.tenant_id) {
      return NextResponse.json({ error: 'Tenant scope mismatch' }, { status: 403 });
    }

    if (messageType === 'text') {
      if (channel.platform !== 'line') {
        return NextResponse.json(
          { error: `The ${channel.platform} adapter is not enabled yet` },
          { status: 400 },
        );
      }

      const { data: identity, error: identityError } = await db
        .from('channel_identities')
        .select('platform_user_id')
        .eq('tenant_id', conversation.tenant_id)
        .eq('channel_id', conversation.channel_id)
        .eq('contact_id', conversation.contact_id)
        .maybeSingle();

      if (identityError) throw identityError;
      if (!identity) {
        return NextResponse.json({ error: 'Channel identity not found' }, { status: 404 });
      }

      await LineAdapter.sendOutbound(
        { channelAccessToken: channel.credentials?.channelAccessToken ?? '' },
        {
          recipientPlatformId: identity.platform_user_id,
          messageType: 'text',
          text: content,
        },
      );
    }

    const now = new Date().toISOString();
    const { data: insertedMessage, error: messageError } = await db
      .from('messages')
      .insert({
        tenant_id: conversation.tenant_id,
        conversation_id: conversation.id,
        sender_type: messageType === 'internal_note' ? 'human_agent' : 'human_agent',
        sender_id: user.id,
        message_type: messageType,
        content,
        is_read: true,
        created_at: now,
      })
      .select()
      .single();

    if (messageError) throw messageError;

    const { error: updateError } = await db
      .from('conversations')
      .update({
        assigned_to: 'human_agent',
        last_message_preview: content.slice(0, 500),
        last_message_at: now,
      })
      .eq('id', conversation.id)
      .eq('tenant_id', conversation.tenant_id);

    if (updateError) throw updateError;

    return NextResponse.json(insertedMessage, { status: 201 });
  } catch (error) {
    console.error('[messages/send] request failed', error);
    return NextResponse.json({ error: 'Unable to send message' }, { status: 500 });
  }
}
