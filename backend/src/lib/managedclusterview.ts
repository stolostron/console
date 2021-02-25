/* Copyright Contributors to the Open Cluster Management project */

export const ManagedClusterViewApiVersion = 'view.open-cluster-management.io/v1beta1'
export type ManagedClusterViewApiVersionType = 'view.open-cluster-management.io/v1beta1'

export const ManagedClusterViewKind = 'ManagedClusterView'
export type ManagedClusterViewKindType = 'ManagedClusterView'
export const ManagedClusterViewConditionType = 'Processing'
export const ManagedClusterViewApiGroup = 'view.open-cluster-management.io'
export const ManagedClusterViewVersion = 'v1beta1'
export const ManagedClusterViewResources = 'managedclusterviews'

export interface ManagedClusterView {
    apiVersion: ManagedClusterViewApiVersionType
    kind: ManagedClusterViewKindType
    metadata: {
        name?: string
        namespace?: string
        annotations?: {
            [key: string]: string
        }
        labels?: {
            [key: string]: string
        }
    }
    spec?: {
        scope?: {
            apiGroup?: string
            kind?: string
            version?: string
            resource?: string
            name?: string
            namespace?: string
            updateIntervalSeconds?: string
        }
    }
    status?: {
        conditions?: Array<{
            lastTransitionTime: Date
            message: string
            reason: string
            status: string
            type: string
        }>
        result?: Record<string, unknown>
    }
}
