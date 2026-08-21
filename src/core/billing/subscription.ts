import type { SupabaseClient } from '@supabase/supabase-js';
import { getPlanDefinition, normalizePlanId } from './catalog';

export async function getCompanySubscription(db: SupabaseClient, companyId: string) {
  const { data, error } = await db
    .from('subscriptions')
    .select('id, company_id, plan_id, status, provider, current_period_start, current_period_end, current_cycle_id, scheduled_plan_id, scheduled_change_at, custom_ai_message_limit, custom_monthly_price_thb, scheduled_custom_ai_message_limit, scheduled_custom_monthly_price_thb')
    .eq('company_id', companyId)
    .in('status', ['trialing', 'active', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function changeCompanyPlan(
  db: SupabaseClient,
  companyId: string,
  requestedPlan: unknown,
  effective: 'now' | 'next_cycle' = 'next_cycle',
  actorId?: string,
  options?: { customAiMessageLimit?: unknown; customMonthlyPriceThb?: unknown },
) {
  const planId = normalizePlanId(requestedPlan);
  const definition = getPlanDefinition(planId);
  const subscription = await getCompanySubscription(db, companyId);
  if (!subscription) throw new Error('Active subscription not found');
  const customAiMessageLimit = planId === 'enterprise' && Number.isInteger(Number(options?.customAiMessageLimit)) && Number(options?.customAiMessageLimit) > 0
    ? Number(options?.customAiMessageLimit)
    : null;
  const customMonthlyPriceThb = planId === 'enterprise' && Number.isFinite(Number(options?.customMonthlyPriceThb)) && Number(options?.customMonthlyPriceThb) >= 0
    ? Number(options?.customMonthlyPriceThb)
    : null;

  if (effective === 'next_cycle') {
    const { data, error } = await db
      .from('subscriptions')
      .update({
        scheduled_plan_id: planId,
        scheduled_change_at: subscription.current_period_end,
        scheduled_custom_ai_message_limit: customAiMessageLimit,
        scheduled_custom_monthly_price_thb: customMonthlyPriceThb,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)
      .select('id, plan_id, scheduled_plan_id, scheduled_change_at, scheduled_custom_ai_message_limit, scheduled_custom_monthly_price_thb, current_period_end')
      .single();
    if (error) throw error;
    await db.from('audit_logs').insert({ company_id: companyId, user_id: actorId ?? null, action: 'subscription.plan_scheduled', resource_type: 'subscription', resource_id: subscription.id, metadata: { from: subscription.plan_id, to: planId, effective: 'next_cycle' } });
    return { subscription: data, plan: definition, effective: 'next_cycle' as const };
  }

  const { data, error } = await db
    .from('subscriptions')
    .update({
      plan_id: planId,
      custom_ai_message_limit: customAiMessageLimit,
      custom_monthly_price_thb: customMonthlyPriceThb,
      scheduled_plan_id: null,
      scheduled_change_at: null,
      scheduled_custom_ai_message_limit: null,
      scheduled_custom_monthly_price_thb: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id)
    .select('id, plan_id, current_cycle_id, current_period_start, current_period_end')
    .single();
  if (error) throw error;
  await db.from('tenants').update({ plan: planId, plan_id: planId }).eq('id', companyId);
  if (data.current_cycle_id) await db.from('billing_cycles').update({ plan_id: planId }).eq('id', data.current_cycle_id).eq('company_id', companyId);
  await db.from('audit_logs').insert({ company_id: companyId, user_id: actorId ?? null, action: 'subscription.plan_changed', resource_type: 'subscription', resource_id: subscription.id, metadata: { from: subscription.plan_id, to: planId, effective: 'now' } });
  return { subscription: data, plan: definition, effective: 'now' as const };
}
