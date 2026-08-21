import crypto from 'node:crypto';
import { z } from 'zod';
import type { OutboundPayload, UnifiedIncomingMessage } from '../types/unified';

interface LineCredentials {
  channelAccessToken: string;
  channelSecret?: string;
}

const LineEventSchema = z.object({
  type: z.string().max(64),
  timestamp: z.number().int().positive(),
  source: z.object({
    type: z.enum(['user', 'group', 'room']).optional(),
    userId: z.string().max(100).optional(),
    groupId: z.string().max(100).optional(),
    roomId: z.string().max(100).optional(),
  }).optional(),
  message: z.object({
    id: z.string().min(1).max(100),
    type: z.string().min(1).max(32),
    text: z.string().max(4_000).optional(),
  }).optional(),
  replyToken: z.string().max(200).optional(),
}).passthrough();

type LineEvent = z.infer<typeof LineEventSchema>;

export class LineAdapter {
  static sanitizeEvents(rawEvents: unknown[]): LineEvent[] {
    if (!Array.isArray(rawEvents) || rawEvents.length > 50) {
      throw new Error('Malformed or excessive LINE events payload.');
    }

    return rawEvents.map((rawEvent) => {
      const parsed = LineEventSchema.safeParse(rawEvent);
      if (!parsed.success) throw new Error('Invalid LINE event structure.');
      return parsed.data;
    });
  }

  static verifySignature(body: string, signature: string, secret: string): boolean {
    if (!body || !signature || !secret) return false;

    const expected = crypto.createHmac('sha256', secret).update(body).digest('base64');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const receivedBuffer = Buffer.from(signature, 'utf8');

    return (
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    );
  }

  static async normalize(
    payload: { events?: unknown[] },
    channelId: string,
    tenantId: string,
  ): Promise<UnifiedIncomingMessage[]> {
    const messages: UnifiedIncomingMessage[] = [];
    if (!Array.isArray(payload.events)) {
      throw new Error('LINE payload events must be an array.');
    }

    for (const event of LineAdapter.sanitizeEvents(payload.events)) {

      if (event.type !== 'message' || !event.source?.userId || !event.message) {
        continue;
      }

      const lineMessageType = event.message.type;
      const messageType =
        lineMessageType === 'text'
          ? 'text'
          : lineMessageType === 'image'
            ? 'image'
            : 'file';

      messages.push({
        tenantId,
        channelId,
        platform: 'line',
        platformUserId: event.source.userId,
        platformMessageId: event.message.id,
        messageType,
        content: event.message.text ?? `[${lineMessageType}]`,
        attachments: [],
        replyToken: event.replyToken,
        rawPayload: event,
        timestamp: event.timestamp,
      });
    }

    return messages;
  }

  static async sendOutbound(
    credentials: LineCredentials,
    payload: OutboundPayload,
  ): Promise<void> {
    if (!credentials.channelAccessToken) {
      throw new Error('LINE channel access token is missing.');
    }

    if (payload.messageType !== 'text' || !payload.text?.trim()) {
      throw new Error('LINE outbound currently supports non-empty text messages only.');
    }

    if (payload.text.length > 5000) {
      throw new Error('LINE text messages cannot exceed 5,000 characters.');
    }

    const isReply = Boolean(payload.replyToken);
    const endpoint = isReply
      ? 'https://api.line.me/v2/bot/message/reply'
      : 'https://api.line.me/v2/bot/message/push';

    const body = isReply
      ? {
          replyToken: payload.replyToken,
          messages: [{ type: 'text', text: payload.text.trim() }],
        }
      : {
          to: payload.recipientPlatformId,
          messages: [{ type: 'text', text: payload.text.trim() }],
        };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${credentials.channelAccessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LINE dispatch failed (${response.status}): ${error}`);
    }
  }
}
