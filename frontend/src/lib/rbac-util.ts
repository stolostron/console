/* Copyright Contributors to the Open Cluster Management project */

import { useEffect, useState } from 'react'
import {
  createSubjectAccessReview,
  createSubjectAccessReviews,
  fallbackPlural,
  getResourceGroup,
  getResourcePlural,
  IResource,
  Namespace,
  ResourceAttributes,
} from '../resources'
import { getBackendUrl, postRequest } from '../resources/utils'
import { useSharedValue, useSharedAtoms } from '../shared-atoms'

const ANY_NAMESPACE_RBAC_URL = '/rbac/any-namespace'

interface AnyNamespaceAuthorizationResponse {
  allowed: boolean
}

/**
 * Ask the backend to check the candidate namespaces as the current user.
 * This keeps the per-namespace SSAR (SelfSubjectAccessReview) fan-out out of the browser.
 */
function requestAnyNamespaceAuthorization(resourceAttributes: Promise<ResourceAttributes>, namespaces: string[]) {
  const request = postRequest<
    { resourceAttributes: ResourceAttributes; namespaces: string[] },
    AnyNamespaceAuthorizationResponse
  >(
    `${getBackendUrl()}${ANY_NAMESPACE_RBAC_URL}`,
    resourceAttributes.then((resourceAttributes) => ({ resourceAttributes, namespaces }))
  )

  return {
    // A failed request is indeterminate, so the hook cannot treat it as a confirmed denial.
    promise: request.promise.then((response) => response.allowed).catch(() => undefined),
    abort: request.abort,
  }
}

export function isAnyNamespaceAuthorized(resourceAttributes: Promise<ResourceAttributes>, namespaces: Namespace[]) {
  const namespaceList: string[] = namespaces.map((namespace) => namespace.metadata.name!)

  if (namespaceList.length === 0) {
    return { promise: Promise.resolve(false), abort: () => undefined }
  }

  const request = requestAnyNamespaceAuthorization(resourceAttributes, namespaceList)
  return { ...request, promise: request.promise.then((allowed) => allowed === true) }
}

export function areAllNamespacesUnauthorized(resourceAttributes: Promise<ResourceAttributes>, namespaces: Namespace[]) {
  const namespaceList: string[] = namespaces.map((namespace) => namespace.metadata.name!)

  if (namespaceList.length === 0) {
    return { promise: Promise.resolve(true), abort: () => undefined }
  }

  const request = requestAnyNamespaceAuthorization(resourceAttributes, namespaceList)
  // Only an explicit backend denial proves that every candidate namespace denied access.
  return { ...request, promise: request.promise.then((allowed) => allowed === false) }
}

export async function getAuthorizedNamespaces(resourceAttributes: ResourceAttributes[], namespaces: Namespace[]) {
  const namespaceList: string[] = namespaces.map((namespace) => namespace.metadata.name!)

  if (namespaceList.length === 0) {
    return []
  }

  const adminAccessRequest = await checkAdminAccess()
  const isAdmin = adminAccessRequest?.status?.allowed ?? false

  if (isAdmin) {
    return namespaceList
  }

  const resourceList: Array<ResourceAttributes> = []

  namespaceList.forEach((namespace) => {
    resourceList.push(...resourceAttributes.map((attribute) => ({ ...attribute, namespace })))
  })

  let authorizedNamespaces: string[] = []
  const promiseResult = createSubjectAccessReviews(resourceList)
  await promiseResult.promise.then((results) => {
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        if (result.value.status?.allowed) {
          authorizedNamespaces.push(result.value.spec.resourceAttributes.namespace!)
        }
      }
    })
    // remove duplicates from filtered list
    authorizedNamespaces = Array.from(new Set(authorizedNamespaces))
  })
  return authorizedNamespaces
}

export function checkAdminAccess() {
  const result = createSubjectAccessReview({
    name: '*',
    namespace: '*',
    resource: '*',
    verb: '*',
  }).promise
  return result
}

type Verb = 'get' | 'patch' | 'create' | 'delete' | 'update'
type SubResource = 'join' | 'bind'

