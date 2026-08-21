import CutineoSiteHeader, { type CutineoNavItem } from '@/components/CutineoSiteHeader';
import PwaInstallSection from '@/components/pwa/PwaInstallSection';

const navItems: CutineoNavItem[] = [
  { key: 'features', label: 'ฟีเจอร์', href: '/#features' },
  { key: 'integrations', label: 'การเชื่อมต่อ', href: '/#integrations' },
  { key: 'sales', label: 'AI Sales', href: '/#ai-sales' },
  { key: 'pricing', label: 'ราคา', href: '/pricing' },
  { key: 'resources', label: 'ทรัพยากร', href: '/#resources' },
];

export default function InstallPage() {
  return (
    <main className="pwa-install-page">
      <CutineoSiteHeader navItems={navItems} activeKey="resources" />
      <PwaInstallSection />
    </main>
  );
}
