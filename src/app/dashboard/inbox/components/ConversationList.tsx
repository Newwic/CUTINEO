'use client';

import { Plus, Search } from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';
import { relatedRecord, type InboxConversation } from '../types';

interface ConversationListProps {
  conversations: InboxConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewConversation?: () => void;
}

const avatarColors = ['#274c77', '#5b3f8c', '#7c3f58', '#1f6f68', '#735c2e', '#3d557d'];

function formatTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getInitials(name?: string | null) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function isUnread(conversation: InboxConversation) {
  return conversation.status === 'pending_human' || conversation.status === 'unread';
}

function getChannelMeta(platform?: string | null) {
  const normalized = (platform || 'channel').toLowerCase();
  if (normalized.includes('line')) return { label: 'LINE', className: 'channel-line' };
  if (normalized.includes('facebook')) return { label: 'f', className: 'channel-facebook' };
  if (normalized.includes('instagram')) return { label: '◎', className: 'channel-instagram' };
  return { label: '•', className: 'channel-generic' };
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNewConversation,
}: ConversationListProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const contact = relatedRecord(conversation.contacts);
      const preview = conversation.last_message_preview || '';
      const name = contact?.display_name || 'Unknown customer';
      const matchesQuery = !normalizedQuery
        || `${name} ${preview}`.toLowerCase().includes(normalizedQuery);
      const matchesFilter = filter === 'all' || isUnread(conversation);
      return matchesQuery && matchesFilter;
    });
  }, [conversations, filter, query]);

  const unreadCount = conversations.filter(isUnread).length;

  return (
    <div className="conversation-list">
      <header className="conversation-header">
        <div className="conversation-title-row">
          <div>
            <p className="eyebrow">WORKSPACE / INBOX</p>
            <h1>Conversations <span>{conversations.length}</span></h1>
          </div>
          <button
            type="button"
            className="square-button square-button-accent"
            onClick={onNewConversation}
            aria-label="สร้างบทสนทนาใหม่"
            title="New conversation"
          >
            <Plus size={17} aria-hidden="true" />
          </button>
        </div>

        <label className="conversation-search">
          <Search size={16} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations..."
            aria-label="ค้นหาบทสนทนา"
          />
          <kbd>⌘ K</kbd>
        </label>

        <div className="conversation-filters" role="tablist" aria-label="ตัวกรองบทสนทนา">
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            className={filter === 'all' ? 'is-active' : ''}
            onClick={() => setFilter('all')}
          >
            All <span>{conversations.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'unread'}
            className={filter === 'unread' ? 'is-active' : ''}
            onClick={() => setFilter('unread')}
          >
            Unread <span>{unreadCount}</span>
          </button>
        </div>
      </header>

      <div className="conversation-items" aria-label="รายการบทสนทนา">
        {filteredConversations.length === 0 ? (
          <div className="conversation-empty">
            <span className="empty-icon"><Search size={18} aria-hidden="true" /></span>
            <strong>ไม่พบบทสนทนา</strong>
            <span>ลองค้นหาด้วยชื่อลูกค้าหรือข้อความ</span>
          </div>
        ) : (
          filteredConversations.map((conversation, index) => {
            const contact = relatedRecord(conversation.contacts);
            const channel = relatedRecord(conversation.channels);
            const isActive = activeId === conversation.id;
            const channelMeta = getChannelMeta(channel?.platform);
            const initials = getInitials(contact?.display_name);
            const unread = isUnread(conversation);
            const color = avatarColors[index % avatarColors.length];

            return (
              <button
                key={conversation.id}
                type="button"
                className={`conversation-item ${isActive ? 'is-active' : ''}`}
                onClick={() => onSelect(conversation.id)}
                aria-current={isActive ? 'true' : undefined}
              >
                <div className="avatar-wrap">
                  <span
                    className="conversation-avatar"
                    style={{ '--avatar-bg': color } as CSSProperties}
                    aria-hidden="true"
                  >
                    {initials}
                  </span>
                  <span
                    className={`channel-badge ${channelMeta.className}`}
                    title={channel?.name || channel?.platform || 'Channel'}
                    aria-label={channel?.name || channel?.platform || 'Channel'}
                  >
                    {channelMeta.label}
                  </span>
                </div>

                <span className="conversation-copy">
                  <span className="conversation-item-topline">
                    <strong>{contact?.display_name || 'Unknown customer'}</strong>
                    <time dateTime={conversation.last_message_at || undefined}>
                      {formatTime(conversation.last_message_at)}
                    </time>
                  </span>
                  <span className={`conversation-preview ${unread ? 'is-unread' : ''}`}>
                    {conversation.last_message_preview || 'ยังไม่มีข้อความ'}
                  </span>
                  <span className="conversation-meta">
                    <span className={`mini-status ${conversation.assigned_to === 'ai_agent' ? 'is-ai' : 'is-team'}`}>
                      <span className="mini-status-dot" aria-hidden="true" />
                      {conversation.assigned_to === 'ai_agent' ? 'Neo AI' : 'Team'}
                    </span>
                    <span className="channel-name">{(channel?.name || channel?.platform || 'Channel').toUpperCase()}</span>
                    {unread && <span className="unread-dot" aria-label="ยังไม่ได้อ่าน" />}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>

      <footer className="conversation-footer">
        <span className="sync-indicator"><span />All channels synced</span>
        <span className="conversation-footer-count">{conversations.length} active</span>
      </footer>
    </div>
  );
}
