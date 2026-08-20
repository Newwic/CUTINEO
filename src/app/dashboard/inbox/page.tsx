'use client';

import Link from 'next/link';
import { LogOut, MessageSquareText, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import ConversationList from './components/ConversationList';
import ChatArea from './components/ChatArea';
import CustomerCRMDrawer from './components/CustomerCRMDrawer';

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const client = supabaseClient;
    if (!client) {
      setError('ยังไม่ได้ตั้งค่า Supabase กรุณาสร้างไฟล์ .env.local ก่อน');
      setLoading(false);
      return;
    }
    const db = client;

    let mounted = true;

    async function fetchConversations() {
      const { data: sessionData } = await db.auth.getSession();
      if (!sessionData.session) {
        if (mounted) {
          setAuthRequired(true);
          setLoading(false);
        }
        return;
      }

      const { data, error: fetchError } = await db
        .from('conversations')
        .select(
          'id, tenant_id, channel_id, contact_id, status, assigned_to, last_message_preview, last_message_at, created_at, updated_at, contacts(id, display_name, phone, email, avatar_url, tags, notes, created_at), channels(id, tenant_id, platform, name, is_active)',
        )
        .order('last_message_at', { ascending: false });

      if (!mounted) return;
      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setConversations(data ?? []);
      setActiveConvId((current) => current ?? data?.[0]?.id ?? null);
      setLoading(false);
    }

    void fetchConversations();

    const realtime = db
      .channel('realtime_inbox')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => void fetchConversations(),
      )
      .subscribe();

    const authSubscription = db.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthRequired(true);
        setConversations([]);
        setActiveConvId(null);
      } else {
        setAuthRequired(false);
        void fetchConversations();
      }
    });

    return () => {
      mounted = false;
      void db.removeChannel(realtime);
      authSubscription.data.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabaseClient?.auth.signOut();
  }

  const activeConversation = conversations.find((item) => item.id === activeConvId);

  if (authRequired) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-5 text-white">
        <section className="max-w-md rounded-3xl border border-white/10 bg-white/[0.07] p-8 text-center shadow-2xl">
          <MessageSquareText className="mx-auto text-indigo-300" size={34} aria-hidden="true" />
          <h1 className="mt-5 text-2xl font-black">เข้าสู่ระบบก่อนใช้งาน Inbox</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            บทสนทนาและข้อมูลลูกค้าจะแสดงเฉพาะสมาชิกของ workspace ที่ได้รับสิทธิ์เท่านั้น
          </p>
          <Link href="/login" className="mt-6 inline-flex rounded-xl bg-indigo-500 px-5 py-3 text-sm font-bold hover:bg-indigo-400">
            ไปหน้าเข้าสู่ระบบ
          </Link>
        </section>
      </main>
    );
  }

  if (loading) {
    return <div className="grid h-dvh place-items-center bg-slate-50 text-sm font-semibold text-slate-500">กำลังโหลด Unified Inbox…</div>;
  }

  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden bg-slate-50 font-sans text-slate-900">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-black tracking-tight text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">
            <MessageSquareText size={16} aria-hidden="true" />
          </span>
          CUTINEO <span className="hidden text-xs font-semibold text-slate-400 sm:inline">/ Unified Inbox</span>
        </Link>
        <div className="flex items-center gap-2">
          <button type="button" className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 sm:inline-flex" aria-label="ตั้งค่า">
            <Settings size={18} aria-hidden="true" />
          </button>
          <button type="button" onClick={signOut} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900">
            <LogOut size={16} aria-hidden="true" /> <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </div>
      </header>

      {error && <div className="border-b border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">โหลดข้อมูลไม่สำเร็จ: {error}</div>}

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-80 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
          <ConversationList
            activeId={activeConvId}
            conversations={conversations}
            onSelect={(id: string) => setActiveConvId(id)}
          />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-white">
          {activeConversation ? (
            <ChatArea conversation={activeConversation} />
          ) : (
            <div className="grid flex-1 place-items-center px-6 text-center text-slate-400">
              <div>
                <MessageSquareText className="mx-auto mb-3 text-slate-300" size={42} aria-hidden="true" />
                <p className="font-semibold">ยังไม่มีบทสนทนาใน workspace นี้</p>
                <p className="mt-1 text-sm">เชื่อมต่อ LINE แล้วข้อความใหม่จะปรากฏที่นี่</p>
              </div>
            </div>
          )}
        </section>

        {activeConversation && (
          <aside className="hidden w-80 shrink-0 border-l border-slate-200 bg-white lg:flex lg:flex-col">
            <CustomerCRMDrawer conversation={activeConversation} />
          </aside>
        )}
      </div>

      <div className="border-t border-slate-200 bg-white p-2 md:hidden">
        <ConversationList
          activeId={activeConvId}
          conversations={conversations}
          onSelect={(id: string) => setActiveConvId(id)}
          compact
        />
      </div>
    </main>
  );
}
