import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { OpenClawAdapter } from './services/openClawAdapter';
import { getNeoPolicyReply } from './core/ai/neo-policy';

type ChannelKey = 'all' | 'line' | 'facebook' | 'instagram' | 'marketplace';
type LeadMode = 'trial' | 'contact' | 'login';

const channels: Array<{ key: ChannelKey; label: string; short: string; className: string; count?: number }> = [
  { key: 'all', label: 'ทุกช่องทาง', short: 'ทั้งหมด', className: 'channel-all', count: 12 },
  { key: 'line', label: 'LINE OA', short: 'LINE', className: 'channel-line', count: 6 },
  { key: 'facebook', label: 'Facebook', short: 'FB', className: 'channel-facebook', count: 3 },
  { key: 'instagram', label: 'Instagram', short: 'IG', className: 'channel-instagram', count: 2 },
  { key: 'marketplace', label: 'Marketplace', short: 'MK', className: 'channel-marketplace', count: 1 },
];

const channelMessages: Record<ChannelKey, { name: string; channel: string; channelClass: string; initials: string; message: string; reply: string }> = {
  all: {
    name: 'มินตรา ร้านดอกไม้',
    channel: 'LINE OA',
    channelClass: 'channel-line',
    initials: 'ม',
    message: 'สวัสดีค่ะ สินค้ารุ่นนี้มีของพร้อมส่งไหมคะ?',
    reply: 'มีพร้อมส่งค่ะ เดี๋ยวแอดมินเช็กสีให้ทันทีนะคะ',
  },
  line: {
    name: 'มินตรา ร้านดอกไม้',
    channel: 'LINE OA',
    channelClass: 'channel-line',
    initials: 'ม',
    message: 'สวัสดีค่ะ สินค้ารุ่นนี้มีของพร้อมส่งไหมคะ?',
    reply: 'มีพร้อมส่งค่ะ เดี๋ยวแอดมินเช็กสีให้ทันทีนะคะ',
  },
  facebook: {
    name: 'Nina S.',
    channel: 'Facebook Messenger',
    channelClass: 'channel-facebook',
    initials: 'N',
    message: 'ขอรายละเอียดการจัดส่งหน่อยค่ะ',
    reply: 'จัดส่งทั่วประเทศค่ะ ใช้เวลา 1–3 วันทำการนะคะ',
  },
  instagram: {
    name: 'peachy.home',
    channel: 'Instagram DM',
    channelClass: 'channel-instagram',
    initials: 'P',
    message: 'แพ็กเกจ Pro มี AI ช่วยตอบกี่ข้อความคะ? ✨',
    reply: 'แพ็กเกจ Pro มีโควตา AI ตอบอัตโนมัติ 4,000 ข้อความต่อเดือนค่ะ',
  },
  marketplace: {
    name: 'อรทัย ส.',
    channel: 'Marketplace',
    channelClass: 'channel-marketplace',
    initials: 'อ',
    message: 'สินค้าจะเข้าสต็อกอีกวันไหนคะ?',
    reply: 'คาดว่าจะเข้าในวันพรุ่งนี้ค่ะ กดติดตามร้านไว้ได้เลยนะคะ',
  },
};

