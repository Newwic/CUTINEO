import { NextRequest, NextResponse } from 'next/server';
import { LineAdapter } from '@/core/adapters/line.adapter';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { requireSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type SendMessageType = 'text' | 'internal_note';

function getRelatedRecord<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = (await request.json()) as {
      conversationId?: unknown;
      content?: unknown;
      messageType?: unknown;
      tenantId?: unknown;
    };

    const conversationId = typeof body.conversationId === 'string' ? body.conversationId : '';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const messageType: SendMessageType =
      body.messageType === 'internal_note' ? 'internal_note' : 'text';

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: 'conversationId and non-empty content are required' },
        { status: 400 },
      );
    }

    if (content.length > 4_000) {
      return NextResponse.json({ error: 'Message is too long' }, { status: 400 });
    }

    const db = requireSupabaseServer();
    const { data: conversation, error: conversationError } = await db
      .from('conversations')
      .select(
        'id, tenant_id, channel_id, contact_id, channels(id, tenant_id, platform, credentials)',
      )
      .eq('id', conversationId)
      .maybeSingle();

    if (conversationError) throw conversationError;
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const requestedTenantId =
      typeof body.tenantId === 'string'
        ? body.tenantId
        : request.headers.get('x-tenant-id') ?? conversation.tenant_id;

    if (requestedTenantId !== conversation.tenant_id) {
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

    const channel = getRelatedRecord<{
      id: string;
      tenant_id: string;
      platform: string;
      credentials: { channelAccessToken?: string };
    }>(conversation.channels);

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
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
