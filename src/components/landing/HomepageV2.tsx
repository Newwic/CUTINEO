/* eslint-disable @next/next/no-img-element -- this component is shared by Next and Vite */
'use client';

import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { AI_BOOST, PUBLIC_PLAN_CARDS } from '../../core/billing/catalog';
import { integrations } from '../../config/integrations';
import Header from '../layout/Header';
import HeroInboxDemo from './HeroInboxDemo';
import IntegrationStrip from './IntegrationStrip';
import ScrollStoryPreview from './ScrollStoryPreview';
import styles from './HomepageV2.module.css';

export interface HomepageV2Props {
  basePath?: string;
  signupRoute?: string;
  loginRoute?: string;
}

function normalizePrefix(basePath = '') {
  if (!basePath || basePath === '/') return '/';
  return basePath.endsWith('/') ? basePath : `${basePath}/`;
}

function pageHref(basePath: string, page: string) {
  const prefix = normalizePrefix(basePath);
  return `${prefix}${page}${prefix === '/' ? '' : '/'}`;
}

export default function HomepageV2({ basePath = '', signupRoute = 'signup', loginRoute = 'login' }: HomepageV2Props) {
  const prefix = normalizePrefix(basePath);
  const signupHref = (plan = 'Starter') => `${prefix}${signupRoute}?plan=${encodeURIComponent(plan)}`;
  const loginHref = `${prefix}${loginRoute}`;
  const featuresHref = pageHref(basePath, 'features');
  const integrationsHref = pageHref(basePath, 'integrations');
  const aiSalesHref = pageHref(basePath, 'ai-sales');
  const pricingHref = pageHref(basePath, 'pricing');

  return (
    <div className={styles.page}>
      <Header basePath={basePath} signupRoute={signupRoute} loginRoute={loginRoute} />

      <main>
        <section className={styles.hero} id="top">
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <div className={styles.heroBadge}><span /> Omnichannel CRM + AI Sales Assistant</div>
              <h1>ทุกแชท ทุกลูกค้า<br />ทุกโอกาสขาย<br /><span>รวมไว้ในที่เดียว</span></h1>
              <p className={styles.heroLead}>เชื่อมต่อทุกช่องทางที่ลูกค้าใช้ รวมข้อความไว้ใน Inbox เดียว พร้อม AI ช่วยตอบ จำ ติดตาม และช่วยทีมขายปิดการขายได้เร็วขึ้น</p>
              <div className={styles.heroActions}>
                <a className={`${styles.primaryButton} ${styles.heroPrimary}`} href={signupHref()} data-cta="hero-start">เริ่มต้นใช้งานฟรี <ArrowRight size={17} /></a>
                <a className={styles.secondaryButton} href={aiSalesHref} data-cta="hero-demo">ดู AI Sales <span className={styles.playCircle}>▶</span></a>
              </div>
              <div className={styles.trustRow}><span>✓ ไม่ต้องใช้บัตรเครดิต</span><span>✓ เริ่มต้นง่าย</span><span>✓ ยกเลิกได้ทุกเวลา</span></div>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.heroGlow} />
              <HeroInboxDemo />
              <div className={styles.floatingChannels} aria-hidden="true">
                {integrations.slice(0, 5).map((integration, index) => (
                  <div className={`${styles.floatChannel} ${styles[`floatDelay${index}`]}`} style={{ top: `${30 + index * 82}px` }} key={integration.id}>
                    <img src={integration.logo} alt="" width="25" height="25" loading="lazy" />
                    <span>{integration.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className={styles.integrationPreview}>
          <IntegrationStrip compact />
          <div className={styles.previewLinkRow}><a className={styles.textLink} href={integrationsHref}>ดูการเชื่อมต่อทั้งหมด <ArrowRight size={15} /></a></div>
        </div>

        <section className={styles.previewSection} id="ai-sales-preview">
          <div className={styles.sectionShell}>
            <div className={styles.sectionHeading}>
              <div><div className={styles.sectionKicker}>AI SALES PREVIEW</div><h2>AI ไม่ได้แค่ตอบ <span>แต่ช่วยทีมขายเดินต่อ</span></h2></div>
              <p>จากคำถามแรกของลูกค้า ไปจนถึงความทรงจำของดีล ใบเสนอราคา และการติดตาม ทุกขั้นตอนอยู่ใน Workflow เดียว</p>
            </div>
            <div className={styles.previewGrid}>
              <article className={styles.previewCard}><div className={styles.previewCardIcon}><Sparkles size={20} /></div><h3>ตอบจากข้อมูลธุรกิจ</h3><p>ใช้ FAQ, Product Knowledge และโทนเสียงของแบรนด์ช่วยร่างคำตอบให้ทีมตรวจได้เร็ว</p></article>
              <article className={styles.previewCard}><div className={styles.previewCardIcon}><span>✦</span></div><h3>จำบริบทและสถานะดีล</h3><p>เห็นว่าลูกค้าเคยสนใจอะไร ขอราคาแล้วหรือยัง และควรทำ Next step อะไร</p></article>
              <article className={styles.previewCard}><div className={styles.previewCardIcon}><span>↗</span></div><h3>ตามต่อจนปิดการขาย</h3><p>สร้างข้อความ Follow-up และ Quotation Draft ให้ทีมขายอนุมัติก่อนส่ง</p></article>
            </div>
            <a className={styles.textLink} href={aiSalesHref}>ดู AI Sales ทั้งหมด <ArrowRight size={15} /></a>
          </div>
        </section>

        <ScrollStoryPreview detailsHref={aiSalesHref} />

        <section className={styles.pricingSection} id="pricing-preview">
          <div className={styles.sectionShell}>
            <div className={styles.sectionHeading}>
              <div><div className={styles.sectionKicker}>SIMPLE PRICING</div><h2>เริ่มเล็กได้ <span>โตต่อได้</span></h2></div>
              <p>เลือกแพ็กเกจตามขนาดทีมและปริมาณ AI Messages แล้วเพิ่ม AI Boost ได้เมื่อใช้งานมากขึ้น</p>
            </div>
            <div className={styles.pricingGrid}>
              {PUBLIC_PLAN_CARDS.slice(0, 3).map((plan) => (
                <article className={`${styles.planCard} ${plan.featured ? styles.planFeatured : ''}`} key={plan.name}>
                  {plan.featured && <span className={styles.popularBadge}>แนะนำ · MOST POPULAR</span>}
                  <div className={styles.planTop}><span>{plan.name}</span>{plan.featured && <Sparkles size={14} />}</div>
                  <h3>{plan.monthly === null ? plan.priceLabel : `฿${plan.monthly.toLocaleString('th-TH')}`}<small>/ เดือน</small></h3>
                  <div className={styles.aiQuota}><strong>{plan.aiMessages.toLocaleString('th-TH')}</strong><span>AI Messages / เดือน</span></div>
                  <p className={styles.planPositioning}>{plan.description}</p>
                  <ul>{plan.features.slice(0, 3).map((feature) => <li key={feature}><Check size={14} /><span>{feature}</span></li>)}</ul>
                  <a className={styles.primaryButton} href={signupHref(plan.name)} data-cta={plan.name === 'Pro' ? 'pricing-pro' : `pricing-${plan.name.toLowerCase()}`}>เริ่มต้น {plan.name} <ArrowRight size={15} /></a>
                </article>
              ))}
            </div>
            <div className={styles.boostCard}><div><div className={styles.sectionKicker}>AI BOOST</div><h3>เพิ่ม +{AI_BOOST.messages.toLocaleString('th-TH')} AI Messages</h3><p>฿{AI_BOOST.priceThb} ใช้ได้เฉพาะ Billing Cycle ปัจจุบัน</p></div><strong>฿{AI_BOOST.priceThb}</strong><a className={styles.secondaryButton} href={pricingHref}>ดูราคาและรายละเอียดทั้งหมด</a></div>
            <div className={styles.previewLinkRow}><a className={styles.textLink} href={pricingHref}>ดูราคาและรายละเอียดทั้งหมด <ArrowRight size={15} /></a></div>
          </div>
        </section>

        <section className={styles.finalCta}>
          <div className={styles.sectionShell}>
            <div className={styles.finalCtaInner}>
              <div><div className={styles.sectionKicker}>READY WHEN YOU ARE</div><h2>ไม่ต้องเปิดหลายแอปอีกต่อไป</h2><p>รวมทุกแชท ทุกดีล และ AI Sales Workflow ไว้ในระบบเดียว</p><div className={styles.finalActions}><a className={`${styles.primaryButton} ${styles.lightButton}`} href={signupHref()} data-cta="final-start">เริ่มต้นใช้งานฟรี <ArrowRight size={16} /></a><a className={styles.finalLogin} href={loginHref} data-cta="nav-login">มีบัญชีอยู่แล้ว? เข้าสู่ระบบ</a></div></div>
              <div className={styles.finalVisual}><div className={styles.finalOrb}><span>N</span></div><span>Unified Inbox · AI Sales</span></div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.sectionShell}>
          <div className={styles.footerGrid}>
            <div><div className={styles.footerBrand}><span className={styles.footerBrandMark}>N</span><strong>CUTI<span>NEO</span></strong></div><p>รวมทุกแชท พร้อม AI ช่วยทีมขายตอบ จำ ติดตาม และปิดการขาย</p></div>
            <div><strong>ผลิตภัณฑ์</strong><a href={featuresHref}>ฟีเจอร์</a><a href={integrationsHref}>การเชื่อมต่อ</a><a href={aiSalesHref}>AI Sales</a></div>
            <div><strong>ช่วยเหลือ</strong><a href={pricingHref}>ราคา</a><a href={pageHref(basePath, 'resources')}>ทรัพยากร</a><a href={loginHref}>เข้าสู่ระบบ</a></div>
          </div>
          <div className={styles.footerBottom}>© 2026 CUTINEO · ข้อมูล Demo ใช้ Mock Data และไม่เรียก AI/API จริง</div>
        </div>
      </footer>
    </div>
  );
}
