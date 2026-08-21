import type { Metadata } from 'next';
import MarketingPage from '@/components/marketing/MarketingPage';

export const metadata: Metadata = {
  title: 'CUTINEO Integrations — LINE, Facebook, Instagram, Email',
  description: 'ตรวจสอบช่องทางที่ CUTINEO รองรับและสถานะการเชื่อมต่อของ LINE, Facebook, Messenger, Instagram, Gmail, Outlook และ Email',
};

export default function IntegrationsPage() {
  return <MarketingPage kind="integrations" />;
}
