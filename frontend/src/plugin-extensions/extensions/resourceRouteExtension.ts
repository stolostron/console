/* Copyright Contributors to the Open Cluster Management project */
import { Extension, ExtensionDeclaration } from '@openshift-console/dynamic-plugin-sdk/lib/types'
import { ResourceRouteExtensionProps } from '../properties'

export type ResourceRoute = ExtensionDeclaration<'acm.resource/route', ResourceRouteExtensionProps>

// Type guard
export const isResourceRoute = (e: Extension): e is ResourceRoute => e.type === 'acm.resource/route'

/**
 * Example: How a plugin (like kubevirt) would register a resource route extension
 *
 * In the plugin's console-extensions.ts file:
 *
 * ```typescript
 * const virtualMachineRoute: EncodedExtension<ResourceRoute> = {
 *   type: 'acm.resource/route',
 *   properties: {
 *     model: {
 *       group: 'kubevirt.io',
 *       kind: 'VirtualMachine',
 *       version: 'v1', // Optional - omit for version-agnostic match
 *     },
 *     handler: ({ cluster, namespace, name }) => {
 *       // Only generate ACM VM page path if we have cluster and namespace
 *       if (cluster && namespace) {
 *         return `/multicloud/infrastructure/virtualmachines/${cluster}/${namespace}/${name}`
 *       }
 *       return null // Fall back to default search results
 *     },
 *   },
 * }
 *
 * const virtualMachineInstanceRoute: EncodedExtension<ResourceRoute> = {
 *   type: 'acm.resource/route',
 *   properties: {
 *     model: {
 *       group: 'kubevirt.io',
 *       kind: 'VirtualMachineInstance',
 *     },
 *     handler: ({ cluster, namespace, name }) => {
 *       if (cluster && namespace) {
 *         return `/multicloud/infrastructure/virtualmachines/${cluster}/${namespace}/${name}`
 *       }
 *       return null
 *     },
 *   },
 * }
 *
 * export const extensions: EncodedExtension[] = [
 *   // ... other extensions
 *   virtualMachineRoute,
 *   virtualMachineInstanceRoute,
 * ]
 * ```
 *
 * This replaces the hardcoded logic that was previously in getFirstClassResourceRoute
 * and allows plugins to define custom routing for their resources.
 */
