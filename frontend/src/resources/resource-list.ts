/* Copyright Contributors to the Open Cluster Management project */
export interface ResourceList<T> {
    apiVersion: string
    items?: T[] | null
    kind: 'List'
    metadata: {
        resourceVersion: string
    }
}
