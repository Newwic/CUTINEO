/* eslint-disable @next/next/no-img-element -- shared with the Vite marketing pages. */
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  BookOpen,
  Check,
  Clock3,
  FileText,
  HelpCircle,
  Inbox,
  LockKeyhole,
  MessageCircle,
  Network,
  PackageCheck,
  Puzzle,
  Rocket,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
} from 'lucide-react';
import { integrations, integrationCategories, type Integration, type IntegrationStatus } from '../../config/integrations';
import Header from '../layout/Header';
import ScrollStory from '../landing/ScrollStory';
import styles from './MarketingPages.module.css';

export type MarketingPageKind = 'features' | 'integrations' | 'ai-sales' | 'resources';

interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
  detail: string;
}

const featureItems: FeatureItem[] = [
  { icon: Inbox, title: 'Unified Inbox', description: 'รวมบทสนทนาจากช่องทางต่าง ๆ ไว้ใน Workspace เดียว', detail: 'ทีมเห็นข้อความ ลูกค้า และสถานะงานในบริบทเดียว ลดการสลับแอปและลดข้อความตกหล่น' },
  { icon: Bot, title: 'AI Auto Reply', description: 'ให้ AI ช่วยร่างคำตอบจาก FAQ และ Product Knowledge', detail: 'ทีมตรวจ แก้ไข และอนุมัติก่อนส่งได้ เพื่อคุมคุณภาพและโทนเสียงของแบรนด์' },
  { icon: Sparkles, title: 'AI Sales Memory', description: 'จำความสนใจ ประวัติการคุย และสถานะของแต่ละดีล', detail: 'สมาชิกใหม่ในทีมรับช่วงต่อได้ทันทีโดยไม่ต้องไล่อ่านทุกบทสนทนาเอง' },
  { icon: Clock3, title: 'AI Follow-up', description: 'เตือนดีลที่เงียบและช่วยร่างข้อความติดตาม', detail: 'เห็น Next step ของดีลชัดขึ้น และไม่ปล่อยลูกค้าที่ขอใบเสนอราคาไว้โดยไม่มีการติดตาม' },
  { icon: FileText, title: 'Quotation', description: 'เตรียมใบเสนอราคาจากข้อมูลในแชท', detail: 'AI ช่วยดึงสินค้าและจำนวนให้ฝ่ายขายตรวจสอบ ก่อนอนุมัติและส่งให้ลูกค้า' },
  { icon: UsersRound, title: 'Customer CRM', description: 'เก็บข้อมูลลูกค้า Tags และ Customer Status', detail: 'ประวัติการติดต่อและข้อมูลสำคัญของลูกค้าอยู่ในโปรไฟล์ที่ทีมเข้าถึงตามสิทธิ์' },
  { icon: Network, title: 'Team Collaboration', description: 'มอบหมายงาน ใส่โน้ต และติดตามสถานะแชท', detail: 'กำหนดความรับผิดชอบของแต่ละคน พร้อม RBAC และ audit trail สำหรับทีม' },
  { icon: BarChart3, title: 'Analytics', description: 'ดูปริมาณข้อความ เวลาตอบ และภาพรวมการขาย', detail: 'ใช้ข้อมูลประกอบการวางกำลังคน ช่องทาง และต้นทุน AI ได้ดีขึ้น' },
  { icon: Workflow, title: 'Automation', description: 'ตั้งกฎงานซ้ำและเส้นทางการติดตาม', detail: 'เริ่มจาก Basic Automation แล้วขยายไปสู่ workflow ที่ซับซ้อนขึ้นตามแพ็กเกจ' },
  { icon: Rocket, title: 'Mobile / PWA', description: 'ติดตั้ง CUTINEO บนมือถือและเดสก์ท็อป', detail: 'เปิดใช้งานเหมือนแอปบน browser ที่รองรับ โดยไม่ต้องสร้าง Native App ในระยะเริ่มต้น' },
  { icon: ShieldCheck, title: 'Security', description: 'ออกแบบแบบ multi-tenant และแยกข้อมูลบริษัท', detail: 'ตรวจ company_id, role และ permission ทุก request พร้อมเก็บ secrets ฝั่ง server' },
];

