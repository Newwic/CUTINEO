/* eslint-disable @next/next/no-img-element -- this component is shared by Next and Vite */
'use client';

import { useState } from 'react';
import { ArrowRight, BarChart3, Bot, Check, ChevronDown, Clock3, FileText, LockKeyhole, MessageCircle, Network, PanelTop, Quote, ShieldCheck, Sparkles, Users, Workflow } from 'lucide-react';
import { AI_BOOST, PUBLIC_PLAN_CARDS } from '../../core/billing/catalog';
import CutineoSiteHeader, { type CutineoNavItem } from '../CutineoSiteHeader';
import { NEO_LOGO_PATH } from '../../lib/branding';
import { integrations } from '../../config/integrations';
import HeroInboxDemo from './HeroInboxDemo';
import IntegrationStrip from './IntegrationStrip';
import PwaInstallSection from '../pwa/PwaInstallSection';
import styles from './HomepageV2.module.css';

export interface HomepageV2Props {
  basePath?: string;
  signupRoute?: string;
  loginRoute?: string;
}

const features = [
  { number: '01', icon: PanelTop, title: 'รวมทุกข้อความไว้ใน Inbox เดียว', description: 'ไม่ต้องสลับหลายแอป ทุกช่องทางอยู่ใน Workspace เดียว พร้อมจัดลำดับแชทที่ต้องตอบได้ทันที.' },
  { number: '02', icon: Bot, title: 'AI ช่วยตอบลูกค้าอัตโนมัติ', description: 'ใช้ข้อมูลสินค้า FAQ และ Knowledge Base ของธุรกิจช่วยตอบลูกค้าอย่างสม่ำเสมอ.' },
  { number: '03', icon: Sparkles, title: 'AI จำลูกค้าและประวัติการคุย', description: 'รู้ว่าลูกค้าเคยถามอะไร สนใจสินค้าไหน และดีลอยู่ขั้นตอนไหน.' },
  { number: '04', icon: Workflow, title: 'ติดตามอัตโนมัติ ไม่พลาดทุกดีล', description: 'เมื่อส่งราคาแล้วลูกค้าเงียบ ระบบช่วยเตือนและร่างข้อความ Follow-up ให้ทีม.' },
];

const faqs = [
  { question: 'AI Message นับอย่างไร?', answer: 'AI Message คือข้อความตอบกลับที่สร้างโดย AI ส่วนข้อความจากลูกค้าไม่นับเป็น AI Message โควตาจะเริ่มใหม่ตาม Billing Cycle ของบริษัท.' },
  { question: 'เริ่มจากแพ็กเกจไหนดี?', answer: 'Starter เหมาะกับร้านเล็กที่ต้องการรวมแชทและทดลอง AI ช่วยตอบ หากต้องการให้ AI จำลูกค้า ติดตาม และช่วยขาย แนะนำ Pro.' },
  { question: 'AI Boost ใช้ได้นานแค่ไหน?', answer: `AI Boost ราคา ฿${AI_BOOST.priceThb.toLocaleString('th-TH')} เพิ่ม ${AI_BOOST.messages.toLocaleString('th-TH')} AI Messages ให้รอบบิลปัจจุบันเท่านั้น และไม่ติดไป Billing Cycle ใหม่.` },
  { question: 'ข้อมูลลูกค้าปลอดภัยหรือไม่?', answer: 'CUTINEO ออกแบบแบบ multi-tenant มีการแยก company_id, RBAC, audit log และเก็บ API credential ฝั่ง server ไม่ส่งให้ browser.' },
];

const funnelSteps = [
  { label: 'Customer Message', icon: MessageCircle },
  { label: 'AI Extract Product', icon: Bot },
  { label: 'Quotation Draft', icon: FileText },
  { label: 'Human Approve', icon: Users },
  { label: 'Send', icon: ArrowRight },
  { label: 'Follow-up', icon: Clock3 },
  { label: 'Won', icon: Check },
];

function baseUrl(basePath: string) {
  if (!basePath || basePath === '/') return '/';
  return basePath.endsWith('/') ? basePath : `${basePath}/`;
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return <span className={styles.statusPill}>{children}</span>;
}

