'use client';

import NextLink from 'next/link';
import { ArrowLeft, ArrowUpRight, CheckCircle2, CircleDollarSign, Sparkles } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { supabaseClient } from '@/lib/supabase/client';

function Link({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return <NextLink href={href as never} className={className}>{children}</NextLink>;
}

type Usage = { planId: string; used: number; remaining: number; limit: number; baseLimit: number; boostLimit: number; usagePercent: number; estimatedCostThb: number; provider: string; model: string; status: string; cycleEnd: string | null };
const DEMO: Usage = { planId: 'pro', used: 21_420, remaining: 8_580, limit: 30_000, baseLimit: 30_000, boostLimit: 0, usagePercent: 71.4, estimatedCostThb: 243.18, provider: 'gemini', model: 'gemini-2.5-flash', status: 'warning', cycleEnd: null };

export default function CustomerAIUsagePage() {
  const [usage, setUsage] = useState<Usage>(DEMO);
  const [demo, setDemo] = useState(true);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!supabaseClient) return;
      const { data } = await supabaseClient.auth.getSession();
      if (!data.session) return;
      const response = await fetch('/api/billing/usage', { headers: { Authorization: `Bearer ${data.session.access_token}` } });
      if (!response.ok) return;
      const result = await response.json() as { usage?: Usage };
      if (mounted && result.usage) { setUsage(result.usage); setDemo(false); }
    }
    void load();
    return () => { mounted = false; };
  }, []);
  async function buyBoost() {
    if (demo || !supabaseClient) { setNotice('Demo mode: เชื่อมบัญชีจริงเพื่อซื้อ AI Boost'); return; }
    const { data } = await supabaseClient.auth.getSession();
    if (!data.session) return;
    const response = await fetch('/api/billing/ai-boost', { method: 'POST', headers: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' }, body: '{}' });
    const result = await response.json().catch(() => ({})) as { message?: string; error?: string };
    setNotice(result.message ?? result.error ?? 'สร้างคำขอแล้ว');
  }
  const percent = Math.min(100, usage.usagePercent);
  return <main className="min-h-screen bg-[#081016] px-5 py-7 text-white sm:px-8 lg:px-12"><div className="mx-auto max-w-5xl"><Link href="/dashboard/inbox" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white"><ArrowLeft size={15} /> กลับ Inbox</Link><div className="mt-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-teal-300">CUSTOMER BILLING</p><h1 className="mt-3 text-4xl font-black">AI Usage</h1><p className="mt-2 text-slate-400">ติดตามโควตา AI ของบริษัทใน Billing Cycle ปัจจุบัน</p></div><span className="rounded-full bg-teal-300/10 px-3 py-1 text-xs font-bold uppercase text-teal-200">{usage.planId}</span></div><section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.05] p-6 sm:p-8"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-sm font-semibold text-slate-400">AI Messages</p><strong className="mt-2 block text-5xl font-black tracking-tight">{usage.used.toLocaleString('th-TH')} <span className="text-xl font-semibold text-slate-500">/ {usage.limit.toLocaleString('th-TH')}</span></strong></div><div className="text-right"><span className="text-3xl font-black text-teal-300">{percent}%</span><p className="mt-1 text-xs text-slate-500">Usage</p></div></div><div className="mt-7 h-4 overflow-hidden rounded-full bg-white/10"><span className={`block h-full rounded-full ${percent >= 90 ? 'bg-rose-400' : percent >= 70 ? 'bg-amber-300' : 'bg-teal-300'}`} style={{ width: `${percent}%` }} /></div><div className="mt-5 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-black/10 p-4"><span className="text-xs text-slate-500">เหลือ</span><strong className="mt-1 block text-xl">{usage.remaining.toLocaleString('th-TH')}</strong></div><div className="rounded-2xl border border-white/10 bg-black/10 p-4"><span className="text-xs text-slate-500">AI Cost</span><strong className="mt-1 block text-xl">฿{usage.estimatedCostThb.toFixed(2)}</strong></div><div className="rounded-2xl border border-white/10 bg-black/10 p-4"><span className="text-xs text-slate-500">Provider / Model</span><strong className="mt-1 block break-words text-sm">{usage.provider} · {usage.model}</strong></div></div></section><section className="mt-5 grid gap-5 md:grid-cols-2"><div className="rounded-3xl border border-teal-300/20 bg-teal-300/[0.08] p-6"><div className="flex items-center gap-2 text-teal-200"><Sparkles size={18} /> <strong>AI Boost</strong></div><h2 className="mt-4 text-2xl font-black">+20,000 Messages</h2><p className="mt-2 text-sm leading-6 text-slate-300">฿490 ใช้ได้เฉพาะ Billing Cycle นี้ ไม่เพิ่มโควตาถาวรของแพ็กเกจ</p><button type="button" onClick={() => void buyBoost()} className="mt-5 rounded-xl bg-teal-300 px-4 py-3 text-sm font-black text-slate-950 hover:bg-teal-200">ซื้อ AI Boost</button></div><div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6"><div className="flex items-center gap-2 text-slate-300"><CircleDollarSign size={18} /> <strong>Upgrade Package</strong></div><h2 className="mt-4 text-2xl font-black">ต้องการโควตามากขึ้น?</h2><p className="mt-2 text-sm leading-6 text-slate-400">อัปเกรดเพื่อเพิ่ม AI Messages และปลดล็อกฟีเจอร์ Sales Automation</p><Link href="/pricing" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-black hover:bg-white/10">ดูแพ็กเกจ <ArrowUpRight size={16} /></Link></div></section>{notice && <div className="mt-5 flex items-center gap-2 rounded-2xl border border-teal-300/20 bg-teal-300/10 px-4 py-3 text-sm text-teal-100"><CheckCircle2 size={16} />{notice}</div>}</div></main>;
}
