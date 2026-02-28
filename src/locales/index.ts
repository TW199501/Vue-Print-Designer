import { createI18n } from 'vue-i18n';
import en from './en';
import zh from './zh';
import zhTW from './zh-TW';

const messages = {
  en,
  zh,
  'zh-TW': zhTW,
};

type SupportedLanguage = 'zh' | 'zh-TW' | 'en';

const normalizeLanguage = (lang: string): SupportedLanguage | null => {
  const normalized = lang.toLowerCase().replace(/_/g, '-');

  if (
    normalized.startsWith('zh-tw') ||
    normalized.startsWith('zh-hk') ||
    normalized.startsWith('zh-mo') ||
    normalized.startsWith('zh-hant')
  ) {
    return 'zh-TW';
  }

  if (
    normalized === 'zh' ||
    normalized.startsWith('zh-cn') ||
    normalized.startsWith('zh-sg') ||
    normalized.startsWith('zh-hans')
  ) {
    return 'zh';
  }

  if (normalized === 'en' || normalized.startsWith('en-')) {
    return 'en';
  }

  return null;
};

const getInitialLanguage = () => {
  const stored = localStorage.getItem('print-designer-language');
  if (stored) {
    const normalizedStored = normalizeLanguage(stored);
    if (normalizedStored) {
      return normalizedStored;
    }
  }

  const lang = navigator.language.toLowerCase();
  const normalizedLang = normalizeLanguage(lang);
  if (normalizedLang) {
    return normalizedLang;
  }

  if (lang.startsWith('zh')) {
    return 'zh';
  }

  return 'en'; // Default to English for other languages
};

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: getInitialLanguage(),
  fallbackLocale: 'en',
  messages,
});

export default i18n;