const aiSalesFlow = [
  { icon: MessageCircle, title: 'AI Reply', text: 'ตอบคำถามจาก FAQ และ Product Knowledge' },
  { icon: Sparkles, title: 'Sales Memory', text: 'จำบริบท ความสนใจ และสถานะดีล' },
  { icon: FileText, title: 'AI Summary', text: 'สรุปบทสนทนาให้ทีมรับช่วงต่อได้เร็ว' },
  { icon: Clock3, title: 'AI Follow-up', text: 'เตือนและร่างข้อความเมื่อลูกค้าเงียบ' },
  { icon: PackageCheck, title: 'Quotation', text: 'สร้าง Draft ให้คนตรวจและอนุมัติ' },
  { icon: Activity, title: 'Pipeline', text: 'มองเห็นดีลตั้งแต่แชทจนถึงปิดการขาย' },
];

function normalizePrefix(basePath = '') {
  if (!basePath || basePath === '/') return '/';
  return basePath.endsWith('/') ? basePath : `${basePath}/`;
}

function hrefFor(basePath: string, page: string) {
  const prefix = normalizePrefix(basePath);
  return `${prefix}${page}${prefix === '/' ? '' : '/'}`;
}

function statusLabel(status: IntegrationStatus) {
  if (status === 'available') return 'พร้อมใช้งาน';
  if (status === 'beta') return 'Beta';
  return 'เร็ว ๆ นี้';
}

function statusClass(status: IntegrationStatus) {
  return status === 'available' ? styles.statusAvailable : status === 'beta' ? styles.statusBeta : styles.statusSoon;
}

function IntegrationLogo({ integration }: { integration: Integration }) {
  return <div className={styles.integrationLogo}><img src={integration.logo} alt={`${integration.name} logo`} width="36" height="36" loading="lazy" /></div>;
}

function PageIntro({ kind, title, accent, description, basePath }: { kind: MarketingPageKind; title: string; accent: string; description: string; basePath?: string }) {
  return (
    <section className={styles.pageIntro}>
      <div className={styles.contentShell}>
        <span className={styles.eyebrow}>CUTINEO · {kind.replace('-', ' ').toUpperCase()}</span>
        <h1>{title}<br /><span>{accent}</span></h1>
        <p>{description}</p>
        <div className={styles.introActions}>
          <a className={styles.primaryButton} href={`${normalizePrefix(basePath)}${basePath ? 'register.html' : 'signup'}?plan=Starter`} data-cta={`page-${kind}-start`}>เริ่มต้นใช้งานฟรี <ArrowRight size={16} /></a>
          <a className={styles.secondaryButton} href={hrefFor(basePath ?? '', 'pricing')}>ดูแพ็กเกจราคา</a>
        </div>
      </div>
    </section>
  );
}

function PageFooter({ basePath = '' }: { basePath?: string }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.contentShell}>
        <div className={styles.footerGrid}>
          <div><strong>CUTI<span>NEO</span></strong><p>รวมทุกแชท พร้อม AI ช่วยทีมขายตอบ จำ ติดตาม และปิดการขาย</p></div>
          <div><b>ผลิตภัณฑ์</b><a href={hrefFor(basePath, 'features')}>ฟีเจอร์</a><a href={hrefFor(basePath, 'integrations')}>การเชื่อมต่อ</a><a href={hrefFor(basePath, 'ai-sales')}>AI Sales</a></div>
          <div><b>ช่วยเหลือ</b><a href={hrefFor(basePath, 'pricing')}>ราคา</a><a href={hrefFor(basePath, 'resources')}>ทรัพยากร</a><a href={`${normalizePrefix(basePath)}${basePath ? 'login/' : 'login'}`}>เข้าสู่ระบบ</a></div>
        </div>
        <div className={styles.footerBottom}>© 2026 CUTINEO · Demo ใช้ข้อมูล mock และไม่เรียก AI/API จริง</div>
      </div>
    </footer>
  );
}

function FeaturesContent({ basePath = '' }: { basePath?: string }) {
  return (
    <>
      <section className={styles.contentSection}>
        <div className={styles.contentShell}>
          <div className={styles.sectionHeader}><span className={styles.eyebrow}>ONE WORKSPACE, MORE SALES</span><h2>เครื่องมือที่ทำให้ทีมขาย<br /><span>ทำงานต่อจากบริบทเดียวกัน</span></h2><p>เลือกใช้เฉพาะสิ่งที่ทีมต้องการในวันนี้ แล้วขยาย workflow ได้เมื่อธุรกิจโตขึ้น</p></div>
          <div className={styles.featureGrid}>{featureItems.map((item) => { const Icon = item.icon; return <article className={styles.featureCard} key={item.title}><div className={styles.featureIcon}><Icon size={21} /></div><h3>{item.title}</h3><p>{item.description}</p><small>{item.detail}</small></article>; })}</div>
        </div>
      </section>
      <section className={styles.featureCallout}><div className={styles.contentShell}><div><span className={styles.eyebrow}>NEXT STEP</span><h2>อยากเห็น AI Sales ทำงานจริง?</h2><p>ดู Product Story ตั้งแต่ข้อความแรกจนถึง Follow-up และการปิดดีล</p></div><a className={styles.primaryButton} href={hrefFor(basePath, 'ai-sales')}>ดู AI Sales <ArrowRight size={16} /></a></div></section>
    </>
  );
}

