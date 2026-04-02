/* Copyright Contributors to the Open Cluster Management project */
import {
  buildCatalogCategoryUrl,
  buildCatalogDetailsUrl,
  buildCatalogSearchUrl,
  getOperatorCatalogBasePath,
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

    it('should return true for undefined version', () => {
      expect(isVersionAtLeast(undefined, '4.20')).toBe(true)
    })

    it('should handle exact version matches', () => {
      expect(isVersionAtLeast('4.20', '4.20')).toBe(true)
      expect(isVersionAtLeast('4.20.0', '4.20.0')).toBe(true)
    })

    it('should compare patch versions correctly', () => {
      expect(isVersionAtLeast('4.20.0', '4.20.1')).toBe(false)
      expect(isVersionAtLeast('4.20.1', '4.20.0')).toBe(true)
    })

    it('should handle a leading v prefix', () => {
      expect(isVersionAtLeast('v4.20.1', '4.20.0')).toBe(true)
      expect(isVersionAtLeast('v4.19.9', '4.20.0')).toBe(false)
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

    it('should return /catalog for undefined version', () => {
      expect(getOperatorCatalogBasePath(undefined)).toBe('/catalog')
    })
  })

  describe('buildCatalogSearchUrl', () => {
    it('should build correct URL for OCP 4.20+', () => {
      expect(buildCatalogSearchUrl('4.20.0', 'test operator')).toBe('/catalog/all-namespaces?keyword=test%20operator')
    })

    it('should build correct URL for OCP 4.19', () => {
      expect(buildCatalogSearchUrl('4.19.0', 'test operator')).toBe(
        '/operatorhub/all-namespaces?keyword=test%20operator'
      )
    })

    it('should properly encode special characters in keyword', () => {
      expect(buildCatalogSearchUrl('4.20.0', 'test & special')).toBe(
        '/catalog/all-namespaces?keyword=test%20%26%20special'
      )
    })
  })

  describe('buildCatalogCategoryUrl', () => {
    it('should build correct URL for OCP 4.20+ with category', () => {
      expect(buildCatalogCategoryUrl('4.20.0', 'storage')).toBe('/catalog/ns/default?category=storage')
    })

    it('should build correct URL for OCP 4.19 with category', () => {
      expect(buildCatalogCategoryUrl('4.19.0', 'storage', 'multicluster-engine')).toBe(
        '/operatorhub/ns/multicluster-engine?category=storage'
      )
    })

    it('should encode special characters in category for OCP 4.20+', () => {
      expect(buildCatalogCategoryUrl('4.20.0', 'storage & data')).toBe(
        '/catalog/ns/default?category=storage%20%26%20data'
      )
    })

    it('should encode special characters in category for OCP 4.19', () => {
      expect(buildCatalogCategoryUrl('4.19.0', 'storage & data', 'multicluster-engine')).toBe(
        '/operatorhub/ns/multicluster-engine?category=storage%20%26%20data'
      )
    })

    it('should use default namespace when no namespace is provided', () => {
      expect(buildCatalogCategoryUrl('4.20.0', 'storage')).toBe('/catalog/ns/default?category=storage')
      expect(buildCatalogCategoryUrl('4.19.0', 'Storage')).toBe('/operatorhub/ns/default?category=Storage')
    })
  })

  describe('buildCatalogDetailsUrl', () => {
    it('should use selectedId parameter for OCP 4.20+', () => {
      const url = buildCatalogDetailsUrl('4.20.0', 'advanced-cluster-management-redhat-operators-openshift-marketplace')
      expect(url).toBe(
        '/catalog/all-namespaces?selectedId=advanced-cluster-management-redhat-operators-openshift-marketplace'
      )
    })

    it('should use details-item parameter for OCP 4.19', () => {
      const url = buildCatalogDetailsUrl('4.19.0', 'advanced-cluster-management-redhat-operators-openshift-marketplace')
      expect(url).toBe(
        '/operatorhub/all-namespaces?details-item=advanced-cluster-management-redhat-operators-openshift-marketplace'
      )
    })

    it('should handle undefined version by using catalog path', () => {
      const url = buildCatalogDetailsUrl(
        undefined,
        'advanced-cluster-management-redhat-operators-openshift-marketplace'
      )
      expect(url).toBe(
        '/catalog/all-namespaces?selectedId=advanced-cluster-management-redhat-operators-openshift-marketplace'
      )
    })

    it('should encode special characters in operator id', () => {
      const url = buildCatalogDetailsUrl('4.20.0', 'test operator&id=1')
      expect(url).toBe('/catalog/all-namespaces?selectedId=test%20operator%26id%3D1')
    })
  })
})