export default function HomepageV2({ basePath = '', signupRoute = 'register', loginRoute = 'login' }: HomepageV2Props) {
  const [openFaq, setOpenFaq] = useState(0);
  const [followUpVisible, setFollowUpVisible] = useState(false);
  const prefix = baseUrl(basePath);
  const signupHref = (plan = 'Starter') => `${prefix}${signupRoute}?plan=${encodeURIComponent(plan)}`;
  const loginHref = `${prefix}${loginRoute}`;

  const navItems: CutineoNavItem[] = [
    { key: 'features', label: 'ฟีเจอร์', href: '#features' },
    { key: 'integrations', label: 'การเชื่อมต่อ', href: '#integrations' },
    { key: 'sales', label: 'AI Sales', href: '#ai-sales' },
    { key: 'pricing', label: 'ราคา', href: '#pricing' },
    { key: 'resources', label: 'ทรัพยากร', href: '#resources' },
  ];

  return (
    <div className={styles.page}>
      <CutineoSiteHeader
        navItems={navItems}
        logoHref="#top"
        loginHref={loginHref}
        startHref={signupHref()}
        startLabel="เริ่มต้นใช้งานฟรี"
        ariaLabel="เมนูหลัก"
      />

      <main>
        <section className={styles.hero} id="top">
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <div className={styles.heroBadge}><span /> Omnichannel CRM + AI Sales Assistant</div>
              <h1>ทุกแชท ทุกลูกค้า<br />ทุกโอกาสขาย<br /><span>รวมไว้ในที่เดียว</span></h1>
              <p className={styles.heroLead}>เชื่อมต่อทุกช่องทางที่ลูกค้าใช้ รวมข้อความไว้ใน Inbox เดียว พร้อม AI ช่วยตอบ จำ ติดตาม และช่วยทีมขายปิดการขายได้เร็วขึ้น</p>
              <div className={styles.heroActions}>
                <a className={`${styles.primaryButton} ${styles.heroPrimary}`} href={signupHref()} data-cta="hero-start">เริ่มต้นใช้งานฟรี 14 วัน <ArrowRight size={17} /></a>
                <a className={styles.secondaryButton} href="#how-it-works" data-cta="hero-demo">ดูวิธีการทำงาน <span className={styles.playCircle}>▶</span></a>
              </div>
              <div className={styles.trustRow}><span>✓ ไม่ต้องใช้บัตรเครดิต</span><span>✓ ติดตั้งง่ายใน 5 นาที</span><span>✓ ยกเลิกได้ตลอดเวลา</span></div>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.heroGlow} />
              <HeroInboxDemo />
              <div className={styles.floatingChannels} aria-hidden="true">
                {integrations.slice(0, 5).map((integration, index) => (
                  <div className={`${styles.floatChannel} ${styles[`floatDelay${index}`]}`} style={{ top: `${30 + index * 82}px` }} key={integration.id}>
                    <img src={integration.logo} alt="" width="30" height="30" onError={(event) => { event.currentTarget.hidden = true; }} />
                    <small>{integration.name}</small>
                  </div>
                ))}
                {integrations.slice(5, 10).map((integration, index) => (
                  <div className={`${styles.floatChannel} ${styles[`floatDelay${index + 2}`]}`} style={{ top: `${30 + index * 82}px` }} key={integration.id}>
                    <img src={integration.logo} alt="" width="30" height="30" onError={(event) => { event.currentTarget.hidden = true; }} />
                    <small>{integration.name}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <IntegrationStrip />

        <PwaInstallSection />

        <section className={styles.statsSection} aria-label="จุดเด่น CUTINEO">
          <div className={styles.sectionShell}><div className={styles.statsGrid}><div><strong>1</strong><span>Unified Inbox</span></div><div><strong>24/7</strong><span>AI ช่วยตอบ</span></div><div><strong>3×</strong><span>ตอบไวขึ้น</span></div><div><strong>100%</strong><span>ข้อมูลเป็นของคุณ</span></div></div></div>
        </section>

        <section className={styles.section} id="features" aria-labelledby="features-title">
          <div className={styles.sectionShell}>
            <div className={styles.sectionHeading}><div className={styles.sectionKicker}>ONE WORKSPACE, MORE SALES</div><h2 id="features-title">ทีมขายทำงานจากบทสนทนาเดียว<br /><span>ไม่ใช่การสลับแอป</span></h2><p>ตั้งแต่ข้อความแรกไปจนถึงใบเสนอราคา CUTINEO ช่วยให้ทีมเห็นบริบทเดียวกันและเดินงานต่อได้ทันที</p></div>
            <div className={styles.featureGrid}>
              {features.map((feature) => { const Icon = feature.icon; return <article className={styles.featureCard} key={feature.number}><span className={styles.featureNumber}>{feature.number}</span><div className={styles.featureIcon}><Icon size={21} /></div><h3>{feature.title}</h3><p>{feature.description}</p></article>; })}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.softSection}`} id="ai-sales" aria-labelledby="ai-reply-title">
          <div className={styles.sectionShell}>
            <div className={styles.splitSection}>
              <div className={styles.splitCopy}><div className={styles.sectionKicker}>01 · AI AUTO REPLY</div><h2 id="ai-reply-title">AI ช่วยตอบลูกค้า<br /><span>จากข้อมูลธุรกิจของคุณ</span></h2><p>ให้ AI อ่าน FAQ, Product Knowledge และนโยบายร้าน ก่อนร่างคำตอบที่ทีมตรวจสอบและส่งต่อได้ในไม่กี่วินาที</p><ul className={styles.checkList}><li><Check size={16} />ตอบคำถามซ้ำได้สม่ำเสมอ</li><li><Check size={16} />เปลี่ยนโทนเสียงให้เข้ากับแบรนด์</li><li><Check size={16} />ส่งต่อให้คนเมื่อเรื่องซับซ้อน</li></ul></div>
              <div className={`${styles.aiReplyCard} ${styles.demoCard}`}><div className={styles.demoCardHead}><span className={styles.demoPerson}>ลูกค้า</span><span>LINE · 10:24</span></div><div className={styles.customerBubble}>รุ่น A มีของอยู่ไหมครับ?</div><div className={styles.aiBubble}><span className={styles.aiBubbleLabel}><img src={NEO_LOGO_PATH} alt="Neo" width="22" height="22" /> NEO แนะนำคำตอบ</span><strong>รุ่น A พร้อมส่งครับ มี 2 แพ็กเกจให้เลือก</strong><small>อ้างอิงจาก Product Knowledge · ตรวจสอบก่อนส่ง</small></div><div className={styles.demoInput}>พิมพ์ข้อความตอบกลับ... <ArrowRight size={15} /></div></div>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="memory-title">
          <div className={styles.sectionShell}>
            <div className={`${styles.splitSection} ${styles.splitReverse}`}>
              <div className={`${styles.memoryCard} ${styles.demoCard}`}><div className={styles.memoryHeader}><div className={styles.customerPhoto}>ส</div><div><strong>สมชาย มีเดช</strong><small><span className={styles.onlineDot} /> LINE + Gmail</small></div><StatusPill>AI จำได้</StatusPill></div><div className={styles.memoryRows}><div><span>First seen</span><strong>12/05/2026</strong></div><div><span>Important history</span><strong>สนใจสินค้า A และ B<br />ขอใบเสนอราคา 2 ครั้ง<br />ล่าสุดคุย 7 วันก่อน</strong></div><div><span>Quotation</span><strong>QT-000128</strong></div><div><span>Deal status</span><strong className={styles.warningText}>Waiting Follow-up</strong></div></div><div className={styles.memoryInsight}><Sparkles size={16} /><span><strong>AI จำได้</strong> ลูกค้ารายนี้กำลังรอการติดตาม</span></div></div>
              <div className={styles.splitCopy}><div className={styles.sectionKicker}>02 · AI SALES MEMORY</div><h2 id="memory-title">ไม่ต้องจำเองทุกบทสนทนา<br /><span>ให้ AI จำแทนทีม</span></h2><p>เก็บบริบทการคุย ความสนใจ ใบเสนอราคา และสถานะดีลไว้ใน customer memory เพื่อให้ทุกคนในทีมตอบต่อได้ทันที</p><a className={styles.textLink} href="#pricing">ดูแพ็กเกจที่มี Sales Memory <ArrowRight size={16} /></a></div>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.softSection}`} aria-labelledby="followup-title">
          <div className={styles.sectionShell}>
            <div className={styles.splitSection}>
              <div className={styles.splitCopy}><div className={styles.sectionKicker}>03 · AI FOLLOW-UP</div><h2 id="followup-title">ส่งราคาแล้วไม่เงียบหาย<br /><span>ติดตามต่อให้เป็นระบบ</span></h2><p>ตั้งแต่ส่งใบเสนอราคา จนถึงวันที่ลูกค้าตัดสินใจ ทีมเห็น next step เดียวกัน และให้ AI ช่วยร่างข้อความติดตามได้</p><button className={styles.primaryButton} type="button" onClick={() => setFollowUpVisible(true)}>สร้างข้อความติดตามด้วย AI <Sparkles size={16} /></button>{followUpVisible && <p className={styles.inlineDemoMessage}>“สวัสดีครับ ขออนุญาตติดตามใบเสนอราคาที่ส่งให้ก่อนหน้านี้ หากต้องการข้อมูลเพิ่มเติมแจ้งได้เลยครับ”</p>}</div>
              <div className={`${styles.followUpCard} ${styles.demoCard}`}><div className={styles.timeline}><div><span className={styles.timelineDotDone}>✓</span><strong>Day 1</strong><small>Quotation Sent</small></div><div><span className={styles.timelineDotDone}>✓</span><strong>Day 2</strong><small>No Response</small></div><div className={styles.timelineCurrent}><span className={styles.timelineDot}>!</span><strong>Day 3</strong><small>CUTINEO แจ้งเตือน</small></div></div><div className={styles.followUpAlert}><Clock3 size={18} /><div><strong>ลูกค้ารายนี้ยังไม่ได้ตอบกลับ</strong><span>ระบบแนะนำให้ติดตามภายในวันนี้</span></div></div></div>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="quotation-title">
          <div className={styles.sectionShell}><div className={styles.sectionHeading}><div className={styles.sectionKicker}>04 · QUOTATION FLOW</div><h2 id="quotation-title">จากแชท → ใบเสนอราคา → ปิดการขาย<br /><span>ในระบบเดียว</span></h2><p>ให้ AI ช่วยดึงข้อมูลสินค้า แต่คนยังเป็นผู้อนุมัติก่อนส่งทุกครั้ง</p></div><div className={styles.funnel}>{funnelSteps.map((step, index) => { const Icon = step.icon; return <div className={styles.funnelStep} key={step.label}><span><Icon size={18} /></span><strong>{step.label}</strong>{index < funnelSteps.length - 1 && <ArrowRight className={styles.funnelArrow} size={16} />}</div>; })}</div></div>
        </section>

        <section className={`${styles.section} ${styles.softSection}`} aria-labelledby="before-after-title">
          <div className={styles.sectionShell}><div className={styles.sectionHeading}><div className={styles.sectionKicker}>LESS SWITCHING, MORE CLOSING</div><h2 id="before-after-title">เปลี่ยนวิธีทำงานของทีม<br /><span>จากวุ่นวายเป็นเห็นภาพเดียวกัน</span></h2></div><div className={styles.beforeAfter}><div className={styles.beforeCard}><span className={styles.beforeLabel}>ก่อนใช้ CUTINEO</span><h3>หลายแอป หลายบริบท</h3><ul><li>เปิด LINE, Facebook, Email สลับไปมา</li><li>ข้อมูลลูกค้ากระจายอยู่หลายที่</li><li>ส่งราคาแล้วลืมติดตาม</li></ul></div><div className={styles.afterCard}><span className={styles.afterLabel}>เมื่อใช้ CUTINEO</span><h3>หนึ่ง Workspace หนึ่งโอกาสขาย</h3><ul><li>ทุกแชทอยู่ใน Unified Inbox</li><li>ทีมเห็น Customer Memory เดียวกัน</li><li>AI ช่วยตอบ จำ ตาม และขาย</li></ul></div></div></div>
        </section>

        <section className={styles.section} aria-labelledby="team-title">
          <div className={styles.sectionShell}><div className={styles.splitSection}><div className={styles.teamCard}><div className={styles.teamTop}><span>ทีมขาย CUTINEO</span><StatusPill>5 สมาชิกออนไลน์</StatusPill></div><div className={styles.teamAvatars}><span>น</span><span>พ</span><span>อ</span><span>ม</span><span>+</span></div><div className={styles.assignmentRow}><div className={styles.miniAvatar}>ส</div><div><strong>สมชาย มีเดช</strong><small>มอบหมายให้ นิว · กำลังติดตาม</small></div><span className={styles.teamTag}>PRO</span></div><div className={styles.assignmentRow}><div className={styles.miniAvatarBlue}>A</div><div><strong>ABC Company</strong><small>มอบหมายให้ แอดมิน · รอใบเสนอราคา</small></div><span className={styles.teamTag}>NEW</span></div></div><div className={styles.splitCopy}><div className={styles.sectionKicker}>TEAM COLLABORATION</div><h2 id="team-title">ทีมทำงานต่อกันได้<br /><span>โดยไม่หลุดบริบท</span></h2><p>มอบหมายแชท ใส่ internal note กำหนดสถานะ และรู้ว่าใครกำลังรับผิดชอบทุกดีล โดยไม่ต้องถามซ้ำในแชทกลุ่ม</p><ul className={styles.checkList}><li><Check size={16} />Role และ permission ตามบริษัท</li><li><Check size={16} />สถานะแชทชัดเจนทุกขั้น</li><li><Check size={16} />Audit log พร้อมตรวจสอบ</li></ul></div></div></div>
        </section>

        <section className={`${styles.section} ${styles.softSection}`} aria-labelledby="analytics-title">
          <div className={styles.sectionShell}><div className={styles.splitSection}><div className={styles.splitCopy}><div className={styles.sectionKicker}>ANALYTICS THAT MOVE SALES</div><h2 id="analytics-title">รู้ว่าช่องทางไหน<br /><span>กำลังสร้างยอดขาย</span></h2><p>ดูจำนวนข้อความ เวลาตอบ สถานะดีล และต้นทุน AI เพื่อช่วยตัดสินใจจากข้อมูลจริง</p></div><div className={`${styles.analyticsCard} ${styles.demoCard}`}><div className={styles.analyticsHead}><span>Conversation overview</span><strong>May 2026⌄</strong></div><div className={styles.analyticsNumbers}><div><strong>2,486</strong><span>ข้อความทั้งหมด</span></div><div><strong>18m</strong><span>เวลาตอบเฉลี่ย</span></div><div><strong>34%</strong><span>ปิดการขาย</span></div></div><div className={styles.chart}><span style={{ height: '42%' }} /><span style={{ height: '62%' }} /><span style={{ height: '54%' }} /><span style={{ height: '78%' }} /><span style={{ height: '68%' }} /><span style={{ height: '91%' }} /><span style={{ height: '82%' }} /></div><div className={styles.chartLegend}><span><i className={styles.legendTeal} />LINE</span><span><i className={styles.legendViolet} />Facebook</span><span><i className={styles.legendAmber} />Email</span></div></div></div></div>
        </section>

        <section className={styles.securitySection} aria-labelledby="security-title">
          <div className={styles.sectionShell}><div className={styles.securityInner}><div><div className={styles.sectionKicker}>BUILT FOR TRUST</div><h2 id="security-title">ข้อมูลของแต่ละบริษัท<br /><span>แยกออกจากกันอย่างชัดเจน</span></h2><p>รองรับการเติบโตจาก 1 บริษัทไปสู่ 1,000+ บริษัท ด้วย tenant isolation, RBAC, server-side secrets และ audit-ready architecture</p></div><div className={styles.securityGrid}><div><ShieldCheck size={19} /><strong>Tenant isolation</strong><span>ตรวจ company_id ทุก request</span></div><div><LockKeyhole size={19} /><strong>Server-side secrets</strong><span>API key ไม่ส่งไป Frontend</span></div><div><Network size={19} /><strong>AI Router</strong><span>เปลี่ยน provider ได้ในอนาคต</span></div><div><BarChart3 size={19} /><strong>Usage visibility</strong><span>เห็น token และ cost ต่อบริษัท</span></div></div></div></div>
        </section>

        <section className={styles.pricingSection} id="pricing" aria-labelledby="pricing-title">
          <div className={styles.sectionShell}><div className={styles.sectionHeading}><div className={styles.sectionKicker}>SIMPLE, FAIR PRICING</div><h2 id="pricing-title">แพ็กเกจที่โตไปพร้อมกับธุรกิจคุณ</h2><p>เริ่มจาก “AI ช่วยตอบ” แล้วขยับไปสู่ “AI Sales Automation” เมื่อทีมและยอดขายเติบโต</p></div><div className={styles.pricingGrid}>{PUBLIC_PLAN_CARDS.map((plan) => <article className={`${styles.planCard} ${plan.featured ? styles.planFeatured : ''}`} key={plan.name}>{plan.featured && <div className={styles.popularBadge}>แนะนำ · MOST POPULAR</div>}<div className={styles.planTop}><span>{plan.name}</span>{plan.featured && <Sparkles size={17} />}</div><h3>{plan.monthly === null ? plan.priceLabel : <>฿{plan.monthly.toLocaleString('th-TH')}<small>/ เดือน</small></>}</h3><div className={styles.aiQuota}><strong>{plan.aiMessages.toLocaleString('th-TH')}</strong><span>AI Messages / เดือน</span></div><p className={styles.planPositioning}>{plan.description}</p><p className={styles.planUsers}>{plan.users}</p><ul>{plan.features.map((feature) => <li key={feature}><Check size={15} />{feature}</li>)}</ul><a className={plan.featured ? styles.primaryButton : styles.planButton} href={plan.name === 'Enterprise' ? '#contact' : signupHref(plan.name)} data-cta={plan.name === 'Pro' ? 'pricing-pro' : undefined}>{plan.name === 'Enterprise' ? 'คุยกับทีมขาย' : `เริ่มต้น ${plan.name}`} <ArrowRight size={15} /></a></article>)}</div><div className={styles.boostCard}><div><div className={styles.sectionKicker}>AI BOOST ADD-ON</div><h3>เพิ่มโควตาเฉพาะรอบบิลนี้</h3><p>+{AI_BOOST.messages.toLocaleString('th-TH')} AI Messages · ใช้ได้กับ Starter, Pro และ Advanced · ไม่ติดไปเดือนใหม่</p></div><strong>฿{AI_BOOST.priceThb.toLocaleString('th-TH')}</strong><a href={signupHref('Pro')} className={styles.secondaryButton}>ซื้อ AI Boost <ArrowRight size={15} /></a></div><p className={styles.pricingNote}>AI Message คือข้อความตอบกลับที่สร้างโดย AI ข้อความจากลูกค้าไม่นับเป็น AI Message</p></div>
        </section>

        <section className={styles.faqSection} id="resources" aria-labelledby="faq-title"><div className={styles.sectionShell}><div className={styles.sectionHeading}><div className={styles.sectionKicker}>FAQ · RESOURCES</div><h2 id="faq-title">คำถามที่ทีมมักถามก่อนเริ่มใช้</h2><p>ข้อมูลสั้น ๆ เพื่อช่วยเลือกแพ็กเกจและวางระบบให้เหมาะกับธุรกิจ</p></div><div className={styles.faqList}>{faqs.map((faq, index) => <div className={`${styles.faqItem} ${openFaq === index ? styles.faqOpen : ''}`} key={faq.question}><button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}><span>{faq.question}</span><ChevronDown size={18} /></button>{openFaq === index && <p>{faq.answer}</p>}</div>)}</div></div></section>

        <section className={styles.finalCta} id="contact"><div className={styles.sectionShell}><div className={styles.finalCtaInner}><div><div className={styles.sectionKicker}>READY TO SELL WITH CONTEXT?</div><h2>ไม่ต้องเปิดหลายแอปแล้ว</h2><p>เริ่มจาก 14 วันแบบไม่ต้องใช้บัตรเครดิต แล้วให้ CUTINEO ช่วยทีมตอบ จำ ติดตาม และปิดการขาย</p><div className={styles.finalActions}><a className={styles.lightButton} href={signupHref()} data-cta="final-start">เริ่มต้นใช้งานฟรี 14 วัน <ArrowRight size={17} /></a><a className={styles.finalLogin} href={loginHref}>เข้าสู่ระบบ</a></div></div><div className={styles.finalVisual}><div className={styles.finalOrb}><img src={NEO_LOGO_PATH} alt="Neo" width="92" height="92" /></div><span>AI-first · Omnichannel · Built for teams</span></div></div></div></section>
      </main>

      <footer className={styles.footer}><div className={styles.sectionShell}><div className={styles.footerGrid}><div><a className={styles.footerBrand} href="#top"><img src={NEO_LOGO_PATH} alt="CUTINEO" width="34" height="34" /><strong>CUTI<span>NEO</span></strong></a><p>รวมทุกแชทให้ทีมขายทำงานได้ง่ายขึ้น</p></div><div><strong>ผลิตภัณฑ์</strong><a href="#features">ฟีเจอร์</a><a href="#integrations">การเชื่อมต่อ</a><a href="#pricing">ราคา</a></div><div><strong>ความปลอดภัย</strong><a href="#ai-sales">AI Sales</a><a href="#resources">คำถามที่พบบ่อย</a><a href={loginHref}>เข้าสู่ระบบ</a></div><div><strong>เริ่มต้น</strong><a href={signupHref()} data-cta="footer-start">เริ่มต้นใช้งานฟรี</a><a href="#contact">คุยกับทีมขาย</a></div></div><div className={styles.footerBottom}><span>© 2026 CUTINEO. All rights reserved.</span><span>Demo บนหน้านี้ใช้ข้อมูล mock เท่านั้น ไม่เรียก AI/API จริง</span></div></div></footer>
    </div>
  );
}
