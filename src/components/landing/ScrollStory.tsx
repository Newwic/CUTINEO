/* eslint-disable @next/next/no-img-element -- this component is shared by Next and Vite. */
'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
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
  id: 'channels' | 'inbox' | 'ai-reply' | 'memory' | 'quotation' | 'followup' | 'close';
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
  {
    id: 'close',
    number: '07',
    eyebrow: 'THE CUTINEO LOOP',
    title: 'จากข้อความแรกจนถึงการปิดการขาย',
    description: 'ทุกแชท ข้อมูลลูกค้า ใบเสนอราคา และ Follow-up เชื่อมต่อกันในที่เดียว เพื่อให้ทีมเห็นภาพเดียวกันและเดินดีลต่อได้',
  },
];

const storyChannelIds = ['line', 'facebook', 'instagram', 'gmail', 'outlook'];
const storyChannels = storyChannelIds
  .map((id) => integrations.find((integration) => integration.id === id))
  .filter((integration): integration is Integration => Boolean(integration));

type StageRef = { current: HTMLDivElement | null };

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothStep(value: number) {
  const progress = clamp(value);
  return progress * progress * (3 - 2 * progress);
}

function phase(progress: number, start: number, end: number, from: number, to: number) {
  return from + (to - from) * smoothStep((progress - start) / (end - start));
}

function layerStyle(scale: number, opacity: number, rotate = 0): CSSProperties {
  return {
    opacity,
    transform: `translate3d(-50%, -50%, 0) scale3d(${scale}, ${scale}, 1) rotate(${rotate}deg)`,
  };
}

function ChannelLogo({ integration }: { integration: Integration }) {
  return <img src={integration.logo} alt="" width="22" height="22" loading="lazy" referrerPolicy="no-referrer" />;
}

