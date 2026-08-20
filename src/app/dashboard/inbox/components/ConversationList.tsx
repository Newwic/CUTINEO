'use client';

import { Bot, Inbox, UserRound } from 'lucide-react';

interface ConversationListProps {
  conversations: any[];
  activeId: string | null;
  onSelect: (id: string) => void;
  compact?: boolean;
}

function formatTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  compact = false,
}: ConversationListProps) {
  return (
    <div className={`flex min-h-0 flex-col ${compact ? 'max-h-64' : 'h-full'}`}>
      {!compact && (
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Workspace</p>
              <h1 className="mt-1 text-xl font-black text-slate-900">Unified Inbox</h1>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
              <Inbox size={18} aria-hidden="true" />
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-500">{conversations.length} บทสนทนา</p>
        </div>
      )}

      <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">ยังไม่มีข้อความ</div>
        ) : (
          conversations.map((conversation) => {
            const customer = conversation.contacts;
            const channel = conversation.channels;
            const isAI = conversation.assigned_to === 'ai_agent';
            const isActive = activeId === conversation.id;

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onSelect(conversation.id)}
                className={`block w-full px-4 py-3 text-left transition hover:bg-slate-50 ${
                  isActive ? 'border-l-4 border-indigo-600 bg-indigo-50 pl-3' : 'border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                    {customer?.display_name?.charAt(0)?.toUpperCase() || 'ลูกค้า'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-bold text-slate-800">
                        {customer?.display_name || 'ลูกค้า'}
                      </span>
                      <span className="shrink-0 text-[11px] text-slate-400">{formatTime(conversation.last_message_at)}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {conversation.last_message_preview || 'ไม่มีข้อความ'}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${isAI ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {isAI ? <Bot size={11} aria-hidden="true" /> : <UserRound size={11} aria-hidden="true" />}
                        {isAI ? 'AI ตอบอยู่' : 'แอดมินดูแล'}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-slate-400">{channel?.platform || 'channel'}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
