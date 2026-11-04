/* Copyright Contributors to the Open Cluster Management project */

import { ApolloClient, HttpLink, InMemoryCache, split } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'
import { fetchWithCsrf } from './searchUtils'

/** WebSocket URL for GraphQL subscriptions (graphql-ws), aligned with the HTTP search endpoint. */
export function getSearchWebSocketUrl(httpEndpoint: string): string {
  if (httpEndpoint.startsWith('http://')) {
    return httpEndpoint.replace(/^http/, 'ws')
  }
  if (httpEndpoint.startsWith('https://')) {
    return httpEndpoint.replace(/^https/, 'wss')
  }

  if (typeof window === 'undefined') {
    return 'ws://localhost/proxy/search'
  }

  const url = new URL(httpEndpoint, window.location.origin)
  url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.href
}

/** Builds the Search Apollo client for a given HTTP endpoint resolver. */
export function createSearchClient(getHttpUri: () => string) {
  const httpLink = new HttpLink({
    uri: getHttpUri,
    credentials: 'same-origin',
    fetch: fetchWithCsrf,
  })

  const wsLink = new GraphQLWsLink(
    createClient({
      url: () => getSearchWebSocketUrl(getHttpUri()),
      lazy: true,
    })
  )

  const link = split(
    ({ query }) => {
      const definition = getMainDefinition(query)
      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
    },
    wsLink,
    httpLink
  )

  return new ApolloClient({
    connectToDevTools: process.env.NODE_ENV === 'development',
    link,
    cache: new InMemoryCache(),
    credentials: 'same-origin',

    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
  })
}
