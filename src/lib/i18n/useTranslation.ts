'use client';

import { usePartyStore } from '@/store/usePartyStore';
import { translations, TranslationDictionary, Language } from './translations';

export const useTranslation = () => {
  const language = usePartyStore((s) => s.language);
  const setLanguage = usePartyStore((s) => s.setLanguage);

  const t: TranslationDictionary = translations[language] || translations.es;

  return {
    t,
    language,
    setLanguage,
  };
};

export type { Language, TranslationDictionary };
