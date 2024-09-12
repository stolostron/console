/* Copyright Contributors to the Open Cluster Management project */
// This react hook will be tested in e2e test(Cypress) due to its use of workers and blobs.
import { useEffect, useState } from 'react'
import { grouping } from './grouping'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { useSearchResultItemsQuery } from '../../Search/search-sdk/search-sdk'
import { searchClient } from '../../Search/search-sdk/search-client'
import { convertStringToQuery } from '../../Search/search-helper'
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
  compliant: string
  remediationAction: string
  severity: string
  _isExternal: boolean
  annotation: string
  created: string
  label: string
  kind_plural: string
  namespace: string
  name: string
  disabled: boolean
  // These are only for Operator policy
  deploymentAvailable?: boolean
  upgradeAvailable?: boolean
  // Not from search-collector. Attached in grouping function
  source?: ISourceType
}

export interface DiscoverdPolicyTableItem {
  id: string
  name: string
  severity: string
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
  const {
    data: searchData,
    loading: searchLoading,
    error: searchErr,
  } = useSearchResultItemsQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: {
      input: [
        policyName && policyKind && apiGroup
          ? convertStringToQuery(`kind:${policyKind} name:${policyName} apigroup:${apiGroup}`, 100000)
          : convertStringToQuery('kind:ConfigurationPolicy,CertificatePolicy,OperatorPolicy', 100000),
      ],
    },
  })
  const searchDataItems = searchData?.searchResult?.[0]?.items

  useEffect(() => {
    setIsFetching(true)

    if (searchErr && !searchLoading) {
      setIsFetching(false)
    }

    if (searchDataItems && !searchErr && !searchLoading) {
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
    searchDataItems,
    searchErr,
    searchLoading,
    subscriptions,
    helmReleases,
    channels,
  ])

  return { isFetching, data, err: searchErr }
}
