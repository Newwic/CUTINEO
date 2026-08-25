export const DEFAULT_AUTH_REDIRECT = '/inbox';

/**
 * Accept only same-origin application paths for post-login redirects.
 * This prevents values such as //evil.example or https://evil.example from
 * becoming an open redirect.
 */
export function sanitizeRedirectPath(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) return DEFAULT_AUTH_REDIRECT;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return DEFAULT_AUTH_REDIRECT;
  }

  try {
    const parsed = new URL(value, 'https://cutineo.invalid');
    if (parsed.origin !== 'https://cutineo.invalid') return DEFAULT_AUTH_REDIRECT;
    if (parsed.pathname === '/login' || parsed.pathname === '/register' || parsed.pathname === '/signup') {
      return DEFAULT_AUTH_REDIRECT;
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return DEFAULT_AUTH_REDIRECT;
  }
}

export function pathWithSearch(pathname: string, search: string): string {
  return `${pathname}${search}`;
}
