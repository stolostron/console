/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { ApolloClient, HttpLink, InMemoryCache, split } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'
import { fetchWithCsrf } from '@stolostron/multicluster-sdk/lib/internal/search/searchUtils'
import { getBackendUrl } from '../../../resources/utils'

const httpLink = new HttpLink({
  uri: () => `${getBackendUrl()}/proxy/search`,
  credentials: 'same-origin',
  fetch: fetchWithCsrf,
})

/** WebSocket URL for GraphQL subscriptions (graphql-ws), aligned with {@link httpLink}. */
function getSearchWebSocketUrl(): string {
  const httpEndpoint = `${getBackendUrl()}/proxy/search`

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

const wsLink = new GraphQLWsLink(
  createClient({
    url: () => getSearchWebSocketUrl(),
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

export const searchClient = new ApolloClient({
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
