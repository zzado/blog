import { ui, defaultLang } from './ui';

export function getLangFromUrl(url: URL) {
  const { BASE_URL } = import.meta.env;
  // Handle BASE_URL correctly (remove it from pathname)
  const path = url.pathname.replace(BASE_URL, '');
  // Remove leading slash to split correctly
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const [lang] = cleanPath.split('/');
  
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  }
}