const plans = [
  {
    name: 'Starter',
    description: 'ระบบรวมแชทสำหรับร้านที่มีแอดมินตอบเอง ไม่ใช้ AI',
    monthly: 490,
    priceLabel: null,
    priceNote: '',
    suffix: '/เดือน',
    users: 'แอดมิน 2 บัญชี',
    features: ['เชื่อมต่อ 2 บัญชี LINE OA / Facebook Page', 'รวม Inbox ทุกช่องทางในหน้าเดียว', 'โน้ตหลังบ้านและแท็กสถานะลูกค้า', 'คลังข้อความตอบด่วน', 'เก็บประวัติแชท 90 วัน', 'ไม่มี AI ตอบอัตโนมัติ'],
    button: 'เริ่มต้น Starter',
  },
  {
    name: 'Pro',
    description: 'AI ช่วยตอบและปิดการขาย 24 ชม. สำหรับร้านค้าทั่วไป',
    monthly: 990,
    priceLabel: null,
    suffix: '/เดือน',
    priceNote: 'โปรโมชั่นปีแรก · ปีถัดไป ฿1,490/เดือน',
    users: 'แอดมิน 5 บัญชี',
    features: ['เชื่อมต่อ 5 บัญชี LINE OA / Facebook / Instagram', 'AI ตอบอัตโนมัติ 4,000 ข้อความ/เดือน', 'PromptPay QR ระบุยอดอัตโนมัติ', 'Slip OCR ตรวจสลิปและป้องกันสลิปซ้ำ', 'รองรับจัดส่ง / สินค้าดิจิทัล / จองคิว', 'ประวัติแชทไม่จำกัด'],
    button: 'เลือก Pro',
    featured: true,
  },
  {
    name: 'Advanced',
    description: 'สเกลยอดขาย ยิงแอดหนัก และดูแลหลายสาขาหลายเพจ',
    monthly: 1990,
    priceLabel: null,
    priceNote: '',
    suffix: '/เดือน',
    users: 'แอดมิน 15 บัญชี',
    features: ['เชื่อมต่อช่องทางไม่จำกัด', 'AI ตอบอัตโนมัติ 15,000 ข้อความ/เดือน', 'ทุกฟีเจอร์ของ Pro', 'รองรับ Webhook พื้นฐาน', 'เหมาะกับหลายสาขาหรือหลายเพจ'],
    button: 'เลือก Advanced',
  },
  {
    name: 'Enterprise',
    description: 'Custom Pricing สำหรับองค์กรและแบรนด์ใหญ่ มีหลายสิบสาขาหรือระบบหลังบ้านเฉพาะทาง',
    monthly: null,
    priceLabel: 'Custom Pricing',
    priceNote: 'เริ่มต้นประมาณ ฿19,900–39,900/เดือน',
    suffix: '/เดือน',
    users: 'แอดมินและช่องทางไม่จำกัด',
    features: ['AI ตอบอัตโนมัติ 100,000–200,000+ ข้อความ/เดือน', 'Custom API เชื่อมต่อ POS / ERP (SAP/Express)', 'SLA 99.9% + ทีม Onboarding', 'สัญญาธุรกิจ, PDPA Data Processing และใบกำกับภาษีเต็มรูปแบบ'],
    button: 'ติดต่อทีมงาน',
  },
];

const compareRows = [
  ['บัญชีและช่องทางที่เชื่อมต่อ', '2 บัญชี: LINE OA / Facebook Page', '5 บัญชี: LINE OA / FB / IG', 'ไม่จำกัด', 'ไม่จำกัด'],
  ['แอดมินในทีม', '2 บัญชี', '5 บัญชี', '15 บัญชี', 'ไม่จำกัด'],
  ['AI ตอบอัตโนมัติ', 'ไม่มี (คนตอบ 100%)', '4,000 ข้อความ/เดือน', '15,000 ข้อความ/เดือน', '100,000–200,000+ ข้อความ/เดือน'],
  ['กล่องข้อความกลาง', '✓', '✓', '✓', '✓'],
  ['Internal Note และแท็กสถานะ', '✓', '✓', '✓', '✓'],
  ['Quick Replies', '✓', '✓', '✓', '✓'],
  ['ประวัติแชท', '90 วัน', 'ไม่จำกัด', 'ไม่จำกัด', 'ไม่จำกัด'],
  ['PromptPay QR + Slip OCR', '—', '✓', '✓', 'ตามขอบเขต Enterprise'],
  ['จัดส่ง / ดิจิทัล / จองคิว', '—', '✓', '✓', 'ตามขอบเขต Enterprise'],
  ['Webhook / API', '—', '—', 'Webhook ส่งข้อมูลไปภายนอก', 'Custom API: POS / ERP'],
  ['Add-on เมื่อข้อความหมด', '—', '฿499 / 3,000 ข้อความ', '฿499 / 3,000 ข้อความ', 'คุยกับทีมงาน'],
];

function formatPrice(value: number | null) {
  if (value === null) return null;
  return new Intl.NumberFormat('th-TH').format(value);
}

