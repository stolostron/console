/* Copyright Contributors to the Open Cluster Management project */
import { useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk'

// type guard for resource route extensions
const isResourceRoute = (
  e: any
): e is {
  type: 'acm.resource/route'
  properties: {
    model: { group?: string; kind: string; version?: string }
    handler: (params: { kind: string; cluster?: string; namespace?: string; name: string }) => string | null
  }
} => e.type === 'acm.resource/route'

/**
 * Hook that resolves resource route extensions and provides lookup functionality.
 *
 * This hook uses useResolvedExtensions directly. It can be used by both
 * FleetResourceLink and search definitions.
 *
 * @returns Object with resolved state and lookup function
 */
export const useResourceRouteExtensions = () => {
  const [resourceRoutes, resourceRoutesResolved] = useResolvedExtensions(isResourceRoute)

  /**
   * find matching ResourceRoute extension
   * first checks for exact version match, then falls back to version-agnostic match.
   */
  const getResourceRouteHandler = (group: string | undefined, kind: string, version?: string) => {
    if (!resourceRoutesResolved || !resourceRoutes?.length) {
      return null
    }

    // exact match first, then version-agnostic fallback
    const extension =
      resourceRoutes.find(
        ({ properties: { model } }) => model.group === group && model.kind === kind && model.version === version
      ) ??
      resourceRoutes.find(({ properties: { model } }) => model.group === group && model.kind === kind && !model.version)

    // extract the resolved handler function from the extension
    // cast to the expected type since useResolvedExtensions returns resolved properties
    const handler = extension?.properties.handler as
      | ((params: { kind: string; cluster?: string; namespace?: string; name: string }) => string | null)
      | undefined

    return handler ?? null
  }

  return {
    resourceRoutesResolved,
    getResourceRouteHandler,
  }
}

/**
 * Determines if a resource is a core ACM resource and generates its path.
 *
 * Core ACM resources are fundamental management resources that always have specialized
 * detail pages in the ACM console. These resources do not use the extension system
 * because they are integral parts of ACM itself.
 *
 * Note: Plugin-provided resources (like VirtualMachine) should use the extension system instead.
 *
 * @param kind - The Kubernetes resource kind
 * @param name - The resource name
 * @returns Object with isFirstClass boolean and path string or null
 */
export const getFirstClassResourceRoute = (
  kind: string | undefined,
  name: string | undefined
): { isFirstClass: boolean; path: string | null } => {
  if (!kind || !name) {
    return { isFirstClass: false, path: null }
  }

  if (kind === 'ManagedCluster') {
    return {
      isFirstClass: true,
      path: `/multicloud/infrastructure/clusters/details/${name}/${name}/overview`,
    }
  }

  return { isFirstClass: false, path: null }
}
