/* Copyright Contributors to the Open Cluster Management project */

import { IRequestResult, postRequest, backendUrl } from './resource-request'

export const apiSearchUrl = '/proxy/search'

export type ISearchResult = {
    data: {
        searchResult: {
            items?: any
            count: number
            related?: {
                count: number
                kind: string
            }[]
        }[]
    }
}

export type SearchQuery = {
    operationName: string
    variables: {
        input: {
            filters: { property: string; values: string[] | string }[]
            relatedKinds?: string[]
        }[]
    }
    query: string
}

export function queryStatusCount(cluster: string): IRequestResult<ISearchResult> {
    return postRequest<SearchQuery, ISearchResult>(backendUrl + apiSearchUrl, {
        operationName: 'searchResult',
        variables: {
            input: [
                {
                    filters: [
                        { property: 'kind', values: ['subscription'] },
                        { property: 'cluster', values: [cluster] },
                    ],
                    relatedKinds: ['application'],
                },
                {
                    filters: [
                        { property: 'compliant', values: ['!Compliant'] },
                        { property: 'kind', values: ['policy'] },
                        { property: 'namespace', values: [cluster] },
                        { property: 'cluster', values: 'local-cluster' },
                    ],
                },
            ],
        },
        query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    count\n    related {\n      kind\n      count\n      __typename\n    }\n    __typename\n  }\n}\n',
    })
}
