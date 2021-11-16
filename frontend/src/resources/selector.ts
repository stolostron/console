/* Copyright Contributors to the Open Cluster Management project */

export interface Selector {
    matchExpressions?: {
        key: string
        operator: string
        values?: string[]
    }[]
    matchLabels?: Record<string, string>
}
