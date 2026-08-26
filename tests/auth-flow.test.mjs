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

test('Viewer is read-only in both UI and API', () => {
  const roleAccess = read('src/lib/tenant-access.ts');
  const sendRoute = read('src/app/api/messages/send/route.ts');
  const chatArea = read('src/app/dashboard/inbox/components/ChatArea.tsx');
  const migration = read('supabase/migrations/004_add_viewer_role.sql');
  const adminRoute = read('src/app/api/admin/ai-usage/route.ts');

  assert.match(roleAccess, /'owner' \| 'admin' \| 'agent' \| 'viewer'/);
  assert.match(sendRoute, /membership\.role === 'viewer'/);
  assert.match(chatArea, /canSend/);
  assert.match(migration, /'viewer'/);
  assert.match(adminRoute, /membership\.role === 'owner' \|\| membership\.role === 'admin'/);
});

test('Phase 1 establishes a canonical organization boundary and role model', () => {
  const migration = read('supabase/migrations/005_organizations_rbac_tenant_boundary.sql');
  const organizationAccess = read('src/lib/organization-access.ts');
  const tenantAccess = read('src/lib/tenant-access.ts');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.organizations/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.organization_members/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.roles/);
  assert.match(migration, /RPV Industrial Supply Co\., Ltd\./);
  assert.match(migration, /organization_id UUID/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.is_organization_member/);
  assert.match(migration, /CREATE TRIGGER audit_logs_immutable/);
  assert.match(organizationAccess, /getOrganizationMemberships/);
  assert.match(organizationAccess, /assertStockWriteAccess/);
  assert.match(tenantAccess, /getOrganizationMemberships/);
  assert.doesNotMatch(tenantAccess, /\.from\(['"]tenant_members['"]\)/);
});

test('Stock role policy excludes legacy Inbox agents and viewers from writes', () => {
  const organizationAccess = read('src/lib/organization-access.ts');

  assert.match(organizationAccess, /role === 'warehouse'/);
  assert.match(organizationAccess, /role === 'viewer'/);
  assert.match(organizationAccess, /'agent'/);
  assert.match(organizationAccess, /export function canWriteStock/);
  assert.match(organizationAccess, /role === 'company_owner'/);
  assert.match(organizationAccess, /role === 'admin'/);
});
