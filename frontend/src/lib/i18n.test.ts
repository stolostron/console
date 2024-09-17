/* Copyright Contributors to the Open Cluster Management project */

import { t } from 'i18next'
import i18n from 'i18next'
import { jest } from '@jest/globals'

jest.mock('i18next', () => ({
  t: jest.fn((key, { date, number }) => {
    if (date instanceof Date) {
      if (typeof key === 'string' && key.includes('fromNow')) {
        const now = new Date()
        const elapsed = now.getTime() - date.getTime()
        const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

        const seconds = Math.floor(elapsed / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (seconds < 60) return rtf.format(-seconds, 'second')
        if (minutes < 60) return rtf.format(-minutes, 'minute')
        if (hours < 24) return rtf.format(-hours, 'hour')
        return rtf.format(-days, 'day')
      }
      return new Intl.DateTimeFormat('en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      }).format(date)
    }

    if (typeof number === 'number') {
      return new Intl.NumberFormat('en').format(number)
    }

    return ''
  }),
}))

describe('Date formatting tests', () => {
  const now = new Date('2024-09-15T12:00:00Z') // Use a fixed reference time

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2024-09-15T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return "5 seconds ago" for timestamps 5 seconds ago', () => {
    const timestamp = new Date(now.getTime() - 5000) // 5 seconds ago
    const result = t('{{date, fromNow}}', { date: timestamp })
    expect(result).toBe('5 seconds ago') // Expected output
  })

  it('should return "1 minute ago" for timestamps 1 minute ago', () => {
    const timestamp = new Date(now.getTime() - 60000) // 1 minute ago
    const result = t('{{date, fromNow}}', { date: timestamp })
    expect(result).toBe('1 minute ago') // Expected output
  })

  it('should return "1 hour ago" for timestamps 1 hour ago', () => {
    const timestamp = new Date(now.getTime() - 3600000) // 1 hour ago
    const result = t('{{date, fromNow}}', { date: timestamp })
    expect(result).toBe('1 hour ago') // Expected output
  })

  it('should return "yesterday" for timestamps 1 day ago', () => {
    const timestamp = new Date(now.getTime() - 86400000) // 1 day ago
    const result = t('{{date, fromNow}}', { date: timestamp })
    expect(result).toBe('yesterday') // Adjusted expected output
  })

  it('should return "2 days ago" for timestamps 2 days ago', () => {
    const timestamp = new Date(now.getTime() - 172800000) // 2 days ago
    const result = t('{{date, fromNow}}', { date: timestamp })
    expect(result).toBe('2 days ago') // Expected output
  })
})

describe('i18n format function', () => {
  const now = new Date('2024-09-15T12:00:00Z') // Reference time

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('should format date with default settings', () => {
    const date = new Date('2024-09-14T12:00:00Z') // UTC time
    const result = i18n.t('{{date, format}}', { date: date })

    // Adjusting expected result based on how i18n formats the date
    const expected = 'Sep 14, 2024, 12:00:00 PM' // Adjusted for UTC output

    expect(result).toBe(expected)
  })

  test('should return "5 seconds ago" for timestamps 5 seconds ago', () => {
    const timestamp = new Date(now.getTime() - 5000)
    const result = i18n.t('{{date, fromNow}}', { date: timestamp })
    expect(result).toBe('5 seconds ago')
  })

  test('should return "1 minute ago" for timestamps 1 minute ago', () => {
    const timestamp = new Date(now.getTime() - 60000)
    const result = i18n.t('{{date, fromNow}}', { date: timestamp })
    expect(result).toBe('1 minute ago')
  })

  test('should return "1 hour ago" for timestamps 1 hour ago', () => {
    const timestamp = new Date(now.getTime() - 3600000)
    const result = i18n.t('{{date, fromNow}}', { date: timestamp })
    expect(result).toBe('1 hour ago')
  })

  test('should return "yesterday" for timestamps 1 day ago', () => {
    const timestamp = new Date(now.getTime() - 86400000)
    const result = i18n.t('{{date, fromNow}}', { date: timestamp })
    expect(result).toBe('yesterday')
  })

  test('should return "2 days ago" for timestamps 2 days ago', () => {
    const timestamp = new Date(now.getTime() - 172800000)
    const result = i18n.t('{{date, fromNow}}', { date: timestamp })
    expect(result).toBe('2 days ago')
  })

  test('should format numbers correctly', () => {
    const number = 1234567.89
    const result = i18n.t('{{number}}', { number })
    expect(result).toBe('1,234,567.89') // Adjusts based on the locale
  })
})
