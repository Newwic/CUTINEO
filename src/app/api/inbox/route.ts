import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { getTenantMemberships } from '@/lib/tenant-access';
import { requireSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  try {
    const db = requireSupabaseServer();
    const memberships = await getTenantMemberships(db, user.id);
    const tenantIds = memberships.map((membership) => membership.tenantId);
    if (tenantIds.length === 0) {
      return NextResponse.json({ conversations: [], memberships: [] });
    }

    const { data, error } = await db
      .from('conversations')
      .select(
        'id, tenant_id, channel_id, contact_id, status, assigned_to, last_message_preview, last_message_at, created_at, updated_at, contacts(id, display_name, phone, email, avatar_url, tags, notes, created_at), channels(id, tenant_id, platform, name, is_active)',
      )
      .in('tenant_id', tenantIds)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ conversations: data ?? [], memberships }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('[inbox] failed to load tenant-scoped conversations', error);
    return NextResponse.json({ error: 'Unable to load inbox' }, { status: 500 });
  }
}
