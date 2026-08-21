import type { Metadata } from 'next';
import MarketingPage from '@/components/marketing/MarketingPage';

export const metadata: Metadata = {
  title: 'CUTINEO Resources — คู่มือ บทความ และศูนย์ช่วยเหลือ',
  description: 'รวมคู่มือ บทความ ตัวอย่างการใช้งาน ศูนย์ช่วยเหลือ และทรัพยากรสำหรับเริ่มต้นใช้งาน CUTINEO',
};

export default function ResourcesPage() {
  return <MarketingPage kind="resources" />;
}
