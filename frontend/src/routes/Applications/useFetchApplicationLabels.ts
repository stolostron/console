/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useState } from 'react'
import { IResource } from '../../resources'
import { LabelMap } from '../../resources/utils'
import { isOCPAppResource } from './utils'

const useFetchApplicationLabels = (applicationData?: IResource[]) => {
  const [labelOptions, setLabelOptions] = useState<{ label: string; value: string }[]>()
  const [labelMap, setLabelMap] = useState<LabelMap>()
  const [storedApplicationData, setStoredApplicationData] = useState<IResource[]>()

  useEffect(() => {
    if (applicationData && applicationData.length !== storedApplicationData?.length) {
      const { labelMap, allLabels } = applicationData.filter(isOCPAppResource).reduce(
        (acc, resource) => {
          const { labels, pairs } = (resource.label ?? '').split(';').reduce(
            (innerAcc, label) => {
              const trimmed = label.trim()
              innerAcc.labels.push(trimmed)
              const [key, value] = label.split('=').map((seg) => seg.trim())
              innerAcc.pairs[key] = value
              return innerAcc
            },
            { labels: [] as string[], pairs: {} as Record<string, string> }
          )
          labels.forEach((l) => acc.allLabels.add(l))
          acc.labelMap[resource.id] = { pairs, labels }
          return acc
        },
        { labelMap: {} as LabelMap, allLabels: new Set<string>() }
      )
      setLabelMap(labelMap)
      setLabelOptions(Array.from(allLabels).map((label) => ({ label, value: label })))
      setStoredApplicationData(applicationData)
    }
  }, [applicationData, storedApplicationData])

  return { labelOptions, labelMap }
}

export { useFetchApplicationLabels }
