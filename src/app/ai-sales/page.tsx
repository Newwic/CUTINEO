import type { Metadata } from 'next';
import MarketingPage from '@/components/marketing/MarketingPage';

export const metadata: Metadata = {
  title: 'CUTINEO AI Sales — AI ช่วยตอบ จำ ติดตาม และปิดการขาย',
  description: 'ดู AI Sales Workflow ของ CUTINEO ตั้งแต่ AI Reply, Sales Memory, Summary, Follow-up, Quotation ไปจนถึง Pipeline',
};

export default function AiSalesPage() {
  return <MarketingPage kind="ai-sales" />;
}
