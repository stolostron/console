/* Copyright Contributors to the Open Cluster Management project */

/* istanbul ignore file */

import i18n from 'i18next'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpApi from 'i18next-http-backend'
import { supportedLanguages } from './supportedLanguages'

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(HttpApi)
  .init({
    backend: {
      loadPath: '/multicloud/locales/{{lng}}/{{ns}}.json',
    },
    compatibilityJSON: 'v3',
    fallbackLng: ['en'],
    keySeparator: false,
    interpolation: {
      escapeValue: false,
      format: (value, format, lng) => {
        if (value instanceof Date) {
          if (format === 'fromNow') {
            const now = new Date()
            const elapsed = now.getTime() - value.getTime()
            const rtf = new Intl.RelativeTimeFormat(lng, { numeric: 'auto' })

            const seconds = Math.floor(elapsed / 1000)
            const minutes = Math.floor(seconds / 60)
            const hours = Math.floor(minutes / 60)
            const days = Math.floor(hours / 24)

            if (seconds < 60) return rtf.format(-seconds, 'second')
            if (minutes < 60) return rtf.format(-minutes, 'minute')
            if (hours < 24) return rtf.format(-hours, 'hour')
            return rtf.format(-days, 'day')
          }
          return new Intl.DateTimeFormat(lng, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            timeZone: 'America/New_York', // Example for EST
          }).format(value)
        }
        if (typeof value === 'number') {
          return new Intl.NumberFormat(lng).format(value)
        }
        return value
      },
    },
    defaultNS: 'translation',
    nsSeparator: '~',
    supportedLngs: supportedLanguages,
    simplifyPluralSuffix: true,
  })

export default i18n
