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
import { useRecoilValue, useSharedAtoms } from '../shared-recoil'

const SELF_ACCESS_CHECK_BATCH_SIZE = 40

export function isAnyNamespaceAuthorized(resourceAttributes: Promise<ResourceAttributes>, namespaces: Namespace[]) {
  const namespaceList: string[] = namespaces.map((namespace) => namespace.metadata.name!)

  if (namespaceList.length === 0) {
    return { promise: Promise.resolve(false) }
  }

  let abortFn: () => void | undefined
  const abort = () => {
    abortFn?.()
  }

  return {
    promise: resourceAttributes.then((resourceAttributes) =>
      checkAdminAccess().then((adminAccessRequest) => {
        if (adminAccessRequest?.status?.allowed) {
          return true
        } else {
          const resourceList: Array<ResourceAttributes> = []

          namespaceList.forEach((namespace) => {
            resourceList.push({ ...resourceAttributes, namespace })
          })

          // eslint-disable-next-line no-inner-declarations
          async function processBatch(): Promise<boolean> {
            const nextBatch = resourceList.splice(0, SELF_ACCESS_CHECK_BATCH_SIZE)
            const results = nextBatch.map((resource) => {
              return createSubjectAccessReview(resource)
            })
            abortFn = () => results.forEach((result) => result.abort())
            try {
              // short-circuit as soon as any namespace says the access is allowed
              return await Promise.any(
                results.map((result) =>
                  result.promise.then((result) => {
                    if (result.status?.allowed) {
                      abort()
                      return true
                    } else {
                      throw new Error('access not allowed')
                    }
                  })
                )
              )
            } catch {
              if (resourceList.length) {
                return processBatch()
              } else {
                return false
              }
            }
          }
          return processBatch()
        }
      })
    ),
    abort,
  }
}

export function areAllNamespacesUnauthorized(resourceAttributes: Promise<ResourceAttributes>, namespaces: Namespace[]) {
  const namespaceList: string[] = namespaces.map((namespace) => namespace.metadata.name!)

  if (namespaceList.length === 0) {
    return { promise: Promise.resolve(true) }
  }

  let abortFn: () => void | undefined
  const abort = () => {
    abortFn?.()
  }

  return {
    promise: resourceAttributes.then((resourceAttributes) =>
      checkAdminAccess().then((adminAccessRequest) => {
        if (adminAccessRequest?.status?.allowed) {
          return false
        } else {
          const resourceList: Array<ResourceAttributes> = []

          namespaceList.forEach((namespace) => {
            resourceList.push({ ...resourceAttributes, namespace })
          })

          // eslint-disable-next-line no-inner-declarations
          async function processBatch(): Promise<boolean> {
            const nextBatch = resourceList.splice(0, SELF_ACCESS_CHECK_BATCH_SIZE)
            const results = nextBatch.map((resource) => {
              return createSubjectAccessReview(resource)
            })
            abortFn = () => results.forEach((result) => result.abort())
            try {
              // short-circuit as soon as any namespace says the access is allowed
              return await Promise.all(
                results.map((result) =>
                  result.promise.then((result) => {
                    if (result.status && !result.status.allowed) {
                      return true
                    } else {
                      abort()
                      throw new Error('access is allowed')
                    }
                  })
                )
              ).then(() => {
                if (resourceList.length) {
                  return processBatch()
                } else {
                  return true
                }
              })
            } catch {
              return false
            }
          }
          return processBatch()
        }
      })
    ),
    abort,
  }
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
  const namespaces = useRecoilValue(namespacesState)
  const [someNamespaceIsAuthorized, setSomeNamespaceIsAuthorized] = useState(false)

  useEffect(() => {
    const result = (someNamespaceIsAuthorized ? areAllNamespacesUnauthorized : isAnyNamespaceAuthorized)(
      resourceAttributes,
      namespaces
    )
    result.promise.then((flipAuthorization) => {
      if (flipAuthorization) setSomeNamespaceIsAuthorized(!someNamespaceIsAuthorized)
    })

    return () => result.abort?.()
    // exclude someNamespaceIsAuthorized from dependency list to avoid update loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceAttributes, namespaces])

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
