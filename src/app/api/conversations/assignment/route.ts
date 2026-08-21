import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { enforceRateLimit } from '@/lib/rate-limit';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { requireSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 4 * 1024;

const AssignmentSchema = z.object({
  conversationId: z.string().uuid(),
  assignedTo: z.enum(['ai_agent', 'human_agent']),
  status: z.enum(['open', 'pending_human', 'resolved', 'spam']).optional(),
}).strict();

function clientAddress(request: NextRequest): string {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  try {
    const declaredLength = Number(request.headers.get('content-length') ?? 0);
    if (declaredLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request is too large' }, { status: 413 });
    }

    const ipRate = await enforceRateLimit(`conversation-assignment:ip:${clientAddress(request)}`, 60, 60);
    if (!ipRate.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(ipRate.retryAfter) } },
      );
    }

    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request is too large' }, { status: 413 });
    }

    let rawBody: unknown;
    try {
      rawBody = JSON.parse(bodyText);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = AssignmentSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid assignment payload' }, { status: 400 });
    }

    const userRate = await enforceRateLimit(`conversation-assignment:user:${user.id}`, 120, 60);
    if (!userRate.allowed) {
      return NextResponse.json(
        { error: 'User rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': String(userRate.retryAfter) } },
      );
    }

    const db = requireSupabaseServer();
    const { data: conversation, error: conversationError } = await db
      .from('conversations')
      .select('id, tenant_id')
      .eq('id', parsed.data.conversationId)
      .maybeSingle();

    if (conversationError) throw conversationError;
    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    const { data: membership, error: membershipError } = await db
      .from('tenant_members')
      .select('role')
      .eq('tenant_id', conversation.tenant_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Only tenant admins can change assignment' }, { status: 403 });
    }

    const nextStatus = parsed.data.status ?? (
      parsed.data.assignedTo === 'human_agent' ? 'pending_human' : 'open'
    );

    const { error: updateError } = await db
      .from('conversations')
      .update({ assigned_to: parsed.data.assignedTo, status: nextStatus })
      .eq('id', conversation.id)
      .eq('tenant_id', conversation.tenant_id);

    if (updateError) throw updateError;
    return NextResponse.json({
      conversationId: conversation.id,
      assignedTo: parsed.data.assignedTo,
      status: nextStatus,
    });
  } catch (error) {
    console.error('[conversation/assignment] request failed', error);
    return NextResponse.json({ error: 'Unable to update assignment' }, { status: 500 });
  }
}
