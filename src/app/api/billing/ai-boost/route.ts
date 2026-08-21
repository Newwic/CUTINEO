import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { requireSupabaseServer } from '@/lib/supabase/server';
import { AI_BOOST, isBoostEligible } from '@/core/billing/catalog';
import { getCompanyUsage } from '@/core/billing/usage';
import { assertAdminRole, resolveCompanyForUser } from '@/lib/tenant-access';

export const runtime = 'nodejs';

/** Creates a pending add-on order. It never grants quota before payment activation. */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  try {
    const db = requireSupabaseServer();
    const body = await request.json().catch(() => ({})) as { companyId?: string };
    const membership = await resolveCompanyForUser(db, user, body.companyId);
    assertAdminRole(membership);
    const usage = await getCompanyUsage(db, membership.tenantId);
    if (!isBoostEligible(usage.planId)) return NextResponse.json({ error: 'AI Boost is not available for this plan' }, { status: 400 });
    if (!usage.cycleId) return NextResponse.json({ error: 'Billing cycle is not ready' }, { status: 409 });
    const { data, error } = await db.from('ai_boosts').insert({
      company_id: membership.tenantId,
      billing_cycle_id: usage.cycleId,
      sku: AI_BOOST.id,
      message_limit: AI_BOOST.messages,
      price_thb: AI_BOOST.priceThb,
      status: 'pending',
      purchased_by: user.id,
      expires_at: usage.cycleEnd,
    }).select('id, status, message_limit, price_thb').single();
    if (error) throw error;
    return NextResponse.json({ order: data, message: 'สร้างคำขอ AI Boost แล้ว รอการยืนยันการชำระเงินจากระบบ Billing' }, { status: 201 });
  } catch (error) {
    console.error('[billing/ai-boost]', error);
    const message = error instanceof Error && /access denied|admin access/i.test(error.message) ? error.message : 'Unable to create AI Boost order';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
