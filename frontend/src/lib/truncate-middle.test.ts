/* Copyright Contributors to the Open Cluster Management project */

import { truncateMiddle, shouldTruncate, TruncateOptions } from './truncate-middle'

describe('truncate-middle', () => {
  describe('truncateMiddle', () => {
    describe('handles falsy input', () => {
      test.each([
        ['should return empty string for empty string', ''],
        ['should return undefined for undefined', undefined],
        ['should return null for null', null],
      ])('%s', (_name, value) => {
        expect(truncateMiddle(value as string)).toBe(value)
      })
    })

    describe('does not truncate short strings', () => {
      test.each([
        ['should not truncate string equal to length', 'twelve-chars', { length: 12 }],
        ['should not truncate string shorter than length', 'short', { length: 20 }],
        ['should not truncate string equal to length + minTruncateChars', 'this-is-23-characters!', { length: 20 }],
        [
          'should not truncate when within minTruncateChars threshold',
          'this-is-22-character',
          { length: 20, minTruncateChars: 3 },
        ],
      ])('%s', (_name, value, options) => {
        expect(truncateMiddle(value, options)).toBe(value)
      })
    })

    describe('truncates in the middle by default', () => {
      test('should truncate a long string in the middle', () => {
        const result = truncateMiddle('this-is-a-very-long-string-that-needs-truncation', { length: 20 })
        expect(result.length).toBe(20)
        expect(result).toContain('\u2026') // ellipsis
        expect(result.startsWith('this-is-a')).toBe(true)
        expect(result.endsWith('uncation')).toBe(true)
      })

      test('should truncate with default length of 20', () => {
        const result = truncateMiddle('abcdefghijklmnopqrstuvwxyz-1234567890')
        expect(result.length).toBe(20)
      })

      test('should handle even split when length allows', () => {
        const result = truncateMiddle('1234567890abcdefghij', { length: 11 })
        // With length 11 and omission of 1 char, we have 10 chars to split
        // startLength = ceil(10/2) = 5, endLength = 10 - 5 = 5
        // Takes first 5 chars and last 5 chars from original string
        expect(result).toBe('12345\u2026fghij')
      })
    })

    describe('truncates at the end when truncateEnd is true', () => {
      test('should truncate at the end of string', () => {
        const result = truncateMiddle('this-is-a-very-long-string-that-needs-truncation', {
          length: 20,
          truncateEnd: true,
        })
        expect(result.length).toBe(20)
        expect(result).toBe('this-is-a-very-long\u2026')
      })

      test('should preserve start of string when truncating at end', () => {
        const result = truncateMiddle('abcdefghijklmnopqrstuvwxyz', {
          length: 10,
          truncateEnd: true,
        })
        expect(result.startsWith('abcdefghi')).toBe(true)
        expect(result.endsWith('\u2026')).toBe(true)
      })
    })

    describe('respects custom options', () => {
      test('should use custom omission character', () => {
        const result = truncateMiddle('this-is-a-very-long-string-that-needs-truncation', {
          length: 20,
          omission: '...',
        })
        expect(result).toContain('...')
        expect(result.length).toBe(20)
      })

      test('should use custom minTruncateChars', () => {
        // String of 25 chars, length of 20, minTruncateChars of 10
        // 25 > 20 + 10 = false, so should NOT truncate
        const input = 'this-is-25-characters!!!'
        expect(input.length).toBe(24)
        const result = truncateMiddle(input, { length: 20, minTruncateChars: 10 })
        expect(result).toBe(input)
      })

      test('should truncate when exceeding minTruncateChars threshold', () => {
        // String of 35 chars, length of 20, minTruncateChars of 10
        // 35 > 20 + 10 = true, so should truncate
        const input = 'this-is-a-35-character-string!!!!'
        expect(input.length).toBe(33)
        const result = truncateMiddle(input, { length: 20, minTruncateChars: 10 })
        expect(result.length).toBe(20)
      })
    })

    describe('handles edge cases', () => {
      test('should return only omission when length equals omission length', () => {
        const result = truncateMiddle('this-is-a-very-long-string', { length: 1 })
        expect(result).toBe('\u2026')
      })

      test('should return omission when length is less than omission length', () => {
        const result = truncateMiddle('this-is-a-very-long-string', { length: 0 })
        expect(result).toBe('\u2026')
      })

      test('should handle multi-character omission with small length', () => {
        const result = truncateMiddle('this-is-a-very-long-string', {
          length: 3,
          omission: '...',
        })
        expect(result).toBe('...')
      })

      test('should handle single character strings appropriately', () => {
        expect(truncateMiddle('a')).toBe('a')
      })

      test('should handle strings with unicode characters', () => {
        const result = truncateMiddle('日本語テキストがとても長い場合', { length: 10 })
        expect(result.length).toBe(10)
        expect(result).toContain('\u2026')
      })
    })
  })

  describe('shouldTruncate', () => {
    test.each([
      ['should return true when string exceeds threshold', 'this-is-a-long-string-that-exceeds-threshold', {}, true],
      ['should return false for empty string', '', {}, false],
      ['should return false when string equals threshold', 'this-is-23-characters!', { length: 20 }, false],
      ['should return false when string is shorter than threshold', 'short', { length: 20 }, false],
      ['should respect custom length option', 'longer-than-ten', { length: 10 }, true],
      [
        'should respect custom minTruncateChars option',
        'medium-length-string',
        { length: 15, minTruncateChars: 10 },
        false,
      ],
      [
        'should return true when exceeding custom threshold',
        'this-is-a-very-long-string!!',
        { length: 15, minTruncateChars: 5 },
        true,
      ],
    ])('%s', (_name, text, options: TruncateOptions, expected) => {
      expect(shouldTruncate(text, options)).toBe(expected)
    })

    test('should use default values when no options provided', () => {
      // Default length = 20, minTruncateChars = 3
      // So threshold is 23 characters (text.length > length + minTruncateChars)
      const str23 = 'abcdefghijklmnopqrstuvw' // exactly 23 chars
      const str24 = 'abcdefghijklmnopqrstuvwx' // exactly 24 chars
      expect(str23.length).toBe(23)
      expect(str24.length).toBe(24)
      expect(shouldTruncate(str23)).toBe(false) // 23 is not > 23
      expect(shouldTruncate(str24)).toBe(true) // 24 > 23
    })
  })
})
