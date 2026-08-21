import type { Metadata } from 'next';
import './globals.css';
import CustomerChatWidget from '../components/CustomerChatWidget';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://newwic.github.io/CUTINEO/'),
  title: 'CUTINEO — รวมทุกแชท พร้อม AI ช่วยขาย',
  description: 'รวม LINE, Facebook, Instagram, Email และช่องทางลูกค้าไว้ใน Inbox เดียว พร้อม AI ช่วยตอบ จำ ติดตาม และจัดการงานขาย',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'CUTINEO — รวมทุกแชท พร้อม AI ช่วยขาย',
    description: 'Unified Inbox และ AI Sales Assistant สำหรับทีมขายยุคใหม่',
    type: 'website',
    locale: 'th_TH',
    siteName: 'CUTINEO',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CUTINEO — รวมทุกแชท พร้อม AI ช่วยขาย',
    description: 'รวมทุกช่องทางไว้ใน Inbox เดียว พร้อม AI ช่วยตอบ จำ ติดตาม และขาย',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>
        {children}
        <CustomerChatWidget />
      </body>
    </html>
  );
}
