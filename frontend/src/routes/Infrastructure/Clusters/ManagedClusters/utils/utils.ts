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
export const getCPUArchFromReleaseImage = (releaseImage = '') => {
  const match = /.+:.*-(.*)/gm.exec(releaseImage)
  if (match && match.length > 1 && match[1]) {
    return match[1]
  }
}

export const getVersionFromReleaseImage = (releaseImage = '') => {
  const match = /.+:(\d+\.\d+(?:\.\d+)?)/gm.exec(releaseImage)
  if (match && match.length > 1 && match[1]) {
    return match[1]
  }
}

export const getChannelFromReleaseImage = (releaseImage = '', stream = 'fast') => {
  const version = getVersionFromReleaseImage(releaseImage)
  if (version) {
    // Extract major.minor (e.g., "4.20" from "4.20.8")
    const lastDotIndex = version.lastIndexOf('.')
    if (lastDotIndex > 0) {
      const majorMinor = version.substring(0, lastDotIndex)
      return `${stream}-${majorMinor}`
    }
  }
  return undefined
}
