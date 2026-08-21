/* eslint-disable @next/next/no-img-element -- this component is shared by Next and Vite. */
'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  MessageCircle,
  Send,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { integrations, type Integration } from '../../config/integrations';
import { NEO_LOGO_PATH } from '../../lib/branding';
import styles from './ScrollStory.module.css';

export interface ScrollStoryStep {
  id: 'channels' | 'inbox' | 'ai-reply' | 'memory' | 'quotation' | 'followup';
  number: string;
  eyebrow: string;
  title: string;
  description: string;
}

export const scrollStorySteps: ScrollStoryStep[] = [
  {
    id: 'channels',
    number: '01',
    eyebrow: 'เริ่มจากทุกช่องทาง',
    title: 'ลูกค้าทักจากทุกช่องทาง',
    description: 'LINE, Facebook, Instagram, Gmail และช่องทางอื่น ๆ ไหลเข้าสู่ CUTINEO โดยเห็นสถานะการรองรับอย่างชัดเจน',
  },
  {
    id: 'inbox',
    number: '02',
    eyebrow: 'ONE WORKSPACE',
    title: 'รวมทุกข้อความไว้ใน Inbox เดียว',
    description: 'ทีมไม่ต้องเปิดหลายแอป ทุกบทสนทนาอยู่ใน Workspace เดียว พร้อมบริบทที่ส่งต่องานได้ทันที',
  },
  {
    id: 'ai-reply',
    number: '03',
    eyebrow: 'AI AUTO REPLY',
    title: 'AI ช่วยตอบลูกค้า',
    description: 'ใช้ข้อมูลสินค้า FAQ และ Knowledge Base ช่วยร่างคำตอบได้เร็วขึ้น โดยทีมยังเป็นผู้ตรวจสอบก่อนส่ง',
  },
  {
    id: 'memory',
    number: '04',
    eyebrow: 'AI SALES MEMORY',
    title: 'AI จำลูกค้าได้',
    description: 'รู้ว่าลูกค้าเคยถามอะไร สนใจสินค้าไหน และดีลอยู่ขั้นตอนไหน เพื่อให้ทุกคนในทีมตอบต่อได้อย่างต่อเนื่อง',
  },
  {
    id: 'quotation',
    number: '05',
    eyebrow: 'QUOTATION FLOW',
    title: 'สร้างใบเสนอราคาจากบทสนทนา',
    description: 'AI ช่วยเตรียม Quotation Draft จากข้อมูลในแชท ให้ฝ่ายขายตรวจและอนุมัติก่อนส่งได้เร็วขึ้น',
  },
  {
    id: 'followup',
    number: '06',
    eyebrow: 'AI FOLLOW-UP',
    title: 'ไม่พลาดการ Follow-up',
    description: 'ถ้าส่งราคาแล้วลูกค้าเงียบ CUTINEO ช่วยเตือนและร่างข้อความติดตาม เพื่อให้ทุกดีลมี Next step',
  },
];

const storyChannelIds = ['line', 'facebook', 'instagram', 'gmail', 'outlook'];
const storyChannels = storyChannelIds
  .map((id) => integrations.find((integration) => integration.id === id))
  .filter((integration): integration is Integration => Boolean(integration));

function storyStatusLabel(status: Integration['status']) {
  if (status === 'available') return 'พร้อมใช้';
  if (status === 'beta') return 'Beta';
  return 'เร็ว ๆ นี้';
}

