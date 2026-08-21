import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { requireSupabaseServer } from '@/lib/supabase/server';
import { getCompanyUsage } from '@/core/billing/usage';
import { changeCompanyPlan, getCompanySubscription } from '@/core/billing/subscription';
import { assertAdminRole, resolveCompanyForUser } from '@/lib/tenant-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  try {
    const db = requireSupabaseServer();
    const membership = await resolveCompanyForUser(db, user, request.nextUrl.searchParams.get('companyId'));
    const [subscription, usage] = await Promise.all([getCompanySubscription(db, membership.tenantId), getCompanyUsage(db, membership.tenantId)]);
    return NextResponse.json({ subscription, usage, role: membership.role });
  } catch (error) {
    console.error('[billing/subscription GET]', error);
    return NextResponse.json({ error: 'Unable to load subscription' }, { status: 500 });
  }
}

/** Manual admin control for internal billing operations; production checkout can call the same service. */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  try {
    const body = await request.json() as { companyId?: string; planId?: string; effective?: 'now' | 'next_cycle'; customAiMessageLimit?: number; customMonthlyPriceThb?: number };
    const db = requireSupabaseServer();
    const membership = await resolveCompanyForUser(db, user, body.companyId);
    assertAdminRole(membership);
    const result = await changeCompanyPlan(db, membership.tenantId, body.planId, body.effective ?? 'next_cycle', user.id, {
      customAiMessageLimit: body.customAiMessageLimit,
      customMonthlyPriceThb: body.customMonthlyPriceThb,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[billing/subscription POST]', error);
    const message = error instanceof Error && /access denied|admin access/i.test(error.message) ? error.message : 'Unable to change subscription';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
