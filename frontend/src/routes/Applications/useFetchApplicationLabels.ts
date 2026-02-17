/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useState } from 'react'
import { IApplicationResource } from './model/application-resource'
import { isOCPAppResource } from './utils'

const useFetchApplicationLabels = (applicationData?: IApplicationResource[]) => {
  const [labelOptions, setLabelOptions] = useState<{ label: string; value: string }[]>()
  const [labelMap, setLabelMap] = useState<Record<string, { pairs: Record<string, string>; labels: string[] }>>()

  useEffect(() => {
    if (applicationData) {
      const allLabels = new Set<string>()
      const labelMap: Record<string, { pairs: Record<string, string>; labels: string[] }> = {}
      applicationData.filter(isOCPAppResource).forEach((resource) => {
        const labels: string[] = []
        const pairs: Record<string, string> = {}
        resource.label?.split(';').forEach((label) => {
          labels.push(label.trim())
          const [key, value] = label.split('=').map((seg) => seg.trim())
          pairs[key] = value
          allLabels.add(label.trim())
        })
        labelMap[resource.metadata?.name ?? ''] = { pairs, labels }
      })
      setLabelMap(labelMap)
      setLabelOptions(Array.from(allLabels).map((label) => ({ label, value: label })))
    }
  }, [applicationData])

  return { labelOptions, labelMap }
}

export { useFetchApplicationLabels }
