/* Copyright Contributors to the Open Cluster Management project */
import { K8sVerb, SelfSubjectAccessReviewKind } from '@openshift-console/dynamic-plugin-sdk'
import _ from 'lodash'
import { fleetK8sCreate } from '../api/fleetK8sCreate'
import { SelfSubjectAccessReviewModel } from './models'

/**
 * Memoizes the result so it is possible to only make the request once for each access review.
 * This does mean that the user will have to refresh the page to see updates.
 * Function takes in the destructured resource attributes so that the cache keys are stable.
 * `JSON.stringify` is not guaranteed to give the same result for equivalent objects.
 * Impersonate headers are added automatically by `k8sCreate`.
 * @param group resource group.
 * @param resource resource string.
 * @param subresource subresource string.
 * @param verb K8s verb.
 * @param namespace namespace.
 * @param impersonateKey parameter to include in the cache key even though it's not used in the function body.
 * @returns Memoized result of the access review.
 */
export const checkAccess = _.memoize(
  (
    group: string,
    resource: string,
    subresource: string,
    verb: K8sVerb,
    name: string,
    namespace: string,
    cluster: string
  ): Promise<SelfSubjectAccessReviewKind> => {
    const reviewNamespace = group === 'project.openshift.io' && resource === 'projects' ? name : namespace
    const selfSubjectAccessReview: SelfSubjectAccessReviewKind = {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      spec: {
        resourceAttributes: {
          group,
          resource,
          subresource,
          verb,
          name,
          namespace: reviewNamespace,
        },
      },
    }
    return fleetK8sCreate({
      model: SelfSubjectAccessReviewModel,
      data: selfSubjectAccessReview,
      cluster,
    })
  },
  (...args) => args.join('~')
)
