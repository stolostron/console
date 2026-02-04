/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'
import { createResource, createResourceWithBaseUrl } from './utils/resource-request'

export const SelfSubjectAccessReviewApiVersion = 'authorization.k8s.io/v1'
export type SelfSubjectAccessReviewApiVersionType = 'authorization.k8s.io/v1'

export const SelfSubjectAccessReviewKind = 'SelfSubjectAccessReview'
export type SelfSubjectAccessReviewType = 'SelfSubjectAccessReview'

export const SelfSubjectAccessReviewDefinition: IResourceDefinition = {
  apiVersion: SelfSubjectAccessReviewApiVersion,
  kind: SelfSubjectAccessReviewKind,
}

export interface SelfSubjectAccessReview extends IResource {
  apiVersion: SelfSubjectAccessReviewApiVersionType
  kind: SelfSubjectAccessReviewType
  metadata: Metadata
  spec: {
    resourceAttributes: ResourceAttributes
    user?: string
  }
  status?: {
    allowed: boolean
    denied?: boolean
    evaluationError?: string
    reason?: string
  }
}

export type ResourceAttributes = {
  name?: string
  namespace?: string
  resource: string
  verb: string
  group?: string
  version?: string
  subresource?: string
}

export function createSubjectAccessReview(resourceAttributes: Promise<ResourceAttributes> | ResourceAttributes) {
  const resources = Promise.resolve(resourceAttributes).then(
    (resourceAttributes): SelfSubjectAccessReview => ({
      apiVersion: SelfSubjectAccessReviewApiVersion,
      kind: SelfSubjectAccessReviewKind,
      metadata: {},
      spec: {
        resourceAttributes,
      },
    })
  )
  return createResource<SelfSubjectAccessReview>(resources)
}

/**
 * Creates a SelfSubjectAccessReview request with a custom base URL.
 * This is useful for checking permissions on a remote cluster via a proxy.
 *
 * @param resourceAttributes The resource attributes to check permission for
 * @param baseUrl The base URL to use for the request (e.g., managed cluster proxy URL)
 * @returns IRequestResult with the SelfSubjectAccessReview response
 */
export function createSubjectAccessReviewWithBaseUrl(
  resourceAttributes: Promise<ResourceAttributes> | ResourceAttributes,
  baseUrl: string
) {
  const resources = Promise.resolve(resourceAttributes).then(
    (resourceAttributes): SelfSubjectAccessReview => ({
      apiVersion: SelfSubjectAccessReviewApiVersion,
      kind: SelfSubjectAccessReviewKind,
      metadata: {},
      spec: {
        resourceAttributes,
      },
    })
  )
  return createResourceWithBaseUrl<SelfSubjectAccessReview>(resources, baseUrl)
}

export function createSubjectAccessReviews(resourceAttributes: Array<ResourceAttributes>) {
  const results = resourceAttributes.map((resource) => createSubjectAccessReview(resource))
  return {
    promise: Promise.allSettled(results.map((result) => result.promise)),
    abort: () => results.forEach((result) => result.abort()),
  }
}
