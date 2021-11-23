/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { getBackendUrl } from '../../../../resources'

const httpLink = new HttpLink({
    uri: () => `${getBackendUrl()}/proxy/search`
})

export const searchClient = new ApolloClient({
    connectToDevTools: process.env.NODE_ENV === 'development',
    link: httpLink,
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
