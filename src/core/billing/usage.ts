import type { SupabaseClient } from '@supabase/supabase-js';
import { getPlanDefinition, MODEL_CATALOG, normalizePlanId, type AIFeature, type SupportedModel } from './catalog';

export const USD_TO_THB = Number(process.env.AI_USD_TO_THB ?? 36);

export interface CompanyUsageSummary {
  companyId: string;
  planId: ReturnType<typeof normalizePlanId>;
  cycleId: string | null;
  cycleStart: string | null;
  cycleEnd: string | null;
  baseLimit: number;
  boostLimit: number;
  limit: number;
  used: number;
  remaining: number;
  usagePercent: number;
  estimatedCostThb: number;
  provider: string;
  model: string;
  status: 'ok' | 'warning' | 'critical' | 'exhausted';
}

export interface AIUsageRecordInput {
  companyId: string;
  userId?: string | null;
  conversationId?: string | null;
  billingCycleId?: string | null;
  provider: string;
  model: string;
  feature: AIFeature;
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  messageCount?: number;
  estimatedCostThb?: number;
  createdAt?: string;
}

function safeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function estimateCostThb(
  model: string,
  inputTokens = 0,
  outputTokens = 0,
  cachedTokens = 0,
): number {
  const modelInfo = MODEL_CATALOG[model as SupportedModel] ?? MODEL_CATALOG['gemini-2.5-flash'];
  const billableInput = Math.max(0, inputTokens - cachedTokens);
  const usd = (billableInput / 1_000_000) * modelInfo.inputUsdPerMillion
    + (outputTokens / 1_000_000) * modelInfo.outputUsdPerMillion;
  return Number((usd * USD_TO_THB).toFixed(6));
}

export function usageStatus(percent: number, used: number, limit: number): CompanyUsageSummary['status'] {
  if (limit > 0 && used >= limit) return 'exhausted';
  if (percent >= 90) return 'critical';
  if (percent >= 70) return 'warning';
  return 'ok';
}

async function resolveCycle(db: SupabaseClient, companyId: string, planId: string) {
  const now = new Date();
  const { data: subscription, error: subscriptionError } = await db
    .from('subscriptions')
    .select('id, plan_id, current_cycle_id, current_period_start, current_period_end, scheduled_plan_id, scheduled_change_at, custom_ai_message_limit, scheduled_custom_ai_message_limit')
    .eq('company_id', companyId)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (subscriptionError) throw subscriptionError;

  if (subscription?.current_cycle_id) {
    const { data: currentCycle, error: cycleError } = await db
      .from('billing_cycles')
      .select('id, starts_at, ends_at, plan_id, ai_message_limit, status')
      .eq('id', subscription.current_cycle_id)
      .eq('company_id', companyId)
      .maybeSingle();
    if (cycleError) throw cycleError;
    if (currentCycle && new Date(currentCycle.ends_at).getTime() > now.getTime() && currentCycle.status === 'active') {
      return {
        cycleId: currentCycle.id as string,
        cycleStart: currentCycle.starts_at as string,
        cycleEnd: currentCycle.ends_at as string,
        planId: normalizePlanId(subscription.plan_id ?? planId),
        aiMessageLimit: currentCycle.ai_message_limit as number | null,
      };
    }

    if (currentCycle) await db.from('billing_cycles').update({ status: 'expired' }).eq('id', currentCycle.id).eq('company_id', companyId);
    const nextPlanId = normalizePlanId(subscription.scheduled_plan_id ?? subscription.plan_id ?? planId);
    const nextCustomMessageLimit = subscription.scheduled_custom_ai_message_limit
      ?? (subscription.scheduled_plan_id ? null : subscription.custom_ai_message_limit);
    const nextMessageLimit = nextCustomMessageLimit ?? getPlanDefinition(nextPlanId).aiMessages;
    const start = new Date(Math.max(now.getTime(), new Date(subscription.current_period_end).getTime()));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate()));
    const { data: nextCycle, error: nextCycleError } = await db.from('billing_cycles').upsert({
      company_id: companyId,
      subscription_id: subscription.id,
      plan_id: nextPlanId,
      ai_message_limit: nextMessageLimit,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      status: 'active',
    }, { onConflict: 'company_id,starts_at' }).select('id, starts_at, ends_at, ai_message_limit').single();
    if (nextCycleError) throw nextCycleError;
    await db.from('subscriptions').update({
      plan_id: nextPlanId,
      current_cycle_id: nextCycle.id,
      current_period_start: nextCycle.starts_at,
      current_period_end: nextCycle.ends_at,
      custom_ai_message_limit: nextCustomMessageLimit,
      scheduled_plan_id: null,
      scheduled_change_at: null,
      scheduled_custom_ai_message_limit: null,
      scheduled_custom_monthly_price_thb: null,
      updated_at: now.toISOString(),
    }).eq('id', subscription.id).eq('company_id', companyId);
    await db.from('tenants').update({ plan: nextPlanId, plan_id: nextPlanId }).eq('id', companyId);
    return {
      cycleId: nextCycle.id as string,
      cycleStart: nextCycle.starts_at as string,
      cycleEnd: nextCycle.ends_at as string,
      planId: nextPlanId,
      aiMessageLimit: nextMessageLimit,
    };
  }

  const currentPlanId = normalizePlanId(subscription?.plan_id ?? planId);
  const subscriptionStart = subscription?.current_period_start ? new Date(subscription.current_period_start) : null;
  const subscriptionEnd = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
  const start = subscriptionStart && Number.isFinite(subscriptionStart.getTime())
    ? subscriptionStart
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = subscriptionEnd && Number.isFinite(subscriptionEnd.getTime()) && subscriptionEnd.getTime() > start.getTime()
    ? subscriptionEnd
    : new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate()));
  const { data: cycle, error: cycleError } = await db
    .from('billing_cycles')
    .upsert({
      company_id: companyId,
      subscription_id: subscription?.id ?? null,
      plan_id: currentPlanId,
      ai_message_limit: subscription?.custom_ai_message_limit ?? getPlanDefinition(currentPlanId).aiMessages,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      status: 'active',
    }, { onConflict: 'company_id,starts_at' })
    .select('id, starts_at, ends_at, ai_message_limit')
    .single();
  if (cycleError) throw cycleError;

  if (subscription?.id && cycle?.id) {
    const { error: linkError } = await db.from('subscriptions').update({
      current_cycle_id: cycle.id,
      current_period_start: cycle.starts_at,
      current_period_end: cycle.ends_at,
      updated_at: now.toISOString(),
    }).eq('id', subscription.id).eq('company_id', companyId);
    if (linkError) throw linkError;
  }

  return {
    cycleId: cycle?.id ?? null,
    cycleStart: cycle?.starts_at ?? start.toISOString(),
    cycleEnd: cycle?.ends_at ?? end.toISOString(),
    planId: currentPlanId,
    aiMessageLimit: cycle?.ai_message_limit ?? subscription?.custom_ai_message_limit ?? getPlanDefinition(currentPlanId).aiMessages,
  };
}