function ChannelMark({ integration }: { integration: Integration }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className={styles.channelMark} aria-hidden="true">
      {failed ? (
        <MessageCircle size={22} strokeWidth={1.8} />
      ) : (
        <img
          src={integration.logo}
          alt=""
          width="26"
          height="26"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

function StoryVisual({ activeStep }: { activeStep: number }) {
  const safeStep = Math.max(0, Math.min(scrollStorySteps.length - 1, activeStep));

  return (
    <div className={styles.visualFrame} aria-label={`ภาพจำลองขั้นตอน: ${scrollStorySteps[safeStep].title}`}>
      <div className={styles.visualChrome}>
        <div className={styles.chromeDots} aria-hidden="true"><span /><span /><span /></div>
        <div className={styles.chromeLabel}>CUTINEO PRODUCT FLOW</div>
        <div className={styles.chromeLive}><span /> LIVE DEMO</div>
      </div>

      <div className={styles.visualStage}>
        <Scene visible={safeStep === 0}><ChannelsScene /></Scene>
        <Scene visible={safeStep === 1}><InboxScene /></Scene>
        <Scene visible={safeStep === 2}><AiReplyScene /></Scene>
        <Scene visible={safeStep === 3}><MemoryScene /></Scene>
        <Scene visible={safeStep === 4}><QuotationScene /></Scene>
        <Scene visible={safeStep === 5}><FollowUpScene /></Scene>
      </div>

      <ol className={styles.storyProgress} aria-label="ความคืบหน้าของ Product Story">
        {scrollStorySteps.map((step, index) => (
          <li key={step.id} className={index === safeStep ? styles.progressActive : ''} aria-current={index === safeStep ? 'step' : undefined}>
            <span>{step.number}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Scene({ visible, children }: { visible: boolean; children: ReactNode }) {
  return (
    <div className={`${styles.scene} ${visible ? styles.sceneVisible : ''}`} aria-hidden={!visible}>
      {children}
    </div>
  );
}

function ChannelsScene() {
  return (
    <div className={styles.channelsScene}>
      <div className={styles.sceneIntro}>
        <span className={styles.sceneIcon}><MessageCircle size={17} /></span>
        <div><strong>ทุกช่องทางเริ่มต้นที่นี่</strong><span>สถานะตามการรองรับจริงของ CUTINEO</span></div>
      </div>

      <div className={styles.channelGrid}>
        {storyChannels.map((integration, index) => (
          <div className={styles.channelCard} key={integration.id} style={{ animationDelay: `${index * 0.25}s` }}>
            <ChannelMark integration={integration} />
            <div className={styles.channelText}><strong>{integration.name}</strong><small>{storyStatusLabel(integration.status)}</small></div>
          </div>
        ))}
      </div>

      <div className={styles.flowArrow}><ArrowDown size={23} /><span>ข้อความไหลเข้าสู่</span></div>

      <div className={styles.cutineoHub}>
        <img src={NEO_LOGO_PATH} alt="" width="38" height="38" />
        <div><strong>CUTINEO</strong><span>Unified Conversation Hub</span></div>
      </div>
    </div>
  );
}

function InboxScene() {
  const conversations = [
    { name: 'สมชาย มีเดช', channel: 'LINE', text: 'ขอรายละเอียดสินค้า รุ่น A', integration: 'line' },
    { name: 'ABC Company', channel: 'Gmail', text: 'ขอใบเสนอราคา 2 เครื่องครับ', integration: 'gmail' },
    { name: 'Nattaya', channel: 'Instagram', text: 'สินค้ายังมีไหมคะ?', integration: 'instagram' },
    { name: 'Global Design', channel: 'Outlook', text: 'Request quotation', integration: 'outlook' },
  ];

  return (
    <div className={styles.inboxScene}>
      <div className={styles.inboxTitlebar}><div><strong>Unified Inbox</strong><span>ทุกช่องทางอยู่ในที่เดียว</span></div><span className={styles.inboxCount}>4 ใหม่</span></div>
      <div className={styles.inboxLayout}>
        <div className={styles.inboxList}>
          {conversations.map((conversation, index) => {
            const integration = integrations.find((item) => item.id === conversation.integration);
            return (
              <div className={`${styles.inboxItem} ${index === 0 ? styles.inboxItemActive : ''}`} key={conversation.name}>
                <div className={styles.inboxAvatar}>{conversation.name.slice(0, 1)}</div>
                <div className={styles.inboxItemCopy}><div><strong>{conversation.name}</strong><small>{conversation.channel}</small></div><p>{conversation.text}</p></div>
                {integration && <ChannelMark integration={integration} />}
              </div>
            );
          })}
        </div>
        <div className={styles.inboxChat}>
          <div className={styles.chatHeader}><div className={styles.inboxAvatar}>ส</div><div><strong>สมชาย มีเดช</strong><span>LINE · Online</span></div></div>
          <div className={styles.chatMessages}>
            <div className={styles.chatBubbleCustomer}>ขอรายละเอียดสินค้า รุ่น A หน่อยครับ</div>
            <div className={styles.chatBubbleAgent}>ทีมเห็นแชทและบริบทเดียวกันแล้ว <CheckCircle2 size={14} /></div>
          </div>
          <div className={styles.chatComposer}><span>พิมพ์ข้อความตอบกลับ...</span><Send size={14} /></div>
        </div>
      </div>
    </div>
  );
}

function AiReplyScene() {
  return (
    <div className={styles.aiReplyScene}>
      <div className={styles.sceneIntro}><span className={styles.sceneIcon}><Bot size={17} /></span><div><strong>AI ร่างคำตอบจากข้อมูลธุรกิจ</strong><span>ทีมตรวจสอบก่อนส่งได้ทุกครั้ง</span></div></div>
      <div className={styles.aiConversation}>
        <div className={styles.aiCustomerBubble}><span className={styles.bubbleMeta}><UserRound size={12} /> ลูกค้า · LINE</span>รุ่น A มีของอยู่ไหมครับ?</div>
        <div className={styles.aiAnswerBubble}>
          <span className={styles.aiLabel}><img src={NEO_LOGO_PATH} alt="" width="22" height="22" /> CUTINEO AI <small>แนะนำคำตอบ</small></span>
          <strong>รุ่น A พร้อมส่งครับ มี 2 แพ็กเกจให้เลือก</strong>
          <p>อ้างอิงจาก Product Knowledge · ตรวจสอบก่อนส่ง</p>
          <div className={styles.aiAnswerActions}><button type="button">แก้ไข</button><button type="button" className={styles.aiApprove}><Check size={13} /> อนุมัติคำตอบ</button></div>
        </div>
      </div>
      <div className={styles.aiStatus}><span className={styles.pulseDot} /> AI กำลังช่วยตอบลูกค้า...</div>
    </div>
  );
}

function MemoryScene() {
  return (
    <div className={styles.memoryScene}>
      <div className={styles.memoryCard}>
        <div className={styles.memoryHeader}><div className={styles.memoryPerson}><span className={styles.memoryAvatar}>ส</span><div><strong>สมชาย มีเดช</strong><span>LINE + Gmail · ลูกค้าประจำ</span></div></div><span className={styles.memoryBadge}><Sparkles size={13} /> AI จำได้</span></div>
        <div className={styles.memoryRows}>
          <div><span>สนใจสินค้า</span><strong>Product A และ B</strong></div>
          <div><span>คุยล่าสุด</span><strong>7 วันที่แล้ว</strong></div>
          <div><span>Quotation</span><strong>QT-000128</strong></div>
          <div><span>สถานะดีล</span><strong className={styles.memoryWarning}>Waiting Follow-up</strong></div>
        </div>
        <div className={styles.memoryInsight}><Sparkles size={16} /><p><strong>AI จำได้</strong> ลูกค้ารายนี้กำลังรอการติดตาม</p></div>
      </div>
    </div>
  );
}

function QuotationScene() {
  const flow = [
    { label: 'อ่านข้อมูลจากแชท', icon: MessageCircle, done: true },
    { label: 'เตรียม Quotation Draft', icon: FileText, done: true },
    { label: 'คนตรวจและอนุมัติ', icon: CheckCircle2, done: false },
  ];

  return (
    <div className={styles.quotationScene}>
      <div className={styles.quotationCard}>
        <div className={styles.quotationHead}><div><span className={styles.quotationKicker}>AI GENERATED DRAFT</span><strong>QT-000128</strong></div><span className={styles.draftBadge}>รอตรวจสอบ</span></div>
        <div className={styles.quotationRows}><div><span>สินค้า</span><strong>Product A · 2 เครื่อง</strong></div><div><span>ราคา/เครื่อง</span><strong>฿48,000</strong></div><div className={styles.quotationTotal}><span>รวม</span><strong>฿96,000</strong></div></div>
        <div className={styles.quotationFlow}>{flow.map((item) => { const Icon = item.icon; return <div key={item.label} className={item.done ? styles.flowDone : styles.flowCurrent}><span><Icon size={14} /></span><small>{item.label}</small></div>; })}</div>
        <button type="button" className={styles.quotationButton}><Check size={15} /> ตรวจและอนุมัติ</button>
      </div>
    </div>
  );
}

function FollowUpScene() {
  return (
    <div className={styles.followupScene}>
      <div className={styles.followupTimeline}>
        <div><span className={styles.timelineDone}><Check size={12} /></span><div><strong>Day 1</strong><small>ส่งใบเสนอราคา QT-000128</small></div></div>
        <div><span className={styles.timelineDone}><Check size={12} /></span><div><strong>Day 2</strong><small>ยังไม่มีการตอบกลับ</small></div></div>
        <div className={styles.timelineCurrent}><span>!</span><div><strong>Day 3 · วันนี้</strong><small>CUTINEO แนะนำให้ Follow-up</small></div></div>
      </div>
      <div className={styles.followupDraft}><div className={styles.followupDraftLabel}><Clock3 size={15} /> AI FOLLOW-UP</div><strong>ลูกค้ารายนี้ยังไม่ได้ตอบกลับ</strong><p>สวัสดีครับ ขออนุญาตติดตามใบเสนอราคาที่ส่งให้ก่อนหน้านี้ หากต้องการข้อมูลเพิ่มเติมแจ้งได้เลยครับ</p><button type="button"><Send size={14} /> ใช้ข้อความนี้</button></div>
      <div className={styles.storyOutcome}><CheckCircle2 size={15} /><span>ทุกแชท → ทุกดีล → ในระบบเดียว</span></div>
    </div>
  );
}

export default function ScrollStory() {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return undefined;

    const ratios = new Map<Element, number>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0));

      let nextIndex = -1;
      let highestRatio = 0;
      stepRefs.current.forEach((element, index) => {
        if (!element) return;
        const ratio = ratios.get(element) ?? 0;
        if (ratio > highestRatio) {
          highestRatio = ratio;
          nextIndex = index;
        }
      });

      if (nextIndex >= 0) setActiveStep((current) => current === nextIndex ? current : nextIndex);
    }, { threshold: [0.2, 0.45, 0.65, 0.85], rootMargin: '-15% 0px -25% 0px' });

    stepRefs.current.forEach((element) => { if (element) observer.observe(element); });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('cutineo:story-step-active', {
      detail: { id: scrollStorySteps[activeStep].id, index: activeStep },
    }));
  }, [activeStep]);

  return (
    <section className={styles.storySection} id="how-it-works" aria-labelledby="story-title">
      <div className={styles.storyShell}>
        <div className={styles.storyHeading}>
          <span className={styles.storyKicker}>ดู CUTINEO ทำงาน</span>
          <h2 id="story-title">จากข้อความแรก<br /><span>จนถึงการปิดการขาย</span></h2>
          <p>เลื่อนลงเพื่อดูว่า CUTINEO ช่วยทีมของคุณจัดการลูกค้า ตั้งแต่แชทเข้า จนถึง Follow-up และปิดดีลได้อย่างไร</p>
        </div>

        <div className={styles.storyLayout}>
          <div className={styles.storySteps}>
            {scrollStorySteps.map((step, index) => (
              <article
                className={`${styles.storyStep} ${activeStep === index ? styles.storyStepActive : ''}`}
                data-story-step={step.id}
                key={step.id}
                ref={(element) => { stepRefs.current[index] = element; }}
              >
                <div className={styles.storyStepCopy}>
                  <span className={styles.stepNumber}>{step.number}</span>
                  <span className={styles.stepEyebrow}>{step.eyebrow}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                <div className={styles.mobileStoryVisual}><StoryVisual activeStep={index} /></div>
              </article>
            ))}
          </div>

          <div className={styles.desktopStoryVisual}><div className={styles.stickyVisual}><StoryVisual activeStep={activeStep} /></div></div>
        </div>

        <div className={styles.storyConclusion}>
          <div className={styles.conclusionIcon}><img src={NEO_LOGO_PATH} alt="CUTINEO" width="42" height="42" /></div>
          <div><span>THE CUTINEO LOOP</span><strong>ทุกแชท → ทุกดีล → ในระบบเดียว</strong><p>จาก Inbox ถึง AI Sales Workflow ทีมเห็นภาพเดียวกันและเดินงานต่อได้ทันที</p></div>
          <ArrowRight className={styles.conclusionArrow} size={24} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
