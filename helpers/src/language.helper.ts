import { getLocales } from 'expo-localization';

export const getLanguage = (defaultLanguage: string = 'fr') => {
  const locales = getLocales();
  if (locales.length > 0) {
    return locales.map((l) => l.languageCode);
  }
  return [defaultLanguage];
};
