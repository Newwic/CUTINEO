import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqualText, verifyFacebookSignature } from '@/lib/facebook-crypto';
import { requireSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 2 * 1024 * 1024;

type FacebookCredentials = {
  appSecret?: unknown;
  verifyToken?: unknown;
};

function credentialsOf(value: unknown): FacebookCredentials {
  return value && typeof value === 'object' ? value as FacebookCredentials : {};
}

async function findChannel(channelId: string) {
  const db = requireSupabaseServer();
  const result = await db
    .from('channels')
    .select('id, tenant_id, platform, credentials, is_active')
    .eq('id', channelId)
    .eq('platform', 'facebook')
    .eq('is_active', true)
    .maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  try {
    const { channelId } = await params;
    const mode = request.nextUrl.searchParams.get('hub.mode') ?? '';
    const token = request.nextUrl.searchParams.get('hub.verify_token') ?? '';
    const challenge = request.nextUrl.searchParams.get('hub.challenge') ?? '';
    const channel = await findChannel(channelId);
    const configuredToken = credentialsOf(channel?.credentials).verifyToken;

    if (
      channel &&
      mode === 'subscribe' &&
      typeof configuredToken === 'string' &&
      timingSafeEqualText(token, configuredToken) &&
      challenge.length <= 512
    ) {
      return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    return new Response('Forbidden', { status: 403 });
  } catch (error) {
    console.error('[Facebook webhook] verification failed', error);
    return new Response('Forbidden', { status: 403 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  try {
    const { channelId } = await params;
    const declaredLength = Number(request.headers.get('content-length') ?? 0);
    if (declaredLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const channel = await findChannel(channelId);
    if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });

    const appSecret = credentialsOf(channel.credentials).appSecret;
    const signature = request.headers.get('x-hub-signature-256') ?? '';
    if (typeof appSecret !== 'string' || !verifyFacebookSignature(rawBody, signature, appSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Invalid Facebook payload' }, { status: 400 });
    }

    const entries = (payload as { entry?: unknown }).entry;
    if (!Array.isArray(entries) || entries.length > 50) {
      return NextResponse.json({ error: 'Invalid Facebook entries' }, { status: 400 });
    }

    // Signature verification and bounded parsing are complete here. Message
    // normalization is intentionally a separate adapter/worker concern so a
    // provider retry cannot block the webhook response.
    return NextResponse.json({ status: 'accepted', count: entries.length });
  } catch (error) {
    console.error('[Facebook webhook] request failed', error);
    return NextResponse.json({ error: 'Webhook unavailable' }, { status: 503 });
  }
}