export async function getCompanyUsage(db: SupabaseClient, companyId: string): Promise<CompanyUsageSummary> {
  const { data: tenant, error: tenantError } = await db.from('tenants').select('plan, plan_id, settings').eq('id', companyId).maybeSingle();
  if (tenantError) throw tenantError;
  const planId = normalizePlanId(tenant?.plan_id ?? tenant?.plan);
  const cycle = await resolveCycle(db, companyId, planId);
  const definition = getPlanDefinition(cycle.planId);
  const [usageResult, boostResult] = await Promise.all([
    db.from('ai_usage').select('message_count, estimated_cost').eq('company_id', companyId).eq('billing_cycle_id', cycle.cycleId ?? ''),
    db.from('ai_boosts').select('message_limit').eq('company_id', companyId).eq('billing_cycle_id', cycle.cycleId ?? '').eq('status', 'active'),
  ]);
  if (usageResult.error) throw usageResult.error;
  if (boostResult.error) throw boostResult.error;
  const usageRows = usageResult.data;
  const boostRows = boostResult.data;
  const used = (usageRows ?? []).reduce((total, row) => total + safeNumber(row.message_count), 0);
  const estimatedCostThb = (usageRows ?? []).reduce((total, row) => total + safeNumber(row.estimated_cost), 0);
  const boostLimit = (boostRows ?? []).reduce((total, row) => total + safeNumber(row.message_limit), 0);
  const baseLimit = cycle.aiMessageLimit ?? definition.aiMessages;
  const limit = baseLimit + boostLimit;
  const usagePercent = limit > 0 ? Number(((used / limit) * 100).toFixed(1)) : 0;
  const settings = tenant?.settings && typeof tenant.settings === 'object' ? tenant.settings as { ai_provider?: string; ai_model?: string } : {};

  return {
    companyId,
    planId: cycle.planId,
    cycleId: cycle.cycleId,
    cycleStart: cycle.cycleStart,
    cycleEnd: cycle.cycleEnd,
    baseLimit,
    boostLimit,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    usagePercent,
    estimatedCostThb: Number(estimatedCostThb.toFixed(2)),
    provider: settings.ai_provider ?? 'gemini',
    model: settings.ai_model ?? 'gemini-2.5-flash',
    status: usageStatus(usagePercent, used, limit),
  };
}

export async function assertCompanyAIQuota(db: SupabaseClient, companyId: string, messageCount = 1) {
  const usage = await getCompanyUsage(db, companyId);
  if (usage.used + messageCount > usage.limit) {
    const error = new Error('AI usage limit reached');
    error.name = 'AI_QUOTA_EXCEEDED';
    throw error;
  }
  return usage;
}

export async function recordAIUsage(db: SupabaseClient, input: AIUsageRecordInput): Promise<void> {
  const inputTokens = Math.round(safeNumber(input.inputTokens));
  const outputTokens = Math.round(safeNumber(input.outputTokens));
  const cachedTokens = Math.min(inputTokens, Math.round(safeNumber(input.cachedTokens)));
  const messageCount = Math.max(1, Math.round(safeNumber(input.messageCount) || 1));
  const estimatedCostThb = input.estimatedCostThb ?? estimateCostThb(input.model, inputTokens, outputTokens, cachedTokens);
  const { error } = await db.rpc('record_ai_usage', {
    p_company_id: input.companyId,
    p_user_id: input.userId ?? null,
    p_conversation_id: input.conversationId ?? null,
    p_billing_cycle_id: input.billingCycleId ?? null,
    p_provider: input.provider,
    p_model: input.model,
    p_feature: input.feature,
    p_input_tokens: inputTokens,
    p_output_tokens: outputTokens,
    p_cached_tokens: cachedTokens,
    p_estimated_cost: estimatedCostThb,
    p_message_count: messageCount,
    p_created_at: input.createdAt ?? new Date().toISOString(),
  });
  if (error) throw error;
}
