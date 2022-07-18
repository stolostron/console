/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { configure } from '@testing-library/dom'
import '@testing-library/jest-dom'
import i18n from 'i18next'
import JestFetchMock from 'jest-fetch-mock'
import 'jest-axe/extend-expect'
import nock from 'nock'
import 'regenerator-runtime/runtime'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { initReactI18next } from 'react-i18next'

require('react')

process.env.NODE_ENV = 'test'
process.env.JEST_DEFAULT_HOST = 'http://localhost'
process.env.REACT_APP_BACKEND_PATH = ''

JestFetchMock.enableMocks()
fetchMock.dontMock()
// browser fetch works with relative URL; cross-fetch does not
global.fetch = jest.fn((input, reqInit) =>
    fetchMock(typeof input === 'string' ? new URL(input, process.env.JEST_DEFAULT_HOST).toString() : input, reqInit)
)

configure({ testIdAttribute: 'id' })
jest.setTimeout(30 * 1000)

async function setupBeforeAll(): Promise<void> {
    nock.disableNetConnect()
    nock.enableNetConnect('127.0.0.1')
    nock.enableNetConnect('localhost')
}

let missingNocks: { method: any; path: any; requestBodyBuffers: any[] }[]
let consoleWarnings: any[]
let consoleErrors: any[]

expect.extend({
    hasMissingMocks(missing: { method: any; path: any; requestBodyBuffers: any[] }[]) {
        const msgs: string[] = []
        const pass: boolean = missing.length === 0
        if (!pass) {
            msgs.push('\n\n\n!!!!!!!!!!!!!!!! MISSING MOCKS !!!!!!!!!!!!!!!!!!!!!!!!')
            msgs.push('(Make sure the mocks in test match these mocks)\n')
            missing.forEach((req) => {
                const missingNock = []
                missingNock.push(req.method)
                missingNock.push(req.path)
                req.requestBodyBuffers?.forEach((buffer) => {
                    missingNock.push(`\n${buffer.toString('utf8')}`)
                })
                msgs.push(missingNock.join(' '))
            })
            msgs.push('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
        }
        const message: () => string = () => msgs.join('\n')
        return {
            message,
            pass,
        }
    },
    hasUnusedMocks(unused) {
        const msgs: string[] = []
        const pass: boolean = unused.length === 0
        if (!pass) {
            msgs.push('\n\n\n!!!!!!!!!!!!!!!! EXTRA MOCKS !!!!!!!!!!!!!!!!!!!!!!!!')
            msgs.push('(If there are no other errors above, these mocks are no longer required)\n')
            unused.forEach((pending: string) => {
                msgs.push(pending)
            })
            msgs.push('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
        }
        const message: () => string = () => msgs.join('\n')
        return {
            message,
            pass,
        }
    },
    hasNoConsoleLogs(logs) {
        const msgs: string[] = logs
        const pass: boolean = logs.length === 0
        const message: () => string = () => msgs.join('\n')
        return {
            message,
            pass,
        }
    },
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
console.warn = (message?: any, ..._optionalParams: any[]) => {
    if (typeof message === 'string') {
        if (message.startsWith('You are using a beta component feature (isAriaDisabled).')) return
    }
    consoleWarnings.push(message)
}
// const originalConsoleError = console.error
// eslint-disable-next-line @typescript-eslint/no-unused-vars
console.error = (message?: any, ..._optionalParams: any[]) => {
    consoleErrors.push(message)
    // originalConsoleError(message, optionalParams)
}

function logNoMatch(req: any) {
    missingNocks.push(req)
}

function setupBeforeEach(): void {
    missingNocks = []
    consoleErrors = []
    consoleWarnings = []
    nock.emitter.on('no match', logNoMatch)
}

async function setupAfterEach(): Promise<void> {
    // await new Promise((resolve) => setTimeout(resolve, 100))
    expect(missingNocks).hasMissingMocks()
    // expect(consoleErrors).toEqual([])
    // expect(consoleWarnings).toEqual([])
    expect(nock.pendingMocks()).hasUnusedMocks()
}

async function setupAfterEachNock(): Promise<void> {
    nock.emitter.off('no match', logNoMatch)
    nock.cleanAll()
}

async function setupAfterAll(): Promise<void> {
    nock.enableNetConnect()
    nock.restore()
}

beforeAll(setupBeforeAll)
beforeEach(setupBeforeEach)
afterEach(setupAfterEach)
afterEach(setupAfterEachNock)
afterAll(setupAfterAll)

i18n
    // pass the i18n instance to react-i18next
    .use(initReactI18next)
    // init i18next
    .init({
        keySeparator: false, // this repo will use single level json
        interpolation: {
            escapeValue: false, // react handles this already
        },
        defaultNS: 'translation', // the default file for strings when using useTranslation, etc
        nsSeparator: '~',
        supportedLngs: ['en'], // only languages from this array will attempt to be loaded
        simplifyPluralSuffix: true,
        lng: 'en',
        fallbackLng: 'en',
        ns: 'translation',
        resources: {
            en: {
                translation: require('../public/locales/en/translation.json'),
            },
        },
    })

const moment = jest.requireActual('moment-timezone')
jest.doMock('moment', () => {
    moment.tz.setDefault('UTC')
    return moment
})

window.matchMedia =
    window.matchMedia ||
    function () {
        return {
            matches: false,
            addListener: function () {},
            removeListener: function () {},
        }
    }
