/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { useClusterVersion } from '../hooks/use-cluster-version'

export const isVersionAtLeast = (version: string | undefined, compareVersion: string): boolean => {
  if (!version) return false

  const parsePart = (part?: string) => {
    const value = Number.parseInt((part ?? '0').replace(/\D.*$/, ''), 10)
    return Number.isFinite(value) ? value : 0
  }

  const parseVersion = (v: string) => {
    const [major, minor, patch] = v.replace(/^v/i, '').split('.')
    return { major: parsePart(major), minor: parsePart(minor), patch: parsePart(patch) }
  }

  const current = parseVersion(version)
  const target = parseVersion(compareVersion)

  if (current.major !== target.major) return current.major > target.major
  if (current.minor !== target.minor) return current.minor > target.minor
  return current.patch >= target.patch
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
  return `${basePath}/ns/${encodeURIComponent(namespace)}?category=${encodeURIComponent(category)}`
}

export const buildCatalogDetailsUrl = (
  ocpVersion: string | undefined,
  namespace: string,
  operatorId: string
): string => {
  const basePath = getOperatorCatalogBasePath(ocpVersion)
  const paramName = isVersionAtLeast(ocpVersion, '4.20') ? 'selectedId' : 'details-item'
  return `${basePath}/${encodeURIComponent(namespace)}?${paramName}=${encodeURIComponent(operatorId)}`
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
