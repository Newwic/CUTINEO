import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = {
    supabase: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    redis: Boolean(
      process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
    ),
    gemini: Boolean(process.env.GEMINI_API_KEY),
  };
  const healthy = Object.values(checks).every(Boolean);

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      service: 'cutineo-ai-inbox',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
