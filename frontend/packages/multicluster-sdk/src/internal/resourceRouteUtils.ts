/* Copyright Contributors to the Open Cluster Management project */

/**
 * Find matching ResourceRoute extension handler from acmExtensions
 * First checks for exact version match, then falls back to version-agnostic match
 *
 * @param acmExtensions - The ACM extensions object from PluginContext
 * @param group - The resource group (e.g., 'kubevirt.io')
 * @param kind - The resource kind (e.g., 'VirtualMachine')
 * @param version - The resource version (e.g., 'v1')
 * @returns The handler function if found, undefined otherwise
 */
export const findResourceRouteHandler = (
  acmExtensions: any,
  group: string | undefined,
  kind: string,
  version?: string
) => {
  return (
    acmExtensions?.resourceRoutes?.find(
      ({ model }: { model: { group?: string; kind: string; version?: string } }) =>
        model.group === group && model.kind === kind && model.version === version
    ) ||
    acmExtensions?.resourceRoutes?.find(
      ({ model }: { model: { group?: string; kind: string; version?: string } }) =>
        model.group === group && model.kind === kind && !model.version
    )
  )?.handler
}
