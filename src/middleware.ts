import { NextRequest, NextResponse } from 'next/server';
import { pathWithSearch, sanitizeRedirectPath } from '@/lib/auth/redirect';
import {
  clearSessionCookies,
  getRequestAuth,
  setSessionCookies,
} from '@/lib/supabase/session';

function applyAuthCookies(response: NextResponse, auth: Awaited<ReturnType<typeof getRequestAuth>>) {
  if (auth.refreshedSession) setSessionCookies(response, auth.refreshedSession);
  if (!auth.user && auth.hadSessionCookie) clearSessionCookies(response);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

function isProtectedPath(pathname: string): boolean {
  return pathname === '/inbox'
    || pathname.startsWith('/inbox/')
    || pathname === '/dashboard'
    || pathname.startsWith('/dashboard/')
    || pathname === '/app'
    || pathname.startsWith('/app/')
    || pathname === '/settings'
    || pathname.startsWith('/settings/');
}

function loginRedirect(request: NextRequest, target: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  if (target !== '/inbox') url.searchParams.set('next', target);
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const auth = await getRequestAuth(request);
  const currentPath = pathWithSearch(pathname, search);

  if (pathname === '/') {
    const response = auth.user
      ? NextResponse.redirect(new URL('/inbox', request.url))
      : NextResponse.redirect(new URL('/login', request.url));
    return applyAuthCookies(response, auth);
  }

  if (pathname === '/login') {
    if (auth.user) {
      const destination = sanitizeRedirectPath(request.nextUrl.searchParams.get('next'));
      return applyAuthCookies(NextResponse.redirect(new URL(destination, request.url)), auth);
    }
    return applyAuthCookies(NextResponse.next(), auth);
  }

  if (pathname === '/register' || pathname === '/signup') {
    if (auth.user) return applyAuthCookies(NextResponse.redirect(new URL('/inbox', request.url)), auth);
    const url = new URL('/login', request.url);
    url.searchParams.set('registration', 'disabled');
    return applyAuthCookies(NextResponse.redirect(url), auth);
  }

  if (pathname === '/dashboard/inbox' || pathname.startsWith('/dashboard/inbox/')) {
    if (!auth.user) return applyAuthCookies(loginRedirect(request, currentPath), auth);
    const destination = pathname === '/dashboard/inbox'
      ? '/inbox'
      : `/inbox${search}`;
    return applyAuthCookies(NextResponse.redirect(new URL(destination, request.url)), auth);
  }

  if (isProtectedPath(pathname) && !auth.user) {
    return applyAuthCookies(loginRedirect(request, currentPath), auth);
  }

  return applyAuthCookies(NextResponse.next(), auth);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|offline.html|icons/|assets/|api/).*)',
  ],
};
