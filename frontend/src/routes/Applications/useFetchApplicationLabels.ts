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
      const allLabels = new Set<string>()
      const labelMap: LabelMap = {}
      applicationData.filter(isOCPAppResource).forEach((resource) => {
        const labels: string[] = []
        const pairs: Record<string, string> = {}
        resource.label?.split(';').forEach((label) => {
          labels.push(label.trim())
          const [key, value] = label.split('=').map((seg) => seg.trim())
          pairs[key] = value
          allLabels.add(label.trim())
        })
        labelMap[resource.id] = { pairs, labels }
      })
      setLabelMap(labelMap)
      setLabelOptions(Array.from(allLabels).map((label) => ({ label, value: label })))
      setStoredApplicationData(applicationData)
    }
  }, [applicationData, storedApplicationData])

  return { labelOptions, labelMap }
}

export { useFetchApplicationLabels }
