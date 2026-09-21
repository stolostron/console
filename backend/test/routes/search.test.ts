/* Copyright Contributors to the Open Cluster Management project */
import EventEmitter from 'node:events'
import type { IncomingMessage } from 'node:http'
import { Readable } from 'node:stream'
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { request as httpsRequest } from 'node:https'
import type { IQuery } from '../../src/routes/aggregators/applications'
import { getSearchResults, pingSearchAPI } from '../../src/lib/search'
import nock from 'nock'
import { request } from '../mock-request'

jest.mock('node:https', () => ({
  request: jest.fn(),
}))

jest.mock('../../src/lib/multi-cluster-hub', () => ({
  getMultiClusterHub: jest.fn<() => Promise<{ metadata: { namespace: string } }>>().mockResolvedValue({
    metadata: { namespace: 'ocm' },
  }),
}))

jest.mock('../../src/lib/serviceAccountToken', () => ({
  getServiceAccountToken: jest.fn(() => 'token'),
  getNamespace: jest.fn(() => 'ocm'),
}))

jest.mock('../../src/lib/agent', () => ({
  getServiceAgent: jest.fn(() => ({})),
}))

jest.mock('../../src/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}))

const mockRequest = httpsRequest as jest.MockedFunction<typeof httpsRequest>

type MockClientRequest = EventEmitter & {
  write: jest.Mock
  end: jest.Mock
  destroy: jest.Mock
}

function createMockResponse(body: string): IncomingMessage {
  return Readable.from([body]) as unknown as IncomingMessage
}

function createMockClientRequest(onEnd?: () => void, error?: Error): MockClientRequest {
  const clientRequest = new EventEmitter() as MockClientRequest
  clientRequest.write = jest.fn()
  clientRequest.end = jest.fn(() => {
    if (error) {
      process.nextTick(() => clientRequest.emit('error', error))
      return
    }
    if (onEnd) {
      process.nextTick(onEnd)
    }
  })
  clientRequest.destroy = jest.fn(() => {
    clientRequest.emit('close')
  })
  return clientRequest
}

const emptySearchQuery: IQuery = {
  operationName: 'searchResult',
  variables: {
    input: [],
  },
  query: 'query searchResult($input: [SearchInput]) { searchResult: search(input: $input) { items } }',
}

describe('search lib', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  describe('pingSearchAPI', () => {
    it('clears the timeout when the request fails', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
      const requestError = new Error('getaddrinfo ENOTFOUND search-search-api.undefined.svc.cluster.local')
      mockRequest.mockImplementation(
        () => createMockClientRequest(undefined, requestError) as unknown as ReturnType<typeof httpsRequest>
      )

      await expect(pingSearchAPI()).rejects.toThrow('getaddrinfo ENOTFOUND')
      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('destroys the request when the ping times out', async () => {
      jest.useFakeTimers()
      mockRequest.mockImplementation(() => createMockClientRequest() as unknown as ReturnType<typeof httpsRequest>)

      const promise = pingSearchAPI()
      const expectation = expect(promise).rejects.toThrow('request timeout')
      await jest.advanceTimersByTimeAsync(4 * 60 * 1000)
      await expectation

      const clientRequest = mockRequest.mock.results[0].value as MockClientRequest
      expect(clientRequest.destroy).toHaveBeenCalled()
    })
  })

  describe('getSearchResults', () => {
    it('clears the timeout when the request fails', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
      const requestError = new Error('getaddrinfo ENOTFOUND search-search-api.undefined.svc.cluster.local')
      mockRequest.mockImplementation(
        () => createMockClientRequest(undefined, requestError) as unknown as ReturnType<typeof httpsRequest>
      )

      await expect(getSearchResults(emptySearchQuery)).rejects.toThrow('getaddrinfo ENOTFOUND')
      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('destroys the request when the search request times out', async () => {
      jest.useFakeTimers()
      mockRequest.mockImplementation(() => createMockClientRequest() as unknown as ReturnType<typeof httpsRequest>)

      const promise = getSearchResults(emptySearchQuery)
      const expectation = expect(promise).rejects.toThrow('request timeout')
      await jest.advanceTimersByTimeAsync(2 * 60 * 1000)
      await expectation

      const clientRequest = mockRequest.mock.results[0].value as MockClientRequest
      expect(clientRequest.destroy).toHaveBeenCalled()
    })

    it('rejects with malformed response data without request timeout', async () => {
      jest.useFakeTimers()
      mockRequest.mockImplementation((_options, callback) => {
        const clientRequest = createMockClientRequest()
        if (typeof callback === 'function') {
          callback(createMockResponse('not-json'))
        }
        return clientRequest as unknown as ReturnType<typeof httpsRequest>
      })

      const promise = getSearchResults(emptySearchQuery)
      const expectation = expect(promise).rejects.toThrow('not-json')
      await jest.advanceTimersByTimeAsync(2 * 60 * 1000)
      await expectation
    })
  })
})

describe(`search Route`, function () {
  it(`uses search-api in the namespace of the MultiClusterHub`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/api').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/operator.open-cluster-management.io/v1/multiclusterhubs')
      .reply(200, {
        items: [
          {
            metadata: {
              namespace: 'ocm',
            },
            status: {
              currentVersion: '2.5.1',
            },
          },
        ],
      })
    nock('https://search-search-api.ocm.svc.cluster.local:4010').post('/searchapi/graphql').reply(200)
    await request('POST', '/proxy/search')
    // TODO - pipeline is not writing response
    //expect(res.statusCode).toEqual(200)
  })

  it(`uses search-api in namespace of pod if no MultiClusterHub`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/api').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL).get('/apis/operator.open-cluster-management.io/v1/multiclusterhubs').reply(200, {
      items: [],
    })
    nock('https://search-search-api.undefined.svc.cluster.local:4010').post('/searchapi/graphql').reply(200)
    await request('POST', '/proxy/search')
    // TODO - pipeline is not writing response
    //expect(res.statusCode).toEqual(200)
  })
})
