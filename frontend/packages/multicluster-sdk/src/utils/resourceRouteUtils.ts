/* Copyright Contributors to the Open Cluster Management project */
import { ResolvedExtension } from '@openshift-console/dynamic-plugin-sdk'
import { ResourceRoute, ResourceRouteHandler } from '../extensions/resource'

/**
 * Find matching ResourceRoute extension
 * First checks for exact version match, then falls back to version-agnostic match.
 *
 * @param extensions - Array of resolved resource route extensions
 * @param group - The resource group (e.g., 'kubevirt.io')
 * @param kind - The resource kind (e.g., 'VirtualMachine')
 * @param version - The resource version (e.g., 'v1')
 * @returns The handler function if found, null otherwise
 */
export const findResourceRouteHandler = (
  extensions: ResolvedExtension<ResourceRoute>[] | undefined,
  group: string | undefined,
  kind: string,
  version?: string
): ResourceRouteHandler | null => {
  if (!extensions?.length) {
    return null
  }

  // first tries to find exact version match
  const exactMatch = extensions.find((ext) => {
    const { model } = ext.properties
    return model.group === group && model.kind === kind && model.version === version
  })

  if (exactMatch) {
    return exactMatch.properties.handler
  }

  // falls back to version-agnostic match
  const versionAgnosticMatch = extensions.find((ext) => {
    const { model } = ext.properties
    return model.group === group && model.kind === kind && !model.version
  })

  return versionAgnosticMatch?.properties.handler || null
}

/**
 * Get extension resource path with parameters
 * Convenience function that combines finding the handler and calling it
 *
 * @param extensions - Array of resolved resource route extensions
 * @param group - The resource group (e.g., 'kubevirt.io')
 * @param kind - The resource kind (e.g., 'VirtualMachine')
 * @param version - The resource version (e.g., 'v1')
 * @param params - Parameters to pass to the handler function
 * @returns The extension path if found, null otherwise
 */
export const getExtensionResourcePath = (
  extensions: ResolvedExtension<ResourceRoute>[] | undefined,
  group: string | undefined,
  kind: string,
  version?: string,
  params?: {
    cluster: string
    namespace?: string
    name: string
    resource: any
    model: { group?: string; version?: string; kind: string }
  }
): string | null => {
  const handler = findResourceRouteHandler(extensions, group, kind, version)

  if (handler && typeof handler === 'function' && params) {
    return handler({
      cluster: params.cluster,
      namespace: params.namespace,
      name: params.name,
      resource: params.resource,
      model: {
        group: params.model.group || '',
        version: params.model.version || '',
        kind: params.model.kind,
      },
    })
  }

  return null
}
