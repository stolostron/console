/* Copyright Contributors to the Open Cluster Management project */

import { listProjects } from '../resources'
import { TFunction } from 'react-i18next'

export function getControlByID(controlData: { id: string }[], id: string): any | undefined {
  return controlData.find(({ id: identifier }) => identifier === id)
}
export const loadExistingNamespaces = (t: TFunction) => {
  return {
    query: () => {
      return new Promise(async (resolve, reject) => {
        try {
          const namespaces = await listProjects().promise
          resolve(namespaces)
        } catch (err) {
          reject(err)
        }
      })
    },
    loadingDesc: t('Loading namespaces...'),
    setAvailable: setAvailableNSSpecs.bind(null),
  }
}

export const setAvailableNSSpecs = (control: any, result: any) => {
  const { loading } = result
  const { data } = result
  control.isLoading = false
  const error = data ? null : result.error
  if (!control.available) {
    control.available = []
    control.availableMap = {}
  }
  if (control.available.length === 0 && (error || data)) {
    if (error) {
      control.isFailed = true
    } else if (data) {
      control.isLoaded = true
      control.available = data.map((d: any) => d.metadata.name)
      control.available.sort()
    }
  } else {
    control.isLoading = loading
  }
}
