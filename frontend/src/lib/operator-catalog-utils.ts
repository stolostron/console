/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { useClusterVersion } from '../hooks/use-cluster-version'

export const isVersionAtLeast = (version: string | undefined, compareVersion: string): boolean => {
  if (!version) return false

  const parseVersion = (v: string) => {
    const parts = v.split('.').map((part) => parseInt(part, 10))
    return { major: parts[0] || 0, minor: parts[1] || 0 }
  }

  const current = parseVersion(version)
  const target = parseVersion(compareVersion)

  return current.major !== target.major ? current.major > target.major : current.minor >= target.minor
}

export const getOperatorCatalogBasePath = (ocpVersion: string | undefined): string =>
  isVersionAtLeast(ocpVersion, '4.20') ? '/catalog' : '/operatorhub'

export const getOperatorCatalogDisplayName = (ocpVersion: string | undefined): string =>
  isVersionAtLeast(ocpVersion, '4.20') ? 'Software Catalog' : 'OperatorHub'

export const buildCatalogSearchUrl = (ocpVersion: string | undefined, namespace: string, keyword: string): string => {
  const basePath = getOperatorCatalogBasePath(ocpVersion)
  return `${basePath}/ns/${namespace}?keyword=${encodeURIComponent(keyword)}`
}

export const buildCatalogCategoryUrl = (
  ocpVersion: string | undefined,
  namespace: string,
  category: string
): string => {
  const basePath = getOperatorCatalogBasePath(ocpVersion)
  return `${basePath}/ns/${namespace}?category=${category}`
}

export const buildCatalogDetailsUrl = (
  ocpVersion: string | undefined,
  namespace: string,
  operatorId: string
): string => {
  const basePath = getOperatorCatalogBasePath(ocpVersion)
  const paramName = isVersionAtLeast(ocpVersion, '4.20') ? 'selectedId' : 'details-item'
  return `${basePath}/${namespace}?${paramName}=${operatorId}`
}

export const useOperatorCatalog = () => {
  const { version, isLoading } = useClusterVersion()

  return useMemo(() => {
    const buildSearchUrl = (namespace: string, keyword: string) => buildCatalogSearchUrl(version, namespace, keyword)

    const buildCategoryUrl = (namespace: string, category: string) =>
      buildCatalogCategoryUrl(version, namespace, category)

    const buildDetailsUrl = (namespace: string, operatorId: string) =>
      buildCatalogDetailsUrl(version, namespace, operatorId)

    return {
      basePath: getOperatorCatalogBasePath(version),
      displayName: getOperatorCatalogDisplayName(version),
      buildSearchUrl,
      buildCategoryUrl,
      buildDetailsUrl,
      isLoading,
      version,
    }
  }, [version, isLoading])
}
