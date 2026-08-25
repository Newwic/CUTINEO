import { redirect } from 'next/navigation';

export default function ConversationDeepLink({ params }: { params: { id: string } }) {
  redirect(`/inbox?conversation=${encodeURIComponent(params.id)}`);
}
