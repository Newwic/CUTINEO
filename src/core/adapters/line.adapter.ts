import crypto from 'node:crypto';
import type { OutboundPayload, UnifiedIncomingMessage } from '../types/unified';

interface LineCredentials {
  channelAccessToken: string;
  channelSecret?: string;
}

export class LineAdapter {
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

    for (const rawEvent of payload.events ?? []) {
      const event = rawEvent as {
        type?: string;
        timestamp?: number;
        replyToken?: string;
        source?: { userId?: string };
        message?: { id?: string; type?: string; text?: string };
      };

      if (event.type !== 'message' || !event.source?.userId || !event.message?.id) {
        continue;
      }

      const lineMessageType = event.message.type ?? 'file';
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
        rawPayload: rawEvent,
        timestamp: event.timestamp ?? Date.now(),
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
