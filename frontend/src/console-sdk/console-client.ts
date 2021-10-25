/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { ApolloClient, InMemoryCache } from '@apollo/client'

export const consoleClient = new ApolloClient({
    connectToDevTools: process.env.NODE_ENV === 'development',
    uri: '/multicloud/proxy/consoleapi',
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
