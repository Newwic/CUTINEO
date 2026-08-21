'use client';

import { Download, Monitor, Smartphone, Tablet } from 'lucide-react';
import { usePwa } from './PwaProvider';

export default function PwaInstallSection() {
  const { canInstall, install, isIOS, isStandalone } = usePwa();
  const installAvailable = canInstall || isIOS;

  return (
    <section className="pwa-install-section" id="install" aria-labelledby="pwa-install-title">
      <div className="pwa-install-shell">
        <div className="pwa-install-heading">
          <div>
            <p className="pwa-install-kicker">CUTINEO PWA</p>
            <h2 id="pwa-install-title">CUTINEO ไปกับคุณทุกที่</h2>
            <p>ใช้งานผ่าน Browser หรือติดตั้งเป็น App บนอุปกรณ์ที่รองรับ โดยข้อมูลลูกค้ายังคงอยู่บนระบบที่ปลอดภัยของคุณ</p>
          </div>
          <button
            type="button"
            className="pwa-install-button"
            onClick={() => void install()}
            disabled={isStandalone || !installAvailable}
            data-cta="install-app"
          >
            <Download size={17} aria-hidden="true" />
            {isStandalone ? 'เปิดอยู่ในโหมด App แล้ว' : isIOS ? 'วิธีเพิ่มไปหน้าจอโฮม' : canInstall ? 'ติดตั้ง CUTINEO' : 'ใช้งานผ่าน Browser ได้ทันที'}
          </button>
        </div>

        <div className="pwa-device-grid">
          <article><Monitor size={22} aria-hidden="true" /><strong>คอมพิวเตอร์</strong><span>ใช้งานผ่าน Browser หรือติดตั้งเป็น App</span></article>
          <article><Smartphone size={22} aria-hidden="true" /><strong>มือถือ</strong><span>เพิ่ม CUTINEO ลงหน้าจอ Home ใช้งานเหมือน App</span></article>
          <article><Tablet size={22} aria-hidden="true" /><strong>Tablet</strong><span>จัดการลูกค้าและทีมขายได้ทุกที่</span></article>
        </div>
      </div>
    </section>
  );
}
