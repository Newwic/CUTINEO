'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  BarChart3,
  Bell,
  Bot,
  ChevronDown,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  PackageCheck,
  Settings2,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  bootstrapSupabaseSession,
  clearSupabaseSession,
  supabaseClient,
} from '@/lib/supabase/client';
import { clearPrivateCaches } from '@/lib/pwa/cache';
import { NEO_LOGO_PATH } from '@/lib/branding';
import ChatArea from './components/ChatArea';
import ConversationList from './components/ConversationList';
import CustomerCRMDrawer from './components/CustomerCRMDrawer';
import AIUsageCard from '../components/AIUsageCard';
import type { InboxConversation } from './types';

const DEMO_CONVERSATIONS: InboxConversation[] = [
  {
    id: 'demo-aom',
    tenant_id: 'demo-tenant',
    contact_id: 'demo-contact-aom',
    assigned_to: 'ai_agent',
    status: 'open',
    last_message_preview: 'โอเคเลยค่ะ ขอให้ช่วยแนะนำขั้นตอนสมัครด้วยนะคะ',
    last_message_at: '2026-08-21T10:42:00+07:00',
    contacts: { display_name: 'Aom S.', phone: '080-123-4567', tags: ['Pro lead'] },
    channels: { platform: 'line', name: 'LINE OA', is_active: true },
    isDemo: true,
  },
  {
    id: 'demo-bua',
    tenant_id: 'demo-tenant',
    contact_id: 'demo-contact-bua',
    assigned_to: 'ai_agent',
    status: 'pending_human',
    last_message_preview: 'ขอเช็กสถานะออเดอร์ล่าสุดให้หน่อยค่ะ',
    last_message_at: '2026-08-21T10:35:00+07:00',
    contacts: { display_name: 'Bua K.', phone: '081-222-4188', tags: ['Order'] },
    channels: { platform: 'line', name: 'LINE OA', is_active: true },
    isDemo: true,
  },
  {
    id: 'demo-chai',
    tenant_id: 'demo-tenant',
    contact_id: 'demo-contact-chai',
    assigned_to: 'human_agent',
    status: 'pending_human',
    last_message_preview: 'มีแพ็กเกจสำหรับทีมเล็กไหมครับ',
    last_message_at: '2026-08-21T09:58:00+07:00',
    contacts: { display_name: 'Chai T.', phone: '089-500-1240', tags: ['Starter'] },
    channels: { platform: 'facebook', name: 'Facebook', is_active: true },
    isDemo: true,
  },
  {
    id: 'demo-fern',
    tenant_id: 'demo-tenant',
    contact_id: 'demo-contact-fern',
    assigned_to: 'ai_agent',
    status: 'open',
    last_message_preview: 'ขอบคุณมากนะคะ เดี๋ยวลองเข้าไปดูค่ะ',
    last_message_at: '2026-08-21T09:41:00+07:00',
    contacts: { display_name: 'Fern P.', phone: '086-910-8890', tags: ['Returning'] },
    channels: { platform: 'instagram', name: 'Instagram', is_active: true },
    isDemo: true,
  },
  {
    id: 'demo-kim',
    tenant_id: 'demo-tenant',
    contact_id: 'demo-contact-kim',
    assigned_to: 'ai_agent',
    status: 'open',
    last_message_preview: 'สนใจรายละเอียดแพ็กเกจ Enterprise ค่ะ',
    last_message_at: '2026-08-21T09:20:00+07:00',
    contacts: { display_name: 'Kim A.', phone: '082-003-7811', tags: ['Enterprise'] },
    channels: { platform: 'line', name: 'LINE OA', is_active: true },
    isDemo: true,
  },
  {
    id: 'demo-mew',
    tenant_id: 'demo-tenant',
    contact_id: 'demo-contact-mew',
    assigned_to: 'human_agent',
    status: 'open',
    last_message_preview: 'สะดวกให้ติดต่อกลับช่วงบ่ายค่ะ',
    last_message_at: '2026-08-21T08:52:00+07:00',
    contacts: { display_name: 'Mew R.', phone: '094-440-3312', tags: ['Callback'] },
    channels: { platform: 'facebook', name: 'Facebook', is_active: true },
    isDemo: true,
  },
];

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Conversations', icon: MessageSquareText, badge: '6' },
  { label: 'Contacts', icon: UsersRound },
  { label: 'Fulfillment', icon: PackageCheck },
  { label: 'AI Agent', icon: Bot, badge: 'Live' },
  { label: 'Settings', icon: Settings2 },
];

type InboxMembership = {
  tenantId: string;
  role: 'owner' | 'admin' | 'agent' | 'viewer';
};

