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

function setupAfterEach(): void {
    const error = nock.isDone() ? undefined : `Pending Nocks: ${nock.pendingMocks().join(',')}`
    expect(error).toBeUndefined()
    nock.cleanAll()
}

async function setupAfterAll(): Promise<void> {
    nock.enableNetConnect()
    nock.restore()
}

beforeAll(setupBeforeAll)
afterEach(setupAfterEach)
afterAll(setupAfterAll)

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
    Trans: (props: { i18nKey: string }) => props.i18nKey,
}))
