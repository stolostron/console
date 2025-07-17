/* Copyright Contributors to the Open Cluster Management project */
import { Extension, ExtensionDeclaration } from '@openshift-console/dynamic-plugin-sdk/lib/types'

export type ResourceRouteExtensionProps = {
  /** resource model to match against */
  model: {
    group?: string
    kind: string
    version?: string
  }
  /** function that returns the path for the resource */
  handler: (params: { kind: string; cluster?: string; namespace?: string; name: string }) => string | null
}

export type ResourceRoute = ExtensionDeclaration<'acm.resource/route', ResourceRouteExtensionProps>

export type ResourceRouteHandler = (params: {
  kind: string
  cluster?: string
  namespace?: string
  name: string
}) => string | null

// type guard
export const isResourceRoute = (e: Extension): e is ResourceRoute => e.type === 'acm.resource/route'
