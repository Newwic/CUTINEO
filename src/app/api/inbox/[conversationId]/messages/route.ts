import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { getTenantMemberships } from '@/lib/tenant-access';
import { requireSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  try {
    const { conversationId } = await params;
    const db = requireSupabaseServer();
    const memberships = await getTenantMemberships(db, user.id);
    const tenantIds = memberships.map((membership) => membership.tenantId);
    if (tenantIds.length === 0) return NextResponse.json({ error: 'Workspace access denied' }, { status: 403 });

    const { data: conversation, error: conversationError } = await db
      .from('conversations')
      .select('id, tenant_id')
      .eq('id', conversationId)
      .in('tenant_id', tenantIds)
      .maybeSingle();
    if (conversationError) throw conversationError;
    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    const { data, error } = await db
      .from('messages')
      .select('*')
      .eq('tenant_id', conversation.tenant_id)
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });
    if (error) throw error;

    return NextResponse.json({ messages: data ?? [] }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('[inbox/messages] failed to load tenant-scoped messages', error);
    return NextResponse.json({ error: 'Unable to load messages' }, { status: 500 });
  }
}
