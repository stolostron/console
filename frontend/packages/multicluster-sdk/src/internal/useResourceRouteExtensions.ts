/* Copyright Contributors to the Open Cluster Management project */
import { useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk'
import { isResourceRoute } from '../extensions/resourceRouteExtension'

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
   * Find matching ResourceRoute extension
   * First checks for exact version match, then falls back to version-agnostic match.
   */
  const findResourceRouteHandler = (group: string | undefined, kind: string, version?: string) => {
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
    findResourceRouteHandler,
  }
}
