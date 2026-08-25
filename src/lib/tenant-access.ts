import type { SupabaseClient, User } from '@supabase/supabase-js';

export interface TenantMembership {
  tenantId: string;
  role: 'owner' | 'admin' | 'agent' | 'viewer';
}

export async function getTenantMemberships(db: SupabaseClient, userId: string): Promise<TenantMembership[]> {
  const { data, error } = await db
    .from('tenant_members')
    .select('tenant_id, role')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).flatMap((row) => {
    if (row.role !== 'owner' && row.role !== 'admin' && row.role !== 'agent' && row.role !== 'viewer') return [];
    return [{ tenantId: row.tenant_id as string, role: row.role }];
  });
}

export async function isPlatformAdmin(db: SupabaseClient, user: User): Promise<boolean> {
  const configuredIds = (process.env.CUTINEO_PLATFORM_ADMIN_USER_IDS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (configuredIds.includes(user.id)) return true;
  try {
    const { data } = await db.from('platform_admins').select('user_id').eq('user_id', user.id).maybeSingle();
    return Boolean(data?.user_id);
  } catch {
    return false;
  }
}

export async function resolveCompanyForUser(
  db: SupabaseClient,
  user: User,
  requestedCompanyId?: string | null,
): Promise<TenantMembership> {
  const memberships = await getTenantMemberships(db, user.id);
  const match = requestedCompanyId
    ? memberships.find((membership) => membership.tenantId === requestedCompanyId)
    : memberships[0];
  if (!match) throw new Error('Workspace access denied');
  return match;
}

export function assertAdminRole(membership: TenantMembership): void {
  if (membership.role !== 'owner' && membership.role !== 'admin') throw new Error('Admin access required');
}
