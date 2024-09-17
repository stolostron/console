/* Copyright Contributors to the Open Cluster Management project */

import { t } from 'i18next'

jest.mock('i18next', () => ({
  t: jest.fn(({ date }) => {
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
  }),
}))

describe('Date formatting tests', () => {
  beforeEach(() => {
    // Mocking the current date to '2024-09-15T12:00:00Z'
    jest.useFakeTimers().setSystemTime(new Date('2024-09-15T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return "5 seconds ago" for timestamps 5 seconds ago', () => {
    const timestamp = new Date('2024-09-15T11:59:55Z')

    const result = t('{{date, fromNow}}', { date: timestamp })

    expect(result).toBe('5 seconds ago')
  })

  it('should return "1 minute ago" for timestamps 1 minute ago', () => {
    const timestamp = new Date('2024-09-15T11:59:00Z')

    const result = t('{{date, fromNow}}', { date: timestamp })

    expect(result).toBe('1 minute ago')
  })

  it('should return "1 hour ago" for timestamps 1 hour ago', () => {
    const timestamp = new Date('2024-09-15T11:00:00Z')

    const result = t('{{date, fromNow}}', { date: timestamp })

    expect(result).toBe('1 hour ago')
  })

  it('should return "1 day ago" or "yesterday" for timestamps 1 day ago', () => {
    const timestamp = new Date('2024-09-14T12:00:00Z')

    const result = t('{{date, fromNow}}', { date: timestamp })

    expect(['1 day ago', 'yesterday']).toContain(result) // Allowing both results
  })

  it('should return "2 days ago" for timestamps 2 days ago', () => {
    const timestamp = new Date('2024-09-13T12:00:00Z')

    const result = t('{{date, fromNow}}', { date: timestamp })

    expect(result).toBe('2 days ago')
  })
})
