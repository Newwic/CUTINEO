'use client';

import NextLink from 'next/link';
import { ArrowLeft, BarChart3, CircleDollarSign, MessageSquare, RefreshCw, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCurrentSupabaseSession, supabaseClient } from '@/lib/supabase/client';

function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return <NextLink href={href as never} className={className}>{children}</NextLink>;
}

type CompanyUsage = {
  companyId: string;
  company: string;
  plan: string;
  aiUsed: number;
  aiLimit: number;
  boost: number;
  usagePercent: number;
  provider: string;
  model: string;
  tokenUsage: number;
  aiCost: number;
  subscriptionRevenue: number;
  estimatedGrossProfit: number;
  marginPercent: number | null;
};

type DashboardPayload = {
  scope: string;
  summary: { totalAIRequests: number; totalAIMessages: number; totalTokens: number; aiCostToday: number; aiCostThisMonth: number; averageCostPerCompany: number; averageCostPerMessage: number; subscriptionRevenue: number; estimatedGrossProfit: number };
  companies: CompanyUsage[];
};

const emptyPayload: DashboardPayload = { scope: 'tenant', summary: { totalAIRequests: 0, totalAIMessages: 0, totalTokens: 0, aiCostToday: 0, aiCostThisMonth: 0, averageCostPerCompany: 0, averageCostPerMessage: 0, subscriptionRevenue: 0, estimatedGrossProfit: 0 }, companies: [] };

export default function AIUsageAdminPage() {
  const [payload, setPayload] = useState<DashboardPayload>(emptyPayload);
  const [sort, setSort] = useState('usage');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      if (!supabaseClient) { setError('ต้องตั้งค่า Supabase ก่อนใช้ Admin AI Usage'); setLoading(false); return; }
      const session = await getCurrentSupabaseSession();
      if (!session) { setError('Authentication required'); setLoading(false); return; }
      const { data } = await supabaseClient.auth.getSession();
      if (!data.session) { setError('กรุณาเข้าสู่ระบบด้วยบัญชี Admin'); setLoading(false); return; }
      const response = await fetch(`/api/admin/ai-usage?sort=${sort}`, { credentials: 'include', cache: 'no-store' });
      const result = await response.json().catch(() => ({})) as DashboardPayload & { error?: string };
      if (!mounted) return;
      if (!response.ok) setError(result.error ?? 'โหลดข้อมูลไม่สำเร็จ');
      else { setPayload(result); setError(''); }
      setLoading(false);
    }
    void load();
    return () => { mounted = false; };
  }, [sort]);

  const money = (value: number) => `฿${value.toLocaleString('th-TH', { maximumFractionDigits: 2 })}`;
  const integer = (value: number) => value.toLocaleString('th-TH');
  const cards = [
    ['Total AI Requests', integer(payload.summary.totalAIRequests), MessageSquare],
    ['Total AI Messages', integer(payload.summary.totalAIMessages), Sparkles],
    ['Total Tokens', integer(payload.summary.totalTokens), BarChart3],
    ['AI Cost Today', money(payload.summary.aiCostToday), CircleDollarSign],
    ['AI Cost This Month', money(payload.summary.aiCostThisMonth), CircleDollarSign],
    ['Avg Cost / Company', money(payload.summary.averageCostPerCompany), CircleDollarSign],
    ['Avg Cost / Message', money(payload.summary.averageCostPerMessage), CircleDollarSign],
    ['Subscription Revenue', money(payload.summary.subscriptionRevenue), CircleDollarSign],
    ['Estimated Gross Profit', money(payload.summary.estimatedGrossProfit), CircleDollarSign],
  ] as const;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#081016] text-white">
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-12">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div><Link href="/dashboard/inbox" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white"><ArrowLeft size={15} /> กลับ Inbox</Link><h1 className="mt-4 text-3xl font-black tracking-tight">AI Usage & Cost</h1><p className="mt-2 text-sm text-slate-400">{payload.scope === 'platform' ? 'Platform-wide owner view' : 'Workspace admin view'} · ดู quota, model, cost และ margin</p></div>
          <label className="flex items-center gap-2 text-sm text-slate-300">Sort <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white"><option value="usage">Highest AI Usage</option><option value="cost">Highest AI Cost</option><option value="lowest_margin">Lowest Margin</option><option value="highest_margin">Highest Margin</option></select></label>
        </header>

        {error && <div className="mt-6 rounded-2xl border border-rose-300/25 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">{error}</div>}
        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, value, Icon]) => <div key={label} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.05] p-5"><Icon size={18} className="text-teal-300" /><p className="mt-4 text-xs font-semibold text-slate-400">{label}</p><strong className="mt-1 block break-words text-2xl font-black">{value}</strong></div>)}
        </section>

        <section className="mt-7 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4"><div><h2 className="font-black">Company AI Usage</h2><p className="mt-1 text-xs text-slate-400">Subscription revenue, estimated AI cost และ gross margin</p></div>{loading && <RefreshCw size={16} className="animate-spin text-teal-300" />}</div>
          <div className="overflow-x-auto"><table className="min-w-[1180px] w-full text-left text-sm"><thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Company</th><th className="px-5 py-3">Plan</th><th className="px-5 py-3">AI Used / Limit</th><th className="px-5 py-3">Boost</th><th className="px-5 py-3">Provider / Model</th><th className="px-5 py-3">Tokens</th><th className="px-5 py-3">AI Cost</th><th className="px-5 py-3">Revenue</th><th className="px-5 py-3">Gross Profit</th><th className="px-5 py-3">Margin</th></tr></thead><tbody className="divide-y divide-white/10">{payload.companies.map((company) => <tr key={company.companyId} className="text-slate-200"><td className="px-5 py-4 font-bold">{company.company}</td><td className="px-5 py-4"><span className="rounded-full bg-teal-300/10 px-2 py-1 text-xs font-bold text-teal-200">{company.plan}</span></td><td className="px-5 py-4"><strong>{integer(company.aiUsed)}</strong><span className="ml-2 text-xs text-slate-500">/ {integer(company.aiLimit)} ({company.usagePercent}%)</span></td><td className="px-5 py-4 text-teal-200">+{integer(company.boost)}</td><td className="px-5 py-4"><span className="block text-xs font-semibold">{company.provider}</span><span className="text-xs text-slate-500">{company.model}</span></td><td className="px-5 py-4">{integer(company.tokenUsage)}</td><td className="px-5 py-4 text-amber-200">{money(company.aiCost)}</td><td className="px-5 py-4">{money(company.subscriptionRevenue)}</td><td className={`px-5 py-4 ${company.estimatedGrossProfit < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>{money(company.estimatedGrossProfit)}</td><td className={`px-5 py-4 font-bold ${(company.marginPercent ?? 0) < 30 ? 'text-rose-300' : 'text-emerald-300'}`}>{company.marginPercent === null ? 'Custom' : `${company.marginPercent}%`}</td></tr>)}{payload.companies.length === 0 && <tr><td colSpan={10} className="px-5 py-12 text-center text-sm text-slate-500">ยังไม่มีข้อมูล AI Usage ในรอบบิลปัจจุบัน</td></tr>}</tbody></table></div>
        </section>
      </div>
    </main>
  );
}
