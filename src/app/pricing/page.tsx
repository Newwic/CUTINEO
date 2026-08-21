import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import Header from '@/components/layout/Header';
import { AI_BOOST, PLAN_CATALOG, PLAN_ORDER, formatPlanPrice } from '@/core/billing/catalog';

export const metadata: Metadata = {
  title: 'CUTINEO Pricing — แพ็กเกจเริ่มต้น ฿490',
  description: 'เลือกแพ็กเกจ CUTINEO ตั้งแต่ Starter, Pro, Advanced ไปจนถึง Enterprise พร้อม AI Boost สำหรับเพิ่มโควตา AI Messages',
};

export default function PricingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#071016] text-white">
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-12">
        <Header activeKey="pricing" />

        <section className="mx-auto max-w-3xl py-16 text-center sm:py-20">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-teal-200"><Sparkles size={14} /> AI-powered pricing</p>
          <h1 className="text-[clamp(30px,5vw,54px)] font-black leading-tight tracking-tight">เลือกแพ็กเกจที่โตไปพร้อมธุรกิจ</h1>
          <p className="mt-5 text-base leading-8 text-slate-300">เริ่มจาก AI ช่วยตอบ แล้วขยับไปสู่ AI Sales Automation เมื่อทีมและยอดขายเติบโต</p>
        </section>

        <section className="grid items-stretch gap-5 lg:grid-cols-4">
          {PLAN_ORDER.map((planId) => {
            const plan = PLAN_CATALOG[planId];
            return (
              <article key={planId} className={`relative flex min-w-0 flex-col rounded-3xl border p-6 ${plan.featured ? 'border-teal-300 bg-teal-300/[0.12] shadow-2xl shadow-teal-500/15 lg:-translate-y-3' : 'border-white/10 bg-white/[0.05]'}`}>
                {plan.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-300 px-4 py-1 text-[11px] font-black text-slate-950">แนะนำ · MOST POPULAR</span>}
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-lg font-black">{plan.name}</p><p className="mt-2 text-sm leading-6 text-slate-300">{plan.positioning}</p></div>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold text-teal-200">{plan.aiMessages.toLocaleString('th-TH')}</span>
                </div>
                <div className="mt-7 min-h-[76px]"><strong className="block text-4xl font-black tracking-tight">{formatPlanPrice(planId)}</strong><span className="text-xs text-slate-400">{plan.monthlyPriceThb === null ? 'ราคาเริ่มต้น · Custom Package' : '/ เดือน'}</span></div>
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/10 p-3 text-sm text-teal-100"><strong className="block text-xl">{plan.aiMessages.toLocaleString('th-TH')}</strong><span className="text-xs text-slate-300">AI Messages / เดือน</span></div>
                <p className="mt-4 min-h-[48px] text-sm leading-6 text-slate-300">{plan.audience}</p>
                <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-200">{plan.marketingFeatures.map((feature) => <li key={feature} className="flex min-w-0 gap-2"><Check size={16} className="mt-1 shrink-0 text-teal-300" /><span className="min-w-0 break-words">{feature}</span></li>)}</ul>
                <Link href={planId === 'enterprise' ? '/resources' : `/signup?plan=${encodeURIComponent(plan.name)}`} className={`mt-7 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${plan.featured ? 'bg-teal-300 text-slate-950 hover:bg-teal-200' : 'border border-white/15 text-white hover:bg-white/10'}`}>
                  {planId === 'enterprise' ? 'คุยกับทีมขาย' : `เริ่มต้น ${plan.name}`} <ArrowRight size={16} />
                </Link>
              </article>
            );
          })}
        </section>

        <section className="mx-auto my-12 flex max-w-4xl flex-col items-start justify-between gap-5 rounded-3xl border border-teal-300/25 bg-teal-300/[0.08] p-6 sm:flex-row sm:items-center sm:p-8">
          <div><p className="text-xs font-black uppercase tracking-[0.16em] text-teal-200">AI BOOST</p><h2 className="mt-2 text-2xl font-black">เพิ่มโควตาเฉพาะรอบบิลนี้</h2><p className="mt-2 text-sm leading-6 text-slate-300">{AI_BOOST.description} ไม่ใช่โควตาถาวรของแพ็กเกจ</p></div>
          <div className="shrink-0 text-left sm:text-right"><strong className="block text-3xl font-black text-teal-200">฿{AI_BOOST.priceThb}</strong><span className="text-xs text-slate-400">+{AI_BOOST.messages.toLocaleString('th-TH')} AI Messages</span></div>
        </section>

        <p className="mx-auto max-w-2xl pb-12 text-center text-xs leading-6 text-slate-500">AI Message คือข้อความตอบกลับที่สร้างโดย AI ข้อความจากลูกค้าไม่นับเป็น AI Message และโควตาจะ reset ตาม Billing Cycle</p>
      </div>
    </main>
  );
}
