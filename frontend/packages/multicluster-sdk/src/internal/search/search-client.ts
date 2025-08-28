/* Copyright Contributors to the Open Cluster Management project */

import { ApolloClient, ApolloLink, from, HttpLink, InMemoryCache } from '@apollo/client'
import { getCookie } from './searchUtils'
import { BACKEND_URL } from '../constants'

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

const httpLink = new HttpLink({
  uri: () => `${BACKEND_URL}/proxy/search`,
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
