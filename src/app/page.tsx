import type { Metadata } from 'next';
import HomepageV2 from '@/components/landing/HomepageV2';

export const metadata: Metadata = {
  title: 'CUTINEO — รวมทุกแชท พร้อม AI ช่วยขาย',
  description: 'รวม LINE, Facebook, Instagram, Email และช่องทางลูกค้าไว้ใน Inbox เดียว พร้อม AI ช่วยตอบ จำ ติดตาม และจัดการงานขาย',
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'CUTINEO',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'รวมทุกแชท พร้อม AI ช่วยขาย',
  offers: { '@type': 'AggregateOffer', priceCurrency: 'THB', lowPrice: '490', offerCount: '4' },
};

export default function HomePage() {
  return (
    <>
      <HomepageV2 basePath="" signupRoute="signup" loginRoute="login" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </>
  );
}
