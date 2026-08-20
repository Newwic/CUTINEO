'use client';

import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { supabaseClient } from '@/lib/supabase/client';

type AuthMode = 'signin' | 'signup';
type LoginMethod = 'email' | 'phone';

interface LoginFormProps {
  initialMode?: AuthMode;
}

function CutineoLogo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 text-[27px] font-black tracking-[-0.06em] text-slate-800">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#42d5c5] text-white shadow-sm shadow-teal-200">
        <Sparkles size={21} strokeWidth={2.8} aria-hidden="true" />
      </span>
      cutineo
    </Link>
  );
}

export default function LoginForm({ initialMode = 'signin' }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [method, setMethod] = useState<LoginMethod>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabaseClient) return;
    void supabaseClient.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard/inbox');
    });
  }, [router]);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError('');
    setNotice('');
  }

  function switchMethod(nextMethod: LoginMethod) {
    setMethod(nextMethod);
    setIdentifier('');
    setError('');
    setNotice('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!supabaseClient) {
      setError('ยังไม่ได้ตั้งค่า Supabase ในไฟล์ environment');
      return;
    }

    if (!identifier.trim()) {
      setError(method === 'email' ? 'กรุณากรอกอีเมล' : 'กรุณากรอกเบอร์โทรศัพท์');
      return;
    }

    if (password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }

    setLoading(true);
    const authResult =
      mode === 'signin'
        ? method === 'email'
          ? await supabaseClient.auth.signInWithPassword({ email: identifier.trim(), password })
          : await supabaseClient.auth.signInWithPassword({ phone: identifier.trim(), password })
        : method === 'email'
          ? await supabaseClient.auth.signUp({ email: identifier.trim(), password })
          : await supabaseClient.auth.signUp({ phone: identifier.trim(), password });
    setLoading(false);

    if (authResult.error) {
      setError(authResult.error.message);
      return;
    }

    if (mode === 'signup' && !authResult.data.session) {
      setNotice(
        method === 'email'
          ? 'สมัครสำเร็จ กรุณาตรวจอีเมลเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ'
          : 'สมัครสำเร็จ กรุณายืนยันเบอร์โทรศัพท์ตามขั้นตอนของ Supabase',
      );
      return;
    }

    router.replace('/dashboard/inbox');
  }

  const identifierLabel = method === 'email' ? 'อีเมล' : 'เบอร์โทรศัพท์';

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <header className="mx-auto flex w-full max-w-[1450px] items-center justify-between px-6 py-8 sm:px-10 lg:px-16">
        <CutineoLogo />
        <LanguageSwitcher variant="light" />
      </header>

      <section className="mx-auto flex w-full max-w-[680px] flex-col items-center px-5 pb-10 pt-16 sm:pt-24">
        <div className="w-full rounded-2xl border border-slate-100 bg-white px-6 py-10 shadow-[0_5px_18px_rgba(15,23,42,0.07)] sm:px-[53px] sm:py-14">
          <h1 className="text-center text-[30px] font-bold tracking-[-0.03em] text-[#12233c] sm:text-[34px]">
            {mode === 'signin' ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'}
          </h1>

          <div role="tablist" aria-label="ประเภทการเข้าสู่ระบบ" className="mx-auto mt-10 flex w-fit rounded-full bg-[#f7f8fa] p-1.5">
            <button
              type="button"
              role="tab"
              aria-selected={method === 'email'}
              onClick={() => switchMethod('email')}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${method === 'email' ? 'bg-white text-[#17263c] shadow-[0_2px_7px_rgba(15,23,42,0.08)]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              อีเมล
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={method === 'phone'}
              onClick={() => switchMethod('phone')}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${method === 'phone' ? 'bg-white text-[#17263c] shadow-[0_2px_7px_rgba(15,23,42,0.08)]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              เบอร์โทรศัพท์
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-7">
            <label className="block text-[15px] font-semibold text-[#17263c]">
              {identifierLabel}
              <input
                required
                type={method === 'email' ? 'email' : 'tel'}
                autoComplete={method === 'email' ? 'email' : 'tel'}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="mt-3 h-[53px] w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-normal text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                placeholder={method === 'email' ? 'name@example.com' : '08x-xxx-xxxx'}
              />
            </label>

            <label className="block text-[15px] font-semibold text-[#17263c]">
              รหัสผ่าน
              <span className="relative mt-3 block">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  minLength={8}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-[53px] w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-[15px] font-normal text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                </button>
              </span>
            </label>

            {mode === 'signin' && (
              <p className="-mt-4 text-[15px] text-[#17263c]">
                ลืมรหัสผ่าน{' '}
                <Link href="/forgot-password" className="font-medium text-[#10a8a2] underline decoration-transparent underline-offset-2 transition hover:decoration-current">
                  รีเซ็ตรหัสผ่าน
                </Link>
              </p>
            )}

            {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">{error}</p>}
            {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">{notice}</p>}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-[53px] w-full items-center justify-center gap-2 rounded-xl bg-[#1d2b3f] px-4 text-[15px] font-bold text-white shadow-sm transition hover:bg-[#263952] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 size={17} className="animate-spin" aria-hidden="true" />}
              {mode === 'signin' ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-[15px] text-[#17263c]">
          {mode === 'signin' ? (
            <>
              ยังไม่มีบัญชี CUTINEO{' '}
              <button type="button" onClick={() => switchMode('signup')} className="font-medium text-[#10a8a2] underline decoration-transparent underline-offset-2 transition hover:decoration-current">
                สร้างบัญชี
              </button>
            </>
          ) : (
            <>
              มีบัญชีอยู่แล้ว?{' '}
              <button type="button" onClick={() => switchMode('signin')} className="font-medium text-[#10a8a2] underline decoration-transparent underline-offset-2 transition hover:decoration-current">
                เข้าสู่ระบบ
              </button>
            </>
          )}
        </p>

        <Link href="/" className="mt-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-700">
          <ArrowLeft size={15} aria-hidden="true" /> กลับหน้าแรก
        </Link>
        <p className="mt-10 text-center text-xs text-slate-400">© 2026 CUTINEO. All rights reserved.</p>
      </section>
    </main>
  );
}
