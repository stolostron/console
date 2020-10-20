import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpApi from 'i18next-http-backend'

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(HttpApi)
  .init({
    keySeparator: false,

    interpolation: {
      escapeValue: false,
    },

    defaultNS: 'common', // the default file for strings when using useTranslation, etc

    supportedLngs: ['en', 'fr'], // only languages from this array will attempt to be loaded
    nonExplicitSupportedLngs: true, // allows for example en-US/en-UK to be supported when en is supported
    fallbackLng: ['en'] // if language is not supported, or string is missing fallback to English
  })

  export default i18n
