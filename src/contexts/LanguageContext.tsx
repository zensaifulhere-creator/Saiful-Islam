import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { SiteLanguage, UI_TRANSLATIONS, UiDictionary } from '../data/translations';

const LANG_STORAGE_KEY = 'fariha_site_lang';

interface LanguageContextValue {
  lang: SiteLanguage;
  isBn: boolean;
  setLang: (next: SiteLanguage) => void;
  toggleLang: () => void;
  ui: UiDictionary;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readInitialLanguage(): SiteLanguage {
  try {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'bn' || saved === 'en') {
      return saved;
    }
  } catch {
    // Ignore storage read restrictions
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<SiteLanguage>(readInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Ignore storage write restrictions
    }
  }, [lang]);

  const setLang = useCallback((next: SiteLanguage) => {
    setLangState(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === 'en' ? 'bn' : 'en'));
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        lang,
        isBn: lang === 'bn',
        setLang,
        toggleLang,
        ui: UI_TRANSLATIONS[lang],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
