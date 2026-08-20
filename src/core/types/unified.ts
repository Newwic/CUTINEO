export type PlatformType = 'line' | 'facebook' | 'tiktok' | 'wechat';

export type UnifiedMessageType = 'text' | 'image' | 'file';

export interface MessageAttachment {
  type: 'image' | 'file';
  url?: string;
  name?: string;
  mimeType?: string;
  size?: number;
}

export interface UnifiedIncomingMessage {
  tenantId: string;
  channelId: string;
  platform: PlatformType;
  platformUserId: string;
  platformMessageId: string;
  messageType: UnifiedMessageType;
  content: string;
  attachments: MessageAttachment[];
  replyToken?: string;
  rawPayload: unknown;
  timestamp: number;
}

export interface OutboundPayload {
  recipientPlatformId: string;
  replyToken?: string;
  messageType: 'text' | 'image';
  text?: string;
}
