'use client';

import { Languages } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LanguageSwitcherProps {
  variant?: 'dark' | 'light';
}

export default function LanguageSwitcher({ variant = 'dark' }: LanguageSwitcherProps) {
  const [language, setLanguage] = useState<'th' | 'en'>('th');
  const isLight = variant === 'light';

  useEffect(() => {
    const stored = window.localStorage.getItem('cutineo-language');
    const nextLanguage = stored === 'en' ? 'en' : 'th';
    setLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage;
  }, []);

  function toggleLanguage() {
    const nextLanguage = language === 'th' ? 'en' : 'th';
    setLanguage(nextLanguage);
    window.localStorage.setItem('cutineo-language', nextLanguage);
    document.documentElement.lang = nextLanguage;
  }

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={language === 'th' ? 'เปลี่ยนเป็นภาษาอังกฤษ' : 'Switch to Thai'}
      className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold transition ${
        isLight
          ? 'text-slate-800 hover:bg-slate-100'
          : 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-indigo-300 hover:text-indigo-700'
      }`}
    >
      {isLight ? (
        <span aria-hidden="true" className="text-base leading-none">
          {language === 'th' ? '🇹🇭' : '🇬🇧'}
        </span>
      ) : (
        <Languages size={16} aria-hidden="true" />
      )}
      <span>{isLight ? (language === 'th' ? 'Thai' : 'English') : language === 'th' ? 'TH' : 'EN'}</span>
      {isLight && <ChevronDown size={15} aria-hidden="true" />}
    </button>
  );
}
