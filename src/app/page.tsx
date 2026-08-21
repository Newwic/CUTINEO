import HomepageV2 from '@/components/landing/HomepageV2';

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'CUTINEO',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'รวม LINE, Facebook, Instagram, Email และช่องทางลูกค้าไว้ใน Inbox เดียว พร้อม AI ช่วยตอบ จำ ติดตาม และจัดการงานขาย',
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'THB',
    lowPrice: '490',
    offerCount: '4',
  },
};

export default function HomePage() {
  return (
    <>
      <HomepageV2 basePath="" signupRoute="register" loginRoute="login" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </>
  );
}
