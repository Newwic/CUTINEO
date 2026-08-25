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
  Send,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { integrations, type Integration } from '../../config/integrations';
import { NEO_LOGO_PATH } from '../../lib/branding';
import styles from './ScrollStory.module.css';

export interface ScrollStoryStep {
  id: 'channels' | 'inbox' | 'ai-reply' | 'memory' | 'quotation' | 'followup' | 'close';
  eyebrow: string;
  title: string;
  description: string;
}

export const scrollStorySteps: ScrollStoryStep[] = [
  {
    id: 'channels',
    eyebrow: 'เริ่มจากทุกช่องทาง',
    title: 'ลูกค้าทักจากทุกช่องทาง',
    description: 'LINE, Facebook, Instagram, Gmail และช่องทางอื่น ๆ ไหลเข้าสู่ CUTINEO โดยเห็นสถานะการรองรับอย่างชัดเจน',
  },
  {
    id: 'inbox',
    eyebrow: 'ONE WORKSPACE',
    title: 'รวมทุกข้อความไว้ใน Inbox เดียว',
    description: 'ทีมไม่ต้องเปิดหลายแอป ทุกบทสนทนาอยู่ใน Workspace เดียว พร้อมบริบทที่ส่งต่องานได้ทันที',
  },
  {
    id: 'ai-reply',
    eyebrow: 'AI AUTO REPLY',
    title: 'AI ช่วยตอบลูกค้า',
    description: 'ใช้ข้อมูลสินค้า FAQ และ Knowledge Base ช่วยร่างคำตอบได้เร็วขึ้น โดยทีมยังเป็นผู้ตรวจสอบก่อนส่ง',
  },
  {
    id: 'memory',
    eyebrow: 'AI SALES MEMORY',
    title: 'AI จำลูกค้าได้',
    description: 'รู้ว่าลูกค้าเคยถามอะไร สนใจสินค้าไหน และดีลอยู่ขั้นตอนไหน เพื่อให้ทุกคนในทีมตอบต่อได้อย่างต่อเนื่อง',
  },
  {
    id: 'quotation',
    eyebrow: 'QUOTATION FLOW',
    title: 'สร้างใบเสนอราคาจากบทสนทนา',
    description: 'AI ช่วยเตรียม Quotation Draft จากข้อมูลในแชท ให้ฝ่ายขายตรวจและอนุมัติก่อนส่งได้เร็วขึ้น',
  },
  {
    id: 'followup',
    eyebrow: 'AI FOLLOW-UP',
    title: 'ไม่พลาดการ Follow-up',
    description: 'ถ้าส่งราคาแล้วลูกค้าเงียบ CUTINEO ช่วยเตือนและร่างข้อความติดตาม เพื่อให้ทุกดีลมี Next step',
  },
  {
    id: 'close',
    eyebrow: 'THE CUTINEO LOOP',
    title: 'ปิดการขายในระบบเดียว',
    description: 'ทุกแชท ข้อมูลลูกค้า ใบเสนอราคา และ Follow-up เชื่อมต่อกันในที่เดียว เพื่อให้ทีมเห็นภาพเดียวกันและเดินดีลต่อได้',
  },
];

const portalDemoStates = [
  { id: 'channels', label: 'CHANNELS' },
  { id: 'inbox', label: 'UNIFIED INBOX' },
  { id: 'neo', label: 'NEO AI' },
  { id: 'close', label: 'DEAL CLOSED' },
] as const;

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

function layerStyle(scale: number, opacity: number, rotate = 0, x = 0, y = 0): CSSProperties {
  return {
    opacity,
    transform: `translate3d(-50%, -50%, 0) translate3d(${x}px, ${y}px, 0) scale3d(${scale}, ${scale}, 1) rotate(${rotate}deg)`,
  };
}

function ChannelLogo({ integration }: { integration: Integration }) {
  return <img src={integration.logo} alt="" width="22" height="22" loading="lazy" referrerPolicy="no-referrer" />;
}

