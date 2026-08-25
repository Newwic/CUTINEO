import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseClient: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          // The browser keeps only an in-memory session. Long-lived session
          // persistence lives in the HttpOnly cookie bridge on the server.
          persistSession: false,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export function requireSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error(
      'Supabase browser client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  return supabaseClient;
}

interface SessionBridgeResponse {
  session?: {
    access_token?: unknown;
    refresh_token?: unknown;
  };
}

export async function syncSupabaseSession(session: Session): Promise<void> {
  if (typeof window === 'undefined') return;

  const response = await fetch('/api/auth/session', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      expires_at: session.expires_at,
    }),
  });

  if (!response.ok) throw new Error('สร้าง secure session ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
}

export async function bootstrapSupabaseSession(): Promise<Session | null> {
  if (!supabaseClient || typeof window === 'undefined') return null;

  const current = await supabaseClient.auth.getSession();
  if (current.data.session) return current.data.session;

  const response = await fetch('/api/auth/session', {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!response.ok) return null;

  const payload = await response.json().catch(() => null) as SessionBridgeResponse | null;
  const accessToken = payload?.session?.access_token;
  const refreshToken = payload?.session?.refresh_token;
  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') return null;

  const { data, error } = await supabaseClient.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return error ? null : data.session;
}

export async function getCurrentSupabaseSession(): Promise<Session | null> {
  if (!supabaseClient) return null;
  const session = await bootstrapSupabaseSession();
  return session ?? (await supabaseClient.auth.getSession()).data.session;
}

export async function clearSupabaseSession(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    if (supabaseClient) await supabaseClient.auth.signOut();
  } finally {
    await fetch('/api/auth/session', {
      method: 'DELETE',
      credentials: 'include',
      cache: 'no-store',
    });
  }
}
