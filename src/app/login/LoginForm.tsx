'use client';

import Link from 'next/link';
import { Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { sanitizeRedirectPath } from '@/lib/auth/redirect';
import {
  bootstrapSupabaseSession,
  supabaseClient,
  syncSupabaseSession,
} from '@/lib/supabase/client';

interface LoginFormProps {
  nextPath?: string;
  registrationDisabled?: boolean;
}

function CutineoLogo() {
  return (
    <div className="inline-flex items-center gap-2.5 text-[27px] font-black tracking-[-0.06em] text-slate-800">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#42d5c5] text-white shadow-sm shadow-teal-200">
        <Sparkles size={21} strokeWidth={2.8} aria-hidden="true" />
      </span>
      CUTINEO
    </div>
  );
}

function readableAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
  if (normalized.includes('email not confirmed')) return 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ';
  if (normalized.includes('too many requests')) return 'มีการลองเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่';
  return 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองใหม่อีกครั้ง';
}

export default function LoginForm({ nextPath = '/inbox', registrationDisabled = false }: LoginFormProps) {
  const router = useRouter();
  const destination = sanitizeRedirectPath(nextPath);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(registrationDisabled ? 'การสมัครบัญชีใหม่ต้องได้รับอนุญาตจาก Owner ก่อน' : '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabaseClient) return undefined;
    let mounted = true;

    void bootstrapSupabaseSession().then((session) => {
      if (mounted && session) {
        router.replace(destination as never);
        router.refresh();
      }
    });

    return () => {
      mounted = false;
    };
  }, [destination, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError('');
    setNotice('');

    if (!supabaseClient) {
      setError('ระบบ Login ยังไม่ได้ตั้งค่า Supabase กรุณาติดต่อ Owner');
      return;
    }
    if (!email.trim()) {
      setError('กรุณากรอกอีเมล');
      return;
    }
    if (password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        setError(readableAuthError(authError.message));
        return;
      }
      if (!data.session) {
        setError('เข้าสู่ระบบสำเร็จแต่ยังไม่พบ Session กรุณาลองใหม่อีกครั้ง');
        return;
      }

      await syncSupabaseSession(data.session);
      setPassword('');
      router.replace(destination as never);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error && submitError.message.includes('secure session')
        ? submitError.message
        : 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <header className="mx-auto flex w-full max-w-[1450px] items-center justify-between px-6 py-8 sm:px-10 lg:px-16">
        <CutineoLogo />
        <LanguageSwitcher variant="light" />
      </header>

      <section className="mx-auto flex w-full max-w-[560px] flex-col items-center px-5 pb-10 pt-12 sm:pt-20">
        <div className="w-full min-w-0 rounded-2xl border border-slate-100 bg-white px-6 py-10 shadow-[0_5px_18px_rgba(15,23,42,0.07)] sm:px-12 sm:py-14">
          <h1 className="text-center text-[30px] font-bold leading-[1.25] tracking-[-0.03em] text-[#12233c] sm:text-[34px]">
            เข้าสู่ระบบ
          </h1>
          <p className="mt-3 text-center text-sm text-slate-500">เข้าสู่ระบบจัดการแชตลูกค้า</p>

          <form onSubmit={handleSubmit} className="mt-9 space-y-6">
            <label className="block text-[15px] font-semibold text-[#17263c]">
              อีเมล
              <input
                required
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-3 min-h-[52px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-normal leading-[1.5] text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                placeholder="name@example.com"
              />
            </label>

            <label className="block text-[15px] font-semibold text-[#17263c]">
              รหัสผ่าน
              <span className="relative mt-3 block">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  minLength={8}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-h-[52px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-base font-normal leading-[1.5] text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  className="absolute right-2 top-1/2 grid min-h-[44px] min-w-[44px] -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                </button>
              </span>
            </label>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm font-medium text-[#10a8a2] underline underline-offset-2">
                ลืมรหัสผ่าน
              </Link>
            </div>

            {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">{error}</p>}
            {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">{notice}</p>}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#1d2b3f] px-4 py-3 text-base font-bold text-white shadow-sm transition hover:bg-[#263952] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
              {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">บัญชีผู้ใช้ต้องถูกสร้างและอนุมัติโดย Owner</p>
        <p className="mt-8 text-center text-xs text-slate-400">© 2026 CUTINEO. All rights reserved.</p>
      </section>
    </main>
  );
}
