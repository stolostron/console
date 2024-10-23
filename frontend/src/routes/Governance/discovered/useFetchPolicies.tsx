/* Copyright Contributors to the Open Cluster Management project */
// This react hook will be tested in e2e test(Cypress) due to its use of workers and blobs.
import { useEffect, useState } from 'react'
import { grouping } from './grouping'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { useSearchResultItemsQuery, SearchInput } from '../../Search/search-sdk/search-sdk'
import { searchClient } from '../../Search/search-sdk/search-client'
import { parseDiscoveredPolicies, resolveSource, getSourceText, parseStringMap } from '../common/util'
export interface ISourceType {
  type: string //ex: 'Policy' | 'Git' | 'Multiple'
  parentNs: string
  parentName: string
}
export interface DiscoveredPolicyItem {
  _uid: string
  _hubClusterResource: boolean
  kind: string
  apigroup: string
  apiversion: string
  cluster: string
  compliant?: string
  responseAction: string
  severity?: string
  _isExternal?: boolean
  annotation: string
  created: string
  label: string
  kind_plural: string
  // This is undefined on Gatekeeper constraints
  namespace?: string
  name: string
  disabled?: boolean
  // These are only for Operator policy
  deploymentAvailable?: boolean
  upgradeAvailable?: boolean
  // This is only for Gatekeeper constraints
  totalViolations?: number
  // Not from search-collector. Attached in grouping function
  source?: ISourceType
  // ValidatingAdmissionPolicyBinding
  policyName?: string
  _ownedByGatekeeper?: boolean
  validationActions?: string
}

export interface DiscoverdPolicyTableItem {
  id: string
  name: string
  severity: string
  apigroup: string
  kind: string
  responseAction: string
  policies: DiscoveredPolicyItem[]
  source?: ISourceType
}

// If id (`policyName` + `policyKind` + `apiGroup`) exists, it returns a filtered `DiscoveredPolicyTable` based on `clusterName`.
export function useFetchPolicies(policyName?: string, policyKind?: string, apiGroup?: string) {
  const [isFetching, setIsFetching] = useState(true)
  const [data, setData] = useState<DiscoverdPolicyTableItem[]>()
  const { channelsState, helmReleaseState, subscriptionsState } = useSharedAtoms()
  const helmReleases = useRecoilValue(helmReleaseState)
  const subscriptions = useRecoilValue(subscriptionsState)
  const channels = useRecoilValue(channelsState)

  let searchQuery: SearchInput[]

  if (policyName && policyKind && apiGroup) {
    searchQuery = [
      {
        filters: [
          {
            property: 'apigroup',
            values: [apiGroup],
          },
          {
            property: 'name',
            values: [policyName],
          },
          {
            property: 'kind',
            values: [policyKind],
          },
        ],
        limit: 100000,
      },
    ]
  } else {
    searchQuery = [
      {
        filters: [
          {
            property: 'apigroup',
            values: ['policy.open-cluster-management.io'],
          },
          {
            property: 'kind',
            values: ['CertificatePolicy', 'ConfigurationPolicy', 'OperatorPolicy'],
          },
        ],
        limit: 100000,
      },
      // Query for all Gatekeeper Constraints
      {
        filters: [
          {
            property: 'apigroup',
            values: ['constraints.gatekeeper.sh'],
          },
        ],
        limit: 100000,
      },
      {
        filters: [
          {
            property: 'apigroup',
            values: ['admissionregistration.k8s.io'],
          },
          {
            property: 'kind',
            values: ['ValidatingAdmissionPolicyBinding'],
          },
        ],
        limit: 100000,
      },
    ]
  }

  const {
    data: searchData,
    loading: searchLoading,
    error: searchErr,
  } = useSearchResultItemsQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: { input: searchQuery },
    pollInterval: 15000, // Poll every 15 seconds
  })

  useEffect(() => {
    if (searchErr && !searchLoading) {
      setIsFetching(false)
    }

    let searchDataItems: any[] = []

    searchData?.searchResult?.forEach((result) => {
      searchDataItems = searchDataItems.concat(result?.items || [])
    })

    if (searchDataItems.length == 0 && !searchErr && !searchLoading) {
      setData([])
      setIsFetching(false)
    }

    if (searchDataItems.length !== 0 && !searchErr && !searchLoading) {
      const dataObj = '(' + grouping + ')();'
      // for firefox
      const blob = new Blob([dataObj.replace('"use strict";', '')], { type: 'application/javascript' })
      const blobURL = (window.URL ? URL : webkitURL).createObjectURL(blob)
      // Worker for discovered policies table
      const worker = new Worker(blobURL)

      worker.onmessage = (e: MessageEvent<any>) => {
        setData(parseDiscoveredPolicies(e.data) as DiscoverdPolicyTableItem[])

        setIsFetching(false)
      }

      worker.postMessage({
        data: searchDataItems,
        subscriptions,
        helmReleases,
        channels,
        resolveSourceStr: resolveSource.toString(),
        getSourceTextStr: getSourceText.toString(),
        parseStringMapStr: parseStringMap.toString(),
        parseDiscoveredPoliciesStr: parseDiscoveredPolicies.toString(),
      })

      return () => {
        worker.terminate()
      }
    }
  }, [
    channelsState,
    helmReleaseState,
    subscriptionsState,
    searchData,
    searchErr,
    searchLoading,
    subscriptions,
    helmReleases,
    channels,
  ])

  return { isFetching, data, err: searchErr }
}
