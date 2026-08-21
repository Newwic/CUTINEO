/* eslint-disable @next/next/no-img-element -- shared with the Vite static pages. */
'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { NEO_LOGO_PATH } from '../lib/branding';

export type CutineoLanguage = 'th' | 'en';
export type CutineoNavKey = 'features' | 'how' | 'integrations' | 'sales' | 'pricing' | 'resources';

export interface CutineoNavItem {
  key: CutineoNavKey;
  label: string;
  href: string;
}

interface CutineoSiteHeaderProps {
  navItems: CutineoNavItem[];
  logoHref?: string;
  loginHref?: string;
  startHref?: string;
  loginLabel?: string;
  startLabel?: string;
  language?: CutineoLanguage;
  activeKey?: CutineoNavKey;
  onLogin?: () => void;
  onStart?: () => void;
  onLanguageToggle?: () => void;
  ariaLabel?: string;
}

function getStoredLanguage(): CutineoLanguage {
  try {
    return window.localStorage.getItem('cutineo-language') === 'en' ? 'en' : 'th';
  } catch {
    return 'th';
  }
}

export default function CutineoSiteHeader({
  navItems,
  logoHref = '/',
  loginHref = '/login',
  startHref = '/register?plan=Starter',
  loginLabel = 'เข้าสู่ระบบ',
  startLabel = 'เริ่มต้นใช้งานฟรี',
  language,
  activeKey,
  onLogin,
  onStart,
  onLanguageToggle,
  ariaLabel = 'เมนูหลัก',
}: CutineoSiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [internalLanguage, setInternalLanguage] = useState<CutineoLanguage>('th');
  const currentLanguage = language ?? internalLanguage;

  useEffect(() => {
    if (language !== undefined) return;
    const storedLanguage = getStoredLanguage();
    setInternalLanguage(storedLanguage);
    document.documentElement.lang = storedLanguage;
  }, [language]);

  useEffect(() => {
    const updateHeaderState = () => setScrolled(window.scrollY > 12);
    updateHeaderState();
    window.addEventListener('scroll', updateHeaderState, { passive: true });
    window.addEventListener('hashchange', updateHeaderState);
    return () => {
      window.removeEventListener('scroll', updateHeaderState);
      window.removeEventListener('hashchange', updateHeaderState);
    };
  }, []);

  useEffect(() => {
    const updatePath = () => setCurrentPath(window.location.pathname.replace(/\/+$/, '') || '/');
    updatePath();
    window.addEventListener('popstate', updatePath);
    window.addEventListener('hashchange', updatePath);
    return () => {
      window.removeEventListener('popstate', updatePath);
      window.removeEventListener('hashchange', updatePath);
    };
  }, []);

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleAction(event: MouseEvent<HTMLAnchorElement>, action?: () => void) {
    if (action) {
      event.preventDefault();
      action();
    }
    closeMenu();
  }

  function toggleLanguage() {
    if (onLanguageToggle) {
      onLanguageToggle();
      return;
    }
    const nextLanguage: CutineoLanguage = currentLanguage === 'th' ? 'en' : 'th';
    setInternalLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage;
    try {
      window.localStorage.setItem('cutineo-language', nextLanguage);
    } catch {
      // Private browsing can disable localStorage; the switch still works in memory.
    }
  }

  function isActive(item: CutineoNavItem) {
    if (activeKey === item.key) return true;
    if (!currentPath || typeof window === 'undefined') return false;

    try {
      const target = new URL(item.href, window.location.origin);
      const targetPath = target.pathname.replace(/\/+$/, '') || '/';
      if (target.hash) return currentPath === targetPath && window.location.hash === target.hash;
      if (targetPath === '/') return currentPath === '/';
      return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
    } catch {
      return false;
    }
  }

  const languageButton = (className = '') => (
    <button
      className={`cutineo-language-toggle ${className}`}
      type="button"
      onClick={toggleLanguage}
      aria-label={currentLanguage === 'th' ? 'เปลี่ยนเป็นภาษาอังกฤษ' : 'Switch to Thai'}
    >
      <span className={currentLanguage === 'th' ? 'is-selected' : ''}>TH</span>
      <span className="cutineo-language-slash">/</span>
      <span className={currentLanguage === 'en' ? 'is-selected' : ''}>EN</span>
    </button>
  );

  return (
    <header className={`cutineo-site-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="cutineo-site-header-inner">
        <a className="cutineo-site-brand" href={logoHref} onClick={closeMenu} aria-label="กลับหน้าแรก CUTINEO">
          <img src={NEO_LOGO_PATH} alt="CUTINEO" />
          <span>CUTI<span>NEO</span></span>
        </a>

        <nav id="cutineo-public-nav" className={`cutineo-site-nav${menuOpen ? ' is-open' : ''}`} aria-label={ariaLabel}>
          {navItems.map((item) => (
            <a
              key={item.key}
              className={isActive(item) ? 'is-active' : ''}
              href={item.href}
              aria-current={isActive(item) ? 'page' : undefined}
              onClick={closeMenu}
            >
              {item.label}
            </a>
          ))}
          <div className="cutineo-mobile-nav-meta">
            <a href={loginHref} onClick={(event) => handleAction(event, onLogin)}>{loginLabel}</a>
            {languageButton()}
          </div>
        </nav>

        <div className="cutineo-site-actions">
          <a className="cutineo-site-login" href={loginHref} onClick={(event) => handleAction(event, onLogin)}>{loginLabel}</a>
          <a className="cutineo-site-cta" href={startHref} data-cta="header-start" onClick={(event) => handleAction(event, onStart)}>{startLabel}</a>
          {languageButton('cutineo-desktop-language')}
        </div>

        <button
          className={`cutineo-menu-toggle${menuOpen ? ' is-open' : ''}`}
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
          aria-expanded={menuOpen}
          aria-controls="cutineo-public-nav"
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
}
