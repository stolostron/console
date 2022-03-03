/* Copyright Contributors to the Open Cluster Management project */

export interface Selector {
    matchExpressions?: {
        key: string
        operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist' | undefined
        values?: string[]
    }[]
    matchLabels?: Record<string, string>
}
