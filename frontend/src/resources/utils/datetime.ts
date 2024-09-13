// /* Copyright Contributors to the Open Cluster Management project */

import * as _ from 'lodash'
import i18n from 'i18next'
import { getLastLanguage } from './getLastLanguage'

const language = i18n.language || getLastLanguage() || 'en'

// The maximum allowed clock skew in milliseconds where we show a date as "Just now" even if it is from the future.
export const maxClockSkewMS = -60000

// https://tc39.es/ecma402/#datetimeformat-objects
// Use timeFormatter to display time in hours and minutes, e.g., "12:44 AM".
export const timeFormatter = new Intl.DateTimeFormat(language, {
  hour: 'numeric',
  minute: 'numeric',
})

// Use timeFormatterWithSeconds to display time with seconds, e.g., "12:44:09 AM".
export const timeFormatterWithSeconds = new Intl.DateTimeFormat(language, {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
})

// Use dateFormatter to display the date with month, day, and year, e.g., "Sep 9, 2024".
export const dateFormatter = new Intl.DateTimeFormat(language, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

// Use dateFormatterNoYear to display the date without the year, e.g., "Sep 9".
export const dateFormatterNoYear = new Intl.DateTimeFormat(language, {
  month: 'short',
  day: 'numeric',
})

// Use dateTimeFormatter to display the full date and time without seconds, e.g., "Sep 9, 2024, 12:44 AM".
export const dateTimeFormatter = (langArg?: string) =>
  new Intl.DateTimeFormat(langArg ?? language, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    year: 'numeric',
  })

// Use dateTimeFormatterWithSeconds to display the full date and time with seconds, e.g., "Sep 9, 2024, 12:44:09 AM".
export const dateTimeFormatterWithSeconds = new Intl.DateTimeFormat(language, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  year: 'numeric',
})

// Use utcDateTimeFormatter to display the date and time in UTC with timezone, e.g., "Sep 9, 2024, 12:44 AM UTC".
export const utcDateTimeFormatter = new Intl.DateTimeFormat(language, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
  timeZoneName: 'short',
})

// Use relativeTimeFormatter to format relative time for days, hours, and minutes, e.g., "2 days ago".
//Gives you more control, but you need to manually provide the time difference and unit.
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

interface FromNowOptions {
  omitSuffix?: boolean
  includeSeconds?: boolean
  addSuffix?: boolean
}
//Use fromNow when you want a relative time display like "5 minutes ago" or "2 days ago."
//Automatically calculates the time difference and returns a human-readable string. Best for quick, ready-to-use relative time.
export const fromNow = (dateTime: string | Date, now?: Date, options?: FromNowOptions, langArg?: string) => {
  // Check for null. If dateTime is null, it returns incorrect date Jan 1 1970.
  if (!dateTime) {
    return '-'
  }

  if (!now) {
    now = new Date()
  }

  const d = new Date(dateTime)
  const ms = now.getTime() - d.getTime()
  const justNow = i18n.t('Just now')

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
      return i18n.t('{{count}} day', { count: days })
    }
    if (hours) {
      return i18n.t('{{count}} hour', { count: hours })
    }
    return i18n.t('{{count}} minute', { count: minutes })
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

  const rtf = relativeTimeFormatter(langArg)
  if (rtf) {
    if (days) {
      return rtf.format(-days, 'day')
    }

    if (hours) {
      return rtf.format(-hours, 'hour')
    }

    if (minutes) {
      return rtf.format(-minutes, 'minute')
    }
  }
}
export const isValid = (dateTime: Date) => dateTime instanceof Date && !_.isNaN(dateTime.valueOf())

const zeroPad = (number: number) => (number < 10 ? `0${number}` : number)

export const twentyFourHourTime = (date: Date, showSeconds?: boolean): string => {
  const hours = zeroPad(date.getHours() ?? 0)
  const minutes = `:${zeroPad(date.getMinutes() ?? 0)}`
  const seconds = showSeconds ? `:${zeroPad(date.getSeconds() ?? 0)}` : ''
  return `${hours}${minutes}${seconds}`
}
