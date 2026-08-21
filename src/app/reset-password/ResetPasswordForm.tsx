'use client';

import Link from 'next/link';
import { CheckCircle2, Loader2, LockKeyhole, Sparkles } from 'lucide-react';
import { FormEvent, useState } from 'react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { supabaseClient } from '@/lib/supabase/client';

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!supabaseClient) {
      setError('ยังไม่ได้ตั้งค่า Supabase ในไฟล์ environment');
      return;
    }
    if (password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }
    if (password !== confirmation) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabaseClient.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setUpdated(true);
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
        <div className="w-full rounded-2xl border border-slate-100 bg-white px-6 py-10 shadow-[0_5px_18px_rgba(15,23,42,0.07)] sm:px-12 sm:py-14">
          {updated ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto text-emerald-500" size={48} aria-hidden="true" />
              <h1 className="mt-5 text-3xl font-bold tracking-tight text-[#12233c]">เปลี่ยนรหัสผ่านแล้ว</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที</p>
              <Link href="/login" className="mt-8 inline-flex rounded-xl bg-[#1d2b3f] px-5 py-3 text-sm font-bold text-white hover:bg-[#263952]">ไปหน้าเข้าสู่ระบบ</Link>
            </div>
          ) : (
            <>
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-600"><LockKeyhole size={22} aria-hidden="true" /></div>
              <h1 className="mt-5 text-center text-3xl font-bold tracking-tight text-[#12233c]">ตั้งรหัสผ่านใหม่</h1>
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <label className="block text-[15px] font-semibold text-[#17263c]">รหัสผ่านใหม่
                <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-3 min-h-[53px] h-auto w-full rounded-xl border border-slate-200 px-4 py-3 text-[15px] leading-[1.5] outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100" placeholder="อย่างน้อย 8 ตัวอักษร" />
                </label>
                <label className="block text-[15px] font-semibold text-[#17263c]">ยืนยันรหัสผ่าน
                <input required minLength={8} type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-3 min-h-[53px] h-auto w-full rounded-xl border border-slate-200 px-4 py-3 text-[15px] leading-[1.5] outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100" placeholder="กรอกรหัสผ่านอีกครั้ง" />
                </label>
                {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
                <button type="submit" disabled={loading} className="inline-flex min-h-[53px] h-auto w-full items-center justify-center gap-2 rounded-xl bg-[#1d2b3f] px-4 py-3 text-sm leading-[1.4] font-bold text-white transition hover:bg-[#263952] disabled:cursor-not-allowed disabled:opacity-60">
                  {loading && <Loader2 size={17} className="animate-spin" aria-hidden="true" />}
                  บันทึกรหัสผ่านใหม่
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
