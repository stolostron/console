/* Copyright Contributors to the Open Cluster Management project */

import { useEffect, useState } from 'react'
import { fireManagedClusterView } from '../../../../resources'
import { useParams } from 'react-router-dom-v5-compat'
import { useTemplateDetailsContext } from './PolicyTemplateDetailsPage'
import { searchClient } from '../../../Search/search-sdk/search-client'
import { useSearchResultItemsLazyQuery } from '../../../Search/search-sdk/search-sdk'

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

export function useGetParamKind() {
  const urlParams = useParams()
  const kind = urlParams.kind ?? ''
  const apiGroup = urlParams.apiGroup ?? ''
  const { clusterName, template: vapb, templateLoading } = useTemplateDetailsContext()
  const [vap, setVap] = useState<{ loading: boolean; vapObj: any; err: any; isNotfound: boolean }>({
    loading: false,
    vapObj: null,
    err: null,
    isNotfound: false,
  })
  useEffect(() => {
    const vapName = vapb?.spec?.policyName
    if (
      apiGroup === 'admissionregistration.k8s.io' &&
      kind == 'ValidatingAdmissionPolicyBinding' &&
      vapName &&
      !templateLoading &&
      !vap.loading &&
      !vap.vapObj &&
      !vap.err &&
      !vap.isNotfound
    ) {
      setVap({ loading: true, vapObj: null, err: null, isNotfound: false })
      fireManagedClusterView(clusterName, 'ValidatingAdmissionPolicy', 'admissionregistration.k8s.io/v1', vapName)
        .then((viewResponse) => {
          if (viewResponse?.message) {
            if (viewResponse?.message.endsWith('not found')) {
              setVap({ loading: false, vapObj: null, err: null, isNotfound: true })
            } else {
              setVap({ loading: false, vapObj: null, err: viewResponse?.message, isNotfound: false })
            }
          } else {
            setVap({ loading: false, vapObj: viewResponse.result, err: null, isNotfound: false })
          }
        })
        .catch((err) => {
          console.error('Error getting resource: ', err)
          setVap({ loading: false, vapObj: null, err: err, isNotfound: false })
        })
    }
  }, [apiGroup, clusterName, vapb, kind, vap, templateLoading])

  return { loading: vap.loading, err: vap.err, paramKindObj: vap?.vapObj?.spec?.paramKind }
}
