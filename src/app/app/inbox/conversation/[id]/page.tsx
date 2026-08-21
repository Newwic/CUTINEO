import { redirect } from 'next/navigation';

export default function ConversationDeepLink({ params }: { params: { id: string } }) {
  redirect(`/dashboard/inbox?conversation=${encodeURIComponent(params.id)}`);
}
