/* Copyright Contributors to the Open Cluster Management project */
import { K8sVerb, SelfSubjectAccessReviewKind } from '@openshift-console/dynamic-plugin-sdk'
import { useEffect, useState } from 'react'
import { checkAccess } from '../internal/checkAccess'
import { FleetAccessReviewResourceAttributes } from '../types/fleet'

/**
 * Hook that provides information about user access to a given resource.
 * @param resourceAttributes resource attributes for access review
 * @param resourceAttributes.group the name of the group to check access for
 * @param resourceAttributes.resource the name of the resource to check access for
 * @param resourceAttributes.subresource the name of the subresource to check access for
 * @param resourceAttributes.verb the "action" to perform; one of 'create' | 'get' | 'list' | 'update' | 'patch' | 'delete' | 'deletecollection' | 'watch' | 'impersonate'
 * @param resourceAttributes.name the name
 * @param resourceAttributes.namespace the namespace
 * @param resourceAttributes.cluster the cluster name to find the resource in
 *
 * @returns Array with `isAllowed` and `loading` values.
 */
export const useFleetAccessReview = ({
  group = '',
  resource = '',
  subresource = '',
  verb = '' as K8sVerb,
  name = '',
  namespace = '',
  cluster = '',
}: FleetAccessReviewResourceAttributes): [boolean, boolean] => {
  const [loading, setLoading] = useState(true)
  const [isAllowed, setAllowed] = useState(false)

  const skipCheck = !group && !resource
  useEffect(() => {
    if (skipCheck) {
      setAllowed(false)
      setLoading(false)
      return
    }
    checkAccess(group, resource, subresource, verb, name, namespace, cluster)
      .then((result: SelfSubjectAccessReviewKind) => {
        setAllowed(result.status?.allowed ?? false)
        setLoading(false)
      })
      .catch((e: Error) => {
        console.warn('SelfSubjectAccessReview failed', e)
        // Default to enabling the action if the access review fails so that we
        // don't incorrectly block users from actions they can perform. The server
        // still enforces access control.
        setAllowed(true)
        setLoading(false)
      })
  }, [setLoading, setAllowed, group, resource, subresource, verb, name, namespace, cluster, skipCheck])

  return [isAllowed, loading]
}
