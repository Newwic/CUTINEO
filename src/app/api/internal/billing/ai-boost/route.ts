import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function hasValidWorkerSecret(request: NextRequest): boolean {
  const secrets = [process.env.WORKER_SECRET, process.env.CRON_SECRET]
    .filter((value): value is string => Boolean(value && value.length >= 16));
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ?? '';
  if (!token) return false;
  return secrets.some((secret) => {
    const received = Buffer.from(token, 'utf8');
    const expected = Buffer.from(secret, 'utf8');
    return received.length === expected.length && crypto.timingSafeEqual(received, expected);
  });
}

/** Payment providers call this only after a verified payment. It is never exposed to the browser. */
export async function POST(request: NextRequest) {
  if (!hasValidWorkerSecret(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json() as { orderId?: string; providerReference?: string };
    if (!body.orderId || !body.providerReference) return NextResponse.json({ error: 'orderId and providerReference are required' }, { status: 400 });
    const db = requireSupabaseServer();
    const { data: order, error: orderError } = await db
      .from('ai_boosts')
      .select('id, company_id, billing_cycle_id, status')
      .eq('id', body.orderId)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order) return NextResponse.json({ error: 'Boost order not found' }, { status: 404 });
    if (order.status === 'active') return NextResponse.json({ order, idempotent: true });
    if (order.status !== 'pending') return NextResponse.json({ error: 'Boost order cannot be activated from its current state' }, { status: 409 });

    const { data: cycle, error: cycleError } = await db
      .from('billing_cycles')
      .select('id, company_id, status, ends_at')
      .eq('id', order.billing_cycle_id)
      .eq('company_id', order.company_id)
      .maybeSingle();
    if (cycleError) throw cycleError;
    if (!cycle || cycle.status !== 'active' || new Date(cycle.ends_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: 'Billing cycle is no longer active' }, { status: 409 });
    }

    const { data: activated, error: activateError } = await db
      .from('ai_boosts')
      .update({ status: 'active', provider: 'payment_webhook', provider_reference: body.providerReference, activated_at: new Date().toISOString(), expires_at: cycle.ends_at })
      .eq('id', order.id)
      .eq('status', 'pending')
      .select('id, company_id, billing_cycle_id, message_limit, price_thb, status, expires_at')
      .single();
    if (activateError) throw activateError;
    await db.from('audit_logs').insert({ company_id: order.company_id, action: 'billing.ai_boost_activated', resource_type: 'ai_boost', resource_id: order.id, metadata: { providerReference: body.providerReference } });
    return NextResponse.json({ order: activated });
  } catch (error) {
    console.error('[internal/billing/ai-boost]', error);
    return NextResponse.json({ error: 'Unable to activate AI Boost' }, { status: 500 });
  }
}
