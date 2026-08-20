import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNeoStore } from '../state/neoStore';
import { makeEvent } from '../schemas/neoEvent.schema';
import type { OpenClawAdapter } from '../services/openClawAdapter';

interface ChatPanelProps {
  adapter: OpenClawAdapter;
  onClose: () => void;
}

type ChatLine = {
  id: string;
  role: 'neo' | 'user';
  text: string;
};

const welcomeMessage = '\u0e2a\u0e27\u0e31\u0e2a\u0e14\u0e35\u0e04\u0e23\u0e31\u0e1a\u0e19\u0e34\u0e27 \u0e1e\u0e34\u0e21\u0e1e\u0e4c\u0e04\u0e33\u0e16\u0e32\u0e21\u0e2b\u0e23\u0e37\u0e2d\u0e04\u0e33\u0e2a\u0e31\u0e48\u0e07\u0e44\u0e14\u0e49\u0e40\u0e25\u0e22';
const offlineReply = (text: string) => `\u0e23\u0e31\u0e1a\u0e02\u0e49\u0e2d\u0e04\u0e27\u0e32\u0e21\u0e41\u0e25\u0e49\u0e27\u0e04\u0e23\u0e31\u0e1a: “${text}”  \u0e15\u0e2d\u0e19\u0e19\u0e35\u0e49\u0e40\u0e1b\u0e47\u0e19 Offline Demo \u0e41\u0e15\u0e48\u0e1e\u0e23\u0e49\u0e2d\u0e21\u0e15\u0e48\u0e2d OpenClaw \u0e40\u0e21\u0e37\u0e48\u0e2d\u0e21\u0e35 WebSocket URL`;

export function ChatPanel({ adapter, onClose }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatLine[]>([
    { id: 'welcome', role: 'neo', text: welcomeMessage },
  ]);
  const state = useNeoStore((store) => store.state);
  const connection = useNeoStore((store) => store.connection);
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;

    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: 'user', text },
    ]);
    adapter.publishMock(makeEvent('model.thinking', {
      state: 'THINKING',
      title: '\u0e01\u0e33\u0e25\u0e31\u0e07\u0e1b\u0e23\u0e30\u0e21\u0e27\u0e25\u0e1c\u0e25\u0e04\u0e33\u0e2a\u0e31\u0e48\u0e07',
      message: `\u0e01\u0e33\u0e25\u0e31\u0e07\u0e04\u0e34\u0e14\u0e08\u0e32\u0e01\u0e04\u0e33\u0e2a\u0e31\u0e48\u0e07: ${text}`,
      severity: 'info',
    }));
    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        { id: `neo-${Date.now()}`, role: 'neo', text: offlineReply(text) },
      ]);
      adapter.publishMock(makeEvent('model.responding', {
        state: 'SPEAKING',
        title: '\u0e15\u0e2d\u0e1a\u0e01\u0e25\u0e31\u0e1a\u0e1c\u0e39\u0e49\u0e43\u0e0a\u0e49',
        message: '\u0e23\u0e31\u0e1a\u0e04\u0e33\u0e2a\u0e31\u0e48\u0e07\u0e41\u0e25\u0e49\u0e27\u0e04\u0e23\u0e31\u0e1a',
        severity: 'success',
      }));
    }, 700);
    setInput('');
  };

  return (
    <section className="chat-panel" aria-label="NEO compact assistant">
      <div className="panel-header">
        <div><span className="panel-eyebrow">CUTINEO CHAT</span><strong>\u0e2a\u0e19\u0e17\u0e19\u0e32\u0e01\u0e31\u0e1a NEO</strong></div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="\u0e1b\u0e34\u0e14\u0e41\u0e0a\u0e17">×</button>
      </div>
      <div className="chat-history" role="log" aria-live="polite">
        {messages.map((message) => (
          <div className={`chat-message ${message.role === 'neo' ? 'neo-message' : 'user-message'}`} key={message.id}>
            {message.text}
          </div>
        ))}
        <div ref={historyEndRef} />
      </div>
      <form className="chat-input-row" onSubmit={send}>
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="\u0e1e\u0e34\u0e21\u0e1e\u0e4c\u0e04\u0e33\u0e16\u0e32\u0e21\u0e43\u0e2b\u0e49 NEO..." aria-label="\u0e02\u0e49\u0e2d\u0e04\u0e27\u0e32\u0e21" autoFocus />
        <button type="submit" aria-label="\u0e2a\u0e48\u0e07\u0e02\u0e49\u0e2d\u0e04\u0e27\u0e32\u0e21">➤</button>
      </form>
      <div className="panel-footer">
        <span className={`connection-pill ${connection}`}>{connection === 'online' ? 'Online' : connection === 'connecting' ? 'Connecting' : 'Offline demo'}</span>
        <span>\u0e23\u0e30\u0e1a\u0e1a\u0e1e\u0e23\u0e49\u0e2d\u0e21\u0e17\u0e14\u0e25\u0e2d\u0e07</span>
      </div>
    </section>
  );
}