function isLiveConversationList(value: unknown): value is InboxConversation[] {
  return Array.isArray(value) && value.every((conversation) => (
    Boolean(conversation)
    && typeof conversation === 'object'
    && typeof (conversation as InboxConversation).id === 'string'
  ));
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<InboxConversation[]>(DEMO_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string | null>(DEMO_CONVERSATIONS[0].id);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [canManageSettings, setCanManageSettings] = useState(false);
  const [memberships, setMemberships] = useState<InboxMembership[]>([]);
  const [userLabel, setUserLabel] = useState('ผู้ใช้งาน');
  const [userInitials, setUserInitials] = useState('CU');
  const [userRole, setUserRole] = useState('สมาชิก');
  const [activeNav, setActiveNav] = useState('Conversations');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileConversationsOpen, setMobileConversationsOpen] = useState(false);
  const [mobileCustomerOpen, setMobileCustomerOpen] = useState(false);
  const [mobileAiSignal, setMobileAiSignal] = useState(0);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let mounted = true;
    const client = supabaseClient;

    function redirectToLogin() {
      if (mounted) window.location.replace('/login?next=%2Finbox');
    }

    async function fetchLiveConversations() {
      if (!client) {
        setConversations([]);
        setActiveConvId(null);
        setLoadError('ระบบ Authentication ยังไม่ได้ตั้งค่า กรุณาติดต่อ Owner');
        setLoading(false);
        return;
      }

      const session = await bootstrapSupabaseSession();
      if (!mounted) return;
      if (!session) {
        redirectToLogin();
        return;
      }

      const metadataName = typeof session.user.user_metadata?.full_name === 'string'
        ? session.user.user_metadata.full_name.trim()
        : '';
      const sessionLabel = metadataName || session.user.email || 'ผู้ใช้งาน';
      setUserLabel(sessionLabel);
      setUserInitials(sessionLabel.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'CU');

      const response = await fetch('/api/inbox', { credentials: 'include', cache: 'no-store' });
      const payload = await response.json().catch(() => null) as {
        conversations?: unknown;
        memberships?: InboxMembership[];
        error?: string;
      } | null;
      const data = payload?.conversations;
      const error = response.ok ? null : new Error(payload?.error || 'Unable to load inbox');

      if (!mounted) return;
      if (error) {
        console.error('[CUTINEO inbox] failed to load conversations', error);
        setConversations([]);
        setActiveConvId(null);
        setIsDemoMode(false);
        setCanManageSettings(false);
        setMemberships([]);
        setLoadError(`โหลด conversations ไม่สำเร็จ: ${error.message}`);
        setLoading(false);
        return;
      }

      if (!isLiveConversationList(data)) {
        setConversations([]);
        setActiveConvId(null);
        setIsDemoMode(false);
        setCanManageSettings(false);
        setMemberships([]);
        setLoadError('รูปแบบข้อมูล conversations จาก Supabase ไม่ถูกต้อง');
        setLoading(false);
        return;
      }

      if (data.length === 0) {
        setConversations(DEMO_CONVERSATIONS);
        setActiveConvId(DEMO_CONVERSATIONS[0].id);
        setIsDemoMode(true);
        setCanManageSettings(Boolean(payload?.memberships?.some(({ role }) => role === 'owner' || role === 'admin')));
        setMemberships(payload?.memberships ?? []);
        setUserRole(payload?.memberships?.find(({ role }) => role)?.role || 'สมาชิก');
        setLoadError('ยังไม่พบ conversation ใน workspace นี้ หรือบัญชีนี้ยังไม่ได้เป็นสมาชิกของ tenant');
        setLoading(false);
        return;
      }

      setConversations(data);
      setActiveConvId((current) => current && data.some((item) => item.id === current) ? current : data[0].id);
      setIsDemoMode(false);
      setCanManageSettings(Boolean(payload?.memberships?.some(({ role }) => role === 'owner' || role === 'admin')));
      setMemberships(payload?.memberships ?? []);
      setUserRole(payload?.memberships?.find(({ role }) => role)?.role || 'สมาชิก');
      setLoading(false);
    }

    void fetchLiveConversations();

    if (!client) {
      return () => {
        mounted = false;
      };
    }

    const realtime = client
      .channel('cutineo-inbox-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => void fetchLiveConversations(),
      )
      .subscribe();

    const authSubscription = client.auth.onAuthStateChange((_event, session) => {
      if (!session) redirectToLogin();
      else void fetchLiveConversations();
    });

    return () => {
      mounted = false;
      void client.removeChannel(realtime);
      authSubscription.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function verifyRestoredPage() {
      const response = await fetch('/api/auth/session', { credentials: 'include', cache: 'no-store' });
      if (!response.ok) window.location.replace('/login?next=%2Finbox');
    }

    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) void verifyRestoredPage();
    }

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 3_500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const requestedId = new URLSearchParams(window.location.search).get('conversation');
    if (requestedId && conversations.some((conversation) => conversation.id === requestedId)) {
      setActiveConvId(requestedId);
    }
  }, [conversations]);

  useEffect(() => {
    if (!activeConvId) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('conversation') === activeConvId) return;
    url.searchParams.set('conversation', activeConvId);
    window.history.replaceState(null, '', url);
  }, [activeConvId]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConvId) || null,
    [activeConvId, conversations],
  );

  const activeMembership = activeConversation && !activeConversation.isDemo
    ? memberships.find((membership) => membership.tenantId === activeConversation.tenant_id)
    : undefined;
  const canSendMessages = Boolean(activeConversation?.isDemo || (activeMembership && activeMembership.role !== 'viewer'));

  function selectConversation(id: string) {
    setActiveConvId(id);
    setMobileConversationsOpen(false);
    setMobileCustomerOpen(false);
  }

  function updatePreview(conversationId: string, preview: string) {
    setConversations((current) => current.map((conversation) => (
      conversation.id === conversationId
        ? { ...conversation, last_message_preview: preview, last_message_at: new Date().toISOString() }
        : conversation
    )));
  }

  function retryConversationLoad() {
    window.location.reload();
  }

  function handleNavClick(label: string) {
    setActiveNav(label);
    setMobileNavOpen(false);
    if (label !== 'Conversations') {
      setNotice(`${label} module พร้อมเชื่อมต่อใน workspace นี้`);
    }
  }

  async function handleSecureSignOut() {
    try {
      await clearSupabaseSession();
      await clearPrivateCaches();
    } finally {
      window.location.replace('/login');
    }
  }

  async function signOut() {
    await handleSecureSignOut();
    return;

    if (!supabaseClient) {
      setNotice('กำลังดูอยู่ใน Demo mode — ยังไม่มี session ให้ sign out');
      return;
    }
    await supabaseClient?.auth.signOut();
    setNotice('ออกจากระบบแล้ว');
  }

  if (loading) {
    return (
      <main className="cutineo-loading">
        <Image
          className="brand-logo brand-logo-loading"
          src={NEO_LOGO_PATH}
          alt="Neo"
          width={36}
          height={36}
          priority
        />
        <div>
          <strong>Loading CUTINEO Inbox</strong>
          <span>กำลังเตรียม workspace ของคุณ...</span>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="cutineo-shell">
      <div
        className={`mobile-scrim ${mobileNavOpen || mobileConversationsOpen || mobileCustomerOpen ? 'is-visible' : ''}`}
        onClick={() => {
          setMobileNavOpen(false);
          setMobileConversationsOpen(false);
          setMobileCustomerOpen(false);
        }}
        aria-hidden="true"
      />

      <aside className={`cutineo-sidebar ${mobileNavOpen ? 'is-mobile-open' : ''}`} aria-label="เมนูหลัก">
        <div className="sidebar-top">
          <div className="sidebar-brand-row">
            <Link href={"/inbox" as never} className="sidebar-brand" aria-label="CUTINEO Inbox">
              <Image
                className="brand-logo"
                src={NEO_LOGO_PATH}
                alt="CUTINEO"
                width={36}
                height={36}
                priority
              />
              <span className="brand-wordmark">
                <strong>CUTINEO</strong>
                <small>OMNICHANNEL OS</small>
              </span>
            </Link>
            <button
              type="button"
              className="mobile-close-button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="ปิดเมนู"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <button type="button" className="workspace-switcher" onClick={() => setNotice('Workspace switcher พร้อมใช้งานเร็ว ๆ นี้')}>
            <span className="workspace-avatar">CS</span>
            <span className="workspace-switcher-copy">
              <small>WORKSPACE</small>
              <strong>Cutineo Studio</strong>
            </span>
            <ChevronDown size={15} aria-hidden="true" />
          </button>

          <nav className="primary-nav">
            <p className="nav-section-label">Workspace</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeNav === item.label;
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`nav-item ${active ? 'is-active' : ''}`}
                  onClick={() => handleNavClick(item.label)}
                >
                  <Icon size={18} strokeWidth={active ? 2.3 : 1.8} aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.badge && <span className={`nav-item-badge ${item.badge === 'Live' ? 'is-live' : ''}`}>{item.badge}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <AIUsageCard onNotice={setNotice} />
          <div className="legacy-ai-usage-card">
            <div className="usage-title"><span><Sparkles size={13} aria-hidden="true" /> Neo AI credits</span><strong>78%</strong></div>
            <div className="usage-bar"><span /></div>
            <p>2,340 of 3,000 responses used</p>
            <button type="button" onClick={() => setNotice('Plan & billing พร้อมเชื่อมต่อใน Settings')}>View plan <span>→</span></button>
          </div>

          <button type="button" className="help-link" onClick={() => setNotice('ทีม support จะช่วยคุณจากหน้านี้เร็ว ๆ นี้')}>
            <HelpCircle size={17} aria-hidden="true" /> Help center
          </button>
          <div className="sidebar-profile">
            <span className="profile-avatar">{userInitials}</span>
            <span className="profile-copy"><strong>{userLabel}</strong><small>{userRole}</small></span>
            <button type="button" className="profile-action" onClick={() => void signOut()} aria-label="ออกจากระบบ" title="Sign out">
              <LogOut size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      <aside className={`conversations-column ${mobileConversationsOpen ? 'is-mobile-open' : ''}`} aria-label="รายการ Conversations">
        <ConversationList
          conversations={conversations}
          activeId={activeConvId}
          onSelect={selectConversation}
          onNewConversation={() => setNotice('สร้าง conversation ใหม่ได้จากการเชื่อมต่อ channel')}
        />
      </aside>

      <section className="chat-column">
        {activeConversation ? (
          <ChatArea
            conversation={activeConversation}
            canSend={canSendMessages}
            onOpenNav={() => setMobileNavOpen(true)}
            onOpenConversations={() => setMobileConversationsOpen(true)}
            onOpenCustomerDetails={() => setMobileCustomerOpen(true)}
            openAiSignal={mobileAiSignal}
            onPreviewUpdate={updatePreview}
            onNotice={setNotice}
          />
        ) : (
          <div className="chat-column-empty">
            <Image
              className="neo-avatar neo-avatar-large"
              src={NEO_LOGO_PATH}
              alt="Neo AI"
              width={45}
              height={45}
            />
            <strong>{loadError ? 'โหลดห้องแชทไม่สำเร็จ' : 'ยังไม่มีห้องแชท'}</strong>
            <span>{loadError || 'เลือกห้องสนทนาจากรายการเพื่อเริ่มตอบกลับ'}</span>
            {loadError && (
              <button type="button" className="empty-retry-button" onClick={retryConversationLoad}>
                ลองโหลดใหม่
              </button>
            )}
          </div>
        )}
      </section>

      <div className="topbar-status" aria-label="สถานะระบบ">
        <span className="system-online-dot" />
        <span>{isDemoMode ? 'ยังไม่ได้เชื่อมต่อช่องทาง' : 'Live workspace'}</span>
        {isDemoMode && canManageSettings && (
          <Link href={"/settings" as never} className="inbox-settings-link">
            ตั้งค่าช่องทาง
          </Link>
        )}
        <Bell size={15} aria-hidden="true" />
      </div>

      {notice && (
        <div className="dashboard-toast" role="status">
          <BarChart3 size={16} aria-hidden="true" />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="ปิดการแจ้งเตือน">
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}
      </main>

    <nav className="mobile-bottom-nav" aria-label="เมนูหลักบนมือถือ">
      <button type="button" className="is-active" onClick={() => setMobileConversationsOpen(true)}>
        <MessageSquareText size={18} aria-hidden="true" /><span>Inbox</span>
      </button>
      <button type="button" onClick={() => setMobileCustomerOpen(true)}>
        <UsersRound size={18} aria-hidden="true" /><span>ลูกค้า</span>
      </button>
      <button type="button" onClick={() => setNotice('Sales workspace พร้อมให้ทีมเริ่มจัดการดีล')}>
        <PackageCheck size={18} aria-hidden="true" /><span>ขาย</span>
      </button>
      <button type="button" onClick={() => setMobileAiSignal((value) => value + 1)}>
        <Sparkles size={18} aria-hidden="true" /><span>AI</span>
      </button>
      <button type="button" onClick={() => setMobileNavOpen(true)}>
        <Settings2 size={18} aria-hidden="true" /><span>เพิ่มเติม</span>
      </button>
    </nav>

    {mobileCustomerOpen && activeConversation && (
      <div className="customer-detail-sheet" role="dialog" aria-modal="true" aria-labelledby="customer-detail-title">
        <header className="sheet-heading">
          <strong id="customer-detail-title">ข้อมูลลูกค้า</strong>
          <button type="button" className="sheet-close" onClick={() => setMobileCustomerOpen(false)} aria-label="ปิดข้อมูลลูกค้า"><X size={18} aria-hidden="true" /></button>
        </header>
        <CustomerCRMDrawer conversation={activeConversation} />
      </div>
    )}
    </>
  );
}
