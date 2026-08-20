import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { OpenClawAdapter } from './services/openClawAdapter';

type BillingCycle = 'monthly' | 'yearly';
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
    message: 'มีโปรสำหรับออเดอร์แรกไหมคะ ✨',
    reply: 'มีค่ะ ใช้โค้ด CUTI10 รับส่วนลด 10% ได้เลย',
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
    name: 'Basic',
    description: 'เริ่มต้นรวมแชทของร้านเล็กให้เป็นระบบ',
    monthly: 0,
    yearly: 0,
    suffix: 'เริ่มใช้งานฟรี',
    users: 'ผู้ใช้งาน 1 คน',
    features: ['รวมแชท 3 ช่องทาง', '500 ข้อความต่อเดือน', 'กล่องข้อความกลาง', 'ป้ายกำกับลูกค้า', 'รายงานพื้นฐาน'],
    button: 'เริ่มใช้ฟรี',
  },
  {
    name: 'Pro',
    description: 'เหมาะกับทีมขายที่ต้องตอบลูกค้าให้ไวขึ้น',
    monthly: 990,
    yearly: 792,
    suffix: '/เดือน',
    users: 'ผู้ใช้งาน 3 คน',
    features: ['รวมแชทไม่จำกัดช่องทาง', 'ไม่จำกัดข้อความ', 'มอบหมายแชทให้ทีม', 'ข้อความตอบกลับสำเร็จรูป', 'LINE Broadcast', 'สรุปบทสนทนาด้วย AI'],
    button: 'ทดลอง Pro ฟรี',
    featured: true,
  },
  {
    name: 'Advanced',
    description: 'ขยายทีมด้วยระบบอัตโนมัติและข้อมูลเชิงลึก',
    monthly: 1990,
    yearly: 1592,
    suffix: '/เดือน',
    users: 'ผู้ใช้งาน 10 คน',
    features: ['ทุกฟีเจอร์ของ Pro', 'แชทบอท AI ตลอด 24 ชม.', 'Workflow อัตโนมัติ', 'แดชบอร์ดวิเคราะห์ข้อมูล', 'เชื่อมต่อ Webhook', 'จัดการออเดอร์และรีวิว'],
    button: 'เลือก Advanced',
  },
  {
    name: 'Enterprise',
    description: 'โซลูชันที่ปรับตามกระบวนการขององค์กร',
    monthly: null,
    yearly: null,
    suffix: 'คุยกับทีมงาน',
    users: 'ผู้ใช้งานไม่จำกัด',
    features: ['ทุกฟีเจอร์ของ Advanced', 'สิทธิ์การใช้งานแบบละเอียด', 'เชื่อมต่อระบบภายใน', 'ทีมดูแลเฉพาะบัญชี', 'SLA และความปลอดภัยระดับองค์กร'],
    button: 'ติดต่อเรา',
  },
];

const compareRows = [
  ['รวมแชทจากหลายช่องทาง', '3 ช่องทาง', 'ไม่จำกัด', 'ไม่จำกัด', 'ไม่จำกัด'],
  ['ผู้ใช้งานในทีม', '1 คน', '3 คน', '10 คน', 'ไม่จำกัด'],
  ['กล่องข้อความกลาง', '✓', '✓', '✓', '✓'],
  ['มอบหมายแชทให้ทีม', '—', '✓', '✓', '✓'],
  ['ข้อความตอบกลับสำเร็จรูป', '—', '✓', '✓', '✓'],
  ['LINE Broadcast', '—', '✓', '✓', '✓'],
  ['แชทบอทและสรุปด้วย AI', '—', 'สรุปแชท', 'เต็มรูปแบบ', 'เต็มรูปแบบ'],
  ['ระบบอัตโนมัติ / Webhook', '—', '—', '✓', 'ปรับแต่งได้'],
  ['ทีมดูแลเฉพาะบัญชี', '—', '—', '—', '✓'],
];

function formatPrice(value: number | null) {
  if (value === null) return null;
  return new Intl.NumberFormat('th-TH').format(value);
}

