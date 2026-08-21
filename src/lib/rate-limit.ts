import crypto from 'node:crypto';
import { requireRedis } from './redis';

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  retryAfter: number;
}

function fingerprint(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 32);
}

/**
 * Fixed-window limiter backed by Upstash Redis.
 * The caller should fail closed when Redis is unavailable.
 */
export async function enforceRateLimit(
  key: string,
  limit: number,
  windowSeconds = 60,
): Promise<RateLimitResult> {
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new Error('Rate-limit limit must be a positive integer.');
  }
  if (!Number.isSafeInteger(windowSeconds) || windowSeconds < 1) {
    throw new Error('Rate-limit window must be a positive integer.');
  }

  const redis = requireRedis();
  const bucket = Math.floor(Date.now() / 1000 / windowSeconds);
  const redisKey = `ratelimit:${fingerprint(key)}:${bucket}`;
  const count = await redis.incr(redisKey);

  if (count === 1) {
    await redis.expire(redisKey, windowSeconds + 5);
  }

  return {
    allowed: count <= limit,
    count,
    retryAfter: windowSeconds - (Math.floor(Date.now() / 1000) % windowSeconds),
  };
}
