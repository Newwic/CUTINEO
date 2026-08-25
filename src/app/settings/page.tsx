import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  CUTINEO_ACCESS_COOKIE,
  CUTINEO_REFRESH_COOKIE,
  getUserFromCookieTokens,
} from '@/lib/supabase/session';
import { getTenantMemberships } from '@/lib/tenant-access';
import { requireSupabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ตั้งค่าการเชื่อมต่อ | CUTINEO',
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const cookieStore = cookies();
  const user = await getUserFromCookieTokens(
    cookieStore.get(CUTINEO_ACCESS_COOKIE)?.value,
    cookieStore.get(CUTINEO_REFRESH_COOKIE)?.value,
  );

  if (!user) redirect('/login?next=%2Fsettings');

  try {
    const memberships = await getTenantMemberships(requireSupabaseServer(), user.id);
    const adminMembership = memberships.find(({ role }) => role === 'owner' || role === 'admin');

    if (!adminMembership) redirect('/inbox?error=forbidden');

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6">
        <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-600">CUTINEO</p>
          <h1 className="mt-3 text-2xl font-bold">ตั้งค่าการเชื่อมต่อช่องทาง</h1>
          <p className="mt-3 leading-7 text-slate-600">
            พื้นที่นี้สำหรับ Owner และ Admin เท่านั้น การเชื่อมต่อ LINE หรือ Facebook จะเปิดใช้งานเมื่อกำหนดค่าช่องทางและตรวจสอบสิทธิ์เรียบร้อยแล้ว
          </p>
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            ยังไม่ได้เชื่อมต่อช่องทางจริง ขณะนี้ Inbox จะแสดงข้อมูลจำลองเพื่อเตรียมหน้าจอเท่านั้น และยังไม่แสดงว่ารับข้อความจากลูกค้าจริงแล้ว
          </div>
          <Link
            href="/inbox"
            className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            กลับไป Inbox
          </Link>
        </section>
      </main>
    );
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error;
    redirect('/inbox?error=settings_unavailable');
  }
}
