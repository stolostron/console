/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable jest/no-conditional-expect */

import { validateHttpsURL, validateNoProxy } from './validation'

const t = (key: string) => key
describe('validation', () => {
  describe('validateHttpsURL', () => {
    test.each([
      ['should allow a valid https URL', 'https://example.com', true],
      ['should allow a valid https URL with path', 'https://example.com/path/to/resource', true],
      ['should allow a valid https URL with port', 'https://example.com:8443', true],
      ['should allow empty value', '', true],
      ['should not allow http URL', 'http://example.com', false],
      ['should not allow URL without protocol', 'example.com', false],
      ['should not allow plain string', 'not-a-url', false],
      ['should not allow ftp URL', 'ftp://example.com', false],
    ])('%s', (_name, value, isValid) => {
      if (isValid) {
        expect(validateHttpsURL(value, t)).toBeUndefined()
      } else {
        expect(validateHttpsURL(value, t)).toBeTruthy()
      }
    })
  })
  describe('validateNoProxy', () => {
    test.each([
      ['should allow a domain without TLD', 'ca', true],
      ['should allow a domain prefaced with .', '.com', true],
      ['should allow an IP address', '10.0.0.1', true], // NOSONAR - IP address used in test
      ['should allow a CIDR', '10.0.0.0/16', true], // NOSONAR - CIDR used in test
      ['should allow *', '*', true],
      ['should not allow a value with spaces', 'test space', false],
      ['should not allow ?', '?', false],
    ])('%s', (_name, value, isValid) => {
      if (!isValid) {
        expect(validateNoProxy(value, t)).toBeTruthy()
      } else {
        expect(validateNoProxy(value, t)).toBeUndefined()
      }
    })
  })
})
