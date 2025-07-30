/* Copyright Contributors to the Open Cluster Management project */

import { ApolloClient, ApolloLink, from, HttpLink, InMemoryCache } from '@apollo/client'
import { getCookie } from './searchUtils'
import { getBackendUrl } from '../../api/apiRequests'

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
  uri: () => `${getBackendUrl()}/proxy/search`,
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
