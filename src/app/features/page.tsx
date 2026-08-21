import type { Metadata } from 'next';
import MarketingPage from '@/components/marketing/MarketingPage';

export const metadata: Metadata = {
  title: 'CUTINEO Features — ฟีเจอร์ระบบรวมแชทและ AI Sales',
  description: 'ดูฟีเจอร์ Unified Inbox, AI Auto Reply, Sales Memory, Follow-up, Quotation, CRM และเครื่องมือทีมขายของ CUTINEO',
};

export default function FeaturesPage() {
  return <MarketingPage kind="features" />;
}
