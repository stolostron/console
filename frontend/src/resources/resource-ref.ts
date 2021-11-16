/* Copyright Contributors to the Open Cluster Management project */
export interface ResourceRef {
    apiGroup: string
    kind: string
    name: string
    uid?: string
}
