import { useMemo } from 'react'
import { IResource } from '../../src/common/resource'

export function useLabelValuesMap(clusters: IResource[]) {
    return useMemo(() => {
        const labelValuesMap: Record<string, string[]> = {}
        for (const cluster of clusters) {
            const labels = cluster.metadata?.labels ?? {}
            for (const label in labels) {
                let values = labelValuesMap[label]
                if (!values) {
                    values = []
                    labelValuesMap[label] = values
                }
                const value = labels[label]
                if (value !== undefined) {
                    if (!values.includes(value)) {
                        values.push(value)
                    }
                }
            }
        }
        return labelValuesMap
    }, [clusters])
}
