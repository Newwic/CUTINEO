/* eslint-disable @next/next/no-img-element -- shared with the Vite static pages. */
import { useEffect, useState, type FormEvent } from 'react';
import CutineoSiteHeader, { type CutineoNavItem } from './components/CutineoSiteHeader';
import { NEO_LOGO_PATH } from './lib/branding';

type DemoDocument = 'terms' | 'privacy' | null;
type Language = 'th' | 'en';

type DemoForm = {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  teamSize: string;
  interests: string;
  preferredTime: string;
  consent: boolean;
};

const emptyForm: DemoForm = {
  fullName: '',
  businessName: '',
  email: '',
  phone: '',
  teamSize: '',
  interests: '',
  preferredTime: '',
  consent: false,
};

const teamSizes = ['1–5', '6–10', '11–15', '16–20', '21–25', '26–30', '30+'];
const countryCodes = ['+66', '+65', '+63', '+60', '+62', '+86', '+81', '+1'];

const languageCopy = {
  th: {
    languageName: 'ไทย', languageButton: 'EN', backHome: 'กลับหน้าแรก', login: 'เข้าสู่ระบบ', trial: 'เริ่มต้นใช้งานฟรี',
    nav: { features: 'ฟีเจอร์', how: 'วิธีการทำงาน', sales: 'AI Sales', pricing: 'ราคา' },
    hero: {
      kicker: 'SEE CUTINEO IN ACTION', title: 'นัดหมายเวลาสาธิต', titleAccent: 'การใช้งานจริง',
      description: 'เราจะปรับการสาธิตให้เหมาะกับธุรกิจของคุณ แสดงให้ดูว่า CUTINEO ช่วยรวมแชท เพิ่มประสิทธิภาพทีม และปิดการขายได้อย่างไร',
      points: ['ดูกล่องแชทกลางจากหลายช่องทาง', 'เห็นการทำงานของ NEO และระบบทีม', 'คุยกับทีมเราโดยไม่มีค่าใช้จ่าย'], video: 'ดูวิดีโอตัวอย่างการใช้งาน',
    },
    form: {
      kicker: 'BOOK A DEMO', title: 'จองเวลาสาธิตกับทีม CUTINEO', description: 'กรอกข้อมูลสั้น ๆ แล้วเลือกเวลาที่สะดวกให้เราเตรียมเดโมได้ตรงความต้องการ',
      fullName: 'ชื่อ-นามสกุล', fullNamePlaceholder: 'ชื่อ-นามสกุล', businessName: 'ชื่อบริษัทหรือร้านค้า', businessPlaceholder: 'ชื่อธุรกิจของคุณ', email: 'อีเมล', emailPlaceholder: 'you@example.com', phone: 'เบอร์โทรที่ติดต่อได้', phonePlaceholder: '81 234 5678', team: 'คุณมีแอดมินให้บริการตอบแชทลูกค้ากี่คน?', teamPlaceholder: 'จำนวน', interest: 'ฟีเจอร์อะไรที่คุณสนใจเป็นพิเศษ?', interestPlaceholder: 'เช่น รวมแชท, AI ช่วยตอบ, มอบหมายงาน หรือรายงานยอดขาย', date: 'เลือกวันเวลาที่ต้องการจอง', consentStart: 'ยินยอมให้ทีม CUTINEO ติดต่อกลับเกี่ยวกับการสาธิต และยอมรับ', consentJoin: 'กับ', terms: 'เงื่อนไขการให้บริการ', privacy: 'นโยบายความเป็นส่วนตัว', submit: 'นัดหมายเวลาสาธิต', note: 'ไม่มีค่าใช้จ่าย • ใช้เวลาประมาณ 30 นาที • ไม่มีข้อผูกมัด',
    },
    errors: { fullName: 'กรุณากรอกชื่อ-นามสกุล', businessName: 'กรุณากรอกชื่อบริษัทหรือร้านค้า', email: 'กรุณากรอกอีเมลให้ถูกต้อง', phone: 'กรุณากรอกเบอร์โทรศัพท์ให้ครบถ้วน', team: 'กรุณาเลือกจำนวนแอดมิน', date: 'กรุณาเลือกวันเวลาที่ต้องการจอง', consent: 'กรุณายอมรับเงื่อนไขก่อนส่งข้อมูล' },
    success: { kicker: 'DEMO REQUEST RECEIVED', title: 'รับคำขอสาธิตเรียบร้อยแล้ว', greeting: 'ขอบคุณคุณ', prepared: 'ทีม CUTINEO จะเตรียมตัวอย่างให้เหมาะกับ', date: 'เวลาที่ต้องการจอง', team: 'จำนวนทีมตอบแชท', start: 'เริ่มต้นกับ Starter ฿490 / เดือน', disclaimer: 'หน้านี้เป็นเดโมบน GitHub Pages ข้อมูลถูกเก็บไว้เฉพาะในเบราว์เซอร์เครื่องนี้ และยังไม่ได้ส่งไปยังระบบนัดหมายจริง' },
    benefits: { kicker: 'WHY CUTINEO', title: 'เดโมที่ตอบโจทย์ธุรกิจของคุณ', description: 'เราไม่ได้แค่พาเดินดูฟีเจอร์ แต่จะช่วยวางภาพการใช้งานให้เข้ากับทีมและช่องทางของคุณ', cards: [{ title: 'รวมแชทในกล่องเดียว', text: 'จัดการ Facebook, Instagram, LINE และ Marketplace ในหน้าจอเดียว ลดการสลับแอปและไม่พลาดข้อความ' }, { title: 'ทำงานร่วมกันเป็นทีม', text: 'มอบหมายแชท ติดตามสถานะ และดูภาพรวมการตอบลูกค้าให้ทุกคนทำงานต่อกันได้ลื่นไหล' }, { title: 'ใช้ข้อมูลยกระดับบริการ', text: 'ดูข้อมูลเชิงลึกและใช้ NEO ช่วยร่างคำตอบ เพื่อให้ทีมตอบไวขึ้นและดูแลลูกค้าได้สม่ำเสมอ' }] },
    video: { kicker: 'GET STARTED FAST', title: 'เรียนรู้วิธีใช้งาน CUTINEO', titleAccent: 'ได้ง่าย ๆ ในไม่กี่ขั้นตอน', description: 'ตั้งแต่เชื่อมต่อช่องทาง เพิ่มทีม มอบหมายแชท จนถึงเริ่มตอบลูกค้า ทุกอย่างออกแบบให้เริ่มได้เร็ว', button: 'ดูวิดีโอตัวอย่าง', inbox: 'ทีม CUTINEO', messageOne: 'ลูกค้าจาก LINE เข้ามาแล้ว', messageTwo: 'NEO ช่วยร่างคำตอบให้ทีม ✓', input: 'พิมพ์ข้อความ...' },
    steps: { kicker: 'A SIMPLE START', title: 'เมื่อลงทะเบียนแล้ว เริ่มใช้งานตามนี้', description: 'เพียง 4 ขั้นตอน ทีมของคุณก็พร้อมดูแลทุกแชทจากที่เดียว', cards: [{ title: 'เชื่อมต่อบัญชี', text: 'เชื่อมต่อช่องทางแชทที่ธุรกิจใช้อยู่ เพื่อรับข้อความจากลูกค้าเข้ากล่องกลาง' }, { title: 'เพิ่มเพื่อนร่วมทีม', text: 'ชวนทีมเข้ามาช่วยกันจัดการแชทและแบ่งหน้าที่ได้ในระบบเดียว' }, { title: 'มอบหมายแชท', text: 'กระจายงานให้ทีมอย่างเป็นระบบ พร้อมติดตามว่าแต่ละเคสอยู่ขั้นตอนไหน' }, { title: 'เริ่มคุยกับลูกค้า', text: 'ตอบลูกค้าได้เร็วขึ้นจากกล่องเดียว พร้อมให้ NEO ช่วยทีมเมื่อจำเป็น' }] },
    cta: { kicker: 'READY TO SEE IT?', title: 'อยากเห็นว่า CUTINEO', titleAccent: 'เหมาะกับทีมของคุณอย่างไร?', description: 'จองเดโมกับเรา หรือเริ่มต้นกับ Starter ได้ทันที', book: 'จองเวลาสาธิต', start: 'เริ่มต้นใช้งาน' },
    footer: 'รวมทุกแชทให้ทีมขายทำงานได้ง่ายขึ้น', modal: { kicker: 'CUTINEO DEMO', title: 'ดูภาพรวมการทำงานของ CUTINEO', videoNote: 'วิดีโอตัวอย่างกำลังเตรียมให้ชม', videoText: 'ระหว่างนี้ลองกดเลือกช่องทางและส่งข้อความในเดโมบนหน้าแรกได้เลย', videoButton: 'ไปดูเดโมแบบโต้ตอบ', legalAck: 'รับทราบ', terms: 'การจองเดโมนี้เป็นการขอข้อมูลเพื่อเตรียมการสาธิตเท่านั้น ไม่มีค่าใช้จ่ายและไม่มีข้อผูกมัด ฟีเจอร์เดโมบน GitHub Pages ยังไม่เชื่อมต่อระบบนัดหมายจริง', privacy: 'ข้อมูลที่กรอกในหน้านี้ใช้เพื่อจำลองคำขอเดโมเท่านั้น โดยเดโมจะเก็บข้อมูลไว้ในเบราว์เซอร์เครื่องนี้และไม่บันทึกรหัสผ่าน' },
    legal: { terms: 'เงื่อนไขการให้บริการ', privacy: 'นโยบายความเป็นส่วนตัว' },
  },
  en: {
    languageName: 'English', languageButton: 'TH', backHome: 'Back to home', login: 'Log in', trial: 'Get started',
    nav: { features: 'Features', how: 'How it works', sales: 'AI Sales', pricing: 'Pricing' },
    hero: {
      kicker: 'SEE CUTINEO IN ACTION', title: 'Book a live demo', titleAccent: 'for your team',
      description: 'We will tailor the demo to your business and show how CUTINEO unifies conversations, improves team productivity, and helps close more sales.',
      points: ['See one inbox for every channel', 'Explore NEO and team workflows', 'Talk to our team at no cost'], video: 'Watch a product preview',
    },
    form: {
      kicker: 'BOOK A DEMO', title: 'Book a demo with CUTINEO', description: 'Tell us a little about your team and choose a time that works for you.',
      fullName: 'Full name', fullNamePlaceholder: 'Your full name', businessName: 'Company or store name', businessPlaceholder: 'Your business name', email: 'Email', emailPlaceholder: 'you@example.com', phone: 'Phone number', phonePlaceholder: '81 234 5678', team: 'How many admins answer customer chats?', teamPlaceholder: 'Select a team size', interest: 'Which features interest you most?', interestPlaceholder: 'For example: unified inbox, AI replies, assignments, or reports', date: 'Choose a preferred date and time', consentStart: 'I agree that CUTINEO may contact me about the demo and accept the', consentJoin: 'and', terms: 'Terms of Service', privacy: 'Privacy Policy', submit: 'Book my demo', note: 'No cost • About 30 minutes • No commitment',
    },
    errors: { fullName: 'Please enter your full name', businessName: 'Please enter your company or store name', email: 'Please enter a valid email', phone: 'Please enter a complete phone number', team: 'Please select a team size', date: 'Please choose a date and time', consent: 'Please accept the terms before submitting' },
    success: { kicker: 'DEMO REQUEST RECEIVED', title: 'Your demo request is in', greeting: 'Thanks,', prepared: 'The CUTINEO team will prepare a demo for', date: 'Preferred time', team: 'Chat support team', start: 'Get started with Starter at ฿490 / month', disclaimer: 'This is a GitHub Pages demo. Your information is stored only in this browser and is not sent to a live scheduling system.' },
    benefits: { kicker: 'WHY CUTINEO', title: 'A demo built around your business', description: 'We will do more than walk through features—we will map the experience to your team and channels.', cards: [{ title: 'One inbox for every chat', text: 'Manage Facebook, Instagram, LINE, and Marketplace in one workspace without switching apps or missing messages.' }, { title: 'Work together as a team', text: 'Assign conversations, track status, and give everyone a clear view of customer support.' }, { title: 'Use data to serve better', text: 'Explore insights and let NEO help draft replies so your team can respond faster and more consistently.' }] },
    video: { kicker: 'GET STARTED FAST', title: 'Learn CUTINEO', titleAccent: 'in just a few steps', description: 'Connect channels, invite your team, assign conversations, and start replying from one organized workspace.', button: 'Watch product preview', inbox: 'CUTINEO team', messageOne: 'A new LINE customer arrived', messageTwo: 'NEO drafted a reply for the team ✓', input: 'Type a message...' },
    steps: { kicker: 'A SIMPLE START', title: 'Get started after you register', description: 'In four simple steps, your team can manage every conversation from one place.', cards: [{ title: 'Connect your accounts', text: 'Connect the chat channels your business already uses and bring customer messages into one inbox.' }, { title: 'Invite your team', text: 'Bring teammates into the workspace so everyone can share the workload.' }, { title: 'Assign conversations', text: 'Distribute work clearly and track the status of every customer case.' }, { title: 'Start talking to customers', text: 'Reply faster from one inbox, with NEO ready to help when needed.' }] },
    cta: { kicker: 'READY TO SEE IT?', title: 'See how CUTINEO', titleAccent: 'fits your team', description: 'Book a demo or get started with Starter today.', book: 'Book a demo', start: 'Get started' },
    footer: 'One inbox that makes selling simpler', modal: { kicker: 'CUTINEO DEMO', title: 'See how CUTINEO works', videoNote: 'Product preview coming soon', videoText: 'For now, try selecting a channel and sending a message in the interactive demo on the home page.', videoButton: 'Open interactive demo', legalAck: 'Got it', terms: 'Booking a demo only collects information to prepare a product walkthrough. There is no cost or commitment. This GitHub Pages demo is not connected to a live scheduling system.', privacy: 'Information entered here is used only to simulate a demo request. This demo stores it in this browser and never stores a password.' },
    legal: { terms: 'Terms of Service', privacy: 'Privacy Policy' },
  },
} as const;

