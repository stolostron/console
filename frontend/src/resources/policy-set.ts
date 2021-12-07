/* Copyright Contributors to the Open Cluster Management project */

export const PolicySetApiVersion = 'policy.open-cluster-management.io/v1'
export type PolicySetApiVersionType = 'policy.open-cluster-management.io/v1'

export const PolicySetKind = 'PolicySet'
export type PolicySetKindType = 'PolicySet'

export interface PolicySet {
    apiVersion: PolicySetApiVersionType
    kind: PolicySetKindType
    metadata: {
        name: string
        namespace: string
        resourceVersion?: string
        creationTimestamp?: string
        uid?: string
        annotations?: Record<string, string>
        labels?: Record<string, string>
        generateName?: string
        deletionTimestamp?: string
        selfLink?: string
        finalizers?: string[]
        ownerReferences?: any[]
    }
    spec: PolicySetSpec
    status: PolicySetStatus
}

export interface PolicySetSpec {
    description: string
    policies: string[]
}

export interface PolicySetStatus {
    placement: PolicySetPlacementStatus[]
    results: PolicySetResultsStatus[]
}

export interface PolicySetPlacementStatus {
    placement: string
    placementDecision: string
}

export interface PolicySetResultsStatus {
    policy: string
    compliant?: 'NonCompliant' | 'Compliant'
    message?: string
    clusters?: PolicySetResultClusters[]
}

export interface PolicySetResultClusters {
    clustername: string
    clusternamespace: string
    compliant: 'NonCompliant' | 'Compliant'
}
