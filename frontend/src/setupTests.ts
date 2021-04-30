/* Copyright Contributors to the Open Cluster Management project */

/* eslint-disable @typescript-eslint/no-explicit-any */

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect'
import nock from 'nock'
import { configure } from '@testing-library/dom'

configure({ testIdAttribute: 'id' })
jest.setTimeout(30 * 1000)

process.env.REACT_APP_BACKEND_HOST = 'http://localhost'
process.env.REACT_APP_BACKEND_PATH = ''

async function setupBeforeAll(): Promise<void> {
    nock.disableNetConnect()
    nock.enableNetConnect('127.0.0.1')
    nock.enableNetConnect('localhost')
}

let missingNocks: string[]
let consoleWarnings: any[]
let consoleErrors: any[]

expect.extend({
    hasMissingMocks(missing) {
        const msgs: string[] = []
        const pass: boolean = missing.length === 0
        if (!pass) {
            msgs.push('\n\n\n!!!!!!!!!!!!!!!! MISSING MOCKS !!!!!!!!!!!!!!!!!!!!!!!!')
            msgs.push('(Make sure the mocks in test match these mocks)\n')
            missing.forEach((req: { method: any; path: any; requestBodyBuffers: any[] }) => {
                const missingNock = []
                missingNock.push(req.method)
                missingNock.push(req.path)
                req.requestBodyBuffers.forEach((buffer) => {
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

console.warn = (message?: any, ..._optionalParams: any[]) => {
    if (typeof message === 'string') {
        if (message.startsWith('You are using a beta component feature (isAriaDisabled).')) return
    }
    consoleWarnings.push(message)
}
// const originalConsoleError = console.error
console.error = (message?: any, ...optionalParams: any[]) => {
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
    Trans: (props: { i18nKey: string }) => props.i18nKey,
}))

jest.mock('i18next', () => ({
    t: (key: string) => key,
}))
