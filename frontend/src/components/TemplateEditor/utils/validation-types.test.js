/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable jest/no-conditional-expect */

import { validateNoProxy, validateNoProxyList } from './validation-types'

const t = (key) => key
describe('validation', () => {
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
    describe('validateNoProxyList', () => {
        test.each([
            ['should allow a CSV with valid no proxy values', 'ca,.com,example.org,10.0.0.1,*', true], // NOSONAR - IP address used in test
            ['should not allow a CSV with any bad proxy value', 'ca,.com,example.org,10.0.0.*,*', false], // NOSONAR - IP address used in test
        ])('%s', (_name, value, isValid) => {
            if (!isValid) {
                expect(validateNoProxyList(value, t)).toBeTruthy()
            } else {
                expect(validateNoProxyList(value, t)).toBeUndefined()
            }
        })
    })
})
