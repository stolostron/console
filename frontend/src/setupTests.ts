// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect'
import nock from 'nock'
import { configure } from '@testing-library/dom'

configure({ testIdAttribute: 'id' })
jest.setTimeout(30 * 1000)

process.env.REACT_APP_BACKEND_HOST = 'http://www.example.com:80'
process.env.REACT_APP_BACKEND_PATH = ''

async function setupBeforeAll(): Promise<void> {
    nock.disableNetConnect()
    nock.enableNetConnect('127.0.0.1')
    nock.enableNetConnect('localhost')
}

let noMatches: string[]
let consoleWarnings: any[]
let consoleErrors: any[]

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
    if (noMatches.length === 0) {
        noMatches.push('No match for requests')
    }
    noMatches.push(`${req.method} ${req.path}`)
}

function setupBeforeEach(): void {
    noMatches = []
    consoleErrors = []
    consoleWarnings = []
    nock.emitter.on('no match', logNoMatch)
}

async function setupAfterEach(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(noMatches).toEqual([])
    // expect(consoleErrors).toEqual([])
    // expect(consoleWarnings).toEqual([])
    const error = nock.isDone() ? undefined : `Pending Nocks: ${nock.pendingMocks().join(',')}`
    expect(error).toBeUndefined()
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
