import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { AI_BOOST, PLAN_CATALOG, PLAN_ORDER } from './core/billing/catalog';
import Header from './components/layout/Header';
import CustomerChatWidget from './components/CustomerChatWidget';
import { PwaProvider } from './components/pwa/PwaProvider';
import styles from './components/marketing/MarketingPages.module.css';

export default function StaticPricingPage() {
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
  const href = (page: string) => `${basePath}${page}/`;

  return (
    <PwaProvider serviceWorkerPath={`${import.meta.env.BASE_URL}sw.js`} enabled={import.meta.env.PROD}>
      <div className={styles.page}>
        <Header basePath={basePath} signupRoute="register.html" loginRoute="login/" activeKey="pricing" />
        <main>
          <section className={styles.pageIntro}><div className={styles.contentShell}><span className={styles.eyebrow}>CUTINEO · PRICING</span><h1>เลือกแพ็กเกจที่โตไปพร้อม<br /><span>ธุรกิจของคุณ</span></h1><p>เริ่มจาก AI ช่วยตอบ แล้วขยับไปสู่ AI Sales Automation เมื่อทีมและยอดขายเติบโต</p></div></section>
          <section className={styles.contentSection}><div className={styles.contentShell}><div className={styles.pricingRouteGrid}>{PLAN_ORDER.map((planId) => { const plan = PLAN_CATALOG[planId]; return <article className={`${styles.pricingRouteCard} ${plan.featured ? styles.pricingRouteFeatured : ''}`} key={planId}>{plan.featured && <span className={styles.pricingRouteBadge}>แนะนำ · MOST POPULAR</span>}<div className={styles.eyebrow}>{plan.name}</div><h2>{plan.monthlyPriceThb === null ? 'Custom' : `฿${plan.monthlyPriceThb.toLocaleString('th-TH')}`}<small>{plan.monthlyPriceThb === null ? plan.priceRange : '/ เดือน'}</small></h2><div className={styles.pricingRouteQuota}><strong>{plan.aiMessages.toLocaleString('th-TH')}</strong><span>AI Messages / เดือน</span></div><p>{plan.positioning}</p><ul>{plan.marketingFeatures.slice(0, 5).map((feature) => <li key={feature}><Check size={15} /><span>{feature}</span></li>)}</ul><a className={styles.primaryButton} href={planId === 'enterprise' ? href('resources') : `${basePath}register.html?plan=${encodeURIComponent(plan.name)}`}>{planId === 'enterprise' ? 'คุยกับทีมขาย' : `เริ่มต้น ${plan.name}`}<ArrowRight size={15} /></a></article>; })}</div><div className={styles.pricingRouteBoost}><div><span className={styles.eyebrow}>AI BOOST</span><h2>เพิ่ม +{AI_BOOST.messages.toLocaleString('th-TH')} AI Messages</h2><p>฿{AI_BOOST.priceThb} ใช้ได้เฉพาะ Billing Cycle ปัจจุบัน</p></div><Sparkles size={26} /></div></div></section>
        </main>
        <footer className={styles.footer}><div className={styles.contentShell}><div className={styles.footerBottom}>© 2026 CUTINEO · ข้อมูลราคาอ้างอิงจาก billing catalog ปัจจุบัน</div></div></footer>
      </div>
      <CustomerChatWidget apiUrl={import.meta.env.VITE_CHAT_API_URL || '/api/chat-stream'} />
    </PwaProvider>
  );
}
