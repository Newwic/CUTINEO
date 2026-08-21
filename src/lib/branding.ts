/** Shared public asset paths used by the Next.js inbox and the Vite pages. */
const isGitHubPagesProjectSite =
  typeof window !== 'undefined' &&
  (window.location.pathname === '/CUTINEO' || window.location.pathname.startsWith('/CUTINEO/'));

export const NEO_LOGO_PATH = isGitHubPagesProjectSite
  ? '/CUTINEO/assets/logo-neo.png'
  : '/assets/logo-neo.png';
