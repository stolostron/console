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
import './lib/test-snapshots'

require('react')

process.env.NODE_ENV = 'test'
process.env.JEST_DEFAULT_HOST = 'http://localhost'
process.env.REACT_APP_BACKEND_PATH = ''
if (!process.env.DEBUG_PRINT_LIMIT) {
    process.env.DEBUG_PRINT_LIMIT = '0'
}

JestFetchMock.enableMocks()
fetchMock.dontMock()
// browser fetch works with relative URL; cross-fetch does not
global.fetch = jest.fn((input, reqInit) => {
    const newInput =
        typeof input === 'string' || input instanceof URL
            ? new URL(input.toString(), process.env.JEST_DEFAULT_HOST).toString()
            : input
    return fetchMock(newInput, reqInit)
})

configure({ testIdAttribute: 'id' })
jest.setTimeout(30 * 1000)

async function setupBeforeAll(): Promise<void> {
    nock.disableNetConnect()
    nock.enableNetConnect('127.0.0.1')
    nock.enableNetConnect('localhost')
}

let consoleWarnings: any[]
let consoleErrors: any[]
window.missingNock = undefined

expect.extend({
    hasNoMissingNocks() {
        const msgs: string[] = []
        let pass = true
        Object.entries(window.missingNock || {}).forEach(([k, v]) => {
            if (v.method) {
                pass = false
                switch (v.method) {
                    case 'POST':
                        if (v?.nockedBody) {
                            msgs.push('!!!!!!! --------    nockCreate mismatch -----------    !!!!')
                            msgs.push('\nthis nock: \n')
                            msgs.push(` const req=${JSON.stringify(v.nockedBody)}`)
                            msgs.push("\ndoesn't match this nock: \n")
                            msgs.push(` const req=${JSON.stringify(v.requestedBody)}`)
                        } else {
                            msgs.push('!!!!!!! --------    missing nockCreate -----------    !!!!\n')
                            msgs.push(` const req=${JSON.stringify(v.requestedBody)}`)
                            msgs.push(` const nock = nockCreate(req)`)
                            msgs.push(` // UI clicks create`)
                            msgs.push(` await nock`)
                        }
                        msgs.push('\n!!!!!!! ------------------------------------------------    !!!!')
                        break
                    case 'GET':
                        msgs.push('!!!!!!! --------    missing nock get -----------    !!!!\n')
                        msgs.push(
                            `   const nock =  nock('${v.options.protocol}//${v.options.hostname}').get('${k}').reply(200, response)`
                        )
                        msgs.push(`   // UI clicks somthing`)
                        msgs.push(`   await nock`)
                        msgs.push('\n!!!!!!! ------------------------------------------------    !!!!')
                        break
                    case 'DELETE':
                        // if missing a deleted object, probably wasn't created successfully by test
                        break
                    default:
                        console.log(v.method)
                }
            }
        })

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
    if (!window.missingNock || !window.missingNock[req.path]) {
        const body: any[] = []
        req.requestBodyBuffers?.forEach((buffer: { toString: (arg0: string) => any }) => {
            body.push(`\n${buffer.toString('utf8')}`)
        })
        if (!window.missingNock) {
            window.missingNock = {}
        }
        window.missingNock[req.path] = { requestedBody: body, method: req.method, options: req.options }
    } else if (window.missingNock[req.path]) {
        window.missingNock[req.path].method = req.method
    }
}

function setupBeforeEach(): void {
    consoleErrors = []
    consoleWarnings = []
    nock.emitter.on('no match', logNoMatch)
}

async function setupAfterEach(): Promise<void> {
    // await new Promise((resolve) => setTimeout(resolve, 100))
    // expect(consoleErrors).toEqual([])
    // expect(consoleWarnings).toEqual([])
    expect({}).hasNoMissingNocks()
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
