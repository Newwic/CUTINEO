/* eslint-disable @next/next/no-img-element -- this widget is also bundled by Vite. */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Send, Square, UserRound, X } from 'lucide-react';
import { NEO_LOGO_PATH } from '../lib/branding';
import styles from './CustomerChatWidget.module.css';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  isStreaming?: boolean;
}

interface StreamEvent {
  type?: 'delta' | 'replace' | 'done' | 'error';
  text?: string;
  message?: string;
}

interface CustomerChatWidgetProps {
  apiUrl?: string;
}

const MAX_PROMPT_LENGTH = 2_000;

const initialMessage: ChatMessage = {
  id: 'neo-welcome',
  role: 'assistant',
  text: 'สวัสดีครับ! ผมคือ Neo ที่ปรึกษาประจำ CUTINEO ยินดีให้บริการครับ สนใจระบบรวมแชท แพ็กเกจ หรือการเชื่อมต่อช่องทาง สอบถามได้เลยครับ',
};

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseSseEvents(buffer: string): { events: StreamEvent[]; rest: string } {
  const chunks = buffer.split('\n\n');
  const rest = chunks.pop() ?? '';
  const events: StreamEvent[] = [];

  for (const chunk of chunks) {
    const dataLine = chunk.split('\n').find((line) => line.startsWith('data:'));
    if (!dataLine) continue;

    try {
      const payload = JSON.parse(dataLine.slice(5).trim()) as StreamEvent;
      events.push(payload);
    } catch {
      // Ignore malformed frames. The API emits one JSON data frame per event.
    }
  }

  return { events, rest };
}

