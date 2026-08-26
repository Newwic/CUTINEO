import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  CUTINEO_ACCESS_COOKIE,
  CUTINEO_REFRESH_COOKIE,
  getUserFromCookieTokens,
} from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

/** The product entry point is auth-only; the public marketing pages keep their own routes. */
export default async function HomePage() {
  const cookieStore = await cookies();
  const user = await getUserFromCookieTokens(
    cookieStore.get(CUTINEO_ACCESS_COOKIE)?.value,
    cookieStore.get(CUTINEO_REFRESH_COOKIE)?.value,
  );
  redirect(user ? '/inbox' : '/login');
}
