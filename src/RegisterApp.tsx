import { useMemo, useState, type FormEvent } from 'react';

type PlanName = 'Starter' | 'Pro' | 'Advanced';
type LegalDocument = 'terms' | 'privacy' | null;

type RegistrationForm = {
  businessName: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  teamSize: string;
  terms: boolean;
};

const planNames: PlanName[] = ['Starter', 'Pro', 'Advanced'];

const planCopy: Record<PlanName, { label: string; description: string }> = {
  Starter: { label: 'Starter', description: 'ระบบรวมแชทล้วนสำหรับแอดมิน 2 บัญชี ราคา 490 บาท / เดือน' },
  Pro: { label: 'Pro', description: 'AI ช่วยตอบและปิดการขาย 4,000 ข้อความ / เดือน ราคา 990 บาท / เดือนในปีแรก' },
  Advanced: { label: 'Advanced', description: 'ช่องทางไม่จำกัด แอดมิน 15 บัญชี ราคา 1,990 บาท / เดือน' },
};

const countryCodes = ['+66', '+65', '+63', '+60', '+62', '+86', '+81', '+1'];
const teamSizes = ['1 คน', '2–10 คน', '11–25 คน', '26–50 คน', '50+ คน'];

const emptyForm: RegistrationForm = {
  businessName: '',
  name: '',
  email: '',
  phone: '',
  password: '',
  teamSize: '',
  terms: false,
};

function getBaseUrl() {
  return (import.meta.env.BASE_URL || '/').replace(/\/$/, '/');
}

