const PRIVATE_CACHE_PREFIX = 'cutineo-private-';

/** Remove only CUTINEO-owned private caches; never touch another origin's data. */
export async function clearPrivateCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  const keys = await window.caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith(PRIVATE_CACHE_PREFIX))
      .map((key) => window.caches.delete(key)),
  );
}
