import { NextRequest, NextResponse } from 'next/server';
import { LineAdapter } from '@/core/adapters/line.adapter';
import { requireSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const MAX_BODY_BYTES = 2 * 1024 * 1024;

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
    const declaredLength = Number(request.headers.get('content-length') ?? 0);
    if (declaredLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const signature = request.headers.get('x-line-signature') ?? '';
    const db = requireSupabaseServer();

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

    let messages;
    try {
      messages = await LineAdapter.normalize(payload, channel.id, channel.tenant_id);
    } catch {
      return NextResponse.json({ error: 'Invalid LINE payload' }, { status: 400 });
    }

    for (const message of messages) {
      const identity = await findOrCreateIdentity(db, channel, message.platformUserId);
      const conversation = await findOrCreateConversation(db, channel, identity.contact_id);

      const { data: insertedMessage, error: messageError } = await db.from('messages').insert({
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
      }).select('id').single();

      // The database unique index on platform_message_id is the durable
      // idempotency boundary. Redis is intentionally not used before this
      // insert, otherwise a transient DB failure could permanently drop an
      // inbound customer message.
      if (messageError) {
        if (isUniqueViolation(messageError)) continue;
        throw messageError;
      }
      if (!insertedMessage) throw new Error('Inbound message was not persisted.');

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
        const { error: queueError } = await db.from('webhook_jobs').upsert(
          {
            tenant_id: channel.tenant_id,
            channel_id: channel.id,
            conversation_id: conversation.id,
            message_id: insertedMessage.id,
            status: 'pending',
            available_at: new Date().toISOString(),
          },
          { onConflict: 'message_id', ignoreDuplicates: true },
        );
        if (queueError) throw queueError;
      }
    }

    return NextResponse.json({ status: 'queued', count: messages.length }, { status: 200 });
  } catch (error) {
    console.error('[LINE webhook] request failed', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
