/* Copyright Contributors to the Open Cluster Management project */
import {
  buildCatalogCategoryUrl,
  buildCatalogDetailsUrl,
  buildCatalogSearchUrl,
  getOperatorCatalogBasePath,
  getOperatorCatalogDisplayName,
  isVersionAtLeast,
} from './operator-catalog-utils'

describe('operator-catalog-utils', () => {
  describe('isVersionAtLeast', () => {
    it('should return true for versions greater than or equal to target', () => {
      expect(isVersionAtLeast('4.20.0', '4.20')).toBe(true)
      expect(isVersionAtLeast('4.21.0', '4.20')).toBe(true)
      expect(isVersionAtLeast('4.20.1', '4.20.0')).toBe(true)
      expect(isVersionAtLeast('5.0.0', '4.20')).toBe(true)
    })

    it('should return false for versions less than target', () => {
      expect(isVersionAtLeast('4.19.0', '4.20')).toBe(false)
      expect(isVersionAtLeast('4.19.5', '4.20.0')).toBe(false)
      expect(isVersionAtLeast('3.11.0', '4.20')).toBe(false)
    })

    it('should return false for undefined version (safe fallback)', () => {
      expect(isVersionAtLeast(undefined, '4.20')).toBe(false)
    })

    it('should handle exact version matches', () => {
      expect(isVersionAtLeast('4.20', '4.20')).toBe(true)
      expect(isVersionAtLeast('4.20.0', '4.20.0')).toBe(true)
    })
  })

  describe('getOperatorCatalogBasePath', () => {
    it('should return /catalog for OCP 4.20+', () => {
      expect(getOperatorCatalogBasePath('4.20.0')).toBe('/catalog')
      expect(getOperatorCatalogBasePath('4.21.0')).toBe('/catalog')
      expect(getOperatorCatalogBasePath('5.0.0')).toBe('/catalog')
    })

    it('should return /operatorhub for OCP 4.19 and below', () => {
      expect(getOperatorCatalogBasePath('4.19.0')).toBe('/operatorhub')
      expect(getOperatorCatalogBasePath('4.18.0')).toBe('/operatorhub')
      expect(getOperatorCatalogBasePath('4.15.0')).toBe('/operatorhub')
    })

    it('should return /operatorhub for undefined version', () => {
      expect(getOperatorCatalogBasePath(undefined)).toBe('/operatorhub')
    })
  })

  describe('getOperatorCatalogDisplayName', () => {
    it('should return "Software Catalog" for OCP 4.20+', () => {
      expect(getOperatorCatalogDisplayName('4.20.0')).toBe('Software Catalog')
      expect(getOperatorCatalogDisplayName('4.21.0')).toBe('Software Catalog')
    })

    it('should return "OperatorHub" for OCP 4.19 and below', () => {
      expect(getOperatorCatalogDisplayName('4.19.0')).toBe('OperatorHub')
      expect(getOperatorCatalogDisplayName('4.18.0')).toBe('OperatorHub')
    })

    it('should return "OperatorHub" for undefined version', () => {
      expect(getOperatorCatalogDisplayName(undefined)).toBe('OperatorHub')
    })
  })

  describe('buildCatalogSearchUrl', () => {
    it('should build correct URL for OCP 4.20+', () => {
      expect(buildCatalogSearchUrl('4.20.0', 'default', 'test operator')).toBe(
        '/catalog/ns/default?keyword=test%20operator'
      )
    })

    it('should build correct URL for OCP 4.19', () => {
      expect(buildCatalogSearchUrl('4.19.0', 'default', 'test operator')).toBe(
        '/operatorhub/ns/default?keyword=test%20operator'
      )
    })

    it('should properly encode special characters in keyword', () => {
      expect(buildCatalogSearchUrl('4.20.0', 'default', 'test & special')).toBe(
        '/catalog/ns/default?keyword=test%20%26%20special'
      )
    })
  })

  describe('buildCatalogCategoryUrl', () => {
    it('should build correct URL for OCP 4.20+ with category', () => {
      expect(buildCatalogCategoryUrl('4.20.0', 'multicluster-engine', 'storage')).toBe(
        '/catalog/ns/multicluster-engine?category=storage'
      )
    })

    it('should build correct URL for OCP 4.19 with category', () => {
      expect(buildCatalogCategoryUrl('4.19.0', 'multicluster-engine', 'storage')).toBe(
        '/operatorhub/ns/multicluster-engine?category=storage'
      )
    })
  })

  describe('buildCatalogDetailsUrl', () => {
    it('should use selectedId parameter for OCP 4.20+', () => {
      const url = buildCatalogDetailsUrl(
        '4.20.0',
        'all-namespaces',
        'advanced-cluster-management-redhat-operators-openshift-marketplace'
      )
      expect(url).toBe(
        '/catalog/all-namespaces?selectedId=advanced-cluster-management-redhat-operators-openshift-marketplace'
      )
    })

    it('should use details-item parameter for OCP 4.19', () => {
      const url = buildCatalogDetailsUrl(
        '4.19.0',
        'all-namespaces',
        'advanced-cluster-management-redhat-operators-openshift-marketplace'
      )
      expect(url).toBe(
        '/operatorhub/all-namespaces?details-item=advanced-cluster-management-redhat-operators-openshift-marketplace'
      )
    })

    it('should handle undefined version by using operatorhub path', () => {
      const url = buildCatalogDetailsUrl(
        undefined,
        'all-namespaces',
        'advanced-cluster-management-redhat-operators-openshift-marketplace'
      )
      expect(url).toBe(
        '/operatorhub/all-namespaces?details-item=advanced-cluster-management-redhat-operators-openshift-marketplace'
      )
    })
  })
})
