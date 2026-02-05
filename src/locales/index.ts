import { createI18n } from 'vue-i18n';
import en from './en';
import zh from './zh';

const messages = {
  en,
  zh,
};

const getInitialLanguage = () => {
  const stored = localStorage.getItem('print-designer-language');
  if (stored && (stored === 'zh' || stored === 'en')) {
    return stored;
  }
  const lang = navigator.language.toLowerCase();
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
