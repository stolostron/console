/* Copyright Contributors to the Open Cluster Management project */
import { CodeRef, Extension, ExtensionDeclaration } from '@openshift-console/dynamic-plugin-sdk/lib/types'
import { ExtensionK8sGroupKindModel, ExtensionK8sModel } from '@openshift-console/dynamic-plugin-sdk'
import { FleetK8sResourceCommon } from '../types/fleet'

const RESOURCE_DETAILS_TYPE = 'acm.resource/details'
const RESOURCE_TAB_TYPE = 'acm.resource/tab'
//const RESOURCE_ACTION_TYPE = 'acm.resource/action'

export type ResourceTabComponent = React.ComponentType<{
  /** The cluster where the resource is located. */
  cluster: string
  /** The namespace where the resource is located (if the resource is namespace-scoped). */
  namespace?: string
  /** The name of the resource. */
  name: string
  /** The resource, augmented with cluster property. */
  resource: FleetK8sResourceCommon
  /** The model for the resource. */
  model: ExtensionK8sModel
}>

export type ResourceTabProps = {
  /** The model for which this details component should be used. */
  model: ExtensionK8sGroupKindModel
  /** The component to be rendered for the details tab of a matching resource. */
  component: CodeRef<ResourceTabComponent>
}

export type ResourceTabMetadataProps = {
  /** A unique identifier for this resource tab. */
  id: string
  /** The name of the tab. */
  name: string
  /** Insert this item before the item referenced here. For arrays, the first one found in order is used. */
  insertBefore?: string | string[]
  /** Insert this item after the item referenced here. For arrays, the first one found in order is used. `insertBefore` takes precedence. */
  insertAfter?: string | string[]
}

/** This extension allows plugins to replace the contents of the ACM resource details tab. */
export type ResourceDetails = ExtensionDeclaration<typeof RESOURCE_DETAILS_TYPE, ResourceTabProps>

/** This extension allows plugins to add tabs to the ACM resource details page. */
export type ResourceTab = ExtensionDeclaration<typeof RESOURCE_TAB_TYPE, ResourceTabProps & ResourceTabMetadataProps>

// Type guards
export const isResourceDetails = (e: Extension): e is ResourceDetails => {
  return e.type === RESOURCE_DETAILS_TYPE
}

export const isResourceTab = (e: Extension): e is ResourceDetails => {
  return e.type === RESOURCE_TAB_TYPE
}
