/* Copyright Contributors to the Open Cluster Management project */

/* istanbul ignore file */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpApi from 'i18next-http-backend'

i18n.use(initReactI18next)
    .use(LanguageDetector)
    .use(HttpApi)
    .init({
        backend: {
            loadPath: '/multicloud/locales/{{lng}}/{{ns}}.json',
        },

        keySeparator: false, // this repo will use single level json

        interpolation: {
            escapeValue: false, // react handles this already
        },

        defaultNS: 'common', // the default file for strings when using useTranslation, etc

        supportedLngs: ['en'], // only languages from this array will attempt to be loaded
        fallbackLng: ['en'], // if language is not supported or string is missing, fallback to English
    })

export default i18n
