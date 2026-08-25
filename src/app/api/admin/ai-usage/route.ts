import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { requireSupabaseServer } from '@/lib/supabase/server';
import { PLAN_CATALOG, normalizePlanId } from '@/core/billing/catalog';
import { getTenantMemberships, isPlatformAdmin } from '@/lib/tenant-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DailyUsageRow = {
  company_id: string;
  billing_cycle_id: string | null;
  usage_date: string;
  message_count: number;
  request_count: number;
  input_tokens: number;
  output_tokens: number;
  cached_tokens: number;
  estimated_cost: number;
};

type LatestUsageRow = { company_id: string; provider: string; model: string; created_at: string };

function number(value: unknown): number { return typeof value === 'number' ? value : Number(value ?? 0) || 0; }

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  try {
    const db = requireSupabaseServer();
    const platformAdmin = await isPlatformAdmin(db, user);
    const memberships = await getTenantMemberships(db, user.id);
    const requestedCompany = request.nextUrl.searchParams.get('companyId');
    const ownAdminIds = memberships
      .filter((membership) => membership.role === 'owner' || membership.role === 'admin')
      .map((membership) => membership.tenantId);
    if (!platformAdmin && ownAdminIds.length === 0) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    const companyIds = platformAdmin
      ? null
      : (requestedCompany ? ownAdminIds.filter((id) => id === requestedCompany) : ownAdminIds);
    if (!platformAdmin && companyIds && companyIds.length === 0) return NextResponse.json({ error: 'Workspace access denied' }, { status: 403 });

    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthStartDate = startOfMonth.toISOString().slice(0, 10);
    const todayDate = startOfToday.toISOString().slice(0, 10);
    const [companiesResult, cyclesResult, dailyResult, latestUsageResult, boostsResult, subscriptionsResult] = await Promise.all([
      db.from('tenants').select('id, name, plan, plan_id').order('created_at', { ascending: true }),
      db.from('billing_cycles').select('id, company_id, plan_id, ai_message_limit, starts_at, ends_at, status').eq('status', 'active'),
      db.from('ai_usage_daily').select('company_id, billing_cycle_id, usage_date, message_count, request_count, input_tokens, output_tokens, cached_tokens, estimated_cost').gte('usage_date', monthStartDate).limit(200000),
      db.from('ai_usage').select('company_id, provider, model, created_at').order('created_at', { ascending: false }).limit(10000),
      db.from('ai_boosts').select('company_id, billing_cycle_id, message_limit, status').eq('status', 'active'),
      db.from('subscriptions').select('company_id, plan_id, custom_monthly_price_thb, current_period_start, current_period_end, status').in('status', ['active', 'trialing', 'past_due']),
    ]);
    if (companiesResult.error) throw companiesResult.error;
    if (cyclesResult.error) throw cyclesResult.error;
    if (dailyResult.error) throw dailyResult.error;
    if (latestUsageResult.error) throw latestUsageResult.error;
    if (boostsResult.error) throw boostsResult.error;
    if (subscriptionsResult.error) throw subscriptionsResult.error;

    const allowed = (companyId: string) => platformAdmin || Boolean(companyIds?.includes(companyId));
    const companies = (companiesResult.data ?? []).filter((company) => allowed(company.id));
    const cycleByCompany = new Map((cyclesResult.data ?? []).filter((cycle) => allowed(cycle.company_id)).map((cycle) => [cycle.company_id, cycle]));
    const usageByCompany = new Map<string, DailyUsageRow[]>();
    for (const row of (dailyResult.data ?? []) as DailyUsageRow[]) {
      if (!allowed(row.company_id)) continue;
      const cycle = cycleByCompany.get(row.company_id);
      if (cycle && row.billing_cycle_id !== cycle.id) continue;
      const rows = usageByCompany.get(row.company_id) ?? [];
      rows.push(row);
      usageByCompany.set(row.company_id, rows);
    }
    const latestUsageByCompany = new Map<string, LatestUsageRow>();
    for (const row of (latestUsageResult.data ?? []) as LatestUsageRow[]) {
      if (allowed(row.company_id) && !latestUsageByCompany.has(row.company_id)) latestUsageByCompany.set(row.company_id, row);
    }
    const boostsByCompany = new Map<string, number>();
    for (const boost of boostsResult.data ?? []) {
      if (allowed(boost.company_id) && cycleByCompany.get(boost.company_id)?.id === boost.billing_cycle_id) {
        boostsByCompany.set(boost.company_id, (boostsByCompany.get(boost.company_id) ?? 0) + number(boost.message_limit));
      }
    }
    const subscriptionByCompany = new Map((subscriptionsResult.data ?? []).filter((subscription) => allowed(subscription.company_id)).map((subscription) => [subscription.company_id, subscription]));

    const companyRows = companies.map((company) => {
      const planId = normalizePlanId(company.plan_id ?? company.plan);
      const plan = PLAN_CATALOG[planId];
      const rows = usageByCompany.get(company.id) ?? [];
      const aiUsed = rows.reduce((sum, row) => sum + number(row.message_count), 0);
      const inputTokens = rows.reduce((sum, row) => sum + number(row.input_tokens), 0);
      const outputTokens = rows.reduce((sum, row) => sum + number(row.output_tokens), 0);
      const cachedTokens = rows.reduce((sum, row) => sum + number(row.cached_tokens), 0);
      const aiCost = rows.reduce((sum, row) => sum + number(row.estimated_cost), 0);
      const aiLimit = number(cycleByCompany.get(company.id)?.ai_message_limit ?? plan.aiMessages) + (boostsByCompany.get(company.id) ?? 0);
      const revenue = number(subscriptionByCompany.get(company.id)?.custom_monthly_price_thb ?? plan.monthlyPriceThb ?? 0);
      const latest = latestUsageByCompany.get(company.id);
      const provider = latest?.provider ?? '—';
      const model = latest?.model ?? '—';
      const grossProfit = revenue - aiCost;
      return {
        companyId: company.id,
        company: company.name,
        plan: plan.name,
        aiUsed,
        aiLimit,
        usagePercent: aiLimit ? Number(((aiUsed / aiLimit) * 100).toFixed(1)) : 0,
        boost: boostsByCompany.get(company.id) ?? 0,
        provider,
        model,
        tokenUsage: inputTokens + outputTokens,
        inputTokens,
        outputTokens,
        cachedTokens,
        aiCost: Number(aiCost.toFixed(2)),
        subscriptionRevenue: revenue,
        estimatedGrossProfit: Number(grossProfit.toFixed(2)),
        marginPercent: revenue ? Number(((grossProfit / revenue) * 100).toFixed(1)) : null,
        cycleStart: cycleByCompany.get(company.id)?.starts_at ?? subscriptionByCompany.get(company.id)?.current_period_start ?? null,
        cycleEnd: cycleByCompany.get(company.id)?.ends_at ?? subscriptionByCompany.get(company.id)?.current_period_end ?? null,
      };
    });

    const sort = request.nextUrl.searchParams.get('sort') ?? 'usage';
    companyRows.sort((a, b) => {
      if (sort === 'cost') return b.aiCost - a.aiCost;
      if (sort === 'lowest_margin') return (a.marginPercent ?? -1) - (b.marginPercent ?? -1);
      if (sort === 'highest_margin') return (b.marginPercent ?? -1) - (a.marginPercent ?? -1);
      return b.aiUsed - a.aiUsed;
    });
    const allRows = [...usageByCompany.values()].flat();
    const totalRequests = allRows.reduce((sum, row) => sum + number(row.request_count), 0);
    const totalMessages = allRows.reduce((sum, row) => sum + number(row.message_count), 0);
    const totalTokens = allRows.reduce((sum, row) => sum + number(row.input_tokens) + number(row.output_tokens), 0);
    const costToday = allRows.reduce((sum, row) => row.usage_date >= todayDate ? sum + number(row.estimated_cost) : sum, 0);
    const costThisMonth = allRows.reduce((sum, row) => row.usage_date >= monthStartDate ? sum + number(row.estimated_cost) : sum, 0);
    const totalCost = costThisMonth;
    const totalRevenue = companyRows.reduce((sum, row) => sum + row.subscriptionRevenue, 0);
    return NextResponse.json({
      scope: platformAdmin ? 'platform' : 'tenant',
      summary: {
        totalAIRequests: totalRequests,
        totalAIMessages: totalMessages,
        totalTokens,
        aiCostToday: costToday,
        aiCostThisMonth: costThisMonth,
        averageCostPerCompany: companyRows.length ? totalCost / companyRows.length : 0,
        averageCostPerMessage: totalMessages ? totalCost / totalMessages : 0,
        subscriptionRevenue: totalRevenue,
        estimatedGrossProfit: totalRevenue - totalCost,
      },
      companies: companyRows,
    });
  } catch (error) {
    console.error('[admin/ai-usage]', error);
    return NextResponse.json({ error: 'Unable to load AI usage dashboard' }, { status: 500 });
  }
}
