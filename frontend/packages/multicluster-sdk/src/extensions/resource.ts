/* Copyright Contributors to the Open Cluster Management project */
import { CodeRef, ExtensionDeclaration } from '@openshift-console/dynamic-plugin-sdk/lib/types'
import { ExtensionK8sGroupKindModel, ExtensionK8sModel } from '@openshift-console/dynamic-plugin-sdk'
import { FleetK8sResourceCommon } from '../types/fleet'
import { RESOURCE_ROUTE_TYPE } from '../internal/resourceRouteUtils'

export type ResourceRouteHandler = (props: {
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
}) => string

export type ResourceRouteProps = {
  /** The model for which this resource route should be used. */
  model: ExtensionK8sGroupKindModel
  /** The handler function that returns the route path for the resource. */
  handler: CodeRef<ResourceRouteHandler>
}

/** This extension allows plugins to customize the route used for resources of the given kind. Search results and resource links will direct to the route returned by the implementing function. */
export type ResourceRoute = ExtensionDeclaration<typeof RESOURCE_ROUTE_TYPE, ResourceRouteProps>
