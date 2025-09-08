/* Copyright Contributors to the Open Cluster Management project */

import YamlParser from './YamlParser'

/**
 * Tests for YamlParser.subStrCount() method
 *
 * This method counts NON-OVERLAPPING occurrences of a substring within a string.
 * For example: subStrCount('aaaa', 'aa') returns 2, counting 'aa|aa' as non-overlapping matches.
 */
describe('YamlParser subStrCount tests', () => {
  let yamlParser

  beforeEach(() => {
    yamlParser = new YamlParser()
    jest.clearAllMocks()
  })

  describe('basic functionality', () => {
    test('should count occurrences of substring in string', () => {
      expect(yamlParser.subStrCount('hello world hello', 'hello')).toBe(2)
      expect(yamlParser.subStrCount('abc abc abc', 'abc')).toBe(3)
      expect(yamlParser.subStrCount('test', 'test')).toBe(1)
    })

    test('should return 0 when substring not found', () => {
      expect(yamlParser.subStrCount('hello world', 'xyz')).toBe(0)
      expect(yamlParser.subStrCount('abc', 'def')).toBe(0)
    })

    test('should handle single character substrings', () => {
      expect(yamlParser.subStrCount('aaaa', 'a')).toBe(4)
      expect(yamlParser.subStrCount('abcdef', 'c')).toBe(1)
      expect(yamlParser.subStrCount('hello', 'l')).toBe(2)
    })
  })

  describe('edge cases', () => {
    test('should handle empty strings', () => {
      expect(yamlParser.subStrCount('', 'test')).toBe(0)
      expect(yamlParser.subStrCount('test', '')).toBe(0)
      expect(yamlParser.subStrCount('', '')).toBe(0)
    })

    test('should handle null and undefined inputs', () => {
      // These inputs get converted to strings: null -> 'null', undefined -> 'undefined'
      expect(yamlParser.subStrCount(null, 'test')).toBe(0)
      expect(yamlParser.subStrCount('test', null)).toBe(0)
      expect(yamlParser.subStrCount(undefined, 'test')).toBe(0)
      expect(yamlParser.subStrCount('test', undefined)).toBe(0)
      expect(yamlParser.subStrCount('null', null)).toBe(1) // 'null' contains 'null'
    })

    test('should convert non-string inputs to strings', () => {
      expect(yamlParser.subStrCount(123123123, '123')).toBe(3)
      expect(yamlParser.subStrCount('123123123', 123)).toBe(3)
      expect(yamlParser.subStrCount(111, 1)).toBe(3)
    })

    test('should handle substring longer than string', () => {
      expect(yamlParser.subStrCount('hi', 'hello')).toBe(0)
      expect(yamlParser.subStrCount('a', 'abc')).toBe(0)
    })
  })

  describe('non-overlapping pattern counting', () => {
    test('should count non-overlapping substring occurrences', () => {
      // The function counts non-overlapping occurrences
      // For 'aaaa' searching for 'aa', it finds 2 non-overlapping matches: 'aa|aa'
      expect(yamlParser.subStrCount('aaaa', 'aa')).toBe(2)
      expect(yamlParser.subStrCount('ababab', 'aba')).toBe(1) // Only first 'aba', not overlapping
      expect(yamlParser.subStrCount('111111', '11')).toBe(3) // '11|11|11'
    })

    test('should handle patterns with potential overlaps correctly', () => {
      // These test cases verify non-overlapping behavior
      expect(yamlParser.subStrCount('abcabcabc', 'abc')).toBe(3)
      expect(yamlParser.subStrCount('testtest', 'test')).toBe(2)
      expect(yamlParser.subStrCount('aaabaaab', 'aaa')).toBe(2) // 'aaa|b|aaa|b'
    })

    test('should find all valid non-overlapping matches', () => {
      // The implementation correctly finds matches at any position
      expect(yamlParser.subStrCount('axbxcxdefxghx', 'def')).toBe(1)
      expect(yamlParser.subStrCount('xyzabcxyzabc', 'abc')).toBe(2)
      expect(yamlParser.subStrCount('aabaaabaaab', 'aab')).toBe(3)
    })
  })

  describe('start parameter', () => {
    test('should respect start parameter', () => {
      expect(yamlParser.subStrCount('hello world hello', 'hello', 6)).toBe(1)
      expect(yamlParser.subStrCount('abc abc abc', 'abc', 4)).toBe(2)
      expect(yamlParser.subStrCount('test test test', 'test', 5)).toBe(2)
    })

    test('should handle start parameter beyond string length', () => {
      expect(yamlParser.subStrCount('hello', 'hello', 10)).toBe(0)
    })

    test('should handle negative start parameter', () => {
      // substr() handles negative indices, so should work normally
      expect(yamlParser.subStrCount('hello world hello', 'hello', -5)).toBe(1)
    })
  })

  describe('length parameter', () => {
    test('should respect length parameter', () => {
      expect(yamlParser.subStrCount('hello world hello', 'hello', undefined, 5)).toBe(1)
      expect(yamlParser.subStrCount('abc abc abc', 'abc', undefined, 7)).toBe(2)
    })

    test('should work with both start and length parameters', () => {
      expect(yamlParser.subStrCount('hello world hello again', 'hello', 0, 17)).toBe(2)
      expect(yamlParser.subStrCount('hello world hello again', 'hello', 6, 11)).toBe(1)
      expect(yamlParser.subStrCount('abc abc abc abc', 'abc', 4, 8)).toBe(2)
    })

    test('should handle length parameter of 0', () => {
      expect(yamlParser.subStrCount('hello world', 'hello', undefined, 0)).toBe(0)
    })
  })

  describe('special characters', () => {
    test('should handle special characters', () => {
      expect(yamlParser.subStrCount('a.b.c.d', '.')).toBe(3)
      expect(yamlParser.subStrCount('line1\nline2\nline3', '\n')).toBe(2)
      expect(yamlParser.subStrCount('tab\ttab\ttab', '\t')).toBe(2)
      expect(yamlParser.subStrCount('a*b*c*d', '*')).toBe(3)
    })

    test('should handle regex special characters as literals', () => {
      expect(yamlParser.subStrCount('a+b+c', '+')).toBe(2)
      expect(yamlParser.subStrCount('a[b]c[d]', '[')).toBe(2)
      expect(yamlParser.subStrCount('a{b}c{d}', '{')).toBe(2)
    })
  })
})
