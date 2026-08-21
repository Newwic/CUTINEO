import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import PwaInstallSection from '@/components/pwa/PwaInstallSection';

export const metadata: Metadata = {
  title: 'ติดตั้ง CUTINEO — ใช้งานได้ทุกอุปกรณ์',
  description: 'เพิ่ม CUTINEO ลงหน้าจอโฮมบนมือถือหรือเปิดเป็นแอปบนเดสก์ท็อปผ่าน PWA',
};

export default function InstallPage() {
  return (
    <main className="pwa-install-page">
      <Header activeKey="resources" />
      <PwaInstallSection />
    </main>
  );
}
