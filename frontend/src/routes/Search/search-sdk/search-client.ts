/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { ApolloClient, ApolloLink, from, HttpLink, InMemoryCache, split } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'
import { getBackendUrl, getCookie } from '../../../resources/utils'

const httpLink = new HttpLink({
  uri: () => `${getBackendUrl()}/proxy/search`,
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

const csrfHeaderLink = new ApolloLink((operation, forward) => {
  const csrfToken = getCookie('csrf-token')
  if (csrfToken) {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        'X-CSRFToken': csrfToken,
      },
    }))
  }

  return forward(operation)
})

const httpChain = from([csrfHeaderLink, httpLink])

const link = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
  },
  wsLink,
  httpChain
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
