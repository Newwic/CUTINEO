import { createClient, type User } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  const authorization = request.headers.get('authorization');
  const token = authorization?.replace(/^Bearer\s+/i, '').trim();

  if (!token || !url || !anonKey) return null;

  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await client.auth.getUser(token);
  if (error) return null;
  return data.user;
}