function getNeoDemoReply(customerMessage: string) {
  const policyReply = getNeoPolicyReply(customerMessage);
  if (policyReply) return policyReply;

  const question = customerMessage.toLowerCase();
  const asksForPrice = question.includes('ราคา') || question.includes('แพ็กเกจ') || question.includes('เท่าไหร่') || question.includes('ค่าใช้จ่าย');

  if (question.includes('enterprise') || question.includes('องค์กร') || question.includes('หลายสิบสาขา') || question.includes('erp') || question.includes('pos') || question.includes('wms')) {
    return 'กรณีเป็นองค์กรหรือมีหลายสาขา Neo แนะนำ Enterprise ครับ\n• Custom Pricing เริ่มต้นประมาณ ฿19,900–39,900 / เดือน\n• AI 100,000–200,000+ ข้อความ / เดือน\n• เชื่อมต่อ Custom API กับ POS / ERP (SAP/Express)\n• SLA 99.9% + ทีม Onboarding ดูแลเป็นพิเศษ\n• สัญญาธุรกิจ, PDPA Data Processing และใบกำกับภาษีเต็มรูปแบบ\n\nเพื่อส่งต่อทีมฝ่ายขายขอข้อมูล 3 อย่างครับ\n1. ชื่อบริษัทหรือแบรนด์\n2. ชื่อผู้ติดต่อและเบอร์โทรศัพท์\n3. ระบบเดิมที่ต้องการเชื่อมต่อ เช่น POS, SAP หรือเว็บไซต์\n\nทีมฝ่ายขายจะติดต่อกลับเพื่อนัด Demo ระบบโดยตรงครับ';
  }

  if (question.includes('ช่องทางชำระ') || question.includes('เลขบัญชี') || question.includes('โอนเข้าบัญชี') || question.includes('payment link')) {
    return 'เรื่องช่องทางชำระเงินจริง Neo ขอส่งต่อให้แอดมินตรวจสอบข้อมูลให้ครับ เพื่อความถูกต้องและปลอดภัย ระบบจะไม่แสดงเลขบัญชี ลิงก์ชำระเงิน หรือ QR ที่ไม่ได้ยืนยันครับ';
  }

  if (question.includes('ตอบเอง') || question.includes('แอดมินอยู่แล้ว') || question.includes('ไม่ใช้ ai') || question.includes('กลัว ai')) {
    return 'ถ้ามีแอดมินคอยตอบเอง Neo แนะนำ Starter ครับ\n• ฿490 / เดือน\n• เชื่อมต่อ 2 บัญชี LINE OA / Facebook Page\n• แอดมิน 2 บัญชี\n• รวม Inbox, Internal Note, แท็ก และ Quick Replies\n• เก็บประวัติแชท 90 วัน\n• ไม่มี AI ตอบอัตโนมัติ\n\nเหมาะกับร้านที่ต้องการจัดระเบียบแชทโดยให้ทีมเป็นคนตอบครับ';
  }

  if (question.includes('ตอบไม่ทัน') || question.includes('ตอนดึก') || question.includes('ตรวจสลิป') || question.includes('slip') || question.includes('promptpay') || question.includes('ai')) {
    return 'จากความต้องการนี้ Neo แนะนำ Pro ครับ\n• ฿990 / เดือนในปีแรก และปีถัดไป ฿1,490 / เดือน\n• AI ตอบอัตโนมัติ 4,000 ข้อความ / เดือน\n• PromptPay QR ระบุยอดอัตโนมัติ\n• Slip OCR ตรวจสลิปและป้องกันสลิปซ้ำ\n• รองรับจัดส่ง สินค้าดิจิทัล และจองคิว\n\nถ้าข้อความหมด เพิ่มได้ 499 บาท ต่อ 3,000 ข้อความครับ';
  }

  if (question.includes('ยิงแอด') || question.includes('หลายสาขา') || question.includes('หลายเพจ') || question.includes('webhook') || question.includes('ขนาดกลาง')) {
    return 'ถ้าธุรกิจมีหลายเพจ ยิงแอดหนัก หรือมีหลายสาขา Neo แนะนำ Advanced ครับ\n• ฿1,990 / เดือน\n• เชื่อมต่อช่องทางไม่จำกัด\n• แอดมิน 15 บัญชี\n• AI ตอบอัตโนมัติ 15,000 ข้อความ / เดือน\n• มีทุกฟีเจอร์ของ Pro และ Webhook พื้นฐาน\n\nเมื่อข้อความหมด เพิ่มได้ 499 บาท ต่อ 3,000 ข้อความครับ';
  }

  if (asksForPrice) {
    return 'แพ็กเกจ CUTINEO มี 4 ระดับครับ\n• Starter: ฿490 / เดือน — รวมแชท ไม่ใช้ AI\n• Pro: ฿990 / เดือนปีแรก — AI 4,000 ข้อความ + PromptPay QR + Slip OCR\n• Advanced: ฿1,990 / เดือน — ช่องทางไม่จำกัด + AI 15,000 ข้อความ + Webhook\n• Enterprise: Custom Pricing เริ่มต้นประมาณ ฿19,900–39,900 / เดือน — Custom API, SLA 99.9% และทีม Onboarding\n\nถ้าข้อความ Pro หรือ Advanced หมด มี Add-on ฿499 ต่อ 3,000 ข้อความครับ';
  }

    return 'Neo พร้อมช่วยแนะนำแพ็กเกจครับ บอกผมได้เลยว่าธุรกิจมีแอดมินกี่คน ใช้กี่เพจ มีระบบ POS/ERP เดิมหรือไม่ และต้องการ AI ช่วยตอบหรือไม่ แล้วผมจะช่วยเลือกแพ็กเกจที่คุ้มที่สุดให้ครับ';
}

