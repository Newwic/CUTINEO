import { useEffect, useState, type FormEvent } from 'react';

type DemoDocument = 'terms' | 'privacy' | null;

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

const teamSizes = ['1–5 คน', '6–10 คน', '11–15 คน', '16–20 คน', '21–25 คน', '26–30 คน', '30+ คน'];
const countryCodes = ['+66', '+65', '+63', '+60', '+62', '+86', '+81', '+1'];

function getBaseUrl() {
  return (import.meta.env.BASE_URL || '/').replace(/\/$/, '/');
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function formatDateTime(value: string) {
  if (!value) return 'ยังไม่ได้เลือก';
  return new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function DemoApp() {
  const [form, setForm] = useState<DemoForm>(emptyForm);
  const [countryCode, setCountryCode] = useState('+66');
  const [errors, setErrors] = useState<Partial<Record<keyof DemoForm, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [legalDocument, setLegalDocument] = useState<DemoDocument>(null);

  const baseUrl = getBaseUrl();
  const homeUrl = `${baseUrl}index.html`;
  const registerUrl = `${baseUrl}register.html?plan=Basic`;
  const nowForDatePicker = new Date().toISOString().slice(0, 16);

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
  const goToRegister = () => window.location.assign(registerUrl);
  const goToLogin = () => window.location.assign(`${homeUrl}?login=1`);

  const validate = () => {
    const nextErrors: Partial<Record<keyof DemoForm, string>> = {};
    if (!form.fullName.trim()) nextErrors.fullName = 'กรุณากรอกชื่อ-นามสกุล';
    if (!form.businessName.trim()) nextErrors.businessName = 'กรุณากรอกชื่อบริษัทหรือร้านค้า';
    if (!isEmail(form.email.trim())) nextErrors.email = 'กรุณากรอกอีเมลให้ถูกต้อง';
    if (form.phone.replace(/\D/g, '').length < 8) nextErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์ให้ครบถ้วน';
    if (!form.teamSize) nextErrors.teamSize = 'กรุณาเลือกจำนวนแอดมิน';
    if (!form.preferredTime) nextErrors.preferredTime = 'กรุณาเลือกวันเวลาที่ต้องการจอง';
    if (!form.consent) nextErrors.consent = 'กรุณายอมรับเงื่อนไขก่อนส่งข้อมูล';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    try {
      localStorage.setItem('cutineo-demo-request', JSON.stringify({ ...form, countryCode, createdAt: new Date().toISOString() }));
    } catch {
      // Private browsing can disable localStorage. The demo still completes successfully.
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="demo-page demo-success-page">
        <header className="demo-header demo-shell">
          <button className="demo-brand" type="button" onClick={goHome} aria-label="กลับหน้าแรก CUTINEO">
            <span className="demo-brand-mark">N</span>
            <span className="demo-brand-word">CUTI<span>NEO</span></span>
          </button>
          <button className="demo-header-link" type="button" onClick={goHome}>กลับหน้าแรก</button>
        </header>
        <main className="demo-success-card" role="status">
          <div className="demo-success-icon">✓</div>
          <span className="demo-kicker">DEMO REQUEST RECEIVED</span>
          <h1>รับคำขอสาธิตเรียบร้อยแล้ว</h1>
          <p>ขอบคุณคุณ {form.fullName || 'ลูกค้า'} ทีม CUTINEO จะเตรียมตัวอย่างให้เหมาะกับ {form.businessName || 'ธุรกิจของคุณ'}</p>
          <div className="demo-summary">
            <div><span>เวลาที่ต้องการจอง</span><strong>{formatDateTime(form.preferredTime)}</strong></div>
            <div><span>จำนวนทีมตอบแชท</span><strong>{form.teamSize}</strong></div>
          </div>
          <div className="demo-success-actions">
            <button className="demo-primary-button" type="button" onClick={goToRegister}>เริ่มทดลองใช้ฟรี 7 วัน <span>→</span></button>
            <button className="demo-secondary-button" type="button" onClick={goHome}>กลับหน้าแรก</button>
          </div>
          <small className="demo-disclaimer">หน้านี้เป็นเดโมบน GitHub Pages ข้อมูลถูกเก็บไว้เฉพาะในเบราว์เซอร์เครื่องนี้ และยังไม่ได้ส่งไปยังระบบนัดหมายจริง</small>
        </main>
      </div>
    );
  }

  return (
    <div className="demo-page">
      <header className="demo-header demo-shell">
        <button className="demo-brand" type="button" onClick={goHome} aria-label="กลับหน้าแรก CUTINEO">
          <span className="demo-brand-mark">N</span>
          <span className="demo-brand-word">CUTI<span>NEO</span></span>
        </button>
        <nav className="demo-nav" aria-label="เมนูหน้าเดโม">
          <button type="button" onClick={() => scrollTo('why')}>ฟีเจอร์</button>
          <button type="button" onClick={() => scrollTo('how')}>วิธีใช้งาน</button>
          <a href={`${baseUrl}index.html#pricing`}>ราคา</a>
        </nav>
        <div className="demo-header-actions">
          <button className="demo-login-link" type="button" onClick={goToLogin}>เข้าสู่ระบบ</button>
          <button className="demo-trial-button" type="button" onClick={goToRegister}>ทดลองใช้ฟรี</button>
        </div>
      </header>

      <main>
        <section className="demo-hero demo-shell" id="top">
          <div className="demo-hero-copy">
            <span className="demo-kicker">SEE CUTINEO IN ACTION</span>
            <h1>นัดหมายเวลาสาธิต<br /><span>การใช้งานจริง</span></h1>
            <p>เราจะปรับการสาธิตให้เหมาะกับธุรกิจของคุณ แสดงให้ดูว่า CUTINEO ช่วยรวมแชท เพิ่มประสิทธิภาพทีม และปิดการขายได้อย่างไร</p>
            <div className="demo-hero-points">
              <span><i>✓</i> ดูกล่องแชทกลางจากหลายช่องทาง</span>
              <span><i>✓</i> เห็นการทำงานของ NEO และระบบทีม</span>
              <span><i>✓</i> คุยกับทีมเราโดยไม่มีค่าใช้จ่าย</span>
            </div>
            <button className="demo-video-link" type="button" onClick={() => setVideoOpen(true)}><span className="demo-play-icon">▶</span> ดูวิดีโอตัวอย่างการใช้งาน</button>
          </div>

          <section className="demo-form-card" aria-labelledby="demo-form-title">
            <div className="demo-form-heading">
              <span className="demo-kicker">BOOK A DEMO</span>
              <h2 id="demo-form-title">จองเวลาสาธิตกับทีม CUTINEO</h2>
              <p>กรอกข้อมูลสั้น ๆ แล้วเลือกเวลาที่สะดวกให้เราเตรียมเดโมได้ตรงความต้องการ</p>
            </div>
            <form className="demo-form" noValidate onSubmit={handleSubmit}>
              <label className="demo-field">
                <span>ชื่อ-นามสกุล</span>
                <input type="text" value={form.fullName} onChange={(event) => updateField('fullName', event.currentTarget.value)} placeholder="ชื่อ-นามสกุล" autoComplete="name" aria-invalid={Boolean(errors.fullName)} />
                {errors.fullName && <small className="demo-field-error">{errors.fullName}</small>}
              </label>
              <label className="demo-field">
                <span>ชื่อบริษัทหรือร้านค้า</span>
                <input type="text" value={form.businessName} onChange={(event) => updateField('businessName', event.currentTarget.value)} placeholder="ชื่อธุรกิจของคุณ" autoComplete="organization" aria-invalid={Boolean(errors.businessName)} />
                {errors.businessName && <small className="demo-field-error">{errors.businessName}</small>}
              </label>
              <label className="demo-field">
                <span>อีเมล</span>
                <input type="email" value={form.email} onChange={(event) => updateField('email', event.currentTarget.value)} placeholder="you@example.com" autoComplete="email" aria-invalid={Boolean(errors.email)} />
                {errors.email && <small className="demo-field-error">{errors.email}</small>}
              </label>
              <label className="demo-field">
                <span>เบอร์โทรที่ติดต่อได้</span>
                <div className={`demo-phone-field ${errors.phone ? 'has-error' : ''}`}>
                  <select aria-label="รหัสประเทศ" value={countryCode} onChange={(event) => setCountryCode(event.currentTarget.value)}>
                    {countryCodes.map((code) => <option value={code} key={code}>{code}</option>)}
                  </select>
                  <input type="tel" value={form.phone} onChange={(event) => updateField('phone', event.currentTarget.value)} placeholder="81 234 5678" autoComplete="tel" aria-invalid={Boolean(errors.phone)} />
                </div>
                {errors.phone && <small className="demo-field-error">{errors.phone}</small>}
              </label>
              <label className="demo-field demo-field-full">
                <span>คุณมีแอดมินให้บริการตอบแชทลูกค้ากี่คน?</span>
                <select value={form.teamSize} onChange={(event) => updateField('teamSize', event.currentTarget.value)} aria-invalid={Boolean(errors.teamSize)}>
                  <option value="">จำนวน</option>
                  {teamSizes.map((size) => <option value={size} key={size}>{size}</option>)}
                </select>
                {errors.teamSize && <small className="demo-field-error">{errors.teamSize}</small>}
              </label>
              <label className="demo-field demo-field-full">
                <span>ฟีเจอร์อะไรที่คุณสนใจเป็นพิเศษ?</span>
                <textarea value={form.interests} onChange={(event) => updateField('interests', event.currentTarget.value)} placeholder="เช่น รวมแชท, AI ช่วยตอบ, มอบหมายงาน หรือรายงานยอดขาย" rows={3} />
              </label>
              <label className="demo-field demo-field-full">
                <span>เลือกวันเวลาที่ต้องการจอง</span>
                <input type="datetime-local" min={nowForDatePicker} value={form.preferredTime} onChange={(event) => updateField('preferredTime', event.currentTarget.value)} aria-invalid={Boolean(errors.preferredTime)} />
                {errors.preferredTime && <small className="demo-field-error">{errors.preferredTime}</small>}
              </label>
              <label className={`demo-consent ${errors.consent ? 'has-error' : ''}`}>
                <input type="checkbox" checked={form.consent} onChange={(event) => updateField('consent', event.currentTarget.checked)} />
                <span>ยินยอมให้ทีม CUTINEO ติดต่อกลับเกี่ยวกับการสาธิต และยอมรับ <button type="button" onClick={() => setLegalDocument('terms')}>เงื่อนไขการให้บริการ</button> กับ <button type="button" onClick={() => setLegalDocument('privacy')}>นโยบายความเป็นส่วนตัว</button></span>
              </label>
              {errors.consent && <small className="demo-field-error demo-consent-error">{errors.consent}</small>}
              <button className="demo-submit-button" type="submit">นัดหมายเวลาสาธิต <span>→</span></button>
              <small className="demo-form-note">ไม่มีค่าใช้จ่าย • ใช้เวลาประมาณ 30 นาที • ไม่มีข้อผูกมัด</small>
            </form>
          </section>
        </section>

        <section className="demo-benefits demo-shell" id="why">
          <div className="demo-section-heading"><span className="demo-kicker">WHY CUTINEO</span><h2>เดโมที่ตอบโจทย์ธุรกิจของคุณ</h2><p>เราไม่ได้แค่พาเดินดูฟีเจอร์ แต่จะช่วยวางภาพการใช้งานให้เข้ากับทีมและช่องทางของคุณ</p></div>
          <div className="demo-benefit-grid">
            <article className="demo-benefit-card"><span className="benefit-card-icon icon-inbox">▣</span><h3>รวมแชทในกล่องเดียว</h3><p>จัดการ Facebook, Instagram, LINE และ Marketplace ในหน้าจอเดียว ลดการสลับแอปและไม่พลาดข้อความ</p></article>
            <article className="demo-benefit-card"><span className="benefit-card-icon icon-team">↗</span><h3>ทำงานร่วมกันเป็นทีม</h3><p>มอบหมายแชท ติดตามสถานะ และดูภาพรวมการตอบลูกค้าให้ทุกคนทำงานต่อกันได้ลื่นไหล</p></article>
            <article className="demo-benefit-card"><span className="benefit-card-icon icon-ai">✦</span><h3>ใช้ข้อมูลยกระดับบริการ</h3><p>ดูข้อมูลเชิงลึกและใช้ NEO ช่วยร่างคำตอบ เพื่อให้ทีมตอบไวขึ้นและดูแลลูกค้าได้สม่ำเสมอ</p></article>
          </div>
        </section>

        <section className="demo-video-section" id="how">
          <div className="demo-shell demo-video-layout">
            <div className="demo-video-copy"><span className="demo-kicker">GET STARTED FAST</span><h2>เรียนรู้วิธีใช้งาน CUTINEO<br />ได้ง่าย ๆ ในไม่กี่ขั้นตอน</h2><p>ตั้งแต่เชื่อมต่อช่องทาง เพิ่มทีม มอบหมายแชท จนถึงเริ่มตอบลูกค้า ทุกอย่างออกแบบให้เริ่มได้เร็ว</p><button className="demo-outline-button" type="button" onClick={() => setVideoOpen(true)}>ดูวิดีโอตัวอย่าง <span>▶</span></button></div>
            <div className="demo-video-preview" role="img" aria-label="ตัวอย่างหน้าจอกล่องแชท CUTINEO"><div className="preview-topbar"><span /><span /><span /><b>cutineo inbox</b></div><div className="preview-body"><div className="preview-sidebar"><i /><i /><i /><i /></div><div className="preview-chat"><strong>ทีม CUTINEO</strong><div className="preview-message message-one">ลูกค้าจาก LINE เข้ามาแล้ว</div><div className="preview-message message-two">NEO ช่วยร่างคำตอบให้ทีม ✓</div><div className="preview-input">พิมพ์ข้อความ...</div></div></div><button className="preview-play" type="button" onClick={() => setVideoOpen(true)} aria-label="เปิดวิดีโอตัวอย่าง">▶</button></div>
          </div>
        </section>

        <section className="demo-steps demo-shell">
          <div className="demo-section-heading"><span className="demo-kicker">A SIMPLE START</span><h2>เมื่อลงทะเบียนแล้ว เริ่มใช้งานตามนี้</h2><p>เพียง 4 ขั้นตอน ทีมของคุณก็พร้อมดูแลทุกแชทจากที่เดียว</p></div>
          <div className="demo-step-grid">
            <article className="demo-step-card"><span className="step-number">01</span><div className="step-icon">↗</div><h3>เชื่อมต่อบัญชี</h3><p>เชื่อมต่อช่องทางแชทที่ธุรกิจใช้อยู่ เพื่อรับข้อความจากลูกค้าเข้ากล่องกลาง</p></article>
            <article className="demo-step-card"><span className="step-number">02</span><div className="step-icon">＋</div><h3>เพิ่มเพื่อนร่วมทีม</h3><p>ชวนทีมเข้ามาช่วยกันจัดการแชทและแบ่งหน้าที่ได้ในระบบเดียว</p></article>
            <article className="demo-step-card"><span className="step-number">03</span><div className="step-icon">⇄</div><h3>มอบหมายแชท</h3><p>กระจายงานให้ทีมอย่างเป็นระบบ พร้อมติดตามว่าแต่ละเคสอยู่ขั้นตอนไหน</p></article>
            <article className="demo-step-card"><span className="step-number">04</span><div className="step-icon">✦</div><h3>เริ่มคุยกับลูกค้า</h3><p>ตอบลูกค้าได้เร็วขึ้นจากกล่องเดียว พร้อมให้ NEO ช่วยทีมเมื่อจำเป็น</p></article>
          </div>
        </section>

        <section className="demo-cta demo-shell"><div><span className="demo-kicker demo-kicker-light">READY TO SEE IT?</span><h2>อยากเห็นว่า CUTINEO<br />เหมาะกับทีมของคุณอย่างไร?</h2><p>จองเดโมกับเรา หรือเริ่มทดลองใช้ฟรีได้ทันที</p></div><div className="demo-cta-actions"><button className="demo-cta-light" type="button" onClick={() => scrollTo('top')}>จองเวลาสาธิต <span>↑</span></button><button className="demo-cta-ghost" type="button" onClick={goToRegister}>เริ่มทดลองใช้ฟรี <span>→</span></button></div></section>
      </main>

      <footer className="demo-footer demo-shell"><button className="demo-brand" type="button" onClick={goHome}><span className="demo-brand-mark">N</span><span className="demo-brand-word">CUTI<span>NEO</span></span></button><span>รวมทุกแชทให้ทีมขายทำงานได้ง่ายขึ้น</span><span>© 2026 CUTINEO</span></footer>

      {videoOpen && <div className="demo-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setVideoOpen(false); }}><section className="demo-video-modal" role="dialog" aria-modal="true" aria-labelledby="video-modal-title"><button className="demo-modal-close" type="button" onClick={() => setVideoOpen(false)} aria-label="ปิดวิดีโอ">×</button><span className="demo-kicker">CUTINEO DEMO</span><h2 id="video-modal-title">ดูภาพรวมการทำงานของ CUTINEO</h2><div className="demo-modal-player"><div className="modal-player-glow" /><span>▶</span><small>วิดีโอตัวอย่างกำลังเตรียมให้ชม</small></div><p>ระหว่างนี้ลองกดเลือกช่องทางและส่งข้อความในเดโมบนหน้าแรกได้เลย</p><button className="demo-primary-modal-button" type="button" onClick={goHome}>ไปดูเดโมแบบโต้ตอบ <span>→</span></button></section></div>}

      {legalDocument && <div className="demo-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLegalDocument(null); }}><section className="demo-legal-modal" role="dialog" aria-modal="true" aria-labelledby="demo-legal-title"><button className="demo-modal-close" type="button" onClick={() => setLegalDocument(null)} aria-label="ปิดหน้าต่าง">×</button><span className="demo-kicker">CUTINEO</span><h2 id="demo-legal-title">{legalDocument === 'terms' ? 'เงื่อนไขการให้บริการ' : 'นโยบายความเป็นส่วนตัว'}</h2><p>{legalDocument === 'terms' ? 'การจองเดโมนี้เป็นการขอข้อมูลเพื่อเตรียมการสาธิตเท่านั้น ไม่มีค่าใช้จ่ายและไม่มีข้อผูกมัด ฟีเจอร์เดโมบน GitHub Pages ยังไม่เชื่อมต่อระบบนัดหมายจริง' : 'ข้อมูลที่กรอกในหน้านี้ใช้เพื่อจำลองคำขอเดโมเท่านั้น โดยเดโมจะเก็บข้อมูลไว้ในเบราว์เซอร์เครื่องนี้และไม่บันทึกรหัสผ่าน'}</p><button className="demo-secondary-modal-button" type="button" onClick={() => setLegalDocument(null)}>รับทราบ</button></section></div>}
    </div>
  );
}
