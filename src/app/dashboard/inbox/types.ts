export type InboxMessageRole = 'user' | 'ai';

export interface InboxContact {
  id?: string;
  display_name?: string | null;
  phone?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  tags?: string[] | null;
  notes?: string | null;
  created_at?: string | null;
}

export interface InboxChannel {
  id?: string;
  platform?: string | null;
  name?: string | null;
  is_active?: boolean;
}

export interface InboxConversation {
  id: string;
  tenant_id?: string | null;
  channel_id?: string | null;
  contact_id?: string | null;
  status?: string | null;
  assigned_to?: string | null;
  last_message_preview?: string | null;
  last_message_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  contacts?: InboxContact | InboxContact[] | null;
  channels?: InboxChannel | InboxChannel[] | null;
  isDemo?: boolean;
}

export interface InboxMessage {
  id: string;
  conversation_id: string;
  sender_type?: string | null;
  sender_id?: string | null;
  message_type?: string | null;
  content: string;
  created_at: string;
  is_read?: boolean;
  isStreaming?: boolean;
  pending?: boolean;
  role?: InboxMessageRole;
}

export function relatedRecord<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function messageRole(message: InboxMessage): InboxMessageRole {
  if (message.role) return message.role;
  return message.sender_type === 'ai_agent' || message.sender_type === 'assistant'
    ? 'ai'
    : 'user';
}