function PortalVisual({ activeStep, progress, stageRef }: { activeStep: number; progress: number; stageRef: StageRef }) {
  const demoStateIndex = progress < .23 ? 0 : progress < .48 ? 1 : progress < .73 ? 2 : 3;
  const demoState = portalDemoStates[demoStateIndex];
  // Each scene keeps the same footprint so only the product state changes.
  // This gives the scroll story a calm, readable handoff instead of stacked cards.
  const outerScale = phase(progress, 0, 0.18, 0.985, 1.01);
  const outerOpacity = 1 - smoothStep((progress - 0.18) / 0.08);
  const outerY = phase(progress, 0, 0.18, 0, -14);
  const windowScale = phase(progress, 0.18, 0.27, 0.97, 1);
  const windowOpacity = smoothStep((progress - 0.18) / 0.08) * (1 - smoothStep((progress - 0.43) / 0.08));
  const windowY = phase(progress, 0.18, 0.27, 24, 0);
  const gateScale = phase(progress, 0.43, 0.52, 0.97, 1);
  const gateOpacity = smoothStep((progress - 0.43) / 0.08) * (1 - smoothStep((progress - 0.68) / 0.08));
  const gateX = phase(progress, 0.43, 0.52, -24, 0);
  const finalScale = phase(progress, 0.68, 0.77, 0.97, 1);
  const finalOpacity = smoothStep((progress - 0.68) / 0.08);
  const finalY = phase(progress, 0.68, 0.77, 24, 0);

  return (
    <div className={styles.portalFrame} data-story-frame data-demo-state={demoState.id} aria-label={`ภาพจำลอง Product Story: ${scrollStorySteps[activeStep].eyebrow}`}>
      <div className={styles.portalTopbar}>
        <div className={styles.portalWindowDots} aria-hidden="true"><span /><span /><span /></div>
        <span className={styles.portalTopLabel}>CUTINEO / PRODUCT STORY</span>
      </div>

      <div className={styles.portalStage} data-story-stage ref={stageRef} aria-hidden="true">
        <div className={styles.portalBackdrop} />
        <div className={styles.portalGrid} />
        <div className={`${styles.portalGlow} ${styles.portalGlowA}`} data-story-parallax />
        <div className={`${styles.portalGlow} ${styles.portalGlowB}`} data-story-parallax />

        <div className={`${styles.portalLayer} ${styles.portalDoorLayer}`} style={layerStyle(outerScale, outerOpacity, 0, 0, outerY)}>
          <div className={styles.portalDoorFrame}>
            <div className={styles.portalLayerMeta}><span>INCOMING</span><span>CHANNELS</span></div>
            <div className={styles.portalDoorHeading}><span className={styles.portalEyebrow}>THE FIRST MESSAGE</span><strong>ทุกข้อความ<br /><em>มีโอกาสขาย</em></strong></div>
            <div className={styles.portalChannelGrid}>
              {storyChannels.slice(0, 4).map((integration, index) => (
                <div className={styles.portalChannel} key={integration.id}>
                  <span className={styles.portalChannelIcon}><ChannelLogo integration={integration} /></span>
                  <span><strong>{integration.name}</strong><small>{index === 0 ? 'ข้อความใหม่' : 'connected'}</small></span>
                  <i />
                </div>
              ))}
            </div>
            <div className={styles.portalDoorFoot}><span className={styles.portalStatusDot} /> ข้อความกำลังไหลเข้าสู่ CUTINEO <ArrowDown size={14} /></div>
          </div>
        </div>

        <div className={`${styles.portalLayer} ${styles.portalWindowLayer}`} style={layerStyle(windowScale, windowOpacity, -0.5, 0, windowY)}>
          <div className={styles.portalWindowShell}>
            <div className={styles.portalLayerMeta}><span>UNIFIED INBOX</span><span className={styles.portalGreenText}>4 NEW</span></div>
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

        <div className={`${styles.portalLayer} ${styles.portalGateLayer}`} style={layerStyle(gateScale, gateOpacity, 0.5, gateX, 0)}>
          <div className={styles.portalGateShell}>
            <div className={styles.portalGateRings}><span /><span /><span /></div>
            <div className={styles.portalGateCore}>
              <span className={styles.portalGateIcon}><Sparkles size={17} /></span>
              <span className={styles.portalEyebrow}>NEO SALES ENGINE</span>
              <strong>ตอบ · จำ · ตาม</strong>
              <p>AI เข้าใจบริบทของลูกค้า แล้วส่งต่องานขายให้ทีมได้ทันที</p>
              <div className={styles.portalGatePills}><span><Bot size={12} /> AI Reply</span><span><UserRound size={12} /> Memory</span><span><Clock3 size={12} /> Follow-up</span></div>
            </div>
          </div>
        </div>

        <div className={`${styles.portalLayer} ${styles.portalFinalLayer}`} style={layerStyle(finalScale, finalOpacity, 0, 0, finalY)}>
          <div className={styles.portalFinalShell}>
            <div className={styles.portalFinalTop}><span>DEAL CLOSED</span><b><CheckCircle2 size={12} /> CLOSED</b></div>
            <div className={styles.portalFinalMark}><img src={NEO_LOGO_PATH} alt="" width="34" height="34" /></div>
            <span className={styles.portalEyebrow}>FROM FIRST MESSAGE TO CLOSED DEAL</span>
            <strong>ทุกแชท<br /><em>จบที่ดีล</em></strong>
            <div className={styles.portalDealCard}><span><FileText size={13} /> QT-000128</span><b>฿96,000</b><small><Check size={11} /> ทีมอนุมัติแล้ว · พร้อมปิดการขาย</small></div>
            <div className={styles.portalFinalTags}><span>Unified Inbox</span><span>AI Memory</span><span>Next step</span></div>
          </div>
        </div>

        <div className={`${styles.portalCorner} ${styles.portalCornerTop}`}>SCROLL / FLOW</div>
        <div className={`${styles.portalCorner} ${styles.portalCornerBottom}`}>NEO SYSTEM</div>
      </div>

      <div className={styles.portalBottomBar}>
        <div className={styles.portalStepDots} aria-hidden="true">
          {scrollStorySteps.map((step, index) => <span className={index === activeStep ? styles.portalStepDotActive : ''} key={step.id} />)}
        </div>
        <div className={styles.portalStateRail} aria-label="สถานะ Product Demo">
          {portalDemoStates.map((state, index) => <span className={index === demoStateIndex ? styles.portalStateActive : ''} key={state.id}>{state.label}</span>)}
        </div>
        <span className={styles.portalBottomHint}><ArrowDown size={13} /> เลื่อนเพื่อดูทุกขั้นตอน</span>
        <span className={styles.portalBottomStep}>{scrollStorySteps[activeStep].eyebrow}</span>
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
      const stickyTop = window.matchMedia('(max-width: 1023px)').matches ? 82 : 76;
      const visualHeight = frameElement?.offsetHeight || Math.round(window.innerHeight * 0.72);
      const travel = Math.max(1, layout.offsetHeight - visualHeight - stickyTop);
      const nextProgress = clamp((stickyTop - rect.top) / travel);
      // The copy card is taller than the sticky viewport. Shift the active
      // marker slightly forward so the card currently entering the viewport
      // is the one the user can actually read.
      const nextStep = Math.min(
        scrollStorySteps.length - 1,
        Math.floor(Math.min(0.999, nextProgress + 0.065) * scrollStorySteps.length),
      );

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
    <section className={styles.storySection} id="how-it-works" data-sticky-demo data-scroll-section="story" aria-label="Product Story ของ CUTINEO">
      <div className={styles.storyShell}>
        <div className={styles.storyLayout} ref={layoutRef}>
          <div className={styles.storySteps}>
            {scrollStorySteps.map((step, index) => (
              <article
                className={`${styles.storyStep} ${activeStep === index ? styles.storyStepActive : ''}`}
                data-story-step={step.id}
                key={step.id}
              >
                <div className={styles.storyStepCopy}>
                  <span className={styles.stepEyebrow}>{step.eyebrow}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.desktopStoryVisual}>
            <div className={styles.stickyVisual} data-sticky-visual><PortalVisual activeStep={activeStep} progress={progress} stageRef={stageRef} /></div>
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
