/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2022 Red Hat, Inc.

import { MockedProvider } from '@apollo/client/testing'
import { render, screen, waitFor } from '@testing-library/react'
import { createBrowserHistory } from 'history'
import { Router } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../lib/nock-util'
import { SearchResultRelatedItemsDocument } from '../search-sdk/search-sdk'
import RelatedResourceDetailsTab from './RelatedResourceDetailsTab'

describe('RelatedResourceDetailsTab', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  it('Should correctly return RelatedResourceDetailsTab with namespaced resource', async () => {
    const testResourceNs = {
      kind: 'ConfigMap',
      apiVersion: 'apps/v1',
      metadata: {
        name: 'testConfigMap',
        namespace: 'testConfigMapNs',
      },
    }
    const mocks = [
      {
        request: {
          query: SearchResultRelatedItemsDocument,
          variables: {
            input: [
              {
                keywords: [],
                filters: [
                  { property: 'kind', values: ['ConfigMap'] },
                  { property: 'cluster', values: ['test-cluster'] },
                  { property: 'name', values: ['testConfigMap'] },
                  { property: 'namespace', values: ['testConfigMapNs'] },
                  { property: 'apigroup', values: ['apps'] },
                ],
                limit: 1000,
              },
            ],
          },
        },
        result: {
          data: {
            searchResult: [
              {
                related: [
                  {
                    kind: 'Pod',
                    items: [
                      {
                        apiversion: 'v1',
                        cluster: 'local-cluster',
                        kind: 'Pod',
                        kind_plural: 'pods',
                        name: 'test-pod-1',
                        namespace: 'test-ns-1',
                      },
                      {
                        apiversion: 'v1',
                        cluster: 'local-cluster',
                        kind: 'Pod',
                        kind_plural: 'pods',
                        name: 'test-pod-2',
                        namespace: 'test-ns-2',
                      },
                    ],
                    __typename: 'SearchRelatedResult',
                  },
                ],
                __typename: 'SearchResult',
              },
            ],
          },
        },
      },
    ]
    render(
      <RecoilRoot>
        <Router history={createBrowserHistory()}>
          <MockedProvider mocks={mocks}>
            <RelatedResourceDetailsTab cluster={'test-cluster'} resource={testResourceNs} />
          </MockedProvider>
        </Router>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('Pod')).toBeTruthy())
  })

  it('Should correctly return RelatedResourceDetailsTab with non-namespaced resource', async () => {
    const testResourceNonNs = {
      kind: 'Node',
      apiVersion: 'v1',
      metadata: {
        name: 'testNode',
      },
    }
    const mocks = [
      {
        request: {
          query: SearchResultRelatedItemsDocument,
          variables: {
            input: [
              {
                keywords: [],
                filters: [
                  { property: 'kind', values: ['Node'] },
                  { property: 'cluster', values: ['test-cluster'] },
                  { property: 'name', values: ['testNode'] },
                ],
                limit: 1000,
              },
            ],
          },
        },
        result: {
          data: {
            searchResult: [
              {
                related: [
                  {
                    kind: 'Pod',
                    items: [
                      {
                        apiversion: 'v1',
                        cluster: 'local-cluster',
                        kind: 'Pod',
                        kind_plural: 'pods',
                        name: 'test-pod-1',
                        namespace: 'test-ns-1',
                      },
                      {
                        apiversion: 'v1',
                        cluster: 'local-cluster',
                        kind: 'Pod',
                        kind_plural: 'pods',
                        name: 'test-pod-2',
                        namespace: 'test-ns-2',
                      },
                    ],
                    __typename: 'SearchRelatedResult',
                  },
                ],
                __typename: 'SearchResult',
              },
            ],
          },
        },
      },
    ]
    render(
      <RecoilRoot>
        <Router history={createBrowserHistory()}>
          <MockedProvider mocks={mocks}>
            <RelatedResourceDetailsTab cluster={'test-cluster'} resource={testResourceNonNs} />
          </MockedProvider>
        </Router>
      </RecoilRoot>
    )

    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('Pod')).toBeTruthy())
  })
})
