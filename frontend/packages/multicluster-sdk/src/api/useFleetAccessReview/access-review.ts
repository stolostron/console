/* Copyright Contributors to the Open Cluster Management project */
import {
  AccessReviewResourceAttributes,
  K8sVerb,
  SelfSubjectAccessReviewKind,
} from '@openshift-console/dynamic-plugin-sdk'
import { useEffect, useState } from 'react'
import { checkAccess } from './checkAccess'

type FleetAccessReviewResourceAttributes = AccessReviewResourceAttributes & {
  cluster?: string
}

/**
 * Hook that provides information about user access to a given resource.
 * @param resourceAttributes resource attributes for access review
 * @param impersonate impersonation details
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