export default function App() {
  const adapter = useMemo(() => new OpenClawAdapter(), []);
  const [activeChannel, setActiveChannel] = useState<ChannelKey>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'connecting'>('offline');
  const [leadMode, setLeadMode] = useState<LeadMode | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('Starter');
  const [demoDraft, setDemoDraft] = useState('');
  const [demoMessages, setDemoMessages] = useState<Array<{ id: number; role: 'team' | 'neo'; text: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConversation = useMemo(() => channelMessages[activeChannel], [activeChannel]);
  useEffect(() => {
    const unsubscribe = adapter.onConnection(setConnectionStatus);
    adapter.connect();
    return () => {
      unsubscribe();
      adapter.close();
    };
  }, [adapter]);

  useEffect(() => {
    if (!leadMode) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLeadMode(null);
    };
    document.body.classList.add('modal-open');
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [leadMode]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('login') === '1') {
      setLeadMode('login');
      window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.hash}`);
    }
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  const announce = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 4500);
  };

  const openLeadModal = (mode: LeadMode, plan = 'Starter') => {
    setSelectedPlan(plan);
    setNotice('');
    setLeadMode(mode);
    setMobileMenuOpen(false);
  };

  const goToRegister = (plan = 'Starter') => {
    const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '/');
    window.location.assign(`${baseUrl}register.html?plan=${encodeURIComponent(plan)}`);
  };

  const goToDemo = (plan?: string) => {
    const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '/');
    const query = plan ? `?plan=${encodeURIComponent(plan)}` : '';
    window.location.assign(`${baseUrl}demo.html${query}`);
  };

  const goToLogin = () => {
    const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '/');
    window.location.assign(`${baseUrl}login/`);
  };

  const choosePlan = (planName: string) => {
    if (planName === 'Enterprise') {
      goToDemo('Enterprise');
      return;
    }
    goToRegister(planName);
  };

  const selectChannel = (channel: ChannelKey) => {
    setActiveChannel(channel);
    setDemoDraft('');
    setDemoMessages([]);
  };

  const sendDemoMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = demoDraft.trim();
    if (!text) return;
    adapter.send({ type: 'chat.message', channel: activeConversation.channel, text, source: 'cutineo-demo' });
    setDemoMessages((current) => [...current, { id: Date.now(), role: 'team', text }]);
    setDemoDraft('');
    window.setTimeout(() => {
      setDemoMessages((current) => [...current, { id: Date.now(), role: 'neo', text: getNeoDemoReply(text) }]);
    }, 500);
  };

  const handleFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    announce(`เลือกไฟล์ ${file.name} แล้ว — เดโมจะไม่อัปโหลดไฟล์ออกจากเครื่องครับ`);
    event.target.value = '';
  };

  const handleLeadSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    if (!email.includes('@')) {
      announce('กรุณากรอกอีเมลให้ถูกต้องครับ');
      return;
    }
    const mode = leadMode;
    setLeadMode(null);
    if (mode === 'login') {
      announce('เข้าสู่โหมดเดโมแล้วครับ — ระบบบัญชีจริงจะเชื่อมต่อในขั้นถัดไป');
      return;
    }
    const name = String(form.get('name') ?? '').trim();
    const business = String(form.get('business') ?? '').trim();
    announce(mode === 'contact'
      ? `รับข้อมูลของ ${name || 'คุณ'} แล้วครับ ทีม CUTINEO จะติดต่อกลับเรื่องแพ็กเกจ ${selectedPlan}`
      : `รับข้อมูลของ ${name || 'คุณ'} แล้วครับ ทีม CUTINEO จะติดต่อกลับเรื่องแพ็กเกจ ${selectedPlan}`);
    if (business) {
      try {
        window.localStorage.setItem('cutineo-last-lead', JSON.stringify({ name, email, business, plan: selectedPlan, mode, createdAt: new Date().toISOString() }));
      } catch {
        // Storage can be disabled in private browsing; the success state still works.
      }
    }
  };

  return (
    <div className="cutineo-site">
      <header className="site-header">
        <button className="brand" type="button" onClick={() => scrollTo('top')} aria-label="กลับหน้าแรก CUTINEO">
          <span className="brand-mark" aria-hidden="true"><span>N</span></span>
          <span className="brand-word">CUTI<span>NEO</span></span>
        </button>

        <nav className={`main-nav ${mobileMenuOpen ? 'is-open' : ''}`} aria-label="เมนูหลัก">
          <button type="button" onClick={() => scrollTo('features')}>ฟีเจอร์</button>
          <button type="button" onClick={() => scrollTo('pricing')}>แพ็กเกจราคา</button>
          <button type="button" onClick={() => scrollTo('compare')}>เปรียบเทียบแพ็กเกจ</button>
          <button type="button" onClick={goToDemo}>ติดต่อเรา</button>
        </nav>

        <div className="header-actions">
          <button className="login-link" type="button" onClick={goToLogin}>เข้าสู่ระบบ</button>
          <button className="button button-dark button-small" type="button" onClick={() => goToRegister()}>เริ่มต้นกับ Starter</button>
        </div>
        <button className={`menu-toggle ${mobileMenuOpen ? 'is-active' : ''}`} type="button" onClick={() => setMobileMenuOpen((open) => !open)} aria-label="เปิดเมนู" aria-expanded={mobileMenuOpen}>
          <span /><span /><span />
        </button>
      </header>

      <main>
        <section className="hero section-shell" id="top">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> CENTRAL INBOX FOR YOUR BUSINESS</div>
            <h1>รวมทุกแชทของร้านคุณ<br /><span>ไว้ในที่เดียว</span></h1>
            <p className="hero-lead">ไม่ต้องสลับหลายแอปให้วุ่นวาย ตอบลูกค้าจาก LINE, Facebook, Instagram และ Marketplace ได้ในกล่องข้อความเดียว</p>
            <div className="hero-actions">
              <button className="button button-primary" type="button" onClick={() => goToRegister()}>เริ่มต้นกับ Starter <span aria-hidden="true">→</span></button>
              <button className="text-button" type="button" onClick={() => scrollTo('demo')}>ดูการทำงาน <span className="play-icon" aria-hidden="true">▶</span></button>
            </div>
            <div className="hero-trust">
              <span className="trust-avatars" aria-hidden="true"><i>น</i><i>พ</i><i>อ</i></span>
              <span><strong>Starter ฿490 / เดือน</strong><br />รวม Inbox และเครื่องมือจัดการแชท</span>
            </div>
          </div>

          <div className="hero-visual" id="demo">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="visual-glow" />
            <div className="inbox-window">
              <div className="window-bar">
                <div className="window-brand"><span className="mini-mark">N</span><span>รวมแชท</span><span className={`online-dot connection-${connectionStatus}`} /> <small>{connectionStatus === 'online' ? 'OpenClaw ออนไลน์' : connectionStatus === 'connecting' ? 'กำลังเชื่อมต่อ' : 'โหมดเดโม'}</small></div>
                <div className="window-tools"><span>⌕</span><span>⋯</span></div>
              </div>
              <div className="inbox-layout">
                <aside className="inbox-sidebar">
                  <div className="sidebar-label">กล่องข้อความ</div>
                  {channels.map((channel) => (
                    <button className={`channel-row ${activeChannel === channel.key ? 'is-active' : ''}`} key={channel.key} type="button" onClick={() => selectChannel(channel.key)}>
                      <span className={`channel-icon ${channel.className}`}>{channel.short.slice(0, 2)}</span>
                      <span>{channel.label}</span>
                      {channel.count && <b>{channel.count}</b>}
                    </button>
                  ))}
                  <div className="sidebar-bottom"><span className="mini-user">น</span><span>ทีมขาย CUTINEO</span><span>⚙</span></div>
                </aside>
                <div className="conversation">
                  <div className="conversation-head">
                    <div className="customer-avatar">{activeConversation.initials}</div>
                    <div><strong>{activeConversation.name}</strong><small><span className={`channel-status ${activeConversation.channelClass}`} /> {activeConversation.channel}</small></div>
                    <button type="button" aria-label="ตัวเลือกการสนทนา" onClick={() => announce('ตัวเลือกการสนทนาพร้อมใช้งานเมื่อเชื่อมต่อบัญชีจริงครับ')}>⋮</button>
                  </div>
                  <div className="conversation-body">
                    <span className="date-divider">วันนี้ · 10:24</span>
                    <div className="chat-bubble customer-bubble">{activeConversation.message}</div>
                    <div className="chat-bubble neo-bubble"><span className="bubble-label">NEO แนะนำคำตอบ</span>{activeConversation.reply}</div>
                    <div className="chat-bubble customer-bubble short-bubble">ขอบคุณมากค่ะ 😊</div>
                    {demoMessages.map((message) => <div className={`chat-bubble ${message.role === 'neo' ? 'neo-bubble' : 'team-bubble'}`} key={message.id}>{message.role === 'neo' && <span className="bubble-label">NEO แนะนำคำตอบ</span>}{message.text}</div>)}
                  </div>
                  <form className="reply-box" onSubmit={sendDemoMessage}>
                    <input value={demoDraft} onChange={(event) => setDemoDraft(event.target.value)} placeholder="พิมพ์ข้อความตอบกลับ..." aria-label="ข้อความตอบกลับในเดโม" />
                    <div><button type="button" aria-label="เพิ่มไฟล์" onClick={() => fileInputRef.current?.click()}>＋</button><button type="submit" className="send-button" aria-label="ส่งข้อความ">↑</button></div>
                    <input ref={fileInputRef} className="visually-hidden" type="file" onChange={handleFileSelected} />
                  </form>
                </div>
              </div>
            </div>
            <div className="floating-metric metric-speed"><span className="metric-icon">✦</span><span><strong>ตอบเร็วขึ้น 3 เท่า</strong><small>ด้วย AI ช่วยแนะนำคำตอบ</small></span></div>
            <div className="floating-metric metric-channel"><span className="metric-check">✓</span><span><strong>4 ช่องทาง</strong><small>เชื่อมต่อแล้ว</small></span></div>
          </div>
        </section>

        <section className="stats-strip section-shell" aria-label="ตัวเลขการใช้งาน">
          <div><strong>1 กล่อง</strong><span>ดูแลทุกบทสนทนา</span></div>
          <div><strong>24/7</strong><span>พร้อมตอบลูกค้าเสมอ</span></div>
          <div><strong>4+ ช่องทาง</strong><span>เชื่อมต่อได้ในที่เดียว</span></div>
          <div><strong>ลดงานซ้ำ</strong><span>ด้วยระบบอัตโนมัติ</span></div>
        </section>

        <section className="features-section section-shell" id="features">
          <div className="section-heading centered-heading"><div className="eyebrow">WHY CUTINEO</div><h2>ให้ทีมของคุณโฟกัสกับลูกค้า<br /><span>ไม่ใช่การสลับแอป</span></h2><p>เครื่องมือที่ช่วยให้ทีมขายตอบไวขึ้น ทำงานเป็นระบบขึ้น และไม่พลาดทุกโอกาสในการปิดการขาย</p></div>
          <div className="feature-grid">
            <article className="feature-card feature-highlight"><div className="feature-icon icon-inbox">▣</div><h3>รวมแชทไว้ที่เดียว</h3><p>เห็นทุกข้อความจากทุกช่องทางในหน้าจอเดียว พร้อมจัดลำดับแชทที่ต้องตอบได้ทันที</p><button type="button" onClick={() => scrollTo('demo')}>ดูตัวอย่าง <span>↗</span></button></article>
            <article className="feature-card"><div className="feature-icon icon-ai">✦</div><h3>NEO ช่วยตอบด้วย AI</h3><p>แนะนำคำตอบจากข้อมูลร้านของคุณ ลดเวลาตอบคำถามซ้ำ ๆ และช่วยให้โทนการสื่อสารสม่ำเสมอ</p><div className="feature-tag">AI ASSISTED</div></article>
            <article className="feature-card"><div className="feature-icon icon-flow">↗</div><h3>ทำงานอัตโนมัติ</h3><p>ตั้งกฎ มอบหมายแชท และส่งข้อความติดตามให้ทีมทำงานต่อได้โดยไม่ต้องเฝ้าหน้าจอ</p><div className="feature-tag">SMART WORKFLOW</div></article>
          </div>
        </section>

        <section className="pricing-section section-shell" id="pricing">
          <div className="section-heading centered-heading"><div className="eyebrow">SIMPLE, FAIR PRICING</div><h2>แพ็กเกจที่โตไปพร้อมกับธุรกิจคุณ</h2><p>เริ่มจากสิ่งที่จำเป็น แล้วอัปเกรดเมื่อทีมและยอดขายของคุณเติบโต</p></div>
          <div className="pricing-grid">
            {plans.map((plan) => {
              const price = plan.monthly;
              return <article className={`plan-card ${plan.featured ? 'is-featured' : ''}`} key={plan.name}>
                {plan.featured && <div className="popular-ribbon">แนะนำสำหรับทีมที่กำลังโต</div>}
                <div className="plan-top"><span className="plan-label">{plan.name}</span>{plan.featured && <span className="plan-star">✦</span>}</div>
                <h3>{price === null ? plan.priceLabel : <>฿{formatPrice(price)}<small>{plan.suffix}</small></>}</h3>
                {plan.priceNote && <span className="billing-note">{plan.priceNote}</span>}
                <p className="plan-description">{plan.description}</p>
                <button className={`plan-button ${plan.featured ? 'button-primary' : ''}`} type="button" onClick={() => choosePlan(plan.name)}>{plan.button} <span>→</span></button>
                <div className="plan-divider" />
                <strong className="included-title">สิ่งที่รวมในแพ็กเกจ</strong>
                <span className="plan-users">✓ {plan.users}</span>
                <ul>{plan.features.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
              </article>;
            })}
          </div>
          <p className="pricing-footnote">Add-on สำหรับ Pro และ Advanced เมื่อข้อความหมด: ฿499 ต่อ 3,000 ข้อความ</p>
        </section>

        <section className="compare-section section-shell" id="compare">
          <div className="section-heading"><div className="eyebrow">COMPARE PLANS</div><h2>เลือกฟีเจอร์ที่เหมาะกับทีม</h2><p>ดูรายละเอียดแต่ละแพ็กเกจแบบชัด ๆ ก่อนเริ่มใช้งาน</p></div>
          <div className="compare-wrap"><table><thead><tr><th>ฟีเจอร์</th><th>Starter</th><th className="highlight-column">Pro</th><th>Advanced</th><th>Enterprise</th></tr></thead><tbody>{compareRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td className={`${index === 2 ? 'highlight-column' : ''} ${cell === '✓' ? 'check-cell' : ''}`} key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
        </section>

        <section className="cta-section section-shell" id="contact">
          <div className="cta-card"><div className="cta-glow" /><div className="cta-copy"><div className="eyebrow eyebrow-light">READY WHEN YOU ARE</div><h2>เริ่มดูแลทุกแชท<br />ให้เป็นเรื่องง่าย</h2><p>เริ่มต้นด้วย Starter ฿490 / เดือน แล้วอัปเกรดเป็น Pro เมื่ออยากให้ Neo ช่วยตอบและปิดการขาย</p><button className="button button-light" type="button" onClick={() => goToRegister()}>เริ่มต้นกับ Starter <span>→</span></button></div><div className="cta-visual"><div className="cta-orb"><span>N</span></div><div className="cta-ring ring-a" /><div className="cta-ring ring-b" /><span className="cta-spark spark-a">✦</span><span className="cta-spark spark-b">✦</span></div></div>
        </section>
      </main>

      <footer className="site-footer section-shell"><div className="footer-brand"><button className="brand" type="button" onClick={() => scrollTo('top')}><span className="brand-mark" aria-hidden="true"><span>N</span></span><span className="brand-word">CUTI<span>NEO</span></span></button><p>รวมทุกแชทให้ทีมขายทำงานได้ง่ายขึ้น</p></div><div className="footer-links"><div><strong>ผลิตภัณฑ์</strong><button type="button" onClick={() => scrollTo('features')}>ฟีเจอร์</button><button type="button" onClick={() => scrollTo('pricing')}>แพ็กเกจราคา</button></div><div><strong>ช่วยเหลือ</strong><button type="button" onClick={() => announce('ศูนย์ช่วยเหลือกำลังเตรียมเปิดให้บริการครับ')}>ศูนย์ช่วยเหลือ</button><button type="button" onClick={goToDemo}>ขอเดโม</button></div></div><span className="copyright">© 2026 CUTINEO</span></footer>

      {leadMode && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLeadMode(null); }}>
        <section className="lead-modal" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title">
          <button className="modal-close" type="button" onClick={() => setLeadMode(null)} aria-label="ปิดหน้าต่าง">×</button>
          <div className="modal-icon">{leadMode === 'login' ? '↗' : leadMode === 'contact' ? '✦' : 'N'}</div>
          <div className="eyebrow">{leadMode === 'login' ? 'WELCOME BACK' : leadMode === 'contact' ? 'TALK TO CUTINEO' : 'GET STARTED WITH CUTINEO'}</div>
          <h2 id="lead-modal-title">{leadMode === 'login' ? 'เข้าสู่โหมดเดโม' : leadMode === 'contact' ? 'คุยกับทีม CUTINEO' : 'เริ่มต้นกับ CUTINEO'}</h2>
          <p>{leadMode === 'login' ? 'กรอกข้อมูลเพื่อทดลองหน้าการเข้าสู่ระบบ ฟังก์ชันนี้ยังไม่เชื่อมต่อบัญชีจริง' : `กรอกข้อมูลสั้น ๆ เพื่อเริ่มต้นกับแพ็กเกจ ${selectedPlan}`}</p>
          <form className="lead-form" key={`${leadMode}-${selectedPlan}`} onSubmit={handleLeadSubmit}>
            {leadMode !== 'login' && <label>ชื่อผู้ติดต่อ<input name="name" type="text" placeholder="เช่น คุณนิว" required autoFocus /></label>}
            <label>อีเมล{leadMode === 'login' ? 'สำหรับเข้าสู่ระบบ' : ''}<input name="email" type="email" placeholder="you@example.com" required autoFocus={leadMode === 'login'} /></label>
            {leadMode === 'login' ? <label>รหัสผ่านเดโม<input name="password" type="password" placeholder="อย่างน้อย 6 ตัวอักษร" minLength={6} required /></label> : <label>ชื่อธุรกิจ<input name="business" type="text" placeholder="ชื่อร้านหรือบริษัท" required /></label>}
            <button className="button button-primary modal-submit" type="submit">{leadMode === 'login' ? 'เข้าโหมดเดโม' : leadMode === 'contact' ? 'ส่งข้อมูลให้ทีมงาน' : 'ส่งข้อมูลให้ทีมงาน'} <span>→</span></button>
          </form>
          <small className="modal-note">เดโมนี้ไม่เรียกเก็บเงินและไม่ส่งข้อมูลออกจากเครื่อง</small>
        </section>
      </div>}

      {notice && <div className="toast" role="status"><span className="toast-icon">✓</span><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="ปิดข้อความ">×</button></div>}
    </div>
  );
}
