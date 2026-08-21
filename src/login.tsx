/* eslint-disable @next/next/no-img-element -- shared with the Vite static pages. */
import { StrictMode, useEffect, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { NEO_LOGO_PATH } from './lib/branding';
import './login.css';

type Language = 'th' | 'en';
type LoginMethod = 'email' | 'phone';

const copy = {
  th: {
    language: 'EN',
    title: 'เข้าสู่ระบบ',
    email: 'อีเมล',
    phone: 'เบอร์โทรศัพท์',
    password: 'รหัสผ่าน',
    emailPlaceholder: 'name@example.com',
    phonePlaceholder: '08x-xxx-xxxx',
    passwordPlaceholder: 'อย่างน้อย 8 ตัวอักษร',
    forgot: 'ลืมรหัสผ่าน?',
    reset: 'รีเซ็ตรหัสผ่าน',
    submit: 'เข้าสู่ระบบ',
    noAccount: 'ยังไม่มีบัญชี CUTINEO?',
    register: 'สร้างบัญชี',
    back: 'กลับหน้าแรก',
    demo: 'หน้า Login นี้เชื่อมกับบัญชีจริงได้เมื่อ deploy Backend และ Supabase แล้ว',
    invalidEmail: 'กรุณากรอกอีเมลให้ถูกต้อง',
    invalidPhone: 'กรุณากรอกเบอร์โทรศัพท์',
    invalidPassword: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
    success: 'ตรวจสอบข้อมูลเรียบร้อย กำลังเข้าสู่ระบบเดโม...',
    resetNotice: 'ลิงก์รีเซ็ตรหัสผ่านจะส่งไปที่อีเมลของคุณเมื่อเชื่อมระบบบัญชีจริง',
  },
  en: {
    language: 'TH',
    title: 'Log in',
    email: 'Email',
    phone: 'Phone number',
    password: 'Password',
    emailPlaceholder: 'name@example.com',
    phonePlaceholder: '08x-xxx-xxxx',
    passwordPlaceholder: 'At least 8 characters',
    forgot: 'Forgot password?',
    reset: 'Reset password',
    submit: 'Log in',
    noAccount: "Don't have a CUTINEO account?",
    register: 'Create account',
    back: 'Back to home',
    demo: 'This login connects to real accounts after the Backend and Supabase are deployed.',
    invalidEmail: 'Please enter a valid email address.',
    invalidPhone: 'Please enter your phone number.',
    invalidPassword: 'Password must be at least 8 characters.',
    success: 'Details accepted. Opening demo mode...',
    resetNotice: 'A reset link will be sent after the real account system is connected.',
  },
} as const;

const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');

function Logo() {
  return (
    <a className="login-brand" href={baseUrl} aria-label="CUTINEO home">
      <span className="login-brand-mark"><img className="login-brand-logo" src={NEO_LOGO_PATH} alt="Neo" /></span>
      <span>cutineo</span>
    </a>
  );
}

function LoginApp() {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      return window.localStorage.getItem('cutineo-language') === 'en' ? 'en' : 'th';
    } catch {
      return 'th';
    }
  });
  const [method, setMethod] = useState<LoginMethod>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info'>('info');
  const [loading, setLoading] = useState(false);
  const t = copy[language];

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      window.localStorage.setItem('cutineo-language', language);
    } catch {
      // Private browsing can disable storage; the switch still works for this page.
    }
  }, [language]);

  const switchMethod = (nextMethod: LoginMethod) => {
    setMethod(nextMethod);
    setIdentifier('');
    setMessage('');
  };

  const showMessage = (nextMessage: string, type: 'error' | 'success' | 'info') => {
    setMessage(nextMessage);
    setMessageType(type);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    if (method === 'email' && (!identifier.includes('@') || !identifier.includes('.'))) {
      showMessage(t.invalidEmail, 'error');
      return;
    }
    if (method === 'phone' && identifier.trim().length < 8) {
      showMessage(t.invalidPhone, 'error');
      return;
    }
    if (password.length < 8) {
      showMessage(t.invalidPassword, 'error');
      return;
    }

    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      showMessage(t.success, 'success');
      window.setTimeout(() => {
        window.location.assign(`${baseUrl}demo.html`);
      }, 450);
    }, 650);
  };

  const resetPassword = () => showMessage(t.resetNotice, 'info');

  return (
    <main className="login-page">
      <header className="login-header">
        <Logo />
        <button className="language-switch" type="button" onClick={() => setLanguage(language === 'th' ? 'en' : 'th')}>
          <span className="language-globe" aria-hidden="true">◉</span>
          {t.language}
        </button>
      </header>

      <section className="login-content" aria-labelledby="login-title">
        <div className="login-card">
          <h1 id="login-title">{t.title}</h1>

          <div className="login-tabs" role="tablist" aria-label={language === 'th' ? 'วิธีเข้าสู่ระบบ' : 'Login method'}>
            <button className={method === 'email' ? 'is-active' : ''} type="button" role="tab" aria-selected={method === 'email'} onClick={() => switchMethod('email')}>
              {t.email}
            </button>
            <button className={method === 'phone' ? 'is-active' : ''} type="button" role="tab" aria-selected={method === 'phone'} onClick={() => switchMethod('phone')}>
              {t.phone}
            </button>
          </div>

          <form className="login-form" onSubmit={submit} noValidate>
            <label>
              <span>{method === 'email' ? t.email : t.phone}</span>
              <input
                required
                type={method === 'email' ? 'email' : 'tel'}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder={method === 'email' ? t.emailPlaceholder : t.phonePlaceholder}
                autoComplete={method === 'email' ? 'email' : 'tel'}
              />
            </label>

            <label>
              <span>{t.password}</span>
              <span className="password-field">
                <input
                  required
                  minLength={8}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t.passwordPlaceholder}
                  autoComplete="current-password"
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
                </button>
              </span>
            </label>

            <button className="forgot-link" type="button" onClick={resetPassword}>{t.forgot} <span>{t.reset}</span></button>

            {message && <p className={`login-message ${messageType}`} role={messageType === 'error' ? 'alert' : 'status'}>{message}</p>}

            <button className="login-submit" type="submit" disabled={loading}>
              {loading && <Loader2 size={17} className="spin" aria-hidden="true" />}
              {t.submit}
            </button>
          </form>
        </div>

        <p className="login-register">{t.noAccount} <a href={`${baseUrl}register.html`}>{t.register}</a></p>
        <a className="login-back" href={baseUrl}><ArrowLeft size={16} aria-hidden="true" /> {t.back}</a>
        <p className="login-note">{t.demo}</p>
        <p className="login-copyright">© 2026 CUTINEO. All rights reserved.</p>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LoginApp />
  </StrictMode>,
);
