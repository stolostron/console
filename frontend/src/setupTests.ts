/* Copyright Contributors to the Open Cluster Management project */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { configure } from '@testing-library/dom'
import '@testing-library/jest-dom'
import JestFetchMock from 'jest-fetch-mock'
import { noop } from 'lodash'
import nock from 'nock'

require('react')

JestFetchMock.enableMocks()
fetchMock.dontMock()

configure({ testIdAttribute: 'id' })
jest.setTimeout(30 * 1000)

process.env.NODE_ENV = 'test'
process.env.REACT_APP_BACKEND_HOST = 'http://localhost'
process.env.REACT_APP_BACKEND_PATH = ''

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

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
    withTranslation: () => (Component: any) => {
        Component.defaultProps = { ...Component.defaultProps, t: () => '' }
        return Component
    },
    Trans: (props: { i18nKey: string }) => props.i18nKey,
}))

jest.mock('i18next', () => ({
    t: (key: string) => key,
    createInstance: () => ({
        use: () => ({
            use: () => ({
                init: noop,
            }),
        }),
    }),
}))
