/* Copyright Contributors to the Open Cluster Management project */

import { useEffect, useState } from 'react'
import { fireManagedClusterView } from '../../../../resources'
import { useParams } from 'react-router-dom-v5-compat'
import { useTemplateDetailsContext } from './PolicyTemplateDetailsPage'

export function useFetchVapb() {
  const urlParams = useParams()
  const name = urlParams.templateName ?? '-'
  const apiGroup = urlParams.apiGroup ?? ''
  const { clusterName, template, templateLoading } = useTemplateDetailsContext()
  const [vapb, setVapb] = useState({ loading: false, vapbObj: null, err: null, isNotfound: false })

  useEffect(() => {
    if (
      apiGroup === 'constraints.gatekeeper.sh' &&
      clusterName &&
      name &&
      template &&
      !templateLoading &&
      // These conditions reduce renders and hitting fireManagedClusterView
      !vapb.loading &&
      !vapb.vapbObj &&
      !vapb.err &&
      !vapb.isNotfound
    ) {
      setVapb({ loading: true, vapbObj: null, err: null, isNotfound: false })
      fireManagedClusterView(
        clusterName,
        'ValidatingAdmissionPolicyBinding',
        'admissionregistration.k8s.io/v1',
        `gatekeeper-${name}`,
        ''
      )
        .then((viewResponse) => {
          if (viewResponse?.message) {
            if (viewResponse?.message.endsWith('not found')) {
              // This constraint does not create a ValidatingAdmissionPolicyBinding, and this is not an error.
              setVapb({ loading: false, vapbObj: null, err: null, isNotfound: true })
            } else {
              setVapb({ loading: false, vapbObj: null, err: viewResponse?.message, isNotfound: false })
            }
          } else {
            setVapb({ loading: false, vapbObj: viewResponse.result, err: null, isNotfound: false })
          }
        })
        .catch((err) => {
          console.error('Error getting resource: ', err)
          setVapb({ loading: false, vapbObj: null, err: err, isNotfound: false })
        })
    }
  }, [apiGroup, clusterName, name, template, templateLoading, vapb])

  return vapb
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
