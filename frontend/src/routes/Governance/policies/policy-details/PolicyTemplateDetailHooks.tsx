/* Copyright Contributors to the Open Cluster Management project */

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom-v5-compat'
import { useTemplateDetailsContext } from './PolicyTemplateDetailsPage'
import { searchClient } from '../../../Search/search-sdk/search-client'
import {
  useSearchResultRelatedItemsLazyQuery,
  useSearchResultItemsLazyQuery,
} from '../../../Search/search-sdk/search-sdk'

export function useFetchVapb() {
  const urlParams = useParams()
  const name = urlParams.templateName ?? '-'
  const apiGroup = urlParams.apiGroup ?? ''
  const { clusterName, template, templateLoading } = useTemplateDetailsContext()
  const [getVapb, { loading, error, data }] = useSearchResultItemsLazyQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
  })
  useEffect(() => {
    if (
      apiGroup === 'constraints.gatekeeper.sh' &&
      clusterName &&
      name &&
      template &&
      !templateLoading &&
      // These conditions reduce renders and hitting fireManagedClusterView
      !loading &&
      !data &&
      !error
    ) {
      getVapb({
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
        variables: {
          input: [
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
                {
                  property: 'name',
                  values: [`gatekeeper-${name}`],
                },
                {
                  property: 'cluster',
                  values: [clusterName],
                },
              ],
              limit: 1,
            },
          ],
        },
      })
    }
  }, [apiGroup, clusterName, name, template, templateLoading, data, loading, error, getVapb])

  return { vapbItems: data?.searchResult?.[0]?.items, loading, err: error?.message }
}

export function useFetchKyvernoRelated() {
  const urlParams = useParams()
  const name = urlParams.templateName ?? '-'
  const kind = urlParams.kind ?? '-'
  const apiGroup = urlParams.apiGroup ?? ''
  const { clusterName, template, templateLoading } = useTemplateDetailsContext()
  const [getKyverno, { loading, error, data }] = useSearchResultRelatedItemsLazyQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
  })
  const [filtered, setFiltered] = useState<any[]>()
  useEffect(() => {
    if (
      apiGroup === 'kyverno.io' &&
      clusterName &&
      name &&
      template &&
      !templateLoading &&
      // These conditions reduce renders and hitting fireManagedClusterView
      !loading &&
      !error &&
      !data
    ) {
      getKyverno({
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
        variables: {
          input: [
            {
              filters: [
                {
                  property: 'apigroup',
                  values: ['kyverno.io'],
                },
                {
                  property: 'kind',
                  values: [kind],
                },
                {
                  property: 'name',
                  values: [name],
                },
                {
                  property: 'cluster',
                  values: [clusterName],
                },
              ],
              limit: 1000000,
            },
          ],
        },
      })
    }
  }, [apiGroup, clusterName, name, template, templateLoading, data, loading, error, kind, getKyverno])

  useEffect(() => {
    if (data) {
      // Attach a PolicyReport to a related resource.
      const reportMap = data.searchResult?.[0]?.related
        ?.filter((r) => ['PolicyReport', 'ClusterPolicyReport'].includes(r?.kind ?? ''))
        .map((r) => r?.items)
        .flat()
        .reduce((accumulator, currentValue) => ({ ...accumulator, [currentValue.name]: currentValue }), {})

      setFiltered(
        data?.searchResult?.[0]?.related
          ?.map((related) => related?.items)
          .flat()
          .filter((item) => !['PolicyReport', 'ClusterPolicyReport', 'Cluster'].includes(item.kind))
          .map((item: any) => {
            // Items are always clusterName + '/' + uid
            const uid = item._uid.split('/').slice(-1)[0]
            return { ...item, policyReport: reportMap[uid] }
          })
      )
    }
  }, [data])

  return useMemo(
    () => ({
      loading,
      err: error?.message,
      relatedItems: filtered,
    }),
    [loading, error, filtered]
  )
}
