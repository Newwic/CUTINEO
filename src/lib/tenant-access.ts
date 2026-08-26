import type { SupabaseClient, User } from '@supabase/supabase-js';
import {
  getOrganizationMemberships,
  isPlatformOwner,
} from './organization-access';

export interface TenantMembership {
  tenantId: string;
  role: 'owner' | 'admin' | 'agent' | 'viewer';
}

export async function getTenantMemberships(db: SupabaseClient, userId: string): Promise<TenantMembership[]> {
  const memberships = await getOrganizationMemberships(db, userId);
  return memberships.flatMap(({ organizationId, role }): TenantMembership[] => {
    if (role === 'company_owner') return [{ tenantId: organizationId, role: 'owner' as const }];
    if (role === 'admin') return [{ tenantId: organizationId, role: 'admin' as const }];
    if (role === 'viewer') return [{ tenantId: organizationId, role: 'viewer' as const }];
    if (role === 'agent' || role === 'warehouse') return [{ tenantId: organizationId, role: 'agent' as const }];
    return [];
  });
}

export async function isPlatformAdmin(db: SupabaseClient, user: User): Promise<boolean> {
  return isPlatformOwner(db, user);
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
