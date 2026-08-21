'use client';

import Image from 'next/image';
import {
  Check,
  ChevronDown,
  Info,
  Menu,
  MoreHorizontal,
  Paperclip,
  Phone,
  Send,
  Smile,
  Sparkles,
  Zap,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { NEO_LOGO_PATH } from '@/lib/branding';
import {
  messageRole,
  relatedRecord,
  type InboxConversation,
  type InboxMessage,
} from '../types';

interface ChatAreaProps {
  conversation: InboxConversation;
  onOpenNav?: () => void;
  onOpenConversations?: () => void;
  onPreviewUpdate?: (conversationId: string, preview: string) => void;
  onNotice?: (message: string) => void;
}

const demoReplies = [
  'ได้เลยค่ะ เดี๋ยว Neo ช่วยเช็กข้อมูลให้ทันทีนะคะ ✨',
  'รับทราบค่ะ ตอนนี้มีทีมงานพร้อมช่วยดูแลต่อให้แล้วนะคะ',
  'คำถามนี้ Neo ช่วยสรุปให้ได้ค่ะ ถ้าต้องการรายละเอียดเพิ่ม แจ้งได้เลยนะคะ',
];

function createMessageId(prefix = 'message') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function dateAt(minutesAgo: number) {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString();
}

function demoMessage(
  id: string,
  conversationId: string,
  role: 'user' | 'ai',
  content: string,
  minutesAgo: number,
  isStreaming = false,
): InboxMessage {
  return {
    id,
    conversation_id: conversationId,
    content,
    created_at: dateAt(minutesAgo),
    role,
    sender_type: role === 'ai' ? 'ai_agent' : 'customer',
    isStreaming,
  };
}

function getDemoMessages(conversation: Pick<InboxConversation, 'id' | 'contacts'>): InboxMessage[] {
  const id = conversation.id;
  if (id === 'demo-aom') {
    return [
      demoMessage('aom-1', id, 'user', 'สวัสดีค่ะ อยากสอบถามแพ็กเกจ Pro หน่อยค่ะ', 28),
      demoMessage('aom-2', id, 'ai', 'สวัสดีค่ะคุณอ้อม 👋 Neo ช่วยดูข้อมูลแพ็กเกจให้ได้เลยค่ะ', 27),
      demoMessage('aom-3', id, 'user', 'ถ้าสมัครวันนี้ มีส่วนลดหรือสิทธิ์ทดลองใช้ไหมคะ?', 12),
      demoMessage('aom-4', id, 'ai', 'มีค่ะ ตอนนี้แพ็กเกจ Pro ทดลองใช้ได้ 14 วัน และยกเลิกได้ทุกเมื่อค่ะ', 11),
      demoMessage('aom-5', id, 'user', 'โอเคเลยค่ะ ขอให้ช่วยแนะนำขั้นตอนสมัครด้วยนะคะ', 2),
      demoMessage('aom-6', id, 'ai', 'ได้เลยค่ะ กำลังเตรียมขั้นตอนสมัครให้คุณอ้อม', 1, true),
    ];
  }

  if (id === 'demo-bua') {
    return [
      demoMessage('bua-1', id, 'user', 'ขอเช็กสถานะออเดอร์ล่าสุดให้หน่อยค่ะ', 39),
      demoMessage('bua-2', id, 'ai', 'ได้เลยค่ะ Neo กำลังตรวจสอบเลขคำสั่งซื้อให้ค่ะ', 38),
      demoMessage('bua-3', id, 'user', 'เลขออเดอร์ #CN-8421 ค่ะ', 34),
      demoMessage('bua-4', id, 'ai', 'ออเดอร์ #CN-8421 อยู่ระหว่างจัดส่ง คาดว่าจะถึงพรุ่งนี้ก่อน 18:00 น. ค่ะ', 31),
    ];
  }

  if (id === 'demo-chai') {
    return [
      demoMessage('chai-1', id, 'user', 'มีแพ็กเกจสำหรับทีมเล็กไหมครับ', 75),
      demoMessage('chai-2', id, 'ai', 'มีค่ะ แพ็กเกจ Starter รองรับทีม 3 คน เหมาะกับทีมเล็กและเริ่มใช้งานได้ทันทีครับ', 73),
    ];
  }

  const name = relatedRecord(conversation.contacts)?.display_name || 'ลูกค้า';
  return [
    demoMessage(`${id}-1`, id, 'user', `สวัสดีครับ ทีม CUTINEO ช่วยดูเรื่องนี้ให้หน่อยได้ไหมครับ`, 22),
    demoMessage(`${id}-2`, id, 'ai', `สวัสดีค่ะคุณ${name.replace(/\s.*/, '')} 👋 Neo พร้อมช่วยดูแลค่ะ`, 20),
  ];
}

function formatTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getChannelLabel(conversation: InboxConversation) {
  const channel = relatedRecord(conversation.channels);
  return (channel?.name || channel?.platform || 'Channel').toUpperCase();
}

function getAutoReply(conversation: InboxConversation, content: string) {
  const lower = content.toLowerCase();
  if (lower.includes('ราคา') || lower.includes('แพ็กเกจ') || lower.includes('price')) {
    return 'ได้เลยค่ะ Neo สรุปแพ็กเกจที่เหมาะกับคุณให้แล้วนะคะ ต้องการให้ส่งรายละเอียดแบบเต็มให้ดูไหมคะ?';
  }
  if (lower.includes('ออเดอร์') || lower.includes('order') || lower.includes('ส่ง')) {
    return 'รับเรื่องแล้วค่ะ Neo กำลังตรวจสอบสถานะล่าสุดให้ และจะแจ้งอัปเดตในแชทนี้ทันทีค่ะ';
  }
  const index = Math.floor(Math.random() * demoReplies.length);
  return demoReplies[index];
}

function normalizeLiveMessages(data: unknown): InboxMessage[] {
  if (!Array.isArray(data)) return [];
  return data.filter((message): message is InboxMessage => (
    Boolean(message)
    && typeof message === 'object'
    && typeof (message as InboxMessage).id === 'string'
    && typeof (message as InboxMessage).content === 'string'
  ));
}

export default function ChatArea({
  conversation,
  onOpenNav,
  onOpenConversations,
  onPreviewUpdate,
  onNotice,
}: ChatAreaProps) {
  const contact = relatedRecord(conversation.contacts);
  const name = contact?.display_name || 'Unknown customer';
  const channelLabel = getChannelLabel(conversation);
  const conversationId = conversation.id;
  const isDemoConversation = Boolean(conversation.isDemo);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [input, setInput] = useState('');
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [copilotOn, setCopilotOn] = useState(conversation.assigned_to !== 'human_agent');
  const [error, setError] = useState('');
  const feedRef = useRef<HTMLDivElement>(null);
  const streamTimerRef = useRef<number | null>(null);

  const clearStreamTimer = () => {
    if (streamTimerRef.current !== null) {
      window.clearTimeout(streamTimerRef.current);
      streamTimerRef.current = null;
    }
  };

  useEffect(() => {
    setCopilotOn(conversation.assigned_to !== 'human_agent');
  }, [conversation.assigned_to, conversation.id]);

  useEffect(() => {
    let mounted = true;
    const client = supabaseClient;
    clearStreamTimer();
    setStreamingId(null);
    setError('');

    if (isDemoConversation || !client) {
      setMessages(getDemoMessages({ id: conversationId, contacts: { display_name: name } }));
      return () => {
        mounted = false;
        clearStreamTimer();
      };
    }

    const liveClient = client;
    setMessages([]);

    async function fetchMessages() {
      const { data, error: fetchError } = await liveClient
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!mounted) return;
      if (fetchError) {
        setError('โหลดข้อความจริงไม่สำเร็จ กำลังแสดงตัวอย่างแทน');
        setMessages(getDemoMessages({ id: conversationId, contacts: { display_name: name } }));
        return;
      }
      setMessages(normalizeLiveMessages(data));
    }

    void fetchMessages();

    const realtime = liveClient
      .channel(`inbox-chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = payload.new as InboxMessage;
          setMessages((current) => (
            current.some((message) => message.id === incoming.id)
              ? current
              : [...current, incoming]
          ));
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      clearStreamTimer();
      void liveClient.removeChannel(realtime);
    };
  }, [conversationId, isDemoConversation, name]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (feedRef.current) {
        feedRef.current.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
      }
    });
  }, [messages, streamingId]);

  useEffect(() => () => clearStreamTimer(), []);

  const conversationStatus = useMemo(() => {
    if (conversation.status === 'pending_human') return 'Needs your attention';
    return 'Online now';
  }, [conversation.status]);

  async function persistLiveMessage(localId: string, content: string) {
    if (conversation.isDemo || !supabaseClient) return;
    const { data: sessionData } = await supabaseClient.auth.getSession();
    if (!sessionData.session) return;

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          conversationId: conversation.id,
          tenantId: conversation.tenant_id,
          content,
          messageType: 'text',
        }),
      });
      const result = await response.json().catch(() => null) as InboxMessage | { error?: string } | null;
      if (!response.ok) throw new Error(result && 'error' in result ? result.error : 'ส่งข้อความไม่สำเร็จ');
      if (result && 'id' in result && typeof result.id === 'string') {
        setMessages((current) => current.map((message) => (
          message.id === localId ? { ...message, ...result, pending: false } : message
        )));
      }
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'ส่งข้อความไม่สำเร็จ');
    }
  }

  function streamReply(replyId: string, content: string) {
    let cursor = 0;
    const step = Math.max(2, Math.ceil(content.length / 44));

    const tick = () => {
      cursor = Math.min(content.length, cursor + step);
      setMessages((current) => current.map((message) => (
        message.id === replyId
          ? { ...message, content: content.slice(0, cursor), isStreaming: cursor < content.length }
          : message
      )));

      if (cursor < content.length) {
        streamTimerRef.current = window.setTimeout(tick, 38);
      } else {
        streamTimerRef.current = null;
        setStreamingId(null);
      }
    };

    streamTimerRef.current = window.setTimeout(tick, 420);
  }

  function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    if (!content || streamingId) return;

    const localId = createMessageId('local');
    const replyId = createMessageId('neo');
    const now = new Date().toISOString();
    const userMessage: InboxMessage = {
      id: localId,
      conversation_id: conversation.id,
      sender_type: 'human_agent',
      content,
      created_at: now,
      pending: true,
      role: 'user',
    };
    const replyMessage: InboxMessage = {
      id: replyId,
      conversation_id: conversation.id,
      sender_type: 'ai_agent',
      content: '',
      created_at: new Date(Date.now() + 500).toISOString(),
      isStreaming: true,
      role: 'ai',
    };

    setInput('');
    setError('');
    setStreamingId(replyId);
    setMessages((current) => [
      ...current.map((message) => ({ ...message, isStreaming: false })),
      userMessage,
      replyMessage,
    ]);
    onPreviewUpdate?.(conversation.id, content);
    void persistLiveMessage(localId, content);
    streamReply(replyId, getAutoReply(conversation, content));
  }

  async function toggleCopilot() {
    const nextValue = !copilotOn;
    setCopilotOn(nextValue);
    onNotice?.(nextValue ? 'Neo AI กลับมาดูแลห้องนี้แล้ว' : 'หยุด Neo AI ชั่วคราวสำหรับห้องนี้แล้ว');

    if (conversation.isDemo || !supabaseClient) return;
    const { data: sessionData } = await supabaseClient.auth.getSession();
    if (!sessionData.session) return;
    try {
      const response = await fetch('/api/conversations/assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          conversationId: conversation.id,
          assignedTo: nextValue ? 'ai_agent' : 'human_agent',
          status: nextValue ? 'open' : 'pending_human',
        }),
      });
      if (!response.ok) throw new Error('เปลี่ยนโหมดผู้ดูแลไม่สำเร็จ');
    } catch (toggleError) {
      setCopilotOn(!nextValue);
      setError(toggleError instanceof Error ? toggleError.message : 'เปลี่ยนโหมดผู้ดูแลไม่สำเร็จ');
    }
  }

  return (
    <section className="chat-area">
      <header className="chat-header">
        <div className="mobile-header-actions">
          <button type="button" className="icon-button" onClick={onOpenNav} aria-label="เปิดเมนูหลัก">
            <Menu size={18} aria-hidden="true" />
          </button>
          <button type="button" className="icon-button" onClick={onOpenConversations} aria-label="เปิดรายการบทสนทนา">
            <ChevronDown size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="chat-contact">
          <div className="large-avatar" aria-hidden="true">{name.slice(0, 2).toUpperCase()}</div>
          <div className="chat-contact-copy">
            <div className="chat-contact-title-row">
              <h2>{name}</h2>
              <span className="online-indicator"><span />{conversationStatus}</span>
            </div>
            <p><span className="channel-inline-dot channel-line" />{channelLabel} <span className="dot-separator">•</span> Customer since today</p>
          </div>
        </div>

        <div className="chat-header-actions">
          <div className="neo-specialist" title="Neo • CUTINEO Specialist">
            <Image
              className="neo-specialist-logo"
              src={NEO_LOGO_PATH}
              alt="Neo"
              width={32}
              height={32}
            />
            <span className="neo-specialist-copy">
              <strong>Neo • CUTINEO Specialist</strong>
              <small>AI assistant</small>
            </span>
          </div>
          <button
            type="button"
            className={`copilot-pill ${copilotOn ? 'is-on' : 'is-off'}`}
            onClick={() => void toggleCopilot()}
          >
            <Sparkles size={14} aria-hidden="true" />
            <span>{copilotOn ? 'Neo AI active' : 'AI paused'}</span>
          </button>
          <span className="action-divider" aria-hidden="true" />
          <button type="button" className="icon-button header-icon-button" aria-label="โทรหา customer" title="Call customer">
            <Phone size={17} aria-hidden="true" />
          </button>
          <button type="button" className="icon-button header-icon-button" aria-label="ดูรายละเอียด" title="Conversation details">
            <Info size={17} aria-hidden="true" />
          </button>
          <button type="button" className="icon-button header-icon-button" aria-label="เมนูเพิ่มเติม" title="More actions">
            <MoreHorizontal size={19} aria-hidden="true" />
          </button>
        </div>
      </header>

      {error && <div className="chat-error" role="status">{error}</div>}

      <div className="message-feed" ref={feedRef} aria-live="polite">
        <div className="feed-date"><span>Today</span></div>
        {messages.length === 0 ? (
          <div className="message-empty">
            <Image
              className="neo-avatar neo-avatar-large"
              src={NEO_LOGO_PATH}
              alt="Neo AI"
              width={45}
              height={45}
            />
            <strong>เริ่มต้นบทสนทนากับ {name}</strong>
            <span>พิมพ์ข้อความแรกได้เลย</span>
          </div>
        ) : (
          messages.map((message) => {
            const isAi = messageRole(message) === 'ai';
            const isStreaming = Boolean(message.isStreaming || message.id === streamingId);
            return (
              <div key={message.id} className={`message-row ${isAi ? 'message-row-ai' : 'message-row-user'}`}>
                {isAi ? (
                  <Image
                    className="neo-avatar"
                    src={NEO_LOGO_PATH}
                    alt="Neo AI"
                    width={31}
                    height={31}
                  />
                ) : <span className="message-avatar-placeholder" aria-hidden="true" />}
                <div className={`message-content ${isAi ? 'message-content-ai' : 'message-content-user'}`}>
                  <div className="message-meta">
                    <span>{isAi ? 'Neo AI' : 'You'}</span>
                    <time dateTime={message.created_at}>{formatTime(message.created_at)}</time>
                    {message.pending && <span className="pending-label">Sending...</span>}
                  </div>
                  <div className={`message-bubble ${isAi ? 'message-bubble-ai' : 'message-bubble-user'} ${isStreaming ? 'is-streaming' : ''}`}>
                    {message.content ? <p>{message.content}</p> : <span className="typing-dots"><i /><i /><i /></span>}
                    {isStreaming && <span className="stream-cursor" aria-label="กำลังพิมพ์">▍</span>}
                  </div>
                  {!isAi && !message.pending && (
                    <span className="message-delivered"><Check size={12} aria-hidden="true" /> Delivered</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <footer className="composer-area">
        <div className="composer-status-row">
          <span className="composer-context"><Zap size={13} aria-hidden="true" /> Replying as <strong>Team CUTINEO</strong></span>
          <span className="composer-shortcut">Enter to send <span>•</span> Shift + Enter for new line</span>
        </div>
        <form className="composer" onSubmit={handleSend}>
          <button type="button" className="composer-tool" aria-label="แนบไฟล์" title="Attach file">
            <Paperclip size={18} aria-hidden="true" />
          </button>
          <textarea
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value.slice(0, 4_000))}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={`Reply to ${name}...`}
            aria-label="พิมพ์ข้อความตอบกลับ"
            disabled={Boolean(streamingId)}
          />
          <button type="button" className="composer-tool composer-emoji" aria-label="เพิ่มอีโมจิ" title="Add emoji">
            <Smile size={18} aria-hidden="true" />
          </button>
          <button
            type="submit"
            className="send-button"
            disabled={!input.trim() || Boolean(streamingId)}
            aria-label="ส่งข้อความ"
          >
            <Send size={17} aria-hidden="true" />
          </button>
        </form>
        <p className="composer-disclaimer">ไม่ต้องใช้บัตรเครดิต <span>•</span> ยกเลิกได้ทุกเมื่อ</p>
      </footer>
    </section>
  );
}
