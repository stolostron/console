/* Copyright Contributors to the Open Cluster Management project */

import { IResource } from './resource'

export interface Selector {
    matchExpressions?: {
        key: string
        operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist' | undefined
        values?: string[]
    }[]
    matchLabels?: Record<string, string>
}

export function resourceMatchesSelector(resource: IResource, selector: Selector) {
    const { matchLabels, matchExpressions } = selector
    const labels = resource.metadata?.labels ?? {}

    if (matchLabels) {
        for (const label in matchLabels) {
            const value = matchLabels[label]
            if (labels[label] !== value) {
                return false
            }
        }
    }

    if (matchExpressions) {
        for (const expression of matchExpressions) {
            const { key, operator, values } = expression
            switch (operator) {
                case 'In': {
                    const labelValue = labels[key]
                    if (typeof values === 'string') {
                        if (values !== labelValue) {
                            return false
                        }
                    } else if (Array.isArray(values)) {
                        if (!values.includes(labelValue)) {
                            return false
                        }
                    }
                    break
                }
                case 'NotIn': {
                    const labelValue = labels[key]
                    if (typeof values === 'string') {
                        if (values === labelValue) {
                            return false
                        }
                    } else if (Array.isArray(values)) {
                        if (values.includes(labelValue)) {
                            return false
                        }
                    }
                    break
                }
                case 'Exists':
                    if (!(key in labels)) return false
                    break
                case 'DoesNotExist':
                    if (key in labels) return false
                    break
            }
        }
    }

    return true
}
