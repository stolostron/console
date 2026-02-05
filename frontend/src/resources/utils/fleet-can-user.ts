/* Copyright Contributors to the Open Cluster Management project */

import { canUser, rbacResource } from '../../lib/rbac-util'
import { ManagedClusterActionDefinition } from '../managedclusteraction'
import { ManagedClusterViewDefinition } from '../managedclusterview'
import { IResource } from '../resource'
import {
  createSubjectAccessReviewWithBaseUrl,
  ResourceAttributes,
  SelfSubjectAccessReview,
} from '../self-subject-access-review'
import { getBackendUrl, IRequestResult } from './resource-request'

type Verb = 'get' | 'patch' | 'create' | 'delete' | 'update'

/**
 * Checks if a user can perform an action on a resource in a managed cluster.
 *
 * This function follows the fleet permission checking pattern:
 * 1. First checks if the user has permission to create ManagedClusterView (for 'get') or
 *    ManagedClusterAction (for other verbs) on the hub cluster
 * 2. If permitted to use MCV/MCA, returns allowed=true since the user can effectively
 *    perform the action through MCV/MCA
 * 3. If not permitted to use MCV/MCA, falls back to doing a SelfSubjectAccessReview
 *    via the managed cluster proxy to check direct permissions on the managed cluster
 *
 * @param verb The action to check permission for: 'get' | 'patch' | 'create' | 'delete' | 'update'
 * @param cluster The name of the managed cluster
 * @param resource The resource to check permission for
 * @param namespace Optional namespace of the resource
 * @param name Optional name of the resource
 * @returns IRequestResult with the SelfSubjectAccessReview response
 */
export function fleetCanUser(
  verb: Verb,
  cluster: string,
  resource: IResource,
  namespace?: string,
  name?: string
): IRequestResult<SelfSubjectAccessReview> {
  let abortFn: (() => void) | undefined

  const abort = () => {
    abortFn?.()
  }

  const promise = (async (): Promise<SelfSubjectAccessReview> => {
    const isMCV = verb === 'get'

    // First, check if user can create MCV/MCA on the hub cluster
    const canCreateManagedClusterViewAction = canUser(
      'create',
      isMCV ? ManagedClusterViewDefinition : ManagedClusterActionDefinition
    )
    abortFn = canCreateManagedClusterViewAction.abort

    const mcvMcaResult = await canCreateManagedClusterViewAction.promise
    const canUseMcvMca = mcvMcaResult.status?.allowed ?? false

    if (canUseMcvMca) {
      // User can use MCV/MCA to perform the action, so return allowed=true
      return {
        apiVersion: 'authorization.k8s.io/v1',
        kind: 'SelfSubjectAccessReview',
        metadata: {},
        spec: {
          resourceAttributes: await rbacResource(verb, resource, namespace, name),
        },
        status: {
          allowed: true,
        },
      }
    }

    // User cannot use MCV/MCA, fall back to checking direct permissions via cluster proxy
    const resourceAttributes: Promise<ResourceAttributes> = rbacResource(verb, resource, namespace, name)

    // Build the managed cluster proxy URL
    const managedClusterProxyBaseUrl = getBackendUrl() + `/managedclusterproxy/${cluster}`

    const proxyAccessReview = createSubjectAccessReviewWithBaseUrl(resourceAttributes, managedClusterProxyBaseUrl)
    abortFn = proxyAccessReview.abort

    return proxyAccessReview.promise
  })()

  return {
    promise,
    abort,
  }
}
