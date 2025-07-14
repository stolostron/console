/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { configure } from '@testing-library/dom'
import '@testing-library/jest-dom'
import 'jest-axe/extend-expect'
import JestFetchMock from 'jest-fetch-mock'
import { TextEncoder } from 'util'
import i18n from 'i18next'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { initReactI18next } from 'react-i18next'

process.env.NODE_ENV = 'test'
process.env.JEST_DEFAULT_HOST = 'http://localhost'
process.env.REACT_APP_BACKEND_PATH = ''
process.env.MODE = 'plugin'
process.env.DEBUG_PRINT_LIMIT ??= '0'

window.SERVER_FLAGS = { basePath: '/' } as any

JestFetchMock.enableMocks()
fetchMock.dontMock()

global.fetch = jest.fn((input, reqInit) => {
  const newInput =
    typeof input === 'string' || input instanceof URL
      ? new URL(input.toString(), process.env.JEST_DEFAULT_HOST).toString()
      : input
  return fetchMock(newInput, reqInit)
})

global.EventSource = class EventSource {
  static readonly CONNECTING = 0 as const
  static readonly OPEN = 1 as const
  static readonly CLOSED = 2 as const

  constructor(url: string | URL, eventSourceInitDict?: EventSourceInit | undefined) {
    this.url = url.toString()
    this.withCredentials = !!eventSourceInitDict?.withCredentials
  }

  CONNECTING = 0 as const
  OPEN = 1 as const
  CLOSED = 2 as const

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

global.TextEncoder = TextEncoder

configure({ testIdAttribute: 'id' })
jest.setTimeout((process.env.LAUNCH ? 3000 : 180) * 1000)

let consoleWarnings: any[] = []
let consoleErrors: any[] = []

// eslint-disable-next-line @typescript-eslint/no-unused-vars
console.warn = (message?: any, ..._optionalParams: any[]) => {
  if (typeof message === 'string') {
    if (message.startsWith('You are using a beta component feature (isAriaDisabled).')) return
  }
  consoleWarnings.push(message)
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
console.error = (message?: any, ..._optionalParams: any[]) => {
  consoleErrors.push(message)
}

function setupBeforeEach(): void {
  consoleErrors = []
  consoleWarnings = []
}

beforeEach(setupBeforeEach)

void i18n.use(initReactI18next).init({
  keySeparator: false,
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v3',
  defaultNS: 'translation',
  nsSeparator: '~',
  supportedLngs: ['en'],
  simplifyPluralSuffix: true,
  lng: 'en',
  fallbackLng: 'en',
  ns: 'translation',
  resources: {
    en: {
      translation: {},
    },
  },
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
