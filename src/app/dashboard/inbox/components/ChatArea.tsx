'use client';

import { Bot, Check, Loader2, Send, StickyNote, UserRound } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { supabaseClient } from '@/lib/supabase/client';

interface ChatAreaProps {
  conversation: any;
}

function formatTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatArea({ conversation }: ChatAreaProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [assignedTo, setAssignedTo] = useState(conversation.assigned_to);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAssignedTo(conversation.assigned_to);
  }, [conversation.assigned_to, conversation.id]);

  useEffect(() => {
    const client = supabaseClient;
    if (!client) {
      setError('ยังไม่ได้ตั้งค่า Supabase');
      return;
    }
    const db = client;

    let mounted = true;
    setMessages([]);
    setError('');

    async function fetchMessages() {
      const { data, error: fetchError } = await db
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (!mounted) return;
      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      setMessages(data ?? []);
    }

    void fetchMessages();

    const realtime = db
      .channel(`chat:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          setMessages((current) =>
            current.some((message) => message.id === payload.new.id)
              ? current
              : [...current, payload.new],
          );
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      void db.removeChannel(realtime);
    };
  }, [conversation.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  async function toggleAssignment() {
    const client = supabaseClient;
    if (!client) return;

    const next = assignedTo === 'ai_agent' ? 'human_agent' : 'ai_agent';
    const { error: updateError } = await client
      .from('conversations')
      .update({ assigned_to: next })
      .eq('id', conversation.id)
      .eq('tenant_id', conversation.tenant_id);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setAssignedTo(next);
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    const client = supabaseClient;
    if (!client) {
      setError('ยังไม่ได้ตั้งค่า Supabase');
      return;
    }

    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) {
      setError('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    setSending(true);
    setError('');

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
          messageType: isInternal ? 'internal_note' : 'text',
        }),
      });

      const result = (await response.json().catch(() => null)) as { error?: string; id?: string } | null;
      if (!response.ok) throw new Error(result?.error || 'ส่งข้อความไม่สำเร็จ');

      setInput('');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'ส่งข้อความไม่สำเร็จ');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h2 className="truncate font-black text-slate-900">{conversation.contacts?.display_name || 'ลูกค้า'}</h2>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {conversation.channels?.platform?.toUpperCase() || 'CHANNEL'} · {conversation.contact_id}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleAssignment}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition ${assignedTo === 'ai_agent' ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
        >
          {assignedTo === 'ai_agent' ? <Bot size={14} aria-hidden="true" /> : <UserRound size={14} aria-hidden="true" />}
          <span className="hidden sm:inline">{assignedTo === 'ai_agent' ? 'สลับให้แอดมินตอบ' : 'สลับให้ AI ตอบ'}</span>
          <span className="sm:hidden">{assignedTo === 'ai_agent' ? 'AI' : 'ทีม'}</span>
        </button>
      </div>

      {error && <div className="shrink-0 border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">{error}</div>}

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-4 sm:p-6">
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center text-sm text-slate-400">ยังไม่มีข้อความในบทสนทนานี้</div>
        ) : (
          messages.map((message) => {
            const customer = message.sender_type === 'customer';
            const note = message.message_type === 'internal_note';

            if (note) {
              return (
                <div key={message.id} className="mx-auto max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <span className="mb-1 flex items-center gap-1 text-xs font-black"><StickyNote size={13} aria-hidden="true" /> โน้ตภายในทีม</span>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className="mt-1 text-right text-[10px] text-amber-600">{formatTime(message.created_at)}</p>
                </div>
              );
            }

            return (
              <div key={message.id} className={`flex ${customer ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm sm:max-w-[70%] ${customer ? 'rounded-tl-md border border-slate-200 bg-white text-slate-800' : 'rounded-tr-md bg-indigo-600 text-white'}`}>
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${customer ? 'text-slate-400' : 'text-indigo-200'}`}>
                    {!customer && <Check size={11} aria-hidden="true" />}
                    {formatTime(message.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSend} className="shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsInternal((current) => !current)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${isInternal ? 'border-amber-300 bg-amber-100 text-amber-800' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
          >
            <StickyNote size={13} aria-hidden="true" /> {isInternal ? 'โน้ตภายในทีม' : 'เพิ่มโน้ตภายใน'}
          </button>
          <span className="text-[11px] text-slate-400">{input.length}/4,000</span>
        </div>
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value.slice(0, 4000))}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={isInternal ? 'พิมพ์โน้ตถึงทีม (ลูกค้าจะไม่เห็น)…' : 'พิมพ์ข้อความตอบกลับลูกค้า…'}
            className="max-h-32 min-h-11 flex-1 resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            aria-label={isInternal ? 'บันทึกโน้ต' : 'ส่งข้อความ'}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <Send size={17} aria-hidden="true" />}
          </button>
        </div>
      </form>
    </div>
  );
}
