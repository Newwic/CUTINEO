import type { Metadata } from 'next';
import './globals.css';
import CustomerChatWidget from '../components/CustomerChatWidget';

export const metadata: Metadata = {
  title: 'CUTINEO | AI Commerce Inbox',
  description: 'Omnichannel social commerce inbox for modern teams.',
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
