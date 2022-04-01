// Copyright Contributors to the Open Cluster Management project

import { 
    convertStringToQuery,
    formatNumber,
    searchFailure,
    searchError,
    searchSuccess,
    shouldTrySearch,
    isSearchAvailable,
    isYAMLEditAvailable,
} from "./search-helper";

describe('convertStringToQuery', () => {
    const string1 = 'kind:subscription name:test'
    const string2 = 'kind:channel name:test'
    const string3 = 'kind:placementrule name:test'

    const result1 = {
        "filters": [
            {
                "property": "kind",
                "values": [
                    "subscription"
                ]
            },
            {
                "property": "name",
                "values": [
                    "test"
                ]
            }
        ],
        "keywords": [],
        "relatedKinds": [
            "placementrule",
            "deployable",
            "application",
            "subscription",
            "channel"
        ]
    }

    const result2 = {"filters": [{"property": "kind", "values": ["channel"]}, {"property": "name", "values": ["test"]}], "keywords": [], "relatedKinds": ["subscription"]}
    const result3 = {"filters": [{"property": "kind", "values": ["placementrule"]}, {"property": "name", "values": ["test"]}], "keywords": [], "relatedKinds": ["subscription"]}
    it('convert string to query', () => {
        expect(convertStringToQuery(string1)).toEqual(result1)
        expect(convertStringToQuery(string2)).toEqual(result2)
        expect(convertStringToQuery(string3)).toEqual(result3)
    })
})

describe('formatNumber', () => {
    it('format some numbers', () => {
        expect(formatNumber(1)).toEqual(1)
        expect(formatNumber(1000)).toEqual('1k')
    })
})

describe('various search helper functions', () => {
    it('call search helper functions', () => {
        searchFailure()
        searchError()
        searchSuccess()
        expect(shouldTrySearch()).toEqual(true)
        expect(isSearchAvailable()).toEqual(true)
        expect(isYAMLEditAvailable()).toEqual(true)
    })
})