export default function CustomerChatWidget({ apiUrl = '/api/chat-stream' }: CustomerChatWidgetProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const feedRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
    });
  }, []);

  const updateMessage = useCallback((id: string, update: (message: ChatMessage) => ChatMessage) => {
    setMessages((current) => current.map((message) => (
      message.id === id ? update(message) : message
    )));
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, scrollToBottom]);

  useEffect(() => () => abortRef.current?.abort(), []);

  if (pathname?.startsWith('/inbox') || pathname?.startsWith('/dashboard/inbox')) return null;

  const stopStreaming = () => {
    abortRef.current?.abort();
    abortRef.current = null;
  };

  const sendMessage = async () => {
    const userText = inputQuery.trim();
    if (!userText || isLoading) return;

    if (userText.length > MAX_PROMPT_LENGTH) {
      setErrorMessage(`ข้อความยาวเกินไป กรุณาใช้ไม่เกิน ${MAX_PROMPT_LENGTH.toLocaleString()} ตัวอักษรครับ`);
      return;
    }

    setErrorMessage('');
    setInputQuery('');

    const assistantId = createMessageId();
    const userMessage: ChatMessage = { id: createMessageId(), role: 'user', text: userText };
    const assistantMessage: ChatMessage = { id: assistantId, role: 'assistant', text: '', isStreaming: true };
    const history = messages.map(({ role, text }) => ({ role, text }));

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ prompt: userText, history }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let serverMessage = 'ไม่สามารถเชื่อมต่อ Neo ได้ในขณะนี้ครับ';
        try {
          const payload = await response.json() as { error?: unknown };
          if (typeof payload.error === 'string') serverMessage = payload.error;
        } catch {
          // Keep the safe generic message for non-JSON responses.
        }
        throw new Error(serverMessage);
      }

      if (!response.body) throw new Error('ไม่พบช่องสัญญาณตอบกลับจากระบบครับ');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const applyEvents = (events: StreamEvent[]) => {
        for (const event of events) {
          if (event.type === 'delta' && typeof event.text === 'string') {
            updateMessage(assistantId, (message) => ({ ...message, text: message.text + event.text }));
          }
          if (event.type === 'replace' && typeof event.text === 'string') {
            updateMessage(assistantId, (message) => ({ ...message, text: event.text ?? '' }));
          }
          if (event.type === 'error') throw new Error(event.message || 'การตอบกลับขัดข้องครับ');
        }
        scrollToBottom();
      };

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
        const parsed = parseSseEvents(buffer);
        buffer = parsed.rest;
        applyEvents(parsed.events);
        if (done) break;
      }

      if (buffer.trim()) applyEvents(parseSseEvents(`${buffer}\n\n`).events);
      updateMessage(assistantId, (message) => ({ ...message, isStreaming: false }));
    } catch (error) {
      const isAbort = error instanceof DOMException && error.name === 'AbortError';
      updateMessage(assistantId, (message) => ({
        ...message,
        text: message.text || (isAbort
          ? 'หยุดการตอบแล้วครับ หากต้องการถามต่อ ส่งข้อความใหม่ได้เลยครับ'
          : 'ขออภัยครับ ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งครับ'),
        isStreaming: false,
      }));
      if (!isAbort) setErrorMessage(error instanceof Error ? error.message : 'ระบบขัดข้องชั่วคราวครับ');
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setIsLoading(false);
      scrollToBottom();
    }
  };

  return (
    <div className={styles.wrapper}>
      {!isOpen ? (
        <button
          type="button"
          className={styles.launcher}
          onClick={() => setIsOpen(true)}
          aria-label="เปิดแชทปรึกษา Neo AI"
        >
          <img className={styles.launcherLogo} src={NEO_LOGO_PATH} alt="" aria-hidden="true" />
          <span>ปรึกษา Neo AI</span>
        </button>
      ) : (
        <section className={styles.box} role="dialog" aria-modal="false" aria-label="Neo ที่ปรึกษา CUTINEO">
          <header className={styles.header}>
            <div className={styles.headerInfo}>
              <img className={styles.headerLogo} src={NEO_LOGO_PATH} alt="Neo" />
              <span className={styles.statusDot} aria-hidden="true" />
              <div>
                <div className={styles.headerTitle}>Neo · ที่ปรึกษา CUTINEO</div>
                <div className={styles.headerSubtitle}>แนะนำแพ็กเกจและการเชื่อมต่อช่องทาง</div>
              </div>
            </div>
            <button type="button" className={styles.closeButton} onClick={() => setIsOpen(false)} aria-label="ปิดหน้าต่างแชท">
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <div ref={feedRef} className={styles.feed} aria-live="polite" aria-label="ประวัติการสนทนา">
            {messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                  <div key={message.id} className={`${styles.messageRow} ${isUser ? styles.messageRowUser : ''}`}>
                  <div className={styles.avatar} aria-hidden="true">
                    {isUser ? <UserRound size={14} /> : <img className={styles.avatarLogo} src={NEO_LOGO_PATH} alt="" />}
                  </div>
                  <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.assistantBubble}`}>
                    {message.text}
                    {message.isStreaming && <span className={styles.streamCursor}>▍</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {errorMessage && <p className={styles.error} role="alert">{errorMessage}</p>}

          <form
            className={styles.inputArea}
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage();
            }}
          >
            <div className={styles.inputContainer}>
              <input
                className={styles.input}
                value={inputQuery}
                onChange={(event) => setInputQuery(event.target.value)}
                placeholder="พิมพ์สอบถามแพ็กเกจหรือบริการ..."
                aria-label="ข้อความถึง Neo"
                maxLength={MAX_PROMPT_LENGTH}
                disabled={isLoading}
              />
              {isLoading ? (
                <button type="button" className={styles.stopButton} onClick={stopStreaming} aria-label="หยุดการตอบ">
                  <Square size={14} fill="currentColor" aria-hidden="true" />
                </button>
              ) : (
                <button type="submit" className={styles.sendButton} disabled={!inputQuery.trim()} aria-label="ส่งข้อความ">
                  <Send size={15} aria-hidden="true" />
                </button>
              )}
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
