/* Copyright Contributors to the Open Cluster Management project */
jest.mock('./discoveredPoliciesWorker.factory')

import { waitFor } from '@testing-library/react'
import { useFetchPolicies } from './useFetchPolicies'
import { renderHook } from '@testing-library/react-hooks'
import { RecoilRoot } from 'recoil'
import { useSearchResultItemsAndRelatedItemsQuery } from '../../Search/search-sdk/search-sdk'

/** Stable identity — a new `data` object every render can make Apollo re-render until OOM. */
const mockSearchQueryResult = {
  data: {
    searchResult: [
      {
        items: [
          {
            _hubClusterResource: false,
            _uid: 'jes1/45fa130d-abff-4426-9cd8-fef1cf460080',
            apigroup: 'policy.open-cluster-management.io',
            apiversion: 'v1',
            cluster: 'jes1',
            compliant: 'Compliant',
            created: '2024-12-17T15:34:18Z',
            disabled: false,
            kind: 'CertificatePolicy',
            kind_plural: 'certificatepolicies',
            label:
              'cluster-name=jes1; cluster-namespace=jes1; governance=all; policy.open-cluster-management.io/cluster-name=jes1; policy.open-cluster-management.io/cluster-namespace=jes1; policy.open-cluster-management.io/policy=open-cluster-management-global-set.policy-with-labels3',
            name: 'policy-certificate-1',
            namespace: 'jes1',
            remediationAction: 'inform',
            severity: 'low',
            _isExternal: false,
            annotation: '',
          },
          {
            _hubClusterResource: false,
            _uid: 'jes2/54c2bc0f-0703-460a-8e98-d3ebf25cfb32',
            apigroup: 'policy.open-cluster-management.io',
            apiversion: 'v1',
            cluster: 'jes2',
            compliant: 'Compliant',
            created: '2024-12-17T15:34:18Z',
            disabled: false,
            kind: 'CertificatePolicy',
            kind_plural: 'certificatepolicies',
            label:
              'cluster-name=jes2; cluster-namespace=jes2; governance=all; policy.open-cluster-management.io/cluster-name=jes2; policy.open-cluster-management.io/cluster-namespace=jes2; policy.open-cluster-management.io/policy=open-cluster-management-global-set.policy-with-labels3',
            name: 'policy-certificate-1',
            namespace: 'jes2',
            remediationAction: 'inform',
            severity: 'low',
            _isExternal: false,
            annotation: '',
          },
          {
            _hubClusterResource: true,
            _uid: 'local-cluster/4d1381b2-1d18-4982-8b63-cc5c99b7863f',
            apigroup: 'policy.open-cluster-management.io',
            apiversion: 'v1',
            cluster: 'local-cluster',
            compliant: 'Compliant',
            created: '2024-12-17T15:34:18Z',
            disabled: false,
            kind: 'CertificatePolicy',
            kind_plural: 'certificatepolicies',
            label:
              'cluster-name=local-cluster; cluster-namespace=local-cluster; governance=all; policy.open-cluster-management.io/cluster-name=local-cluster; policy.open-cluster-management.io/cluster-namespace=local-cluster; policy.open-cluster-management.io/policy=open-cluster-management-global-set.policy-with-labels3',
            name: 'policy-certificate-1',
            namespace: 'local-cluster',
            remediationAction: 'inform',
            severity: 'low',
            _isExternal: false,
            annotation: '',
          },
        ],
        related: [],
      },
    ],
  },
  loading: false,
  error: undefined,
}

jest.mock('../../Search/search-sdk/search-sdk', () => ({
  useSearchResultItemsAndRelatedItemsQuery: jest.fn(() => mockSearchQueryResult),
}))

describe('useFetchPolicies custom hook', () => {
  afterEach(() => {
    ;(useSearchResultItemsAndRelatedItemsQuery as jest.Mock).mockReturnValue(mockSearchQueryResult)
  })

  test('Should parse discovered policy labels', async () => {
    const { result } = renderHook(() => useFetchPolicies(), { wrapper: RecoilRoot })

    await waitFor(() => {
      expect(result.current.labelData).toBeDefined()
    })

    expect(JSON.stringify(result.current.labelData)).toEqual(JSON.stringify(labelData))
  })

  test('stays in fetching state while search is loading', async () => {
    ;(useSearchResultItemsAndRelatedItemsQuery as jest.Mock).mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    })

    const { result } = renderHook(() => useFetchPolicies(), { wrapper: RecoilRoot })

    await waitFor(() => {
      expect(result.current.isFetching).toBe(true)
    })
    expect(result.current.policyItems).toBeUndefined()
  })

  test('sets isFetching to false and exposes the error when search returns an error', async () => {
    ;(useSearchResultItemsAndRelatedItemsQuery as jest.Mock).mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('search failed'),
    })

    const { result } = renderHook(() => useFetchPolicies(), { wrapper: RecoilRoot })

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false)
    })
    expect(result.current.err).toEqual(new Error('search failed'))
    expect(result.current.policyItems).toBeUndefined()
  })

  test('sets policyItems and relatedResources to empty arrays when search returns no results', async () => {
    ;(useSearchResultItemsAndRelatedItemsQuery as jest.Mock).mockReturnValue({
      data: { searchResult: [] },
      loading: false,
      error: undefined,
    })

    const { result } = renderHook(() => useFetchPolicies(), { wrapper: RecoilRoot })

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false)
    })
    expect(result.current.policyItems).toEqual([])
    expect(result.current.relatedResources).toEqual([])
  })
})

const labelData = {
  labelMap: {
    'policy-certificate-1CertificatePolicypolicy.open-cluster-management.io': {
      pairs: {
        governance: 'all',
      },
      labels: [
        'cluster-name=local-cluster',
        'cluster-namespace=local-cluster',
        'governance=all',
        'policy.open-cluster-management.io/cluster-name=local-cluster',
        'policy.open-cluster-management.io/cluster-namespace=local-cluster',
        'policy.open-cluster-management.io/policy=open-cluster-management-global-set.policy-with-labels3',
      ],
    },
  },
  labelOptions: [
    {
      label: 'governance=all',
      value: 'governance=all',
    },
  ],
}
