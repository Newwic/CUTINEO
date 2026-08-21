import type { Metadata, Viewport } from 'next';
import './globals.css';
import CustomerChatWidget from '../components/CustomerChatWidget';
import { PwaProvider } from '../components/pwa/PwaProvider';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://newwic.github.io/CUTINEO/'),
  applicationName: 'CUTINEO',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/favicon.png', type: 'image/png', sizes: '64x64' },
      { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'CUTINEO',
    statusBarStyle: 'default',
  },
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#14b8a6',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>
        <PwaProvider serviceWorkerPath="/sw.js">
          {children}
          <CustomerChatWidget />
        </PwaProvider>
      </body>
    </html>
  );
}