export async function rbacResource(
  verb: Verb,
  resource: IResource,
  namespace?: string,
  name?: string,
  subresource?: SubResource
) {
  const resourcePlural = await getResourcePlural(resource)
  const attributes = {
    name: name ?? resource?.metadata?.name,
    namespace: namespace ?? resource?.metadata?.namespace,
    resource: resourcePlural,
    subresource,
    verb,
    group: getResourceGroup(resource),
  }
  if (!attributes.name) delete attributes.name
  if (!attributes.namespace) delete attributes.namespace
  if (!attributes.subresource) delete attributes.subresource

  return attributes
}

export function rbacGet(resource: IResource, namespace?: string, name?: string) {
  return rbacResource('get', resource, namespace, name)
}

export function rbacPatch(resource: IResource, namespace?: string, name?: string) {
  return rbacResource('patch', resource, namespace, name)
}

export function rbacCreate(resource: IResource, namespace?: string, name?: string, subresource?: SubResource) {
  return rbacResource('create', resource, namespace, name, subresource)
}

export function rbacDelete(resource: IResource, namespace?: string, name?: string) {
  return rbacResource('delete', resource, namespace, name)
}

export function rbacUpdate(resource: IResource, namespace?: string, name?: string) {
  return rbacResource('update', resource, namespace, name)
}

export function canUser(
  verb: Verb,
  resource: IResource,
  namespace?: string,
  name?: string,
  _subresource?: SubResource
) {
  const resourceAttributes = rbacResource(verb, resource, namespace, name, _subresource)
  const selfSubjectAccessReview = createSubjectAccessReview(resourceAttributes)
  return selfSubjectAccessReview
}

export function useIsAnyNamespaceAuthorized(resourceAttributes: Promise<ResourceAttributes>) {
  const { namespacesState } = useSharedAtoms()
  const namespaces = useSharedValue(namespacesState)
  const [someNamespaceIsAuthorized, setSomeNamespaceIsAuthorized] = useState(false)

  const resourceAttributesAsString = JSON.stringify(resourceAttributes)

  useEffect(() => {
    // Once allowed, only switch back after a successful check confirms no namespace grants access.
    const result = (someNamespaceIsAuthorized ? areAllNamespacesUnauthorized : isAnyNamespaceAuthorized)(
      resourceAttributes,
      namespaces
    )
    void result.promise.then((flipAuthorization) => {
      if (flipAuthorization) setSomeNamespaceIsAuthorized(!someNamespaceIsAuthorized)
    })

    return () => result.abort?.()
    // exclude someNamespaceIsAuthorized from dependency list to avoid update loop
    // use resourceAttributesAsString instead of resourceAttributes because the object is currently created on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceAttributesAsString, namespaces])

  return someNamespaceIsAuthorized
}

export function rbacResourceTestHelper(
  verb: Verb,
  resource: IResource,
  namespace?: string,
  name?: string,
  subresource?: SubResource
) {
  const resourcePlural = fallbackPlural(resource)
  const attributes = {
    name: name ?? resource?.metadata?.name,
    namespace: namespace ?? resource?.metadata?.namespace,
    resource: resourcePlural,
    subresource,
    verb,
    group: getResourceGroup(resource),
  }
  if (!attributes.name) delete attributes.name
  if (!attributes.namespace) delete attributes.namespace
  if (!attributes.subresource) delete attributes.subresource

  return attributes
}

export function rbacGetTestHelper(resource: IResource, namespace?: string, name?: string) {
  return rbacResourceTestHelper('get', resource, namespace, name)
}

export function rbacPatchTestHelper(resource: IResource, namespace?: string, name?: string) {
  return rbacResourceTestHelper('patch', resource, namespace, name)
}

export function rbacCreateTestHelper(
  resource: IResource,
  namespace?: string,
  name?: string,
  subresource?: SubResource
) {
  return rbacResourceTestHelper('create', resource, namespace, name, subresource)
}

export function rbacDeleteTestHelper(resource: IResource, namespace?: string, name?: string) {
  return rbacResourceTestHelper('delete', resource, namespace, name)
}

export function rbacUpdateTestHelper(resource: IResource, namespace?: string, name?: string) {
  return rbacResourceTestHelper('update', resource, namespace, name)
}
