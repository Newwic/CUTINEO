import CutineoSiteHeader, { type CutineoNavKey } from '../CutineoSiteHeader';

export interface PublicHeaderProps {
  /** Empty for Next.js routes; Vite passes the GitHub Pages base path. */
  basePath?: string;
  signupRoute?: string;
  loginRoute?: string;
  activeKey?: CutineoNavKey;
}
function normalizeBasePath(basePath = '') {
  if (!basePath || basePath === '/') return '/';
  return basePath.endsWith('/') ? basePath : `${basePath}/`;
}

function pageHref(prefix: string, page: string) {
  return `${prefix}${page}${prefix === '/' ? '' : '/'}`;
}

function routeHref(prefix: string, route: string) {
  if (route.startsWith('/')) return route;
  return `${prefix}${route}`;
}

export default function Header({
  basePath = '',
  signupRoute = 'signup',
  loginRoute = 'login',
  activeKey,
}: PublicHeaderProps) {
  const prefix = normalizeBasePath(basePath);
  const homeHref = prefix;
  const signupHref = `${routeHref(prefix, signupRoute)}?plan=Starter`;

  return (
    <CutineoSiteHeader
      navItems={[
        { key: 'features', label: 'ฟีเจอร์', href: pageHref(prefix, 'features') },
        { key: 'integrations', label: 'การเชื่อมต่อ', href: pageHref(prefix, 'integrations') },
        { key: 'sales', label: 'AI Sales', href: pageHref(prefix, 'ai-sales') },
        { key: 'pricing', label: 'ราคา', href: pageHref(prefix, 'pricing') },
        { key: 'resources', label: 'ทรัพยากร', href: pageHref(prefix, 'resources') },
      ]}
      logoHref={homeHref}
      loginHref={routeHref(prefix, loginRoute)}
      startHref={signupHref}
      activeKey={activeKey}
      ariaLabel="เมนูหลัก CUTINEO"
    />
  );
}
