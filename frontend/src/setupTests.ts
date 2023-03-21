/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { configure } from '@testing-library/dom'
import '@testing-library/jest-dom'
import i18n from 'i18next'
import JestFetchMock from 'jest-fetch-mock'
import 'jest-axe/extend-expect'
import get from 'lodash/get'
import { diff } from 'jest-diff'
import nock from 'nock'
import 'regenerator-runtime/runtime'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { initReactI18next } from 'react-i18next'
import './lib/test-shots'

require('react')

process.env.NODE_ENV = 'test'
process.env.JEST_DEFAULT_HOST = 'http://localhost'
process.env.REACT_APP_BACKEND_PATH = ''
process.env.MODE = 'plugin'
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
global.EventSource = class EventSource {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSED = 2

  constructor(url: string | URL, eventSourceInitDict?: EventSourceInit | undefined) {
    this.url = url.toString()
    this.withCredentials = !!eventSourceInitDict?.withCredentials
  }
  CONNECTING = 0
  OPEN = 1
  CLOSED = 2

  url: string
  readyState = 0
  withCredentials = false

  addEventListener = () => {}
  close = () => {}
  dispatchEvent = () => false
  onerror = () => {}
  onmessage = () => {}
  onopen = () => {}
  removeEventListener = () => {}
}

configure({ testIdAttribute: 'id' })
jest.setTimeout((process.env.LAUNCH ? 3000 : 30) * 1000)

async function setupBeforeAll(): Promise<void> {
  nock.disableNetConnect()
  nock.enableNetConnect('127.0.0.1')
  nock.enableNetConnect('localhost')
}

let missingNocks: { method: any; path: any; requestBodyBuffers: any[] }[]
let consoleWarnings: any[] = []
let consoleErrors: any[] = []

expect.extend({
  toHaveMultilineValue(received, expected: string) {
    received = received.value || received
    return {
      pass: expected.trim().localeCompare(received.trim()) === 0,
      message: () =>
        'expect(received).toHaveMultilineValue(expected):' +
        diff(expected, received, {
          contextLines: 3,
          expand: false,
        }),
    }
  },

  hasNoMissingNocks() {
    const msgs: string[] = []
    const pass: boolean = missingNocks.length === 0
    if (!pass) {
      const nocks = missingNocks
        //.filter(({ method }) => method !== 'DELETE')
        .map((req) => {
          const arr: any[] = []
          req.requestBodyBuffers?.forEach((buffer: { toString: (arg0: string) => any }) => {
            arr.push(`\n${buffer.toString('utf8')}`)
          })
          const ret: {
            url: string
            method: string
            reqBody?: string
          } = {
            url: req.path,
            method: req.method,
          }
          const body = arr[0]
          if (body) {
            ret.reqBody = JSON.parse(body)
          }
          return ret
        })

      const mismatchedNocks: any[] = []
      const pendingNocks: any[] = []
      const completedNocks: any[] = []
      window.pendingNocks.forEach((nock) => {
        if (nock.scope.isDone()) {
          completedNocks.push(nock)
        } else if (get(nock.scope, 'diff')) {
          mismatchedNocks.push(nock)
        } else {
          pendingNocks.push(nock)
        }
      })
      const { dataMocks, funcMocks } = window.getNockShot(nocks, true)
      if (mismatchedNocks.length) {
        msgs.push('\n\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
        msgs.push('!!!!!!!!!!!!!!!! MISMATCHED NOCK(S) !!!!!!!!!!!!!!!!!!!!!!!!')
        mismatchedNocks.forEach(({ scope, nock, source }) => {
          msgs.push(`'${nock}' ${source.trim()}`)
          const diff = get(scope, 'diff')
          if (diff) {
            msgs.push('\n this nock almost matched a request but the bodies were different here:')
            diff.forEach((d: { lhs: any; rhs: any }) => {
              msgs.push(' the request expected this:')
              msgs.push(`  ${d?.lhs}`)
              msgs.push(' the nock provided this:')
              msgs.push(`  ${d?.rhs}`)
            })
          }
        })
        msgs.push('>>>>>> try using this in the nock: <<<<<<<<<<<<')
        dataMocks.forEach((data: string) => {
          msgs.push(data)
        })
      } else {
        msgs.push('\n\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
        msgs.push('!!!!!!!!!!!!!!!! MISSING NOCK(S) !!!!!!!!!!!!!!!!!!!!!!!!')
        msgs.push('\n there was no nocks that matched these request(s):')

        dataMocks.forEach((data: string) => {
          msgs.push(data)
        })
        msgs.push('\n\n')
        funcMocks.forEach((func: string) => {
          msgs.push(func)
        })
      }
      if (pendingNocks.length) {
        msgs.push('\n\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
        msgs.push('!!!!!!!!!!!!!!!! UNUSED NOCK(S) !!!!!!!!!!!!!!!!!!!!!!!!')
        msgs.push('!!! THESE nocks were not required by any request: ')
        pendingNocks.forEach(({ nock, source }) => {
          msgs.push(`'${nock}' ${source.trim()}`)
        })
      }
      if (completedNocks.length) {
        msgs.push('\n\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
        msgs.push('!!!!!!!!!!!!!!!! COMPLETED NOCK(S) !!!!!!!!!!!!!!!!!!!!!!!!')
        msgs.push('!!! THESE nocks were used to satisfy requests:')
        completedNocks.forEach(({ nock, source }) => {
          msgs.push(`'${nock}' ${source.trim()}`)
        })
      }
    }

    const message: () => string = () => msgs.join('\n')
    return {
      message,
      pass,
    }
  },
  hasNoPendingNocks() {
    const msgs: string[] = []
    const pendingNocks = window.pendingNocks.filter(({ scope }) => !scope.isDone())
    const pass: boolean = pendingNocks.length === 0
    if (!pass) {
      msgs.push('\n\n\n!!!!!!!!!!!!!!!! UNUSED NOCK(S) !!!!!!!!!!!!!!!!!!!!!!!!\n\n\n')
      pendingNocks.forEach(({ nock, source }) => {
        msgs.push(`Unused '${nock}' ${source.trim()}`)
      })
      msgs.push('\n\n\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    }

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
  window.pendingNocks = []
}

async function setupAfterEach(): Promise<void> {
  expect(missingNocks).hasNoMissingNocks()
  expect(missingNocks).hasNoPendingNocks()
  // expect(consoleErrors).toEqual([])
  // expect(consoleWarnings).toEqual([])
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
    compatibilityJSON: 'v3',
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
