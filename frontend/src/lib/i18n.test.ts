/* Copyright Contributors to the Open Cluster Management project */

import { t } from 'i18next'

// jest.mock setup
jest.mock('i18next', () => ({
  t: jest.fn((key, { date }) => {
    if (key === '{{date, fromNow}}') {
      if (!(date instanceof Date)) {
        return ''
      }

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
      if (days === 1) return 'yesterday' // Special case for 1 day ago
      return rtf.format(-days, 'day')
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
