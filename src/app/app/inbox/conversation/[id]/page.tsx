import { redirect } from 'next/navigation';

export default async function ConversationDeepLink({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/inbox?conversation=${encodeURIComponent(id)}`);
}
