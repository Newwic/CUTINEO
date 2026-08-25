import { createClient, type User } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import {
  CUTINEO_ACCESS_COOKIE,
  CUTINEO_REFRESH_COOKIE,
} from './session';

export { CUTINEO_ACCESS_COOKIE, CUTINEO_REFRESH_COOKIE } from './session';

export async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  const authorization = request.headers.get('authorization');
  const token = authorization?.replace(/^Bearer\s+/i, '').trim();
  const cookieToken = request.cookies.get(CUTINEO_ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(CUTINEO_REFRESH_COOKIE)?.value;
  const accessToken = token || cookieToken;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if ((!accessToken && !refreshToken) || !url || !anonKey) return null;

  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (accessToken) {
    const { data } = await client.auth.getUser(accessToken);
    if (data.user) return data.user;
  }

  // API calls may arrive while the short-lived access cookie is expiring.
  // Refreshing here keeps the request secure; middleware will persist the
  // rotated cookies on the next page request.
  if (!refreshToken) return null;
  const refreshed = await client.auth.refreshSession({ refresh_token: refreshToken });
  return refreshed.data.session?.user ?? null;
}
