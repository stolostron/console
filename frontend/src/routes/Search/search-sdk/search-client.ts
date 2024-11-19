/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { ApolloClient, ApolloLink, from, HttpLink, InMemoryCache } from '@apollo/client'
import { getBackendUrl, getCookie } from '../../../resources/utils'

const httpLink = new HttpLink({
  uri: () => `${getBackendUrl()}/proxy/search`,
})

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

export const searchClient = new ApolloClient({
  connectToDevTools: process.env.NODE_ENV === 'development',
  link: from([csrfHeaderLink, httpLink]),
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
