import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// Preload translation resources to ensure SSR and CSR render identical content
// Avoid HTTP fetching during SSR which can lead to hydration mismatches
// Import JSON statically so server has translations at render time
import zh from '../public/locales/zh/translation.json';
import en from '../public/locales/en/translation.json';

const resources = {
  zh: { translation: zh },
  en: { translation: en },
} as const;

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'zh',
      fallbackLng: 'zh',
      debug: process.env.NODE_ENV === 'development',
      interpolation: {
        escapeValue: false,
      },
      // Ensure sync init under Node to avoid rendering keys on the server
      initImmediate: false,
      react: {
        useSuspense: false,
      },
    });
}

export default i18n;
