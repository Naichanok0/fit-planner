import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region?: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en-US', name: 'English (US)', nativeName: 'English', flag: '🇺🇸' },
  { code: 'th-TH', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' }
];

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (languageCode: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(SUPPORTED_LANGUAGES[0]); // Default to English
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load translations for current language
  const loadTranslations = async (languageCode: string) => {
    setIsLoading(true);
    try {
      let translationModule;
      
      // Static imports based on language code
      switch (languageCode) {
        case 'th-TH':
          translationModule = await import('./translations/th-TH');
          break;
        case 'en-US':
        default:
          translationModule = await import('./translations/en-US');
          break;
      }
      
      setTranslations(translationModule.default || translationModule.translations);
    } catch (error) {
      console.warn(`Failed to load translations for ${languageCode}, falling back to English`);
      try {
        const fallbackModule = await import('./translations/en-US');
        setTranslations(fallbackModule.default || fallbackModule.translations);
      } catch (fallbackError) {
        console.error('Failed to load fallback translations:', fallbackError);
        setTranslations({});
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Set language and load translations
  const setLanguage = (languageCode: string) => {
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
    if (language) {
      setCurrentLanguage(language);
      localStorage.setItem('preferredLanguage', languageCode);
      loadTranslations(languageCode);
    }
  };

  // Translation function with parameter substitution
  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value));
      });
    }
    
    return translation;
  };

  // Initialize language on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    const browserLanguage = navigator.language;
    
    // Try saved language first, then browser language, then default to English
    const initialLanguage = savedLanguage || 
      SUPPORTED_LANGUAGES.find(lang => lang.code === browserLanguage)?.code ||
      SUPPORTED_LANGUAGES.find(lang => lang.code.startsWith(browserLanguage.split('-')[0]))?.code ||
      'en-US';
    
    setLanguage(initialLanguage);
  }, []);

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t,
    isLoading
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}