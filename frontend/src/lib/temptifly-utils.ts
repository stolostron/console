/* Copyright Contributors to the Open Cluster Management project */

import { listManagedClusters, listProjects } from '../resources'
import { TFunction } from 'react-i18next'

export function getControlByID(controlData: { id: string }[], id: string): any | undefined {
  return controlData.find(({ id: identifier }) => identifier === id)
}
export const loadExistingNamespaces = (t: TFunction) => {
  return {
    query: () => {
      return new Promise((resolve, reject) => {
        listProjects().promise.then(resolve).catch(reject)
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

export const loadHostedClusterNamespaces = (t: TFunction) => {
  let isFetching = false

  return {
    query: () => {
      if (isFetching) return Promise.resolve({ data: [] }) // Prevent multiple calls
      isFetching = true

      return Promise.all([listProjects().promise, listManagedClusters().promise])
        .then(([projects, managedClusters]) => {
          console.log(managedClusters)
          isFetching = false

          const projectNamespaces = Array.isArray(projects) ? projects.map((project) => project.metadata.name) : []
          const managedClusterNamespaces = Array.isArray(managedClusters)
            ? managedClusters.map((cluster) => cluster.metadata?.name)
            : []

          if (!Array.isArray(managedClusterNamespaces)) {
            return { data: [] }
          }

          const filteredNamespaces = projectNamespaces.filter((namespace: string | undefined) => {
            return namespace && !managedClusterNamespaces.includes(namespace)
          })

          console.log('Project Namespaces:', projectNamespaces)
          console.log('Managed Cluster Namespaces:', managedClusterNamespaces)
          console.log('Filtered Namespaces:', filteredNamespaces)

          return { data: filteredNamespaces }
        })
        .catch((error) => {
          isFetching = false
          console.error('Error fetching namespaces:', error)
          return { data: [] } // Return an empty array on error
        })
    },
    loadingDesc: t('Loading namespaces...'),
    setAvailable: setAvailableHostedClusterNamespaces,
  }
}

export const setAvailableHostedClusterNamespaces = (control: any, result: any) => {
  const { data } = result
  control.isLoading = false

  if (!control.available) {
    control.available = []
  }

  if (data?.data && Array.isArray(data?.data)) {
    const namespaces = data.data
    if (namespaces.length === 0) {
      console.warn('No namespaces found.')
    }
    control.isLoaded = true
    control.available = namespaces
      .filter((namespace: string | undefined) => {
        return namespace && !control.available.includes(namespace)
      })
      .sort((a: string, b: string) => a.localeCompare(b))
    console.log('Dropdown options:', control.available)
  } else {
    control.isFailed = true
    console.error('Expected an array for namespaces, received:', data)
  }
}
