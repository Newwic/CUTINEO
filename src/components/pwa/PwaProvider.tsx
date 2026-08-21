'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaContextValue {
  online: boolean;
  canInstall: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  updateAvailable: boolean;
  install: () => Promise<void>;
  applyUpdate: () => void;
  closeInstallGuide: () => void;
  iosGuideOpen: boolean;
}

const PwaContext = createContext<PwaContextValue>({
  online: true,
  canInstall: false,
  isIOS: false,
  isStandalone: false,
  updateAvailable: false,
  install: async () => undefined,
  applyUpdate: () => undefined,
  closeInstallGuide: () => undefined,
  iosGuideOpen: false,
});

function isIosDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches === true
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export function PwaProvider({
  children,
  serviceWorkerPath,
  enabled = true,
}: {
  children: ReactNode;
  serviceWorkerPath: string;
  enabled?: boolean;
}) {
  const [online, setOnline] = useState(true);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [iosGuideOpen, setIosGuideOpen] = useState(false);
  const [connectionNotice, setConnectionNotice] = useState<'offline' | 'online' | null>(null);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  const refreshing = useRef(false);

  const closeInstallGuide = useCallback(() => {
    setIosGuideOpen(false);
    try {
      window.localStorage.setItem('cutineo-ios-install-dismissed-v1', '1');
    } catch {
      // Private browsing can disable storage; closing the guide still works in memory.
    }
  }, []);

  useEffect(() => {
    const ios = isIosDevice();
    const standalone = isStandaloneDisplay();
    const initialOnline = navigator.onLine;
    setIsIOS(ios);
    setIsStandalone(standalone);
    setOnline(initialOnline);
    if (!initialOnline) setConnectionNotice('offline');

    const handleOffline = () => {
      setOnline(false);
      setConnectionNotice('offline');
    };
    const handleOnline = () => {
      setOnline(true);
      setConnectionNotice('online');
      window.setTimeout(() => setConnectionNotice(null), 2400);
    };
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPrompt.current = event as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    const handleInstalled = () => {
      deferredPrompt.current = null;
      setCanInstall(false);
      setIsStandalone(true);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener('beforeinstallprompt', handleInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !('serviceWorker' in navigator) || !window.isSecureContext) return;

    let disposed = false;
    const register = async () => {
      try {
        const nextRegistration = await navigator.serviceWorker.register(serviceWorkerPath);
        if (disposed) return;
        registration.current = nextRegistration;
        setUpdateAvailable(Boolean(nextRegistration.waiting));

        nextRegistration.addEventListener('updatefound', () => {
          const worker = nextRegistration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        });
      } catch {
        // PWA is an enhancement. Authentication and the web app remain usable if SW is unavailable.
      }
    };

    const handleControllerChange = () => {
      if (refreshing.current) return;
      refreshing.current = true;
      window.location.reload();
    };

    void register();
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    return () => {
      disposed = true;
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [enabled, serviceWorkerPath]);

  const install = useCallback(async () => {
    if (isStandalone) return;
    if (deferredPrompt.current) {
      await deferredPrompt.current.prompt();
      await deferredPrompt.current.userChoice;
      deferredPrompt.current = null;
      setCanInstall(false);
      return;
    }
    if (isIOS) setIosGuideOpen(true);
  }, [isIOS, isStandalone]);

  const applyUpdate = useCallback(() => {
    registration.current?.waiting?.postMessage({ type: 'SKIP_WAITING' });
  }, []);

  const value = useMemo<PwaContextValue>(() => ({
    online,
    canInstall,
    isIOS,
    isStandalone,
    updateAvailable,
    install,
    applyUpdate,
    closeInstallGuide,
    iosGuideOpen,
  }), [applyUpdate, canInstall, closeInstallGuide, install, iosGuideOpen, isIOS, isStandalone, online, updateAvailable]);

  return (
    <PwaContext.Provider value={value}>
      {children}
      {connectionNotice && (
        <div className={`pwa-status-stack pwa-connection-${connectionNotice}`} role="status" aria-live="polite">
          <span aria-hidden="true">{connectionNotice === 'offline' ? '⚠️' : '✓'}</span>
          <span>{connectionNotice === 'offline' ? 'การเชื่อมต่ออินเทอร์เน็ตขาดหาย' : 'เชื่อมต่อแล้ว'}</span>
        </div>
      )}
      {updateAvailable && (
        <div className="pwa-update-banner" role="status" aria-live="polite">
          <span>มี CUTINEO เวอร์ชันใหม่</span>
          <button type="button" onClick={applyUpdate}>อัปเดต</button>
        </div>
      )}
      {iosGuideOpen && (
        <div className="pwa-guide-backdrop" role="presentation" onClick={closeInstallGuide}>
          <section className="pwa-install-guide" role="dialog" aria-modal="true" aria-labelledby="pwa-guide-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="pwa-guide-close" onClick={closeInstallGuide} aria-label="ปิดคำแนะนำ">×</button>
            <div className="pwa-guide-icon">N</div>
            <p className="pwa-guide-kicker">CUTINEO PWA</p>
            <h2 id="pwa-guide-title">เพิ่ม CUTINEO ไปยังหน้าจอโฮม</h2>
            <ol>
              <li>เปิดหน้านี้ด้วย Safari</li>
              <li>กดปุ่ม Share</li>
              <li>เลือก <strong>Add to Home Screen</strong> แล้วกด Add</li>
            </ol>
            <button type="button" className="pwa-guide-primary" onClick={closeInstallGuide}>เข้าใจแล้ว</button>
          </section>
        </div>
      )}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  return useContext(PwaContext);
}
