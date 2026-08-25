import { createClient, type Session, type User } from '@supabase/supabase-js';
import type { NextRequest, NextResponse } from 'next/server';

export const CUTINEO_ACCESS_COOKIE = 'cutineo_access_token';
export const CUTINEO_REFRESH_COOKIE = 'cutineo_refresh_token';

const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

type SessionTokens = Pick<Session, 'access_token' | 'refresh_token'>
  & Partial<Pick<Session, 'expires_in' | 'expires_at'>>;

function createAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
}

export function setSessionCookies(response: NextResponse, session: SessionTokens): void {
  const accessMaxAge = Math.max(60, Number(session.expires_in) || 3_600);
  const common = cookieOptions();

  response.cookies.set({
    ...common,
    name: CUTINEO_ACCESS_COOKIE,
    value: session.access_token,
    maxAge: accessMaxAge,
  });
  response.cookies.set({
    ...common,
    name: CUTINEO_REFRESH_COOKIE,
    value: session.refresh_token,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

export function clearSessionCookies(response: NextResponse): void {
  const common = { ...cookieOptions(), maxAge: 0 };
  response.cookies.set({ ...common, name: CUTINEO_ACCESS_COOKIE, value: '' });
  response.cookies.set({ ...common, name: CUTINEO_REFRESH_COOKIE, value: '' });
}

export interface RequestAuthState {
  user: User | null;
  /** A refreshed session must be copied to the response by middleware. */
  refreshedSession: Session | null;
  hadSessionCookie: boolean;
}

/**
 * Resolve the request from the HttpOnly session cookies. An access token is
 * checked first; an expired access token can be renewed with the refresh
 * token. The caller decides whether and where to set the refreshed cookies.
 */
export async function getRequestAuth(request: NextRequest): Promise<RequestAuthState> {
  const accessToken = request.cookies.get(CUTINEO_ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(CUTINEO_REFRESH_COOKIE)?.value;
  const empty = {
    user: null,
    refreshedSession: null,
    hadSessionCookie: Boolean(accessToken || refreshToken),
  } satisfies RequestAuthState;
  const client = createAuthClient();
  if (!client) return empty;

  try {
    if (accessToken) {
      const { data } = await client.auth.getUser(accessToken);
      if (data.user) return { ...empty, user: data.user };
    }

    if (refreshToken) {
      const { data, error } = await client.auth.refreshSession({ refresh_token: refreshToken });
      if (!error && data.session?.user) {
        return { user: data.session.user, refreshedSession: data.session, hadSessionCookie: true };
      }
    }
  } catch {
    // Fail closed. Protected routes will go to /login; public routes remain usable.
  }

  return empty;
}

export async function getUserFromCookieTokens(
  accessToken: string | undefined,
  refreshToken: string | undefined,
): Promise<User | null> {
  const client = createAuthClient();
  if (!client) return null;

  try {
    if (accessToken) {
      const { data } = await client.auth.getUser(accessToken);
      if (data.user) return data.user;
    }
    if (refreshToken) {
      const { data } = await client.auth.refreshSession({ refresh_token: refreshToken });
      return data.session?.user ?? null;
    }
  } catch {
    return null;
  }

  return null;
}
