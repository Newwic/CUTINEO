/* eslint-disable @next/next/no-img-element -- shared Vite/Next marketing assets */
'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { integrations, integrationCategories, type IntegrationStatus } from '../../config/integrations';
import { MotionGroup, MotionReveal } from '../motion/ScrollReveal';
import styles from './HomepageV2.module.css';

function StatusBadge({ status }: { status: IntegrationStatus }) {
  const label = status === 'available' ? 'พร้อมใช้งาน' : status === 'beta' ? 'Beta' : 'เร็ว ๆ นี้';
  return <span className={`${styles.integrationStatus} ${styles[`status_${status}`]}`}>{label}</span>;
}

interface IntegrationStripProps {
  compact?: boolean;
}

export default function IntegrationStrip({ compact = false }: IntegrationStripProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'messaging' | 'social' | 'email'>('all');
  const visibleIntegrations = activeCategory === 'all'
    ? integrations
    : integrations.filter((integration) => integration.category === activeCategory);
  const displayedIntegrations = compact ? visibleIntegrations.slice(0, 6) : visibleIntegrations;

  return (
    <section className={styles.integrationSection} id="integrations" aria-labelledby="integration-title">
      <div className={styles.sectionShell}>
        <div className={styles.sectionKicker}>CONNECT YOUR WORKSPACE</div>
        <MotionReveal className={styles.integrationHeadingRow} delay={60} dataMotion="right">
          <div>
            <h2 id="integration-title">เชื่อมต่อช่องทางที่ลูกค้าของคุณใช้อยู่</h2>
            <p>ดูสถานะตาม adapter ที่มีในระบบจริง ช่องที่ยังไม่พร้อมจะถูกระบุเป็น Beta หรือเร็ว ๆ นี้อย่างชัดเจน</p>
          </div>
          <div className={styles.integrationFilters} role="tablist" aria-label="กรองช่องทาง">
            <button type="button" className={activeCategory === 'all' ? styles.filterActive : ''} onClick={() => setActiveCategory('all')}>ทั้งหมด</button>
            {integrationCategories.map((category) => (
              <button type="button" className={activeCategory === category.id ? styles.filterActive : ''} onClick={() => setActiveCategory(category.id)} key={category.id}>{category.label}</button>
            ))}
          </div>
        </MotionReveal>
        <MotionGroup className={styles.integrationGrid} delay={120} dataMotion="stagger">
          {displayedIntegrations.map((integration) => (
            <article className={styles.integrationCard} key={integration.id}>
              <div className={styles.integrationLogo}><img src={integration.logo} alt={`${integration.name} logo`} width="32" height="32" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} /></div>
              <div className={styles.integrationCopy}>
                <strong>{integration.name}</strong>
                <StatusBadge status={integration.status} />
              </div>
            </article>
          ))}
        </MotionGroup>
        <p className={styles.trademarkNote}>ชื่อ ผลิตภัณฑ์ โลโก้ และเครื่องหมายการค้าของบุคคลที่สามเป็นทรัพย์สินของเจ้าของแต่ละราย การแสดงเครื่องหมายดังกล่าวใช้เพื่อระบุบริการที่ CUTINEO รองรับหรือมีแผนรองรับ และไม่ได้หมายถึงการรับรอง CUTINEO โดยเจ้าของเครื่องหมายการค้า</p>
      </div>
    </section>
  );
}
