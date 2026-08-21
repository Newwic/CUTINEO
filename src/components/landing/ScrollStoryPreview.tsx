import { ArrowRight, Clock3, FileText, MessageCircle, Sparkles } from 'lucide-react';
import styles from './HomepageV2.module.css';

interface ScrollStoryPreviewProps {
  detailsHref: string;
}

const previewSteps = [
  { number: '01', title: 'ทุกช่องทางเข้ามาที่เดียว', text: 'LINE, Facebook, Instagram และ Email ไหลเข้าสู่ CUTINEO', icon: MessageCircle },
  { number: '02', title: 'AI ช่วยทีมขายเดินต่อ', text: 'ตอบลูกค้า จำบริบท สรุปบทสนทนา และเตรียมใบเสนอราคา', icon: Sparkles },
  { number: '03', title: 'ติดตามจนปิดการขาย', text: 'เห็นดีลที่เงียบ พร้อมข้อความ Follow-up ที่ทีมตรวจสอบได้', icon: Clock3 },
];

export default function ScrollStoryPreview({ detailsHref }: ScrollStoryPreviewProps) {
  return (
    <section className={styles.storyPreviewSection} aria-labelledby="story-preview-title">
      <div className={styles.sectionShell}>
        <div className={styles.sectionHeading}>
          <div>
            <div className={styles.sectionKicker}>PRODUCT STORY</div>
            <h2 id="story-preview-title">จากแชทแรก <span>จนถึงดีลที่ปิด</span></h2>
          </div>
          <p>เลื่อนดูภาพรวมการทำงานของ CUTINEO แล้วดูรายละเอียด AI Sales แบบเต็มขั้นตอนได้ในหน้าแยก</p>
        </div>

        <div className={styles.storyPreviewGrid}>
          {previewSteps.map((step) => {
            const Icon = step.icon;
            return (
              <article className={styles.storyPreviewCard} key={step.number}>
                <div className={styles.storyPreviewTop}><span>{step.number}</span><Icon size={20} /></div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            );
          })}
        </div>

        <div className={styles.storyPreviewFlow} aria-hidden="true">
          <span>ข้อความ</span><b>→</b><span>AI Sales</span><b>→</b><span><FileText size={15} /> ดีล</span>
        </div>
        <a className={styles.textLink} href={detailsHref}>ดู AI Sales แบบเต็ม <ArrowRight size={15} /></a>
      </div>
    </section>
  );
}
