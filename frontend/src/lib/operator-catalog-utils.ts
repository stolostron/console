/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { useClusterVersion } from '../hooks/use-cluster-version'

export const isVersionAtLeast = (version: string | undefined, compareVersion: string): boolean => {
  if (!version) return true

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

export const buildCatalogSearchUrl = (ocpVersion: string | undefined, keyword: string): string => {
  const basePath = getOperatorCatalogBasePath(ocpVersion)
  return `${basePath}/all-namespaces?keyword=${encodeURIComponent(keyword)}`
}

export const buildCatalogCategoryUrl = (
  ocpVersion: string | undefined,
  category: string,
  namespace: string = 'default'
): string => {
  const basePath = getOperatorCatalogBasePath(ocpVersion)
  const categoryName = isVersionAtLeast(ocpVersion, '4.20') ? category.toLowerCase() : category
  return `${basePath}/ns/${namespace}?category=${encodeURIComponent(categoryName)}`
}

export const buildCatalogDetailsUrl = (ocpVersion: string | undefined, operatorId: string): string => {
  const basePath = getOperatorCatalogBasePath(ocpVersion)
  const paramName = isVersionAtLeast(ocpVersion, '4.20') ? 'selectedId' : 'details-item'
  return `${basePath}/all-namespaces?${paramName}=${encodeURIComponent(operatorId)}`
}

export const useOperatorCatalog = () => {
  const { version, isLoading } = useClusterVersion()

  return useMemo(() => {
    const buildSearchUrl = (keyword: string) => buildCatalogSearchUrl(version, keyword)

    const buildCategoryUrl = (category: string, namespace?: string) =>
      buildCatalogCategoryUrl(version, category, namespace)

    const buildDetailsUrl = (operatorId: string) => buildCatalogDetailsUrl(version, operatorId)

    return {
      buildSearchUrl,
      buildCategoryUrl,
      buildDetailsUrl,
      isLoading,
    }
  }, [version, isLoading])
}