function IntegrationsContent() {
  return (
    <section className={styles.contentSection} id="guide">
      <div className={styles.contentShell}>
        <div className={styles.sectionHeader}><span className={styles.eyebrow}>CONNECT YOUR WORKSPACE</span><h2>ช่องทางที่ลูกค้าของคุณใช้อยู่</h2><p>สถานะด้านล่างอ้างอิงจาก adapter/config ที่มีในระบบปัจจุบัน ไม่แสดงช่องทางที่ยังไม่พร้อมเป็นการเชื่อมต่อจริง</p></div>
        <div className={styles.integrationGroups}>{integrationCategories.map((category) => <section key={category.id} aria-labelledby={`${category.id}-title`}><h3 id={`${category.id}-title`}>{category.label}</h3><div className={styles.integrationGrid}>{integrations.filter((integration) => integration.category === category.id).map((integration) => <article className={styles.integrationCard} key={integration.id}><IntegrationLogo integration={integration} /><div><strong>{integration.name}</strong><span className={`${styles.statusBadge} ${statusClass(integration.status)}`}>{statusLabel(integration.status)}</span><p>{integration.description}</p></div></article>)}</div></section>)}</div>
        <p className={styles.trademarkNote}>ชื่อผลิตภัณฑ์ โลโก้ และเครื่องหมายการค้าของบุคคลที่สามเป็นทรัพย์สินของเจ้าของแต่ละราย การแสดงเครื่องหมายใช้เพื่อระบุบริการที่ CUTINEO รองรับหรือมีแผนรองรับเท่านั้น</p>
      </div>
    </section>
  );
}

function AiSalesContent({ basePath = '' }: { basePath?: string }) {
  return (
    <>
      <section className={styles.contentSection}>
        <div className={styles.contentShell}>
          <div className={styles.sectionHeader}><span className={styles.eyebrow}>AI SALES WORKFLOW</span><h2>AI ไม่ได้แค่ตอบ<br /><span>แต่ช่วยทีมขายเดินดีลต่อ</span></h2><p>ทุกขั้นยังอยู่ภายใต้การควบคุมของทีม ตั้งแต่ร่างคำตอบ สรุปความต้องการ จนถึงการติดตามและใบเสนอราคา</p></div>
          <div className={styles.salesFlow}>{aiSalesFlow.map((item, index) => { const Icon = item.icon; return <article key={item.title}><div className={styles.salesFlowIcon}><Icon size={20} /></div><span>0{index + 1}</span><h3>{item.title}</h3><p>{item.text}</p>{index < aiSalesFlow.length - 1 && <ArrowRight className={styles.salesArrow} size={17} />}</article>; })}</div>
          <div className={styles.salesTrust}><ShieldCheck size={18} /><span>ข้อมูลลูกค้าและ API credential ไม่ถูกใส่ไว้ใน Landing Demo และ AI ทุก request ต้องผ่าน policy/tenant check ฝั่งระบบ</span></div>
        </div>
      </section>
      <ScrollStory />
      <section className={styles.featureCallout}><div className={styles.contentShell}><div><span className={styles.eyebrow}>READY TO TRY</span><h2>เริ่มจาก AI ช่วยตอบ แล้วโตไปพร้อมทีม</h2></div><a className={styles.primaryButton} href={`${normalizePrefix(basePath)}${basePath ? 'register.html' : 'signup'}?plan=Pro`} data-cta="ai-sales-start">เริ่มต้นกับ Pro <ArrowRight size={16} /></a></div></section>
    </>
  );
}

