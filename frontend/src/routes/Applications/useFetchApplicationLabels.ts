/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useState } from 'react'
import { IResource } from '../../resources'
import { LabelMap } from '../../resources/utils'
import { IApplicationResource } from './model/application-resource'
import { getLabels } from './utils'

const useFetchApplicationLabels = (applicationData?: IResource[]) => {
  const [labelOptions, setLabelOptions] = useState<{ label: string; value: string }[]>()
  const [labelMap, setLabelMap] = useState<LabelMap>()
  const [storedApplicationData, setStoredApplicationData] = useState<IResource[]>()

  useEffect(() => {
    if (applicationData && applicationData.length !== storedApplicationData?.length) {
      const { labelMap, allLabels } = applicationData.reduce(
        (acc, resource) => {
          if (!resource || !resource.metadata) {
            return acc
          }

          const pairs = getLabels(resource)
          const labels = Object.entries(pairs).map(([key, value]) => `${key}=${value}`)

          labels.forEach((l) => acc.allLabels.add(l))

          const resourceId =
            (resource as IApplicationResource).id ||
            `${resource.metadata.namespace || 'default'}/${resource.metadata.name || 'unknown'}`
          acc.labelMap[resourceId] = { pairs, labels }
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
