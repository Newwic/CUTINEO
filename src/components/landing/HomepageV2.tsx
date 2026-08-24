/* eslint-disable @next/next/no-img-element -- this component is shared by Next and Vite */
'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { AI_BOOST, PUBLIC_PLAN_CARDS } from '../../core/billing/catalog';
import { integrations } from '../../config/integrations';
import Header from '../layout/Header';
import { MotionGroup, MotionReveal } from '../motion/ScrollReveal';
import HeroInboxDemo from './HeroInboxDemo';
import IntegrationStrip from './IntegrationStrip';
import ScrollStory from './ScrollStory';
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

const heroMessages = [
  { integration: integrations.find((item) => item.id === 'line'), text: 'สินค้ารุ่นนี้มีของไหมครับ?' },
  { integration: integrations.find((item) => item.id === 'instagram'), text: 'ขอรายละเอียดค่ะ' },
  { integration: integrations.find((item) => item.id === 'gmail'), text: 'Request quotation' },
];

export default function HomepageV2({ basePath = '', signupRoute = 'signup', loginRoute = 'login' }: HomepageV2Props) {
  const prefix = normalizePrefix(basePath);
  const [heroScroll, setHeroScroll] = useState(0);
  const signupHref = (plan = 'Starter') => `${prefix}${signupRoute}?plan=${encodeURIComponent(plan)}`;
  const loginHref = `${prefix}${loginRoute}`;
  const featuresHref = pageHref(basePath, 'features');
  const integrationsHref = pageHref(basePath, 'integrations');
  const aiSalesHref = pageHref(basePath, 'ai-sales');
  const pricingHref = pageHref(basePath, 'pricing');

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setHeroScroll(Math.min(1, Math.max(0, window.scrollY / 560)));
      });
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const heroVisualStyle = {
    '--hero-scroll': heroScroll,
    transform: `translateY(${-heroScroll * 10}px) scale(${1 - heroScroll * 0.015})`,
  } as CSSProperties;
  const heroCopyStyle: CSSProperties = {
    opacity: 1 - heroScroll * 0.16,
    transform: `translateY(${-heroScroll * 6}px)`,
  };

  return (
    <div className={styles.page}>
      <Header basePath={basePath} signupRoute={signupRoute} loginRoute={loginRoute} />

      <main>
        <section className={styles.hero} id="top">
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy} style={heroCopyStyle}>
              <div className={styles.heroBadge}><span /> Omnichannel CRM + AI Sales Assistant</div>
              <h1>ทุกแชท ทุกลูกค้า<br />ทุกโอกาสขาย<br /><span>รวมไว้ในที่เดียว</span></h1>
              <p className={styles.heroLead}>รวม LINE, Facebook, Instagram, Email และช่องทางที่ลูกค้าใช้ไว้ใน Inbox เดียว พร้อม AI ช่วยตอบ จำ ติดตาม และช่วยทีมขายทำงานได้เร็วขึ้น</p>
              <div className={styles.heroActions}>
                <a className={`${styles.primaryButton} ${styles.heroPrimary}`} href={signupHref()} data-cta="hero-start">เริ่มต้นใช้งานฟรี <ArrowRight size={17} /></a>
                <a className={styles.secondaryButton} href={aiSalesHref} data-cta="hero-demo">ดู AI Sales <span className={styles.playCircle}>▶</span></a>
              </div>
              <div className={styles.trustRow}><span>✓ ไม่ต้องใช้บัตรเครดิต</span><span>✓ ติดตั้งง่าย</span><span>✓ ยกเลิกได้ตลอดเวลา</span></div>
            </div>

            <div className={styles.heroVisual} style={heroVisualStyle}>
              <div className={styles.heroGlow} />
              <HeroInboxDemo />
              <div className={styles.heroMessageStream} aria-hidden="true">
                {heroMessages.map(({ integration, text }, index) => integration && (
                  <div className={`${styles.heroMessage} ${styles[`heroMessage${index + 1}`]}`} key={integration.id} style={{ animationDelay: `${index * 1.6}s` }}>
                    <img src={integration.logo} alt="" width="20" height="20" loading="lazy" />
                    <span><strong>{integration.name}</strong>{text}</span>
                  </div>
                ))}
              </div>
              <div className={styles.floatingChannels} aria-hidden="true">
                {integrations.slice(0, 5).map((integration, index) => (
                  <div className={`${styles.floatChannel} ${styles[`floatDelay${index}`]}`} style={{ top: `${30 + index * 82}px` }} key={integration.id}>
                    <img src={integration.logo} alt="" width="25" height="25" loading="lazy" />
                    <span className={styles.floatChannelLabel}>{integration.name}</span>
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
            <MotionReveal className={styles.sectionHeading}>
              <div><div className={styles.sectionKicker}>AI SALES PREVIEW</div><h2>AI ไม่ได้แค่ตอบ <span>แต่ช่วยทีมขายเดินต่อ</span></h2></div>
              <p>ตั้งแต่ตอบคำถาม จนถึงความจำของดีล ใบเสนอราคา และการติดตาม ทุกขั้นตอนอยู่ใน Workflow เดียว</p>
            </MotionReveal>
            <MotionGroup className={styles.previewGrid} delay={80}>
              <article className={styles.previewCard}><div className={styles.previewCardIcon}><Sparkles size={20} /></div><h3>ตอบจากข้อมูลธุรกิจ</h3><p>ใช้ FAQ และข้อมูลสินค้า ช่วยร่างคำตอบให้ทีมตรวจได้เร็วขึ้น</p></article>
              <article className={styles.previewCard}><div className={styles.previewCardIcon}><span>✦</span></div><h3>จำบริบทของดีล</h3><p>เห็นความสนใจของลูกค้า ประวัติการคุย และขั้นตอนถัดไปได้ทันที</p></article>
              <article className={styles.previewCard}><div className={styles.previewCardIcon}><span>↗</span></div><h3>ตามต่อจนปิดการขาย</h3><p>ร่าง Follow-up และ Quotation ให้ทีมตรวจสอบก่อนส่ง</p></article>
            </MotionGroup>
            <a className={styles.textLink} href={aiSalesHref}>ดู AI Sales ทั้งหมด <ArrowRight size={15} /></a>
          </div>
        </section>

        <ScrollStory signupHref={signupHref()} detailsHref={aiSalesHref} />

        <section className={styles.pricingSection} id="pricing-preview">
          <div className={styles.sectionShell}>
            <MotionReveal className={styles.sectionHeading}>
              <div><div className={styles.sectionKicker}>SIMPLE PRICING</div><h2>เริ่มเล็กได้ <span>โตต่อได้</span></h2></div>
              <p>เลือกแพ็กเกจตามขนาดทีมและปริมาณ AI Messages แล้วขยายได้เมื่อธุรกิจโตขึ้น</p>
            </MotionReveal>
            <MotionGroup className={styles.pricingGrid} delay={80}>
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
            </MotionGroup>
            <div className={styles.boostCard}><div><div className={styles.sectionKicker}>AI BOOST</div><h3>เพิ่ม +{AI_BOOST.messages.toLocaleString('th-TH')} AI Messages</h3><p>฿{AI_BOOST.priceThb} ใช้ได้เฉพาะ Billing Cycle ปัจจุบัน</p></div><strong>฿{AI_BOOST.priceThb}</strong><a className={styles.secondaryButton} href={pricingHref}>ดูราคาและรายละเอียดทั้งหมด</a></div>
            <div className={styles.previewLinkRow}><a className={styles.textLink} href={pricingHref}>ดูราคาและรายละเอียดทั้งหมด <ArrowRight size={15} /></a></div>
          </div>
        </section>

        <section className={styles.finalCta}>
          <div className={styles.sectionShell}>
            <div className={styles.finalCtaInner}>
            <div><div className={styles.sectionKicker}>READY WHEN YOU ARE</div><h2>พร้อมจัดการทุกแชท<br />จากที่เดียวหรือยัง?</h2><p>เริ่มใช้ CUTINEO และให้ AI ช่วยทีมตอบ จำ ติดตาม และขายได้เร็วขึ้น</p><div className={styles.finalActions}><a className={`${styles.primaryButton} ${styles.lightButton}`} href={signupHref()} data-cta="final-start">เริ่มต้นใช้งานฟรี <ArrowRight size={16} /></a><a className={styles.finalLogin} href={loginHref} data-cta="nav-login">มีบัญชีอยู่แล้ว? เข้าสู่ระบบ</a></div></div>
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
