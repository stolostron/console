/* Copyright Contributors to the Open Cluster Management project */

export interface IResource {
    kind: string
    apiVersion: string
    metadata?: {
        name: string
        namespace?: string
        resourceVersion?: string
        managedFields?: unknown
        selfLink?: string
    }
}