function getInitialPlan(): PlanName {
  const requestedPlan = new URLSearchParams(window.location.search).get('plan');
  return planNames.includes(requestedPlan as PlanName) ? (requestedPlan as PlanName) : 'Starter';
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function RegisterApp() {
  const [form, setForm] = useState<RegistrationForm>(emptyForm);
  const [selectedPlan, setSelectedPlan] = useState<PlanName>(getInitialPlan);
  const [countryCode, setCountryCode] = useState('+66');
  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationForm, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [legalDocument, setLegalDocument] = useState<LegalDocument>(null);

  const baseUrl = getBaseUrl();
  const homeUrl = `${baseUrl}index.html`;
  const selectedPlanCopy = planCopy[selectedPlan];

  const passwordStrength = useMemo(() => {
    const password = form.password;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    const labels = ['เริ่มต้น', 'พอใช้', 'ดี', 'แข็งแรง', 'แข็งแรงมาก'];
    return { score, label: password ? labels[score] : 'อย่างน้อย 8 ตัวอักษร' };
  }, [form.password]);

  const updateField = <K extends keyof RegistrationForm>(field: K, value: RegistrationForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const goHome = () => window.location.assign(homeUrl);
  const goToLogin = () => window.location.assign(`${baseUrl}login/`);

  const validate = () => {
    const nextErrors: Partial<Record<keyof RegistrationForm, string>> = {};
    if (!form.businessName.trim()) nextErrors.businessName = 'กรุณากรอกชื่อธุรกิจ';
    if (!form.name.trim()) nextErrors.name = 'กรุณากรอกชื่อของคุณ';
    if (!isEmail(form.email.trim())) nextErrors.email = 'กรุณากรอกอีเมลให้ถูกต้อง';
    if (form.phone.replace(/\D/g, '').length < 8) nextErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์ให้ครบถ้วน';
    if (form.password.length < 8) nextErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
    if (!form.teamSize) nextErrors.teamSize = 'กรุณาเลือกจำนวนพนักงานตอบแชท';
    if (!form.terms) nextErrors.terms = 'กรุณายอมรับเงื่อนไขก่อนดำเนินการต่อ';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const { password: _password, ...safeForm } = form;
    try {
      localStorage.setItem('cutineo-registration', JSON.stringify({ ...safeForm, countryCode, plan: selectedPlan, createdAt: new Date().toISOString() }));
    } catch {
      // Private browsing can disable localStorage. The demo still completes successfully.
    }
    setRegistered(true);
  };

  if (registered) {
    return (
      <div className="register-page register-success-page">
        <header className="register-header register-shell">
          <button className="register-brand" type="button" onClick={goHome} aria-label="กลับหน้าแรก CUTINEO">
            <span className="register-brand-mark">N</span>
            <span className="register-brand-word">CUTI<span>NEO</span></span>
          </button>
          <button className="register-back-link" type="button" onClick={goHome}>กลับหน้าแรก</button>
        </header>
        <main className="register-success-card" role="status">
          <div className="success-check">✓</div>
          <span className="register-kicker">WELCOME TO CUTINEO</span>
          <h1>สร้างบัญชีทดลองใช้งานสำเร็จ</h1>
          <p>ยินดีต้อนรับ {form.name || 'คุณ'} จาก {form.businessName || 'ธุรกิจของคุณ'} เราพร้อมช่วยให้ทีมดูแลทุกแชทได้ง่ายขึ้น</p>
          <div className="success-summary">
            <span>แพ็กเกจที่เลือก</span>
            <strong>{selectedPlanCopy.label}</strong>
            <small>{selectedPlanCopy.description}</small>
          </div>
          <button className="register-primary-button" type="button" onClick={goHome}>เข้าสู่หน้า CUTINEO เดโม <span>→</span></button>
          <small className="demo-disclaimer">หน้านี้เป็นเดโมบน GitHub Pages ข้อมูลถูกเก็บไว้เฉพาะในเบราว์เซอร์เครื่องนี้ และยังไม่ได้สร้างบัญชีบนเซิร์ฟเวอร์จริง</small>
        </main>
      </div>
    );
  }

  return (
    <div className="register-page">
      <header className="register-header register-shell">
        <button className="register-brand" type="button" onClick={goHome} aria-label="กลับหน้าแรก CUTINEO">
          <span className="register-brand-mark">N</span>
          <span className="register-brand-word">CUTI<span>NEO</span></span>
        </button>
        <div className="register-header-actions">
          <span className="register-language"><span className="language-dot" /> ไทย</span>
          <span className="register-login-copy">มีบัญชีแล้ว?</span>
          <button className="register-login-link" type="button" onClick={goToLogin}>เข้าสู่ระบบ</button>
        </div>
      </header>

      <main className="register-shell register-layout">
        <section className="register-marketing" aria-labelledby="register-marketing-title">
          <span className="register-kicker">ALL-IN-ONE INBOX</span>
          <h1 id="register-marketing-title">รวมทุกแชทใน<br /><span>กล่องข้อความเดียว</span></h1>
          <p>รวม LINE, Facebook, Instagram และ Marketplace ไว้ในที่เดียว ให้ทีมตอบลูกค้าได้ไวและทำงานร่วมกันง่ายขึ้น</p>

          <div className="register-channel-row" aria-label="ช่องทางที่รองรับ">
            <span className="channel-bubble channel-line">L</span>
            <span className="channel-bubble channel-facebook">f</span>
            <span className="channel-bubble channel-instagram">◎</span>
            <span className="channel-bubble channel-marketplace">M</span>
            <span className="channel-more">+ อีกหลายช่องทาง</span>
          </div>

          <div className="register-benefit-list">
            <article className="register-benefit">
              <span className="benefit-icon">▣</span>
              <div><strong>ตอบแชทได้จากที่เดียว</strong><p>ไม่ต้องสลับหลายแอปและไม่พลาดข้อความสำคัญ</p></div>
            </article>
            <article className="register-benefit">
              <span className="benefit-icon">✦</span>
              <div><strong>มี NEO ช่วยทีมขาย</strong><p>ช่วยร่างคำตอบและสรุปบทสนทนาให้ทำงานเร็วขึ้น</p></div>
            </article>
            <article className="register-benefit">
              <span className="benefit-icon">↗</span>
              <div><strong>เริ่มต้นได้โดยไม่ใช้บัตรเครดิต</strong><p>ทดลองดูประสบการณ์ของ CUTINEO ได้ทันที</p></div>
            </article>
          </div>
        </section>

        <section className="register-card" aria-labelledby="register-form-title">
          <div className="register-card-heading">
            <span className="register-kicker">START YOUR FREE TRIAL</span>
            <h2 id="register-form-title">สร้างบัญชี CUTINEO</h2>
            <p>กรอกข้อมูลด้านล่างเพื่อเริ่มต้นใช้งาน CUTINEO ตามแพ็กเกจที่เลือก</p>
          </div>

          <div className="selected-plan-row">
            <div><span>แพ็กเกจเริ่มต้น</span><strong>{selectedPlanCopy.label}</strong></div>
            <select aria-label="เลือกแพ็กเกจ" value={selectedPlan} onChange={(event) => setSelectedPlan(event.currentTarget.value as PlanName)}>
              {planNames.map((planName) => <option value={planName} key={planName}>{planName}</option>)}
            </select>
          </div>

          <form className="register-form" noValidate onSubmit={handleSubmit}>
            <label className="register-field register-field-full">
              <span>ชื่อธุรกิจของคุณ</span>
              <input name="businessName" type="text" value={form.businessName} onChange={(event) => updateField('businessName', event.currentTarget.value)} placeholder="เช่น ร้านดอกไม้ของนิว" autoComplete="organization" aria-invalid={Boolean(errors.businessName)} />
              {errors.businessName && <small className="field-error">{errors.businessName}</small>}
            </label>

            <label className="register-field">
              <span>ชื่อของคุณ</span>
              <input name="name" type="text" value={form.name} onChange={(event) => updateField('name', event.currentTarget.value)} placeholder="ชื่อ-นามสกุล" autoComplete="name" aria-invalid={Boolean(errors.name)} />
              {errors.name && <small className="field-error">{errors.name}</small>}
            </label>

            <label className="register-field">
              <span>อีเมล</span>
              <input name="email" type="email" value={form.email} onChange={(event) => updateField('email', event.currentTarget.value)} placeholder="you@example.com" autoComplete="email" aria-invalid={Boolean(errors.email)} />
              {errors.email && <small className="field-error">{errors.email}</small>}
            </label>

            <label className="register-field register-field-full">
              <span>เบอร์โทรศัพท์</span>
              <div className={`phone-input ${errors.phone ? 'has-error' : ''}`}>
                <select aria-label="รหัสประเทศ" value={countryCode} onChange={(event) => setCountryCode(event.currentTarget.value)}>
                  {countryCodes.map((code) => <option value={code} key={code}>{code}</option>)}
                </select>
                <input name="phone" type="tel" value={form.phone} onChange={(event) => updateField('phone', event.currentTarget.value)} placeholder="81 234 5678" autoComplete="tel" aria-invalid={Boolean(errors.phone)} />
              </div>
              {errors.phone && <small className="field-error">{errors.phone}</small>}
            </label>

            <label className="register-field register-field-full">
              <span>รหัสผ่าน</span>
              <div className={`password-input ${errors.password ? 'has-error' : ''}`}>
                <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => updateField('password', event.currentTarget.value)} placeholder="อย่างน้อย 8 ตัวอักษร" autoComplete="new-password" aria-invalid={Boolean(errors.password)} />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>{showPassword ? 'ซ่อน' : 'แสดง'}</button>
              </div>
              <div className="password-strength" aria-live="polite">
                <div className="strength-track"><span className={`strength-fill strength-${passwordStrength.score}`} /></div>
                <small>{passwordStrength.label}</small>
              </div>
              {errors.password && <small className="field-error">{errors.password}</small>}
            </label>

            <label className="register-field register-field-full">
              <span>คุณมีพนักงานตอบแชททั้งหมดกี่คน</span>
              <select name="teamSize" value={form.teamSize} onChange={(event) => updateField('teamSize', event.currentTarget.value)} aria-invalid={Boolean(errors.teamSize)}>
                <option value="">เลือกจำนวนทีม</option>
                {teamSizes.map((size) => <option value={size} key={size}>{size}</option>)}
              </select>
              {errors.teamSize && <small className="field-error">{errors.teamSize}</small>}
            </label>

            <label className={`terms-field ${errors.terms ? 'has-error' : ''}`}>
              <input type="checkbox" checked={form.terms} onChange={(event) => updateField('terms', event.currentTarget.checked)} />
              <span>โดยการดำเนินการต่อ ฉันยอมรับ <button type="button" onClick={() => setLegalDocument('terms')}>เงื่อนไขการให้บริการ</button> และ <button type="button" onClick={() => setLegalDocument('privacy')}>นโยบายความเป็นส่วนตัว</button></span>
            </label>
            {errors.terms && <small className="field-error terms-error">{errors.terms}</small>}

            <button className="register-primary-button" type="submit">ส่งข้อมูลเริ่มต้นใช้งาน <span>→</span></button>
            <small className="form-note">ไม่ต้องใช้บัตรเครดิต • ยกเลิกได้ทุกเมื่อ</small>
          </form>
        </section>
      </main>

      <footer className="register-footer register-shell"><span>© 2026 CUTINEO</span><span>รวมทุกแชทให้ทีมขายทำงานได้ง่ายขึ้น</span></footer>

      {legalDocument && <div className="legal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLegalDocument(null); }}>
        <section className="legal-modal" role="dialog" aria-modal="true" aria-labelledby="legal-title">
          <button className="legal-close" type="button" onClick={() => setLegalDocument(null)} aria-label="ปิดหน้าต่าง">×</button>
          <span className="register-kicker">CUTINEO</span>
          <h2 id="legal-title">{legalDocument === 'terms' ? 'เงื่อนไขการให้บริการ' : 'นโยบายความเป็นส่วนตัว'}</h2>
          {legalDocument === 'terms' ? <><p>คุณสามารถทดลองใช้ CUTINEO เพื่อดูการรวมแชทและเครื่องมือช่วยทีมขายได้ตามแพ็กเกจที่เลือก การใช้งานจริงจะอยู่ภายใต้ข้อตกลงของระบบเมื่อเปิดให้บริการเต็มรูปแบบ</p><ul><li>ใช้ข้อมูลสำหรับธุรกิจของคุณเองและไม่ละเมิดสิทธิ์ของผู้อื่น</li><li>ห้ามใช้ระบบเพื่อส่งสแปมหรือเนื้อหาที่ผิดกฎหมาย</li><li>ฟีเจอร์เดโมนี้ยังไม่เชื่อมต่อการชำระเงินหรือบัญชีจริง</li></ul></> : <><p>ข้อมูลที่กรอกในหน้านี้จะถูกใช้เพื่อจำลองการเริ่มต้นใช้งาน CUTINEO เท่านั้น เดโมจะเก็บข้อมูลที่ไม่ใช่รหัสผ่านไว้ในเบราว์เซอร์เครื่องนี้</p><ul><li>เราไม่ส่งข้อมูลออกจากเครื่องในเดโมนี้</li><li>รหัสผ่านจะไม่ถูกบันทึกลง localStorage</li><li>เมื่อต่อ backend จริง จะเพิ่มการยืนยันสิทธิ์และนโยบายข้อมูลอย่างเป็นทางการ</li></ul></>}
          <button className="register-secondary-button" type="button" onClick={() => setLegalDocument(null)}>รับทราบ</button>
        </section>
      </div>}
    </div>
  );
}
