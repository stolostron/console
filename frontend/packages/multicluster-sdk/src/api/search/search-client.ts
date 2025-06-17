/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { ApolloClient, ApolloLink, from, HttpLink, InMemoryCache, NormalizedCacheObject } from '@apollo/client'
import { getCookie } from './searchUtils'
import { useEffect, useState } from 'react'
import { useBackendURL } from '../useBackendURL'

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

export const useSearchClient = () => {
  const [backendURL] = useBackendURL()

  const [searchClient, setSearchClient] = useState<ApolloClient<NormalizedCacheObject>>()

  useEffect(() => {
    if (!backendURL) return

    const httpLink = new HttpLink({
      uri: () => `${backendURL}/proxy/search`,
    })

    setSearchClient(
      new ApolloClient({
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
    )
  }, [backendURL])

  return searchClient
}
