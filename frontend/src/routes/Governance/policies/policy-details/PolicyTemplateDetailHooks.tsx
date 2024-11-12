/* Copyright Contributors to the Open Cluster Management project */

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom-v5-compat'
import { useTemplateDetailsContext } from './PolicyTemplateDetailsPage'
import { searchClient } from '../../../Search/search-sdk/search-client'
import {
  useSearchResultRelatedItemsLazyQuery,
  useSearchResultItemsLazyQuery,
  SearchFilter,
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
      ['constraints.gatekeeper.sh', 'kyverno.io'].includes(apiGroup) &&
      clusterName &&
      name &&
      template &&
      !templateLoading &&
      // These conditions reduce renders and hitting fireManagedClusterView
      !loading &&
      !data &&
      !error
    ) {
      const vapbName = apiGroup === 'constraints.gatekeeper.sh' ? `gatekeeper-${name}` : name + '-binding'

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
                  values: [vapbName],
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
  const namespace = urlParams.templateNamespace
  const apiGroup = urlParams.apiGroup ?? ''
  const { clusterName, template, templateLoading } = useTemplateDetailsContext()
  const [getKyverno, { loading, error, data }] = useSearchResultRelatedItemsLazyQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
  })
  const [filtered, setFiltered] = useState<any[]>()
  const [violationNum, setViolationNum] = useState<number | undefined>()

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
      let extraFilters: SearchFilter[] = []
      if (namespace) {
        extraFilters = [
          {
            property: 'namespace',
            values: [namespace],
          },
        ]
      }

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
                ...extraFilters,
              ],
              limit: 1000000,
            },
          ],
        },
      })
    }
  }, [apiGroup, clusterName, name, namespace, template, templateLoading, data, loading, error, kind, getKyverno])

  useEffect(() => {
    if (data) {
      setViolationNum(0)

      // Attach a PolicyReport to a related resource.
      const reportMap = data.searchResult?.[0]?.related
        ?.filter((r) => ['PolicyReport', 'ClusterPolicyReport'].includes(r?.kind ?? ''))
        .map((r) => r?.items)
        .flat()
        ?.reduce((accumulator, currentValue) => ({ ...accumulator, [currentValue.name]: currentValue }), {})

      let violationAccumulator = 0
      setFiltered(
        data?.searchResult?.[0]?.related
          ?.map((related) => related?.items)
          .flat()
          .filter((item) => !['PolicyReport', 'ClusterPolicyReport', 'Cluster'].includes(item.kind))
          .map((item: any) => {
            // Items are always clusterName + '/' + uid
            const uid = item._uid.split('/').slice(-1)[0]
            const policyReport = reportMap[uid]
            let compliant = ''
            const policyKey = namespace ? `${namespace}/${name}` : name

            for (const violationMapValue of ((policyReport?._policyViolationCounts ?? '') as string).split('; ')) {
              if (!violationMapValue.startsWith(policyKey + '=')) {
                continue
              }

              const violationNumber = Number(violationMapValue.split('=', 2)[1])
              if (violationNumber > 0) {
                violationAccumulator = violationAccumulator + violationNumber
                compliant = 'noncompliant'
              } else {
                compliant = 'compliant'
              }

              break
            }

            return { ...item, compliant, policyReport }
          }) // Filter out unrelated resources which don't have policyReport
          .filter((item: any) => item.policyReport)
      )

      setViolationNum(violationAccumulator)
    }
  }, [data, name, namespace])

  return useMemo(
    () => ({
      loading,
      err: error?.message,
      relatedItems: filtered,
      violationNum,
    }),
    [loading, error, filtered, violationNum]
  )
}
