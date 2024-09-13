// /* Copyright Contributors to the Open Cluster Management project */
import { fromNow, getDuration, isValid, timeFormatter, dateFormatter } from './datetime'

// Mock i18n for translation functions
jest.mock('i18next', () => ({
  t: (key: string, options?: any) => {
    if (key === 'Just now') return 'Just now'
    return `${options.count} ${key}`
  },
}))

describe('fromNow', () => {
  it('should return "Just now" for very recent dates (1 ms)', () => {
    const now = new Date()
    const recentDate = new Date(now.getTime() - 1)
    expect(fromNow(recentDate, now)).toBe('Just now')
  })

  it('should return correct relative time for past dates', () => {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 86400000) // 1 day ago
    expect(fromNow(oneDayAgo, now)).toBe('1 day ago')
  })

  it('should return "-" for future dates', () => {
    const now = new Date()
    const futureDate = new Date(now.getTime() + 86400000) // 1 day in the future
    expect(fromNow(futureDate, now)).toBe('-')
  })

  it.skip('should handle options like omitSuffix', () => {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 86400000)
    expect(fromNow(oneDayAgo, now, { omitSuffix: true })).toBe('1 day')
  })
})
describe('getDuration', () => {
  it('should correctly calculate duration in days, hours, minutes, and seconds', () => {
    const ms = 90061000 // 1 day, 1 hour, 1 minute, 1 second
    const result = getDuration(ms)
    expect(result).toEqual({ days: 1, hours: 1, minutes: 1, seconds: 1 })
  })

  it('should return zero for negative or null values', () => {
    expect(getDuration(-1000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
    expect(getDuration(0)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })
})

describe('isValid', () => {
  it('should return true for valid Date objects', () => {
    const validDate = new Date()
    expect(isValid(validDate)).toBe(true)
  })

  it('should return false for invalid Date objects', () => {
    const invalidDate = new Date('invalid date')
    expect(isValid(invalidDate)).toBe(false)
  })
})

describe('Formatters', () => {
  it('should format time correctly using timeFormatter', () => {
    const date = new Date('2024-09-09T12:44:00')
    expect(timeFormatter.format(date)).toBe('12:44 PM') // Depending on locale
  })

  it('should format date correctly using dateFormatter', () => {
    const date = new Date('2024-09-09')
    expect(dateFormatter.format(date)).toBe('Sep 8, 2024') // Depending on locale
  })
})
