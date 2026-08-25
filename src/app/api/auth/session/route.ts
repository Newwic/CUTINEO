import { createClient, type Session } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import {
  clearSessionCookies,
  CUTINEO_ACCESS_COOKIE,
  CUTINEO_REFRESH_COOKIE,
  setSessionCookies,
} from '@/lib/supabase/session';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type SessionPayload = Pick<Session, 'access_token' | 'refresh_token'>
  & Partial<Pick<Session, 'expires_in' | 'expires_at'>>;

function authClient() {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function noStore(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export async function POST(request: NextRequest) {
  const client = authClient();
  if (!client) return noStore(NextResponse.json({ error: 'Authentication is not configured' }, { status: 503 }));

  const body = await request.json().catch(() => null) as Partial<SessionPayload> | null;
  if (
    typeof body?.access_token !== 'string'
    || typeof body.refresh_token !== 'string'
    || body.access_token.length < 20
    || body.refresh_token.length < 20
  ) {
    return noStore(NextResponse.json({ error: 'Invalid session' }, { status: 400 }));
  }

  const { data, error } = await client.auth.setSession({
    access_token: body.access_token,
    refresh_token: body.refresh_token,
  });
  if (error || !data.session) {
    return noStore(NextResponse.json({ error: 'Invalid session' }, { status: 401 }));
  }

  const response = NextResponse.json({ ok: true }, { status: 200 });
  setSessionCookies(response, data.session);
  return noStore(response);
}

export async function GET(request: NextRequest) {
  const client = authClient();
  if (!client) return noStore(NextResponse.json({ error: 'Authentication is not configured' }, { status: 503 }));

  const accessToken = request.cookies.get(CUTINEO_ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(CUTINEO_REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    const response = noStore(NextResponse.json({ error: 'No session' }, { status: 401 }));
    clearSessionCookies(response);
    return response;
  }

  const result = accessToken
    ? await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
    : await client.auth.refreshSession({ refresh_token: refreshToken });
  if (result.error || !result.data.session) {
    const response = noStore(NextResponse.json({ error: 'Session expired' }, { status: 401 }));
    clearSessionCookies(response);
    return response;
  }

  const session = result.data.session;
  const response = NextResponse.json({
    session: {
      // These tokens are returned only to the in-memory Supabase client. The
      // durable copy remains HttpOnly and is never written to localStorage.
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    },
  });
  setSessionCookies(response, session);
  return noStore(response);
}

export async function DELETE() {
  const response = noStore(new NextResponse(null, { status: 204 }));
  clearSessionCookies(response);
  return response;
}