function ResourcesContent({ basePath = '' }: { basePath?: string }) {
  const resources = [
    { icon: BookOpen, title: 'บทความ', text: 'แนวทางจัดการ Inbox และ AI Sales สำหรับทีมยุคใหม่', status: 'กำลังเตรียม', href: '#articles' },
    { icon: HelpCircle, title: 'ศูนย์ช่วยเหลือ', text: 'คำตอบสำหรับการเริ่มต้นใช้งานและการจัดการทีม', status: 'กำลังเตรียม', href: '#help' },
    { icon: MessageCircle, title: 'ตัวอย่างการใช้งานจริง', text: 'ดูภาพจำลอง workflow ตั้งแต่แชทเข้าจนถึงปิดดีล', status: 'พร้อมดู', href: hrefFor(basePath, 'ai-sales') },
    { icon: Rocket, title: 'วิธีเริ่มต้น', text: 'เริ่มทดลองใช้ฟรีและเตรียม Workspace ให้พร้อมในไม่กี่ขั้นตอน', status: 'พร้อมเริ่ม', href: `${normalizePrefix(basePath)}${basePath ? 'register.html' : 'signup'}?plan=Starter` },
    { icon: Puzzle, title: 'คู่มือ Integration', text: 'ดูสถานะช่องทางและแนวทางการเชื่อมต่อที่ CUTINEO รองรับ', status: 'เปิดดู', href: `${hrefFor(basePath, 'integrations')}#guide` },
    { icon: PackageCheck, title: 'ติดตั้ง PWA', text: 'ใช้งาน CUTINEO บนมือถือและเดสก์ท็อปเหมือนแอป', status: 'เปิดดู', href: `${normalizePrefix(basePath)}${basePath ? 'install/' : 'install'}` },
    { icon: FileText, title: 'FAQ', text: 'คำถามที่พบบ่อยเกี่ยวกับ AI Messages และแพ็กเกจ', status: 'กำลังเตรียม', href: '#faq' },
    { icon: UsersRound, title: 'เกี่ยวกับเรา', text: 'แนวคิดของ CUTINEO และทีมที่สร้างเครื่องมือสำหรับทีมขาย', status: 'กำลังเตรียม', href: '#about' },
  ];

  return <section className={styles.contentSection}><div className={styles.contentShell}><div className={styles.sectionHeader}><span className={styles.eyebrow}>RESOURCE HUB</span><h2>ทุกอย่างที่ช่วยให้เริ่มใช้ CUTINEO ได้เร็วขึ้น</h2><p>บางส่วนกำลังเตรียมเนื้อหาเต็ม แต่ route และโครงสร้างพร้อมต่อยอดแล้ว</p></div><div className={styles.resourceGrid}>{resources.map((resource) => { const Icon = resource.icon; return <a className={styles.resourceCard} href={resource.href} key={resource.title}><div className={styles.resourceIcon}><Icon size={20} /></div><div><span>{resource.status}</span><h3>{resource.title}</h3><p>{resource.text}</p></div><ArrowRight size={17} /></a>; })}</div></div></section>;
}

export default function MarketingPage({ kind, basePath = '' }: { kind: MarketingPageKind; basePath?: string }) {
  const content = {
    features: { title: 'ฟีเจอร์ที่ทำให้ทีมขาย', accent: 'ทำงานได้จากที่เดียว', description: 'รวม Inbox, AI และ workflow งานขายไว้ในระบบเดียว เพื่อให้ทีมตอบไวขึ้นและปิดการขายได้เป็นระบบ' },
    integrations: { title: 'เชื่อมต่อช่องทางของคุณ', accent: 'เข้ากับ CUTINEO', description: 'ดูช่องทางทั้งหมดและสถานะการรองรับจริง ก่อนวางแผนเชื่อมต่อ Workspace ของคุณ' },
    'ai-sales': { title: 'AI Sales ที่ช่วยทีม', accent: 'ไปไกลกว่าการตอบแชท', description: 'ให้ AI ช่วยตอบ จำ สรุป ติดตาม และเตรียมใบเสนอราคา โดยทีมยังคงเป็นผู้ควบคุมทุกขั้นตอนสำคัญ' },
    resources: { title: 'ทรัพยากรสำหรับทีม', accent: 'ที่อยากเริ่มให้เร็วขึ้น', description: 'รวมคู่มือ ตัวอย่างการใช้งาน FAQ และเส้นทางเริ่มต้นของ CUTINEO ไว้ใน Hub เดียว' },
  }[kind];

  return (
    <div className={styles.page}>
      <Header basePath={basePath} signupRoute={basePath ? 'register.html' : 'signup'} loginRoute={basePath ? 'login/' : 'login'} activeKey={kind === 'ai-sales' ? 'sales' : kind} />
      <main>
        <PageIntro kind={kind} title={content.title} accent={content.accent} description={content.description} basePath={basePath} />
        {kind === 'features' && <FeaturesContent basePath={basePath} />}
        {kind === 'integrations' && <IntegrationsContent />}
        {kind === 'ai-sales' && <AiSalesContent basePath={basePath} />}
        {kind === 'resources' && <ResourcesContent basePath={basePath} />}
      </main>
      <PageFooter basePath={basePath} />
    </div>
  );
}
