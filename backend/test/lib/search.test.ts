/* Copyright Contributors to the Open Cluster Management project */
import nock from 'nock'
import { getSearchResults } from '../../src/lib/search'

describe('getSearchResults error handling', function () {
  it(`handles search result error message in getSearchResults`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/operator.open-cluster-management.io/v1/multiclusterhubs')
      .reply(200, {
        items: [
          {
            metadata: {
              namespace: 'ocm',
            },
            status: {
              currentVersion: '2.5.1',
            },
          },
        ],
      })
    // Mock search API returning error message
    nock('https://search-search-api.undefined.svc.cluster.local:4010').post('/searchapi/graphql').reply(200, {
      message: 'Search service unavailable',
      data: null,
    })

    const query = {
      operationName: 'searchResult',
      variables: { input: [] as { filters: { property: string; values: string[] }[]; limit: number }[] },
      query: 'query searchResult($input: [SearchInput]) { searchResult: search(input: $input) { items } }',
    }

    await expect(getSearchResults(query)).rejects.toThrow('Search service unavailable')
  })

  it(`handles request error in getSearchResults`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/operator.open-cluster-management.io/v1/multiclusterhubs')
      .reply(200, {
        items: [
          {
            metadata: {
              namespace: 'ocm',
            },
            status: {
              currentVersion: '2.5.1',
            },
          },
        ],
      })
    // Mock search API connection error
    nock('https://search-search-api.undefined.svc.cluster.local:4010')
      .post('/searchapi/graphql')
      .replyWithError('Connection refused')

    const query = {
      operationName: 'searchResult',
      variables: { input: [] as { filters: { property: string; values: string[] }[]; limit: number }[] },
      query: 'query searchResult($input: [SearchInput]) { searchResult: search(input: $input) { items } }',
    }

    await expect(getSearchResults(query)).rejects.toThrow('Connection refused')
  })
})
