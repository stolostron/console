/* Copyright Contributors to the Open Cluster Management project */

import { ApolloClient, HttpLink, gql, split } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { createSearchClient, getSearchWebSocketUrl } from './createSearchClient'
import { fetchWithCsrf } from './searchUtils'

jest.mock('graphql-ws', () => ({
  createClient: jest.fn(() => ({ kind: 'graphql-ws-client' })),
}))

jest.mock('@apollo/client/link/subscriptions', () => ({
  GraphQLWsLink: jest.fn().mockImplementation((client) => ({ kind: 'ws-link', client })),
}))

jest.mock('@apollo/client', () => {
  const actual = jest.requireActual('@apollo/client')
  return {
    ...actual,
    HttpLink: jest.fn().mockImplementation((options) => ({ kind: 'http-link', options })),
    ApolloClient: jest.fn().mockImplementation((options) => ({ kind: 'apollo-client', options })),
    split: jest.fn((test, left, right) => ({ kind: 'split-link', test, left, right })),
  }
})

jest.mock('./searchUtils', () => ({
  fetchWithCsrf: jest.fn(),
}))

describe('getSearchWebSocketUrl', () => {
  it('converts http endpoints to ws', () => {
    expect(getSearchWebSocketUrl('http://localhost:4000/proxy/search')).toBe('ws://localhost:4000/proxy/search')
  })

  it('converts https endpoints to wss', () => {
    expect(getSearchWebSocketUrl('https://console.example.com/proxy/search')).toBe(
      'wss://console.example.com/proxy/search'
    )
  })

  it('resolves relative endpoints against window.location', () => {
    const originalProtocol = window.location.protocol
    expect(getSearchWebSocketUrl('/api/proxy/plugin/acm/console/multicloud/proxy/search')).toBe(
      `${originalProtocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/proxy/plugin/acm/console/multicloud/proxy/search`
    )
  })
})

describe('createSearchClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('builds an Apollo client with CSRF-aware HTTP fetch and same-origin credentials', () => {
    const getHttpUri = jest.fn(() => 'https://console.example.com/proxy/search')
    const client = createSearchClient(getHttpUri)

    expect(HttpLink).toHaveBeenCalledWith({
      uri: getHttpUri,
      credentials: 'same-origin',
      fetch: fetchWithCsrf,
    })
    expect(createClient).toHaveBeenCalledWith({
      url: expect.any(Function),
      lazy: true,
    })
    expect(GraphQLWsLink).toHaveBeenCalledWith({ kind: 'graphql-ws-client' })
    expect(split).toHaveBeenCalled()
    expect(ApolloClient).toHaveBeenCalledWith(
      expect.objectContaining({
        credentials: 'same-origin',
        link: expect.objectContaining({ kind: 'split-link' }),
        defaultOptions: {
          watchQuery: { fetchPolicy: 'network-only', errorPolicy: 'all' },
          query: { fetchPolicy: 'network-only', errorPolicy: 'all' },
          mutate: { errorPolicy: 'all' },
        },
      })
    )
    expect(client).toEqual(expect.objectContaining({ kind: 'apollo-client' }))
  })

  it('resolves the websocket url from the current HTTP endpoint', () => {
    createSearchClient(() => 'https://console.example.com/proxy/search')
    const wsOptions = (createClient as jest.Mock).mock.calls[0][0] as { url: () => string }
    expect(wsOptions.url()).toBe('wss://console.example.com/proxy/search')
  })

  it('routes subscriptions to the websocket link and other operations to HTTP', () => {
    createSearchClient(() => 'https://console.example.com/proxy/search')
    const test = (split as jest.Mock).mock.calls[0][0] as (args: { query: unknown }) => boolean
    const left = (split as jest.Mock).mock.calls[0][1]
    const right = (split as jest.Mock).mock.calls[0][2]

    expect(left).toEqual(expect.objectContaining({ kind: 'ws-link' }))
    expect(right).toEqual(expect.objectContaining({ kind: 'http-link' }))

    const subscriptionQuery = gql`
      subscription SearchUpdated {
        searchComplete
      }
    `
    const queryOperation = gql`
      query Search {
        search
      }
    `

    expect(test({ query: subscriptionQuery })).toBe(true)
    expect(test({ query: queryOperation })).toBe(false)
  })
})