export default function App() {
  const adapter = useMemo(() => new OpenClawAdapter(), []);
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [activeChannel, setActiveChannel] = useState<ChannelKey>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'connecting'>('offline');
  const [leadMode, setLeadMode] = useState<LeadMode | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('Basic');
  const [demoDraft, setDemoDraft] = useState('');
  const [demoMessages, setDemoMessages] = useState<Array<{ id: number; role: 'team' | 'neo'; text: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConversation = useMemo(() => channelMessages[activeChannel], [activeChannel]);
  const yearlyDiscount = billing === 'yearly' ? 'ประหยัด 20%' : '';

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

  const openLeadModal = (mode: LeadMode, plan = 'Basic') => {
    setSelectedPlan(plan);
    setNotice('');
    setLeadMode(mode);
    setMobileMenuOpen(false);
  };

  const goToRegister = (plan = 'Basic') => {
    const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '/');
    window.location.assign(`${baseUrl}register.html?plan=${encodeURIComponent(plan)}`);
  };

  const goToDemo = () => {
    const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '/');
    window.location.assign(`${baseUrl}demo.html`);
  };

  const goToLogin = () => {
    const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '/');
    window.location.assign(`${baseUrl}login/`);
  };

  const choosePlan = (planName: string) => {
    if (planName === 'Enterprise') {
      goToDemo();
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
      setDemoMessages((current) => [...current, { id: Date.now(), role: 'neo', text: `NEO ช่วยร่างคำตอบให้แล้ว: รับเรื่อง “${text}” เรียบร้อยครับ` }]);
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
      : `รับคำขอทดลองใช้ของ ${name || 'คุณ'} แล้วครับ — แพ็กเกจ ${selectedPlan} พร้อมให้ทดลองในเดโมนี้`);
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
          <button className="button button-dark button-small" type="button" onClick={() => goToRegister()}>ทดลองใช้งานฟรี</button>
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
              <button className="button button-primary" type="button" onClick={() => goToRegister()}>เริ่มต้นฟรี <span aria-hidden="true">→</span></button>
              <button className="text-button" type="button" onClick={() => scrollTo('demo')}>ดูการทำงาน <span className="play-icon" aria-hidden="true">▶</span></button>
            </div>
            <div className="hero-trust">
              <span className="trust-avatars" aria-hidden="true"><i>น</i><i>พ</i><i>อ</i></span>
              <span><strong>เริ่มใช้ฟรีได้ทันที</strong><br />ไม่ต้องใช้บัตรเครดิต</span>
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
          <div className="billing-switch" role="group" aria-label="เลือกรอบการชำระเงิน">
            <button className={billing === 'monthly' ? 'is-active' : ''} type="button" onClick={() => setBilling('monthly')}>รายเดือน</button>
            <button className={billing === 'yearly' ? 'is-active' : ''} type="button" onClick={() => setBilling('yearly')}>รายปี <span>{yearlyDiscount}</span></button>
          </div>
          <div className="pricing-grid">
            {plans.map((plan) => {
              const price = billing === 'yearly' ? plan.yearly : plan.monthly;
              return <article className={`plan-card ${plan.featured ? 'is-featured' : ''}`} key={plan.name}>
                {plan.featured && <div className="popular-ribbon">แนะนำสำหรับทีมที่กำลังโต</div>}
                <div className="plan-top"><span className="plan-label">{plan.name}</span>{plan.featured && <span className="plan-star">✦</span>}</div>
                <h3>{price === null ? 'คุยกับเรา' : price === 0 ? 'ฟรี' : <>฿{formatPrice(price)}<small>{plan.suffix}</small></>}</h3>
                {price !== null && price !== 0 && billing === 'yearly' && <span className="billing-note">คิดเป็นรายปี ฿{formatPrice(price * 12)}</span>}
                <p className="plan-description">{plan.description}</p>
                <button className={`plan-button ${plan.featured ? 'button-primary' : ''}`} type="button" onClick={() => choosePlan(plan.name)}>{plan.button} <span>→</span></button>
                <div className="plan-divider" />
                <strong className="included-title">สิ่งที่รวมในแพ็กเกจ</strong>
                <span className="plan-users">✓ {plan.users}</span>
                <ul>{plan.features.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
              </article>;
            })}
          </div>
          <p className="pricing-footnote">* ราคานี้เป็นราคาเดโมสำหรับออกแบบประสบการณ์ใช้งาน อาจมีการปรับตามจำนวนช่องทางและข้อความจริง</p>
        </section>

        <section className="compare-section section-shell" id="compare">
          <div className="section-heading"><div className="eyebrow">COMPARE PLANS</div><h2>เลือกฟีเจอร์ที่เหมาะกับทีม</h2><p>ดูรายละเอียดแต่ละแพ็กเกจแบบชัด ๆ ก่อนเริ่มใช้งาน</p></div>
          <div className="compare-wrap"><table><thead><tr><th>ฟีเจอร์</th><th>Basic</th><th className="highlight-column">Pro</th><th>Advanced</th><th>Enterprise</th></tr></thead><tbody>{compareRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td className={`${index === 2 ? 'highlight-column' : ''} ${cell === '✓' ? 'check-cell' : ''}`} key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
        </section>

        <section className="cta-section section-shell" id="contact">
          <div className="cta-card"><div className="cta-glow" /><div className="cta-copy"><div className="eyebrow eyebrow-light">READY WHEN YOU ARE</div><h2>เริ่มดูแลทุกแชท<br />ให้เป็นเรื่องง่าย</h2><p>ลองใช้ CUTINEO ฟรี แล้วให้ทีมของคุณเห็นความต่างตั้งแต่วันแรก</p><button className="button button-light" type="button" onClick={() => goToRegister()}>เริ่มต้นฟรี <span>→</span></button></div><div className="cta-visual"><div className="cta-orb"><span>N</span></div><div className="cta-ring ring-a" /><div className="cta-ring ring-b" /><span className="cta-spark spark-a">✦</span><span className="cta-spark spark-b">✦</span></div></div>
        </section>
      </main>

      <footer className="site-footer section-shell"><div className="footer-brand"><button className="brand" type="button" onClick={() => scrollTo('top')}><span className="brand-mark" aria-hidden="true"><span>N</span></span><span className="brand-word">CUTI<span>NEO</span></span></button><p>รวมทุกแชทให้ทีมขายทำงานได้ง่ายขึ้น</p></div><div className="footer-links"><div><strong>ผลิตภัณฑ์</strong><button type="button" onClick={() => scrollTo('features')}>ฟีเจอร์</button><button type="button" onClick={() => scrollTo('pricing')}>แพ็กเกจราคา</button></div><div><strong>ช่วยเหลือ</strong><button type="button" onClick={() => announce('ศูนย์ช่วยเหลือกำลังเตรียมเปิดให้บริการครับ')}>ศูนย์ช่วยเหลือ</button><button type="button" onClick={goToDemo}>ขอเดโม</button></div></div><span className="copyright">© 2026 CUTINEO</span></footer>

      {leadMode && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLeadMode(null); }}>
        <section className="lead-modal" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title">
          <button className="modal-close" type="button" onClick={() => setLeadMode(null)} aria-label="ปิดหน้าต่าง">×</button>
          <div className="modal-icon">{leadMode === 'login' ? '↗' : leadMode === 'contact' ? '✦' : 'N'}</div>
          <div className="eyebrow">{leadMode === 'login' ? 'WELCOME BACK' : leadMode === 'contact' ? 'TALK TO CUTINEO' : 'START YOUR FREE TRIAL'}</div>
          <h2 id="lead-modal-title">{leadMode === 'login' ? 'เข้าสู่โหมดเดโม' : leadMode === 'contact' ? 'คุยกับทีม CUTINEO' : 'เริ่มทดลองใช้งานฟรี'}</h2>
          <p>{leadMode === 'login' ? 'กรอกข้อมูลเพื่อทดลองหน้าการเข้าสู่ระบบ ฟังก์ชันนี้ยังไม่เชื่อมต่อบัญชีจริง' : `กรอกข้อมูลสั้น ๆ เพื่อเริ่มต้นกับแพ็กเกจ ${selectedPlan}`}</p>
          <form className="lead-form" key={`${leadMode}-${selectedPlan}`} onSubmit={handleLeadSubmit}>
            {leadMode !== 'login' && <label>ชื่อผู้ติดต่อ<input name="name" type="text" placeholder="เช่น คุณนิว" required autoFocus /></label>}
            <label>อีเมล{leadMode === 'login' ? 'สำหรับเข้าสู่ระบบ' : ''}<input name="email" type="email" placeholder="you@example.com" required autoFocus={leadMode === 'login'} /></label>
            {leadMode === 'login' ? <label>รหัสผ่านเดโม<input name="password" type="password" placeholder="อย่างน้อย 6 ตัวอักษร" minLength={6} required /></label> : <label>ชื่อธุรกิจ<input name="business" type="text" placeholder="ชื่อร้านหรือบริษัท" required /></label>}
            <button className="button button-primary modal-submit" type="submit">{leadMode === 'login' ? 'เข้าโหมดเดโม' : leadMode === 'contact' ? 'ส่งข้อมูลให้ทีมงาน' : 'เริ่มทดลองใช้ฟรี'} <span>→</span></button>
          </form>
          <small className="modal-note">เดโมนี้ไม่เรียกเก็บเงินและไม่ส่งข้อมูลออกจากเครื่อง</small>
        </section>
      </div>}

      {notice && <div className="toast" role="status"><span className="toast-icon">✓</span><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="ปิดข้อความ">×</button></div>}
    </div>
  );
}
