import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('root and protected routes use the login/inbox flow', () => {
  const middleware = read('src/middleware.ts');
  const rootPage = read('src/app/page.tsx');
  const inboxPage = read('src/app/inbox/page.tsx');

  assert.match(middleware, /pathname === '\/'/);
  assert.match(middleware, /NextResponse\.redirect\(new URL\('\/inbox'/);
  assert.match(middleware, /NextResponse\.redirect\(new URL\('\/login'/);
  assert.match(middleware, /pathname === '\/inbox'/);
  assert.match(middleware, /loginRedirect\(request, currentPath\)/);
  assert.match(rootPage, /redirect\(user \? '\/inbox' : '\/login'\)/);
  assert.match(inboxPage, /dashboard\/inbox\/page/);
});

test('login uses the real Supabase sign-in and never exposes a demo path', () => {
  const login = read('src/app/login/LoginForm.tsx');
  const client = read('src/lib/supabase/client.ts');

  assert.match(login, /signInWithPassword/);
  assert.match(login, /syncSupabaseSession/);
  assert.match(login, /destination as never/);
  assert.doesNotMatch(login, /signUp/);
  assert.doesNotMatch(login, /Demo Inbox/);
  assert.match(client, /persistSession: false/);
  assert.doesNotMatch(client, /localStorage/);
});

test('session and logout data are private', () => {
  const sessionRoute = read('src/app/api/auth/session/route.ts');
  const sessionHelper = read('src/lib/supabase/session.ts');
  const auth = read('src/lib/supabase/auth.ts');
  const inbox = read('src/app/dashboard/inbox/page.tsx');
  const serviceWorker = read('public/sw.js');

  assert.match(sessionHelper, /httpOnly/);
  assert.match(sessionRoute, /clearSessionCookies/);
  assert.match(auth, /CUTINEO_ACCESS_COOKIE/);
  assert.match(inbox, /clearSupabaseSession/);
  assert.match(inbox, /clearPrivateCaches/);
  assert.match(inbox, /window\.location\.replace\('\/login'/);
  assert.match(serviceWorker, /url\.pathname\.includes\('\/api\/'\)/);
});

test('Inbox API scopes queries to memberships from the authenticated user', () => {
  const inboxRoute = read('src/app/api/inbox/route.ts');
  const messageRoute = read('src/app/api/inbox/[conversationId]/messages/route.ts');
  const sendRoute = read('src/app/api/messages/send/route.ts');

  assert.match(inboxRoute, /getTenantMemberships/);
  assert.match(inboxRoute, /\.in\('tenant_id', tenantIds\)/);
  assert.match(messageRoute, /\.in\('tenant_id', tenantIds\)/);
  assert.match(messageRoute, /\.eq\('tenant_id', conversation\.tenant_id\)/);
  assert.match(sendRoute, /\.in\('tenant_id', tenantIds\)/);
});

test('settings performs a server-side Owner/Admin check', () => {
  const settings = read('src/app/settings/page.tsx');

  assert.match(settings, /getUserFromCookieTokens/);
  assert.match(settings, /getTenantMemberships/);
  assert.match(settings, /role === 'owner' \|\| role === 'admin'/);
  assert.match(settings, /redirect\('\/inbox\?error=forbidden'\)/);
});
