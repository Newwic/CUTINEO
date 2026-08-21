import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { requireSupabaseServer } from '@/lib/supabase/server';
import { getCompanyUsage } from '@/core/billing/usage';
import { resolveCompanyForUser } from '@/lib/tenant-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  try {
    const db = requireSupabaseServer();
    const membership = await resolveCompanyForUser(db, user, request.nextUrl.searchParams.get('companyId'));
    const usage = await getCompanyUsage(db, membership.tenantId);
    return NextResponse.json({ usage, role: membership.role });
  } catch (error) {
    console.error('[billing/usage]', error);
    return NextResponse.json({ error: 'Unable to load AI usage' }, { status: 500 });
  }
}