function getBaseUrl() {
  return (import.meta.env.BASE_URL || '/').replace(/\/$/, '/');
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function formatDateTime(value: string, language: Language) {
  if (!value) return language === 'th' ? 'ยังไม่ได้เลือก' : 'Not selected';
  return new Date(value).toLocaleString(language === 'th' ? 'th-TH' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function teamSizeLabel(value: string, language: Language) {
  if (!value) return language === 'th' ? 'ยังไม่ได้เลือก' : 'Not selected';
  return language === 'th' ? `${value} คน` : `${value} people`;
}

export default function DemoApp() {
  const [form, setForm] = useState<DemoForm>(emptyForm);
  const [countryCode, setCountryCode] = useState('+66');
  const [errors, setErrors] = useState<Partial<Record<keyof DemoForm, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [legalDocument, setLegalDocument] = useState<DemoDocument>(null);
  const [language, setLanguage] = useState<Language>(() => {
    try {
      return localStorage.getItem('cutineo-language') === 'en' ? 'en' : 'th';
    } catch {
      return 'th';
    }
  });

  const baseUrl = getBaseUrl();
  const homeUrl = `${baseUrl}index.html`;
  const registerUrl = `${baseUrl}register.html?plan=Starter`;
  const requestedPlan = new URLSearchParams(window.location.search).get('plan') === 'Enterprise' ? 'Enterprise' : '';
  const enterpriseMode = requestedPlan === 'Enterprise';
  const nowForDatePicker = new Date().toISOString().slice(0, 16);
  const t = languageCopy[language];
  const navItems: CutineoNavItem[] = [
    { key: 'features', label: t.nav.features, href: '#why' },
    { key: 'how', label: t.nav.how, href: '#how' },
    { key: 'sales', label: t.nav.sales, href: '#how' },
    { key: 'pricing', label: t.nav.pricing, href: `${homeUrl}#pricing` },
  ];

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem('cutineo-language', language);
    } catch {
      // Private browsing can disable localStorage.
    }
  }, [language]);

  useEffect(() => {
    if (!videoOpen && !legalDocument) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setVideoOpen(false);
        setLegalDocument(null);
      }
    };
    document.body.classList.add('demo-modal-open');
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.classList.remove('demo-modal-open');
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [legalDocument, videoOpen]);

  const updateField = <K extends keyof DemoForm>(field: K, value: DemoForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const goHome = () => window.location.assign(homeUrl);
  const goToRegister = () => {
    if (enterpriseMode) {
      goHome();
      return;
    }
    window.location.assign(registerUrl);
  };
  const goToLogin = () => window.location.assign(`${baseUrl}login/`);
  const toggleLanguage = () => setLanguage((current) => current === 'th' ? 'en' : 'th');

  const validate = () => {
    const nextErrors: Partial<Record<keyof DemoForm, string>> = {};
    if (!form.fullName.trim()) nextErrors.fullName = t.errors.fullName;
    if (!form.businessName.trim()) nextErrors.businessName = t.errors.businessName;
    if (!isEmail(form.email.trim())) nextErrors.email = t.errors.email;
    if (form.phone.replace(/\D/g, '').length < 8) nextErrors.phone = t.errors.phone;
    if (!form.teamSize) nextErrors.teamSize = t.errors.team;
    if (!form.preferredTime) nextErrors.preferredTime = t.errors.date;
    if (!form.consent) nextErrors.consent = t.errors.consent;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    try {
      localStorage.setItem('cutineo-demo-request', JSON.stringify({ ...form, countryCode, requestedPlan: requestedPlan || 'general-demo', createdAt: new Date().toISOString() }));
    } catch {
      // Private browsing can disable localStorage. The demo still completes successfully.
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="demo-page demo-success-page">
        <CutineoSiteHeader
          navItems={navItems}
          logoHref={homeUrl}
          loginHref={`${baseUrl}login/`}
          startHref={registerUrl}
          loginLabel={t.login}
          startLabel={t.trial}
          language={language}
          onLogin={goToLogin}
          onStart={goToRegister}
          onLanguageToggle={toggleLanguage}
          ariaLabel="เมนูหน้าเดโม"
        />
        <main className="demo-success-card" role="status">
          <div className="demo-success-icon">✓</div>
          <span className="demo-kicker">{t.success.kicker}</span>
          <h1>{t.success.title}</h1>
          <p>{t.success.greeting} {form.fullName || (language === 'th' ? 'ลูกค้า' : 'there')} {t.success.prepared} {form.businessName || (language === 'th' ? 'ธุรกิจของคุณ' : 'your business')}</p>
          <div className="demo-summary">
            <div><span>{t.success.date}</span><strong>{formatDateTime(form.preferredTime, language)}</strong></div>
            <div><span>{t.success.team}</span><strong>{teamSizeLabel(form.teamSize, language)}</strong></div>
          </div>
          <div className="demo-success-actions">
            <button className="demo-primary-button" type="button" onClick={goToRegister}>{enterpriseMode ? (language === 'th' ? 'กลับหน้าแรก' : 'Back to home') : t.success.start} <span>→</span></button>
            <button className="demo-secondary-button" type="button" onClick={goHome}>{t.backHome}</button>
          </div>
          <small className="demo-disclaimer">{t.success.disclaimer}</small>
        </main>
      </div>
    );
  }

  return (
    <div className="demo-page">
      <CutineoSiteHeader
        navItems={navItems}
        logoHref={homeUrl}
        loginHref={`${baseUrl}login/`}
        startHref={registerUrl}
        loginLabel={t.login}
        startLabel={t.trial}
        language={language}
        onLogin={goToLogin}
        onStart={goToRegister}
        onLanguageToggle={toggleLanguage}
        ariaLabel="เมนูหน้าเดโม"
      />

      <main>
        <section className="demo-hero demo-shell" id="top">
          <div className="demo-hero-copy">
            <span className="demo-kicker">{t.hero.kicker}</span>
            <h1>{t.hero.title}<br /><span>{t.hero.titleAccent}</span></h1>
            <p>{t.hero.description}</p>
            <div className="demo-hero-points">
              {t.hero.points.map((point) => <span key={point}><i>✓</i> {point}</span>)}
            </div>
            <button className="demo-video-link" type="button" onClick={() => setVideoOpen(true)}><span className="demo-play-icon">▶</span> {t.hero.video}</button>
          </div>

          <section className="demo-form-card" aria-labelledby="demo-form-title">
            <div className="demo-form-heading">
              <span className="demo-kicker">{t.form.kicker}</span>
              <h2 id="demo-form-title">{t.form.title}</h2>
              <p>{t.form.description}</p>
              {enterpriseMode && <div className="demo-enterprise-note"><strong>{language === 'th' ? 'ขอข้อมูลสำหรับ Enterprise' : 'Enterprise consultation'}</strong><span>{language === 'th' ? 'ทีมฝ่ายขายจะใช้ข้อมูลนี้ประเมินการเชื่อมต่อและนัด Demo ระบบ' : 'Our sales team will use these details to assess integration and schedule a product demo.'}</span></div>}
            </div>
            <form className="demo-form" noValidate onSubmit={handleSubmit}>
              <label className="demo-field">
                <span>{t.form.fullName}</span>
                <input type="text" value={form.fullName} onChange={(event) => updateField('fullName', event.currentTarget.value)} placeholder={t.form.fullNamePlaceholder} autoComplete="name" aria-invalid={Boolean(errors.fullName)} />
                {errors.fullName && <small className="demo-field-error">{errors.fullName}</small>}
              </label>
              <label className="demo-field">
                <span>{t.form.businessName}</span>
                <input type="text" value={form.businessName} onChange={(event) => updateField('businessName', event.currentTarget.value)} placeholder={t.form.businessPlaceholder} autoComplete="organization" aria-invalid={Boolean(errors.businessName)} />
                {errors.businessName && <small className="demo-field-error">{errors.businessName}</small>}
              </label>
              <label className="demo-field">
                <span>{t.form.email}</span>
                <input type="email" value={form.email} onChange={(event) => updateField('email', event.currentTarget.value)} placeholder={t.form.emailPlaceholder} autoComplete="email" aria-invalid={Boolean(errors.email)} />
                {errors.email && <small className="demo-field-error">{errors.email}</small>}
              </label>
              <label className="demo-field">
                <span>{t.form.phone}</span>
                <div className={`demo-phone-field ${errors.phone ? 'has-error' : ''}`}>
                  <select aria-label="รหัสประเทศ" value={countryCode} onChange={(event) => setCountryCode(event.currentTarget.value)}>
                    {countryCodes.map((code) => <option value={code} key={code}>{code}</option>)}
                  </select>
                  <input type="tel" value={form.phone} onChange={(event) => updateField('phone', event.currentTarget.value)} placeholder={t.form.phonePlaceholder} autoComplete="tel" aria-invalid={Boolean(errors.phone)} />
                </div>
                {errors.phone && <small className="demo-field-error">{errors.phone}</small>}
              </label>
              <label className="demo-field demo-field-full">
                <span>{t.form.team}</span>
                <select value={form.teamSize} onChange={(event) => updateField('teamSize', event.currentTarget.value)} aria-invalid={Boolean(errors.teamSize)}>
                  <option value="">{t.form.teamPlaceholder}</option>
                  {teamSizes.map((size) => <option value={size} key={size}>{teamSizeLabel(size, language)}</option>)}
                </select>
                {errors.teamSize && <small className="demo-field-error">{errors.teamSize}</small>}
              </label>
              <label className="demo-field demo-field-full">
                <span>{enterpriseMode ? (language === 'th' ? 'ระบบเดิมที่ต้องการเชื่อมต่อ' : 'Existing system to integrate') : t.form.interest}</span>
                <textarea value={form.interests} onChange={(event) => updateField('interests', event.currentTarget.value)} placeholder={enterpriseMode ? (language === 'th' ? 'เช่น POS, SAP, ERP, WMS หรือเว็บไซต์' : 'For example: POS, SAP, ERP, WMS, or your website') : t.form.interestPlaceholder} rows={3} />
              </label>
              <label className="demo-field demo-field-full">
                <span>{t.form.date}</span>
                <input type="datetime-local" min={nowForDatePicker} value={form.preferredTime} onChange={(event) => updateField('preferredTime', event.currentTarget.value)} aria-invalid={Boolean(errors.preferredTime)} />
                {errors.preferredTime && <small className="demo-field-error">{errors.preferredTime}</small>}
              </label>
              <label className={`demo-consent ${errors.consent ? 'has-error' : ''}`}>
                <input type="checkbox" checked={form.consent} onChange={(event) => updateField('consent', event.currentTarget.checked)} />
                <span>{t.form.consentStart} <button type="button" onClick={() => setLegalDocument('terms')}>{t.form.terms}</button> {t.form.consentJoin} <button type="button" onClick={() => setLegalDocument('privacy')}>{t.form.privacy}</button></span>
              </label>
              {errors.consent && <small className="demo-field-error demo-consent-error">{errors.consent}</small>}
              <button className="demo-submit-button" type="submit">{t.form.submit} <span>→</span></button>
              <small className="demo-form-note">{t.form.note}</small>
            </form>
          </section>
        </section>

        <section className="demo-benefits demo-shell" id="why">
          <div className="demo-section-heading"><span className="demo-kicker">{t.benefits.kicker}</span><h2>{t.benefits.title}</h2><p>{t.benefits.description}</p></div>
          <div className="demo-benefit-grid">
            {t.benefits.cards.map((card, index) => <article className="demo-benefit-card" key={card.title}><span className={`benefit-card-icon ${index === 0 ? 'icon-inbox' : index === 1 ? 'icon-team' : 'icon-ai'}`}>{index === 0 ? '▣' : index === 1 ? '↗' : '✦'}</span><h3>{card.title}</h3><p>{card.text}</p></article>)}
          </div>
        </section>

        <section className="demo-video-section" id="how">
          <div className="demo-shell demo-video-layout">
            <div className="demo-video-copy"><span className="demo-kicker">{t.video.kicker}</span><h2>{t.video.title}<br />{t.video.titleAccent}</h2><p>{t.video.description}</p><button className="demo-outline-button" type="button" onClick={() => setVideoOpen(true)}>{t.video.button} <span>▶</span></button></div>
            <div className="demo-video-preview" role="img" aria-label="CUTINEO inbox preview"><div className="preview-topbar"><span /><span /><span /><b>cutineo inbox</b></div><div className="preview-body"><div className="preview-sidebar"><i /><i /><i /><i /></div><div className="preview-chat"><strong>{t.video.inbox}</strong><div className="preview-message message-one">{t.video.messageOne}</div><div className="preview-message message-two">{t.video.messageTwo}</div><div className="preview-input">{t.video.input}</div></div></div><button className="preview-play" type="button" onClick={() => setVideoOpen(true)} aria-label="Open product preview">▶</button></div>
          </div>
        </section>

        <section className="demo-steps demo-shell">
          <div className="demo-section-heading"><span className="demo-kicker">{t.steps.kicker}</span><h2>{t.steps.title}</h2><p>{t.steps.description}</p></div>
          <div className="demo-step-grid">
            {t.steps.cards.map((card, index) => <article className="demo-step-card" key={card.title}><span className="step-number">0{index + 1}</span><div className="step-icon">{index === 0 ? '↗' : index === 1 ? '＋' : index === 2 ? '⇄' : '✦'}</div><h3>{card.title}</h3><p>{card.text}</p></article>)}
          </div>
        </section>

        <section className="demo-cta demo-shell"><div><span className="demo-kicker demo-kicker-light">{t.cta.kicker}</span><h2>{t.cta.title}<br />{t.cta.titleAccent}</h2><p>{t.cta.description}</p></div><div className="demo-cta-actions"><button className="demo-cta-light" type="button" onClick={() => scrollTo('top')}>{t.cta.book} <span>↑</span></button><button className="demo-cta-ghost" type="button" onClick={goToRegister}>{t.cta.start} <span>→</span></button></div></section>
      </main>

      <footer className="demo-footer demo-shell"><button className="demo-brand" type="button" onClick={goHome}><span className="demo-brand-mark"><img src={NEO_LOGO_PATH} alt="Neo" /></span><span className="demo-brand-word">CUTI<span>NEO</span></span></button><span>{t.footer}</span><span>© 2026 CUTINEO</span></footer>

      {videoOpen && <div className="demo-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setVideoOpen(false); }}><section className="demo-video-modal" role="dialog" aria-modal="true" aria-labelledby="video-modal-title"><button className="demo-modal-close" type="button" onClick={() => setVideoOpen(false)} aria-label="Close video">×</button><span className="demo-kicker">{t.modal.kicker}</span><h2 id="video-modal-title">{t.modal.title}</h2><div className="demo-modal-player"><div className="modal-player-glow" /><span>▶</span><small>{t.modal.videoNote}</small></div><p>{t.modal.videoText}</p><button className="demo-primary-modal-button" type="button" onClick={goHome}>{t.modal.videoButton} <span>→</span></button></section></div>}

      {legalDocument && <div className="demo-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLegalDocument(null); }}><section className="demo-legal-modal" role="dialog" aria-modal="true" aria-labelledby="demo-legal-title"><button className="demo-modal-close" type="button" onClick={() => setLegalDocument(null)} aria-label="Close dialog">×</button><span className="demo-kicker">CUTINEO</span><h2 id="demo-legal-title">{legalDocument === 'terms' ? t.legal.terms : t.legal.privacy}</h2><p>{legalDocument === 'terms' ? t.modal.terms : t.modal.privacy}</p><button className="demo-secondary-modal-button" type="button" onClick={() => setLegalDocument(null)}>{t.modal.legalAck}</button></section></div>}
    </div>
  );
}
