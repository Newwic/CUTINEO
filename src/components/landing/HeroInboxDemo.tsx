/* eslint-disable @next/next/no-img-element -- shared Vite/Next marketing mock */
'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Check, Inbox, Paperclip, Search, Sparkles } from 'lucide-react';
import { integrations } from '../../config/integrations';
import styles from './HomepageV2.module.css';

const inboxItems = ['Inbox', 'แยกช่อง', 'รอดำเนินการ', 'ติดตามลูกค้า', 'ปิดการขาย', 'ลูกค้า', 'รายงาน', 'ตั้งค่า'];

const conversations = [
  { name: 'สมชาย มีเดช', channel: 'LINE', integration: 'line', preview: 'ขอรายละเอียดสินค้า รุ่น A หน่อยครับ', badge: 'SM' },
  { name: 'ABC Company', channel: 'Gmail', integration: 'gmail', preview: 'ขอใบเสนอราคา 2 เครื่องครับ', badge: 'AB' },
  { name: 'Nattaya', channel: 'Instagram', integration: 'instagram', preview: 'สินค้ายังมีอยู่ไหมคะ?', badge: 'NA' },
  { name: 'Weerawat', channel: 'Messenger', integration: 'messenger', preview: 'ส่งต่างจังหวัดได้ไหมครับ', badge: 'WE' },
  { name: 'Global Design', channel: 'Outlook', integration: 'outlook', preview: 'Request quotation', badge: 'GD' },
];

const replies = [
  'รุ่น A มี 2 แพ็กครับ เริ่มต้นที่ 25,900 บาท และ Pro ราคา 32,900 บาทครับ',
  'มี 2 แพ็กเกจให้เลือกครับ เดี๋ยวผมสรุปความต่างให้ดูแบบสั้น ๆ ได้เลย',
  'สามารถสร้างใบเสนอราคาให้ได้ทันทีครับ ขอจำนวนสินค้าที่ต้องการเพิ่มอีกนิดนะครับ',
];

function logoFor(id: string) {
  return integrations.find((integration) => integration.id === id)?.logo ?? '';
}

function ChannelLogo({ id }: { id: string }) {
  return (
    <span className={styles.channelLogo}>
      <img src={logoFor(id)} alt="" width="22" height="22" onError={(event) => { event.currentTarget.hidden = true; }} />
    </span>
  );
}