function PortalVisual({ activeStep, progress, stageRef }: { activeStep: number; progress: number; stageRef: StageRef }) {
  const depth = Math.round(progress * 100).toString().padStart(2, '0');
  const outerScale = phase(progress, 0, 0.34, 1, 15);
  const outerOpacity = 1 - smoothStep((progress - 0.2) / 0.16);
  const windowScale = phase(progress, 0.12, 0.56, 0.16, 15);
  const windowOpacity = Math.min(1, 0.28 + smoothStep((progress - 0.08) / 0.16)) * (1 - smoothStep((progress - 0.39) / 0.18));
  const gateScale = phase(progress, 0.37, 0.79, 0.11, 15);
  const gateOpacity = smoothStep((progress - 0.32) / 0.14) * (1 - smoothStep((progress - 0.65) / 0.18));
  const finalScale = phase(progress, 0.67, 0.9, 0.09, 1.03);
  const finalOpacity = smoothStep((progress - 0.63) / 0.19);

  return (
    <div className={styles.portalFrame} aria-label={`ภาพจำลอง Product Story ขั้นตอนที่ ${scrollStorySteps[activeStep].number}`}>
      <div className={styles.portalTopbar}>
        <div className={styles.portalWindowDots} aria-hidden="true"><span /><span /><span /></div>
        <span className={styles.portalTopLabel}>CUTINEO / PRODUCT STORY</span>
        <span className={styles.portalLive}><i /> SCROLL LIVE</span>
        <div className={styles.portalProgressTrack} aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></div>
      </div>

      <div className={styles.portalStage} ref={stageRef} aria-hidden="true">
        <div className={styles.portalBackdrop} />
        <div className={styles.portalGrid} />
        <div className={`${styles.portalGlow} ${styles.portalGlowA}`} />
        <div className={`${styles.portalGlow} ${styles.portalGlowB}`} />

        <div className={`${styles.portalLayer} ${styles.portalDoorLayer}`} style={layerStyle(outerScale, outerOpacity)}>
          <div className={styles.portalDoorFrame}>
            <div className={styles.portalLayerMeta}><span>01 / INCOMING</span><span>CHANNEL PORTAL</span></div>
            <div className={styles.portalDoorHeading}><span className={styles.portalEyebrow}>THE FIRST MESSAGE</span><strong>ทุกข้อความ<br /><em>มีโอกาสขาย</em></strong></div>
            <div className={styles.portalChannelGrid}>
              {storyChannels.slice(0, 4).map((integration, index) => (
                <div className={styles.portalChannel} key={integration.id}>
                  <span className={styles.portalChannelIcon}><ChannelLogo integration={integration} /></span>
                  <span><strong>{integration.name}</strong><small>{index === 0 ? 'ข้อความใหม่ · 04' : 'connected'}</small></span>
                  <i />
                </div>
              ))}
            </div>
            <div className={styles.portalDoorFoot}><span className={styles.portalStatusDot} /> ข้อความกำลังไหลเข้าสู่ CUTINEO <ArrowDown size={14} /></div>
          </div>
        </div>

        <div className={`${styles.portalLayer} ${styles.portalWindowLayer}`} style={layerStyle(windowScale, windowOpacity, -1.5)}>
          <div className={styles.portalWindowShell}>
            <div className={styles.portalLayerMeta}><span>02 / UNIFIED INBOX</span><span className={styles.portalGreenText}>4 NEW</span></div>
            <div className={styles.portalInboxBody}>
              <div className={styles.portalInboxSide}>
                <span className={styles.portalSideTitle}>INBOX</span>
                <b className={styles.portalSideActive}><i /> All conversations <small>12</small></b>
                <span><i className={styles.sideLine} /> LINE OA <small>6</small></span>
                <span><i className={styles.sideFacebook} /> Facebook <small>3</small></span>
                <span><i className={styles.sideInstagram} /> Instagram <small>2</small></span>
              </div>
              <div className={styles.portalChatPanel}>
                <div className={styles.portalChatHead}><span className={styles.portalAvatar}>ส</span><span><strong>สมชาย มีเดช</strong><small><i /> LINE · online</small></span><b>•••</b></div>
                <div className={styles.portalChatMessages}><span className={styles.portalTime}>TODAY · 10:24</span><p className={styles.portalCustomerMessage}>ขอรายละเอียดสินค้า รุ่น A หน่อยครับ</p><p className={styles.portalTeamMessage}>ทีมเห็นแชทและบริบทเดียวกันแล้ว <CheckCircle2 size={12} /></p></div>
                <div className={styles.portalComposer}><span>พิมพ์ข้อความตอบกลับ...</span><Send size={12} /></div>
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.portalLayer} ${styles.portalGateLayer}`} style={layerStyle(gateScale, gateOpacity, 1.4)}>
          <div className={styles.portalGateShell}>
            <div className={styles.portalGateRings}><span /><span /><span /></div>
            <div className={styles.portalGateCore}>
              <span className={styles.portalGateIcon}><Sparkles size={17} /></span>
              <span className={styles.portalEyebrow}>03 / NEO SALES ENGINE</span>
              <strong>ตอบ · จำ · ตาม</strong>
              <p>AI เข้าใจบริบทของลูกค้า แล้วส่งต่องานขายให้ทีมได้ทันที</p>
              <div className={styles.portalGatePills}><span><Bot size={12} /> AI Reply</span><span><UserRound size={12} /> Memory</span><span><Clock3 size={12} /> Follow-up</span></div>
            </div>
          </div>
        </div>

        <div className={`${styles.portalLayer} ${styles.portalFinalLayer}`} style={layerStyle(finalScale, finalOpacity)}>
          <div className={styles.portalFinalShell}>
            <div className={styles.portalFinalTop}><span>04 / DEAL CLOSED</span><b><CheckCircle2 size={12} /> CLOSED</b></div>
            <div className={styles.portalFinalMark}><img src={NEO_LOGO_PATH} alt="" width="34" height="34" /></div>
            <span className={styles.portalEyebrow}>FROM FIRST MESSAGE TO CLOSED DEAL</span>
            <strong>ทุกแชท<br /><em>จบที่ดีล</em></strong>
            <div className={styles.portalDealCard}><span><FileText size={13} /> QT-000128</span><b>฿96,000</b><small><Check size={11} /> ทีมอนุมัติแล้ว · พร้อมปิดการขาย</small></div>
            <div className={styles.portalFinalTags}><span>Unified Inbox</span><span>AI Memory</span><span>Next step</span></div>
          </div>
        </div>

        <div className={styles.portalDepth}><span>DEPTH</span><strong>{depth}<small>%</small></strong></div>
        <div className={`${styles.portalCorner} ${styles.portalCornerTop}`}>SCROLL / DIVE</div>
        <div className={`${styles.portalCorner} ${styles.portalCornerBottom}`}>NEO SYSTEM 04</div>
      </div>

      <div className={styles.portalBottomBar}>
        <div className={styles.portalStepDots} aria-hidden="true">
          {scrollStorySteps.map((step, index) => <span className={index === activeStep ? styles.portalStepDotActive : ''} key={step.id} />)}
        </div>
        <span className={styles.portalBottomHint}><ArrowDown size={13} /> เลื่อนเพื่อดำน้ำผ่านทุกขั้นตอน</span>
        <span className={styles.portalBottomStep}>{scrollStorySteps[activeStep].number} / {scrollStorySteps[activeStep].eyebrow}</span>
      </div>
    </div>
  );
}

interface ScrollStoryProps {
  signupHref?: string;
  detailsHref?: string;
}

export default function ScrollStory({ signupHref = '/signup?plan=Starter', detailsHref = '/ai-sales' }: ScrollStoryProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const layoutRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layout = layoutRef.current;
    if (!layout) return undefined;

    let frame = 0;
    let lastProgress = -1;

    const syncProgress = () => {
      frame = 0;
      const stage = stageRef.current;
      const frameElement = stage?.parentElement;
      const rect = layout.getBoundingClientRect();
      const stickyTop = window.matchMedia('(max-width: 1023px)').matches ? 82 : 104;
      const visualHeight = frameElement?.offsetHeight || Math.round(window.innerHeight * 0.72);
      const travel = Math.max(1, layout.offsetHeight - visualHeight - stickyTop);
      const nextProgress = clamp((stickyTop - rect.top) / travel);
      const nextStep = Math.min(scrollStorySteps.length - 1, Math.floor(nextProgress * scrollStorySteps.length));

      if (stage) stage.style.setProperty('--portal-progress', String(nextProgress));
      if (Math.abs(nextProgress - lastProgress) > 0.001) {
        lastProgress = nextProgress;
        setProgress(nextProgress);
      }
      setActiveStep((current) => current === nextStep ? current : nextStep);
    };

    const requestSync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(syncProgress);
    };

    requestSync();
    window.addEventListener('scroll', requestSync, { passive: true });
    window.addEventListener('resize', requestSync);
    return () => {
      window.removeEventListener('scroll', requestSync);
      window.removeEventListener('resize', requestSync);
      if (frame) window.cancelAnimationFrame(frame);
    };
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
          <p>เลื่อนลงเพื่อดำน้ำผ่าน Product Story แบบทีละเฟรม ตั้งแต่แชทเข้า รวม Inbox ให้ AI ช่วยขาย จนถึงดีลที่ปิดได้ในระบบเดียว</p>
        </div>

        <div className={styles.storyLayout} ref={layoutRef}>
          <div className={styles.storySteps}>
            {scrollStorySteps.map((step, index) => (
              <article
                className={`${styles.storyStep} ${activeStep === index ? styles.storyStepActive : ''}`}
                data-story-step={step.id}
                key={step.id}
              >
                <div className={styles.storyStepCopy}>
                  <span className={styles.stepNumber}>{step.number}</span>
                  <span className={styles.stepEyebrow}>{step.eyebrow}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.desktopStoryVisual}>
            <div className={styles.stickyVisual}><PortalVisual activeStep={activeStep} progress={progress} stageRef={stageRef} /></div>
          </div>
        </div>

        <div className={styles.storyConclusion}>
          <div className={styles.conclusionIcon}><img src={NEO_LOGO_PATH} alt="CUTINEO" width="42" height="42" /></div>
          <div><span>THE CUTINEO LOOP</span><strong>ทุกแชท → ทุกดีล → ในระบบเดียว</strong><p>จาก Inbox ถึง AI Sales Workflow ทีมเห็นภาพเดียวกันและเดินงานต่อได้ทันที</p></div>
          <div className={styles.storyConclusionActions}>
            <a className={styles.storyConclusionPrimary} href={signupHref}>เริ่มต้นใช้งาน <ArrowRight size={14} /></a>
            <a className={styles.storyConclusionLink} href={detailsHref}>ดู AI Sales</a>
          </div>
        </div>
      </div>
    </section>
  );
}
