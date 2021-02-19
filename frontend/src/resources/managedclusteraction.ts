export const ManagedClusterActionApiVersion = 'action.open-cluster-management.io/v1beta1'
export type ManagedClusterActionApiVersionType = 'action.open-cluster-management.io/v1beta1'

export const ManagedClusterActionKind = 'ManagedClusterAction'
export type ManagedClusterActionKindType = 'ManagedClusterAction'

export const ManagedClusterActionDefinition = {
    apiVersion: ManagedClusterActionApiVersion,
    kind: ManagedClusterActionKind,
}

export const ManagedClusterActionConditionType = 'Completed'
export const ManagedClusterActionApiGroup = 'action.open-cluster-management.io'
export const ManagedClusterActionVersion = 'v1beta1'
export const ManagedClusterActionResources = 'managedclusteractions'

export interface ManagedClusterAction {
    apiVersion: ManagedClusterActionApiVersionType
    kind: ManagedClusterActionKindType
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
        actionType?: string
        kube?: {
            resource?: string
            name?: string
            namespace?: string
            template: Record<string, unknown>
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
