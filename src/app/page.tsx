import Link from 'next/link';
import { ArrowRight, Bot, Inbox, MessageSquareText, ShieldCheck } from 'lucide-react';
import CutineoSiteHeader from '@/components/CutineoSiteHeader';

const features = [
  {
    icon: Inbox,
    title: 'Unified Inbox',
    description: 'รวมบทสนทนาจากช่องทางโซเชียลไว้ใน workspace เดียว',
  },
  {
    icon: Bot,
    title: 'AI Agent',
    description: 'ตอบคำถามจาก Knowledge Base และส่งต่อให้ทีมเมื่อจำเป็น',
  },
  {
    icon: ShieldCheck,
    title: 'Multi-tenant by design',
    description: 'แยกข้อมูลร้านค้า สมาชิก และสิทธิ์การเข้าถึงตั้งแต่ระดับฐานข้อมูล',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.32),_transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.18),_transparent_42%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <CutineoSiteHeader
          navItems={[
            { key: 'features', label: 'ฟีเจอร์', href: '#features' },
            { key: 'how', label: 'วิธีการทำงาน', href: '#features' },
            { key: 'sales', label: 'AI Sales', href: '/pricing' },
            { key: 'pricing', label: 'ราคา', href: '/pricing' },
          ]}
          logoHref="/"
          loginHref="/login"
          startHref="/register?plan=Starter"
          ariaLabel="เมนูหลัก"
        />

        <section className="grid flex-1 items-center gap-14 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-300/25 bg-indigo-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-indigo-200">
              <MessageSquareText size={14} aria-hidden="true" /> Social commerce OS
            </p>
            <h1 className="max-w-3xl text-[clamp(28px,4vw,44px)] font-black leading-[1.25] tracking-tight">
              ปิดการขายทุกแชท จากพื้นที่ทำงานเดียว
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              CUTINEO รวมลูกค้า ทีมขาย และ AI Agent ให้ทำงานบนบทสนทนาเดียวกัน พร้อมโครงสร้างพร้อมต่อ LINE, Supabase และระบบ multi-tenant จริง
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/dashboard/inbox"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3.5 text-sm font-bold shadow-xl shadow-indigo-500/25 transition hover:bg-indigo-400"
              >
                เข้า Unified Inbox <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center rounded-xl border border-white/15 px-5 py-3.5 text-sm font-bold text-slate-200 transition hover:border-white/30 hover:bg-white/10"
              >
                ดูความสามารถ
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-5 rounded-[2rem] bg-indigo-500/20 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/15 bg-white/[0.08] p-4 shadow-2xl backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400">WORKSPACE</p>
                  <p className="mt-1 font-bold">ทีม CUTINEO</p>
                </div>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-300">AI online</span>
              </div>
              <div className="space-y-3 py-5">
                <div className="rounded-2xl bg-white px-4 py-3 text-slate-800 shadow-lg">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>ลูกค้าใหม่</span><span>10:42</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold">แพ็กเกจ Pro มี AI ช่วยตอบกี่ข้อความคะ?</p>
                </div>
                <div className="ml-10 rounded-2xl bg-indigo-500 px-4 py-3 shadow-lg shadow-indigo-500/20">
                  <div className="flex items-center gap-2 text-xs text-indigo-100"><Bot size={13} /> AI Agent</div>
                  <p className="mt-2 text-sm font-medium">แพ็กเกจ Pro มี AI ตอบอัตโนมัติ 30,000 AI Messages ต่อเดือนครับ</p>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-xs text-slate-400">
                Knowledge Base ช่วยให้ทีมตอบตรงข้อมูลเดียวกัน
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="grid gap-4 border-t border-white/10 py-8 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <Icon size={21} className="text-indigo-300" aria-hidden="true" />
                <h2 className="mt-4 text-[17px] font-bold leading-[1.4]">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{feature.description}</p>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
