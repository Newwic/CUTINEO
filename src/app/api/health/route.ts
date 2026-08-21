import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const healthy = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN &&
      process.env.GEMINI_API_KEY,
  );

  // Do not disclose which provider, key, or internal dependency is missing.
  // Detailed diagnostics belong in private server logs/monitoring only.
  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      service: 'cutineo-ai-inbox',
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
