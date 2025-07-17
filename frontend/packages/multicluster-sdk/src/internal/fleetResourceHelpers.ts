/* Copyright Contributors to the Open Cluster Management project */
import { useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk'

// Type guard for resource route extensions
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
 * This hook uses useResolvedExtensions directly and provides the same lookup logic
 * that Kevin implemented in the console search results. It can be used by both
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
      ) ||
      resourceRoutes.find(({ properties: { model } }) => model.group === group && model.kind === kind && !model.version)

    // extract the resolved handler function from the extension
    // cast to the expected type since useResolvedExtensions returns resolved properties
    const handler = extension?.properties.handler as
      | ((params: { kind: string; cluster?: string; namespace?: string; name: string }) => string | null)
      | undefined

    return handler || null
  }

  return {
    resourceRoutesResolved,
    getResourceRouteHandler,
  }
}

/**
 * Utility function for search definitions to find resource route handlers.
 * This function implements the exact lookup logic Kevin showed in his console implementation.
 *
 * @param acmExtensions - Extensions from PluginContext
 * @param group - The resource group (e.g., 'kubevirt.io')
 * @param kind - The resource kind (e.g., 'VirtualMachine')
 * @param version - The resource version (e.g., 'v1')
 * @returns The handler function if found, null otherwise
 */
export const findResourceRouteHandler = (
  acmExtensions:
    | { resourceRoutes?: Array<{ model: { group?: string; kind: string; version?: string }; handler: any }> }
    | undefined,
  group: string | undefined,
  kind: string,
  version?: string
) => {
  // exact lookup pattern from his console implementation
  const resourceRouteHandler = (
    acmExtensions?.resourceRoutes?.find(
      ({ model }) => model.group === group && model.kind === kind && model.version === version
    ) ||
    acmExtensions?.resourceRoutes?.find(({ model }) => model.group === group && model.kind === kind && !model.version)
  )?.handler

  return resourceRouteHandler || null
}

/**
 * standalone function for finding resource route handlers from extensions array.
 * used by search results when they have acmExtensions from PluginContext.
 *
 * @param resourceRoutes - Array of registered resource route extensions
 * @param group - The resource group (e.g., 'kubevirt.io')
 * @param kind - The resource kind (e.g., 'VirtualMachine')
 * @param version - The resource version (e.g., 'v1')
 * @returns The handler function if a match is found, null otherwise
 */
export const getResourceRouteHandler = (
  resourceRoutes: Array<{
    model: { group?: string; kind: string; version?: string }
    handler: (params: { kind: string; cluster?: string; namespace?: string; name: string }) => string | null
  }>,
  group: string | undefined,
  kind: string,
  version?: string
): ((params: { kind: string; cluster?: string; namespace?: string; name: string }) => string | null) | null => {
  if (!resourceRoutes?.length) {
    return null
  }

  // exact match first, then version-agnostic fallback
  const matchingRoute =
    resourceRoutes.find(({ model }) => model.group === group && model.kind === kind && model.version === version) ||
    resourceRoutes.find(({ model }) => model.group === group && model.kind === kind && !model.version)

  return matchingRoute?.handler || null
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

  switch (kind) {
    case 'ManagedCluster':
      return {
        isFirstClass: true,
        path: `/multicloud/infrastructure/clusters/details/${name}/${name}/overview`,
      }
    default:
      return { isFirstClass: false, path: null }
  }
}
