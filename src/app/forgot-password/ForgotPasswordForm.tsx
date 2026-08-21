'use client';

import Link from 'next/link';
import { ArrowLeft, Loader2, Mail, Sparkles } from 'lucide-react';
import { FormEvent, useState } from 'react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { supabaseClient } from '@/lib/supabase/client';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!supabaseClient) {
      setError('ยังไม่ได้ตั้งค่า Supabase ในไฟล์ environment');
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setNotice('ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว กรุณาตรวจสอบกล่องข้อความ');
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <header className="mx-auto flex w-full max-w-[1450px] items-center justify-between px-6 py-8 sm:px-10 lg:px-16">
        <Link href="/" className="inline-flex items-center gap-2.5 text-[27px] font-black tracking-[-0.06em] text-slate-800">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#42d5c5] text-white"><Sparkles size={21} strokeWidth={2.8} aria-hidden="true" /></span>
          cutineo
        </Link>
        <LanguageSwitcher variant="light" />
      </header>

      <section className="mx-auto flex w-full max-w-[560px] flex-col items-center px-5 pb-10 pt-16 sm:pt-24">
        <div className="w-full min-w-0 rounded-2xl border border-slate-100 bg-white px-6 py-10 shadow-[0_5px_18px_rgba(15,23,42,0.07)] sm:px-12 sm:py-14">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-600"><Mail size={22} aria-hidden="true" /></div>
          <h1 className="mt-5 text-center text-3xl font-bold tracking-tight text-[#12233c]">รีเซ็ตรหัสผ่าน</h1>
          <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-slate-500">กรอกอีเมลที่ใช้สมัครบัญชี แล้วเราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้คุณ</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block text-[15px] font-semibold text-[#17263c]">
              อีเมล
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-3 min-h-[53px] h-auto w-full rounded-xl border border-slate-200 px-4 py-3 text-[15px] leading-[1.5] outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                placeholder="name@example.com"
              />
            </label>
            {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
            {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}
            <button type="submit" disabled={loading} className="inline-flex min-h-[53px] h-auto w-full items-center justify-center gap-2 rounded-xl bg-[#1d2b3f] px-4 py-3 text-sm leading-[1.4] font-bold text-white transition hover:bg-[#263952] disabled:cursor-not-allowed disabled:opacity-60">
              {loading && <Loader2 size={17} className="animate-spin" aria-hidden="true" />}
              ส่งลิงก์รีเซ็ตรหัสผ่าน
            </button>
          </form>
        </div>
        <Link href="/login" className="mt-8 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft size={15} aria-hidden="true" /> กลับเข้าสู่ระบบ</Link>
      </section>
    </main>
  );
}
