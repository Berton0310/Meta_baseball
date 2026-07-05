import React, { createContext, useState, useContext, type ReactNode } from 'react';
import zhTW from '../locales/i18n_zh-TW.json';
import enUS from '../locales/i18n_en-US.json';

type Language = 'zh-TW' | 'en-US';
type Translations = typeof zhTW;

interface LanguageContextProps {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('zh-TW');

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'zh-TW' ? 'en-US' : 'zh-TW'));
  };

  const getNestedTranslation = (obj: any, path: string): string => {
    const res = path.split('.').reduce((acc, part) => acc && acc[part], obj);
    return res || path.split('.').pop() || path;
  };

  const t = (key: string) => {
    const translations = language === 'zh-TW' ? zhTW : enUS;
    return getNestedTranslation(translations, key);
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