export default function HeroInboxDemo() {
  const [selectedConversation, setSelectedConversation] = useState(0);
  const [replyIndex, setReplyIndex] = useState(0);
  const [draft, setDraft] = useState('');
  const [sentMessage, setSentMessage] = useState('');

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setReplyIndex((current) => (current + 1) % replies.length), 3600);
    return () => window.clearInterval(timer);
  }, []);

  const conversation = conversations[selectedConversation];
  const assistantReply = sentMessage
    ? 'รับข้อความแล้วครับ Neo ช่วยร่างคำตอบจากข้อมูลสินค้าและประวัติการคุยให้ทีมตรวจสอบได้ทันที'
    : replies[replyIndex];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message) return;
    setSentMessage(message);
    setDraft('');
  };

  const categoryCounts = useMemo(() => ({ inbox: 32, pending: 12, followup: 8 }), []);

  return (
    <div className={styles.inboxDemo} aria-label="ตัวอย่าง CUTINEO Unified Inbox">
      <div className={styles.demoTopbar}>
        <div className={styles.demoBrand}>
          <span className={styles.demoBrandLogo}>N</span>
          <strong>CUTINEO</strong>
        </div>
        <div className={styles.demoTopActions}>
          <span className={styles.demoLive}><span /> AI online</span>
          <button type="button" aria-label="ตัวเลือกตัวอย่าง">•••</button>
        </div>
      </div>

      <div className={styles.demoWorkspace}>
        <aside className={styles.demoSidebar}>
          <span className={styles.demoEyebrow}>WORKSPACE</span>
          <nav aria-label="เมนูในตัวอย่าง">
            {inboxItems.map((item, index) => (
              <button className={index === 0 ? styles.demoNavActive : ''} type="button" key={item}>
                <span className={styles.demoNavIcon}>{index === 0 ? <Inbox size={13} /> : <span>{['◌', '◷', '↗', '✓', '♙', '▥', '⚙'][index - 1]}</span>}</span>
                <span>{item}</span>
                {index === 1 && <b>{categoryCounts.pending}</b>}
                {index === 3 && <b>{categoryCounts.followup}</b>}
              </button>
            ))}
          </nav>
          <div className={styles.demoSidebarFoot}><span className={styles.demoAvatar}>น</span><span>ทีมขาย CUTINEO</span></div>
        </aside>

        <section className={styles.demoConversationList} aria-label="รายการบทสนทนา">
          <div className={styles.demoListHead}>
            <div>
              <span className={styles.demoEyebrow}>TODAY</span>
              <strong>Inbox <small>{categoryCounts.inbox}</small></strong>
            </div>
            <button type="button" aria-label="ค้นหาบทสนทนา"><Search size={15} /></button>
          </div>
          <div className={styles.demoSearch}><Search size={13} /><span>ค้นหาบทสนทนา</span></div>
          <div className={styles.demoConversationItems}>
            {conversations.map((item, index) => (
              <button
                className={`${styles.demoConversationItem} ${index === selectedConversation ? styles.demoConversationActive : ''}`}
                type="button"
                key={item.name}
                onClick={() => { setSelectedConversation(index); setSentMessage(''); }}
              >
                <ChannelLogo id={item.integration} />
                <span className={styles.demoConversationCopy}>
                  <strong>{item.name}</strong>
                  <small><span className={styles.demoStatusDot} /> {item.channel} · {index === 0 ? '10:24' : `${9 + index}:5${index}`}</small>
                  <em>{item.preview}</em>
                </span>
                {index < 2 && <b className={styles.demoUnread}>{index + 1}</b>}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.demoChat} aria-label="ตัวอย่างห้องแชท">
          <header className={styles.demoChatHead}>
            <div className={styles.demoCustomerAvatar}>{conversation.badge.slice(0, 1)}</div>
            <div className={styles.demoCustomerCopy}>
              <strong>{conversation.name}</strong>
              <small><span className={styles.demoStatusDot} /> {conversation.channel}</small>
            </div>
            <button type="button">ดำเนินการต่อกับแอดมิน⌄</button>
          </header>
          <div className={styles.demoMessages} aria-live="polite">
            <span className={styles.demoDate}>วันนี้ · 10:24</span>
            <div className={`${styles.demoBubble} ${styles.demoBubbleCustomer}`}>{sentMessage || conversation.preview}</div>
            <div className={`${styles.demoBubble} ${styles.demoBubbleAi}`}>
              <span className={styles.demoAiLabel}><Sparkles size={12} /> AI Assistant</span>
              <span>{assistantReply}</span>
            </div>
            <div className={`${styles.demoBubble} ${styles.demoBubbleCustomer} ${styles.demoBubbleShort}`}>ขอใบเสนอราคาครับ</div>
            <span className={styles.demoTyping}><span /> Neo กำลังช่วยร่างคำตอบ...</span>
          </div>
          <form className={styles.demoComposer} onSubmit={handleSubmit}>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="พิมพ์ข้อความตอบกลับ..." aria-label="ข้อความตัวอย่าง" />
            <button type="button" aria-label="แนบไฟล์"><Paperclip size={14} /></button>
            <button className={styles.demoSend} type="submit" aria-label="ส่งข้อความ"><ArrowUpRight size={15} /></button>
          </form>
        </section>
      </div>

      <div className={styles.demoFloatingStatus}><Sparkles size={17} /><span>AI กำลังช่วยตอบลูกค้า...</span><Check size={15} /></div>
    </div>
  );
}
