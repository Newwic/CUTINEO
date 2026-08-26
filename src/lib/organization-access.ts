import type { SupabaseClient, User } from '@supabase/supabase-js';

export const ORGANIZATION_ROLES = [
  'platform_owner',
  'company_owner',
  'admin',
  'warehouse',
  'viewer',
  'agent',
] as const;

export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

export interface OrganizationMembership {
  organizationId: string;
  role: OrganizationRole;
}

export interface OrganizationContext extends OrganizationMembership {
  isPlatformOwner: boolean;
}

export class OrganizationAccessError extends Error {
  readonly status: 401 | 403 | 404;

  constructor(message: string, status: 401 | 403 | 404 = 403) {
    super(message);
    this.name = 'OrganizationAccessError';
    this.status = status;
  }
}

function parseRole(value: unknown): OrganizationRole | null {
  return typeof value === 'string' && (ORGANIZATION_ROLES as readonly string[]).includes(value)
    ? value as OrganizationRole
    : null;
}

/**
 * Canonical organization membership lookup. All server-side business APIs
 * should resolve access from this table before querying business data.
 */
export async function getOrganizationMemberships(
  db: SupabaseClient,
  userId: string,
): Promise<OrganizationMembership[]> {
  const { data, error } = await db
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', userId);

  if (error) throw error;

  return (data ?? []).flatMap((row) => {
    const role = parseRole(row.role);
    if (!role || typeof row.organization_id !== 'string') return [];
    return [{ organizationId: row.organization_id, role }];
  });
}

/** Platform owners are configured server-side or recorded in the DB. */
export async function isPlatformOwner(db: SupabaseClient, user: User): Promise<boolean> {
  const configuredIds = (process.env.CUTINEO_PLATFORM_ADMIN_USER_IDS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (configuredIds.includes(user.id)) return true;

  try {
    const { data } = await db
      .from('platform_admins')
      .select('user_id, role')
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])
      .maybeSingle();
    return Boolean(data?.user_id);
  } catch {
    return false;
  }
}

/**
 * Resolve one explicit organization. Platform owners must still provide the
 * organization id when acting on company data; this prevents accidental
 * cross-company writes caused by an implicit "first organization" fallback.
 */
export async function resolveOrganizationForUser(
  db: SupabaseClient,
  user: User,
  requestedOrganizationId?: string | null,
): Promise<OrganizationContext> {
  const platformOwner = await isPlatformOwner(db, user);
  if (platformOwner && requestedOrganizationId) {
    return { organizationId: requestedOrganizationId, role: 'platform_owner', isPlatformOwner: true };
  }

  const memberships = await getOrganizationMemberships(db, user.id);
  const membership = requestedOrganizationId
    ? memberships.find(({ organizationId }) => organizationId === requestedOrganizationId)
    : memberships[0];

  if (!membership) throw new OrganizationAccessError('Organization access denied', 403);
  return { ...membership, isPlatformOwner: platformOwner };
}

export function canReadStock(role: OrganizationRole): boolean {
  return role === 'platform_owner'
    || role === 'company_owner'
    || role === 'admin'
    || role === 'warehouse'
    || role === 'viewer';
}

export function canWriteStock(role: OrganizationRole): boolean {
  return role === 'platform_owner'
    || role === 'company_owner'
    || role === 'admin'
    || role === 'warehouse';
}

export function assertStockReadAccess(context: OrganizationContext): void {
  if (!canReadStock(context.role)) throw new OrganizationAccessError('Stock read access required', 403);
}

export function assertStockWriteAccess(context: OrganizationContext): void {
  if (!canWriteStock(context.role)) throw new OrganizationAccessError('Stock write access required', 403);
}
