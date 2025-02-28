/* Copyright Contributors to the Open Cluster Management project */
import { Cluster } from '../../../../../resources/utils'

export const onToggle = (acmCardID: string, open: boolean, setOpen: (open: boolean) => void) => {
  setOpen(!open)
  if (localStorage.getItem(acmCardID) === 'show') {
    localStorage.setItem(acmCardID, 'hide')
  } else {
    localStorage.setItem(acmCardID, 'show')
  }
}

export function getClusterLabelData(clusters: Cluster[]) {
  const allLabels = new Set<string>()
  const labelMap: Record<string, { pairs: Record<string, string>; labels: string[] }> = {}
  clusters?.forEach((cluster) => {
    const labelsArray = Object.entries(cluster.labels || {}) || []
    const labelStrings: string[] = []
    const pairs: Record<string, string> = {}
    labelsArray.forEach(([key, value]) => {
      const stringLabel = `${key}=${value}`
      labelStrings.push(stringLabel)
      if (
        !key.startsWith('name') &&
        !key.startsWith('clusterID') &&
        !key.startsWith('feature.open-cluster-management.io/addon')
      ) {
        pairs[key] = value
        allLabels.add(stringLabel)
      }
    })

    labelMap[cluster.uid] = { pairs, labels: labelStrings }
  })
  return {
    labelMap,
    labelOptions: Array.from(allLabels).map((lbl) => {
      return { label: lbl, value: lbl }
    }),
  }
}
