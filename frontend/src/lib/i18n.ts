/* Copyright Contributors to the Open Cluster Management project */

/* istanbul ignore file */

import i18n from 'i18next'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpApi from 'i18next-http-backend'

i18n
    // pass the i18n instance to react-i18next
    .use(initReactI18next)
    // detect user language
    // learn more: https://github.com/i18next/i18next-browser-languageDetector
    .use(LanguageDetector)
    // fetch json files
    // learn more: https://github.com/i18next/i18next-http-backend
    .use(HttpApi)
    // init i18next
    .init({
        backend: {
            loadPath: '/standalone/locales/{{lng}}/{{ns}}.json',
        },
        compatibilityJSON: 'v3',
        fallbackLng: ['en'], // if language is not supported or string is missing, fallback to English
        keySeparator: false, // this repo will use single level json
        interpolation: {
            escapeValue: false, // react handles this already
        },
        defaultNS: 'translation', // the default file for strings when using useTranslation, etc
        nsSeparator: '~',
        supportedLngs: ['en'], // only languages from this array will attempt to be loaded
        simplifyPluralSuffix: true,
    })

export default i18n
