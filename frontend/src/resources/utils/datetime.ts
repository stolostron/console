// /* Copyright Contributors to the Open Cluster Management project */
// import i18n from 'i18next'

// /*
// // Define a function to get locale from language
// const getLocaleFromLanguage = (languageCode) => {
//   const localeMap = {
//     'en': 'en-US',
//     'ja': 'ja-JP',
//     'ko': 'ko-KR',
//     'zh': 'zh-CN', // Simplified Chinese
//     'fr': 'fr-FR',
//     'es': 'es-ES'
//   };

//   return localeMap[languageCode] || 'en-US'; // Default to 'en-US' if not found
// };
// */

// // Utility to format date and time in a localized manner
// export const formatDateTime = (date: string | Date) => {
//   // Convert the input date to a Date object
//   const targetDate = new Date(date)

//   // Get the detected language (or fallback to 'en')
//   const language = i18n.language || 'en'
//   console.log(language)

//   // Create an instance of Intl.DateTimeFormat based on the user's locale
//   const dateTimeFormat = new Intl.DateTimeFormat(language, {
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric',
//     hour: '2-digit',
//     minute: '2-digit',
//     second: '2-digit',
//     timeZoneName: 'short',
//   })

//   // Format the date
//   const formattedDateTime = dateTimeFormat.format(targetDate)

//   return formattedDateTime
// }

// // Utility to format relative time with localized numbers
// export const formatRelativeTime = (date: string | Date) => {
//   const targetDate = new Date(date)
//   const now = new Date()
//   const diffInSeconds = Math.floor((targetDate.getTime() - now.getTime()) / 1000)

//   let value: number
//   let unit: Intl.RelativeTimeFormatUnit

//   // Calculate the time difference
//   if (Math.abs(diffInSeconds) < 60) {
//     value = diffInSeconds
//     unit = 'second'
//   } else if (Math.abs(diffInSeconds) < 3600) {
//     value = Math.floor(diffInSeconds / 60)
//     unit = 'minute'
//   } else if (Math.abs(diffInSeconds) < 86400) {
//     value = Math.floor(diffInSeconds / 3600)
//     unit = 'hour'
//   } else {
//     value = Math.floor(diffInSeconds / 86400)
//     unit = 'day'
//   }

//   const language = i18n.language || 'en'
//   console.log(`Detected language: ${language}`)

//   const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' })
//   const relativeTimeString = rtf.format(value, unit)
//   console.log(`Original relative time: ${relativeTimeString}`)

//   return relativeTimeString
// }

import i18n from 'i18next'
import { getLastLanguage } from './getLastLanguage'

const language = i18n.language || 'en'
console.log('LANG :  :', language)
// The maximum allowed clock skew in milliseconds where we show a date as "Just now" even if it is from the future.
export const maxClockSkewMS = -60000
//const lang = getLastLanguage()

// https://tc39.es/ecma402/#datetimeformat-objects
export const timeFormatter = new Intl.DateTimeFormat(language, {
  hour: 'numeric',
  minute: 'numeric',
})

export const timeFormatterWithSeconds = new Intl.DateTimeFormat(language, {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
})

export const dateFormatter = new Intl.DateTimeFormat(language, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export const dateFormatterNoYear = new Intl.DateTimeFormat(language, {
  month: 'short',
  day: 'numeric',
})

export const dateTimeFormatter = (langArg?: string) =>
  new Intl.DateTimeFormat(langArg ?? language, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    year: 'numeric',
  })

export const dateTimeFormatterWithSeconds = new Intl.DateTimeFormat(language, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  year: 'numeric',
})

export const utcDateTimeFormatter = new Intl.DateTimeFormat(language, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
  timeZoneName: 'short',
})

export const relativeTimeFormatter = (langArg?: string) =>
  Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat(langArg ?? language) : null

export const getDuration = (ms: number) => {
  if (!ms || ms < 0) {
    ms = 0
  }
  let seconds = Math.floor(ms / 1000)
  let minutes = Math.floor(seconds / 60)
  seconds = seconds % 60
  let hours = Math.floor(minutes / 60)
  minutes = minutes % 60
  const days = Math.floor(hours / 24)
  hours = hours % 24
  return { days, hours, minutes, seconds }
}

export const fromNow = (dateTime: string | Date, now?: Date, options?, langArg?: string) => {
  console.log(dateTime, language)
  // Check for null. If dateTime is null, it returns incorrect date Jan 1 1970.
  if (!dateTime) {
    return '-'
  }

  if (!now) {
    now = new Date()
  }

  const d = new Date(dateTime)
  const ms = now.getTime() - d.getTime()
  const justNow = i18n.t('public~Just now')

  // If the event occurred less than one minute in the future, assume it's clock drift and show "Just now."
  if (!options?.omitSuffix && ms < 60000 && ms > maxClockSkewMS) {
    return justNow
  }

  // Do not attempt to handle other dates in the future.
  if (ms < 0) {
    return '-'
  }

  const { days, hours, minutes } = getDuration(ms)

  if (options?.omitSuffix) {
    if (days) {
      return i18n.t('public~{{count}} day', { count: days })
    }
    if (hours) {
      return i18n.t('public~{{count}} hour', { count: hours })
    }
    return i18n.t('public~{{count}} minute', { count: minutes })
  }

  // Fallback to normal date/time formatting if Intl.RelativeTimeFormat is not
  // available. This is the case for older Safari versions.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat#browser_compatibility
  if (!relativeTimeFormatter(langArg)) {
    return dateTimeFormatter().format(d)
  }

  if (!days && !hours && !minutes) {
    return justNow
  }

  if (days) {
    return relativeTimeFormatter(langArg).format(-days, 'day')
  }

  if (hours) {
    return relativeTimeFormatter(langArg).format(-hours, 'hour')
  }

  return relativeTimeFormatter(langArg).format(-minutes, 'minute')
}

export const isValid = (dateTime: Date) => dateTime instanceof Date && !_.isNaN(dateTime.valueOf())

const zeroPad = (number: number) => (number < 10 ? `0${number}` : number)

export const twentyFourHourTime = (date: Date, showSeconds?: boolean): string => {
  const hours = zeroPad(date.getHours() ?? 0)
  const minutes = `:${zeroPad(date.getMinutes() ?? 0)}`
  const seconds = showSeconds ? `:${zeroPad(date.getSeconds() ?? 0)}` : ''
  return `${hours}${minutes}${seconds}`
}
