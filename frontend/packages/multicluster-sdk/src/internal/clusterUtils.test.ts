/* Copyright Contributors to the Open Cluster Management project */
import { checkForCondition, isClusterAvailable, filterClusters } from './clusterUtils'

describe('clusterUtils', () => {
  describe('checkForCondition', () => {
    it('should return true when condition exists with default status "True"', () => {
      const conditions = [
        { type: 'TestCondition', status: 'True' },
        { type: 'OtherCondition', status: 'False' },
      ]
      expect(checkForCondition('TestCondition', conditions)).toBe(true)
    })

    it('should return false when condition exists with different status', () => {
      const conditions = [
        { type: 'TestCondition', status: 'False' },
        { type: 'OtherCondition', status: 'True' },
      ]
      expect(checkForCondition('TestCondition', conditions)).toBe(false)
    })

    it('should return true when condition exists with custom status', () => {
      const conditions = [
        { type: 'TestCondition', status: 'Custom' },
        { type: 'OtherCondition', status: 'True' },
      ]
      expect(checkForCondition('TestCondition', conditions, 'Custom')).toBe(true)
    })

    it('should return false when condition does not exist', () => {
      const conditions = [{ type: 'OtherCondition', status: 'True' }]
      expect(checkForCondition('TestCondition', conditions)).toBe(false)
    })

    it('should handle empty conditions array', () => {
      expect(checkForCondition('TestCondition', [])).toBe(false)
    })

    it('should handle undefined conditions', () => {
      expect(checkForCondition('TestCondition', undefined as any)).toBe(false)
    })
  })

  describe('isClusterAvailable', () => {
    it('should return true for cluster with proxy label and available condition', () => {
      const cluster = {
        metadata: {
          name: 'test-cluster',
          labels: {
            'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
          },
        },
        status: {
          conditions: [
            {
              type: 'ManagedClusterConditionAvailable',
              status: 'True',
            },
          ],
        },
      }
      expect(isClusterAvailable(cluster)).toBe(true)
    })

    it('should return false for cluster without proxy label', () => {
      const cluster = {
        metadata: {
          name: 'test-cluster',
          labels: {},
        },
        status: {
          conditions: [
            {
              type: 'ManagedClusterConditionAvailable',
              status: 'True',
            },
          ],
        },
      }
      expect(isClusterAvailable(cluster)).toBe(false)
    })

    it('should return false for cluster with wrong proxy label value', () => {
      const cluster = {
        metadata: {
          name: 'test-cluster',
          labels: {
            'feature.open-cluster-management.io/addon-cluster-proxy': 'unavailable',
          },
        },
        status: {
          conditions: [
            {
              type: 'ManagedClusterConditionAvailable',
              status: 'True',
            },
          ],
        },
      }
      expect(isClusterAvailable(cluster)).toBe(false)
    })

    it('should return false for cluster without available condition', () => {
      const cluster = {
        metadata: {
          name: 'test-cluster',
          labels: {
            'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
          },
        },
        status: {
          conditions: [
            {
              type: 'ManagedClusterConditionAvailable',
              status: 'False',
            },
          ],
        },
      }
      expect(isClusterAvailable(cluster)).toBe(false)
    })

    it('should return false for cluster without conditions', () => {
      const cluster = {
        metadata: {
          name: 'test-cluster',
          labels: {
            'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
          },
        },
        status: {
          conditions: [],
        },
      }
      expect(isClusterAvailable(cluster)).toBe(false)
    })

    it('should return false for cluster without status', () => {
      const cluster = {
        metadata: {
          name: 'test-cluster',
          labels: {
            'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
          },
        },
      }
      expect(isClusterAvailable(cluster)).toBe(false)
    })
  })

  describe('filterClusters', () => {
    const availableCluster = {
      metadata: {
        name: 'available-cluster',
        labels: {
          'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
        },
      },
      status: {
        conditions: [
          {
            type: 'ManagedClusterConditionAvailable',
            status: 'True',
          },
        ],
      },
    }

    const unavailableCluster = {
      metadata: {
        name: 'unavailable-cluster',
        labels: {
          'feature.open-cluster-management.io/addon-cluster-proxy': 'unavailable',
        },
      },
      status: {
        conditions: [
          {
            type: 'ManagedClusterConditionAvailable',
            status: 'False',
          },
        ],
      },
    }

    const clusterWithoutName = {
      metadata: {
        labels: {
          'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
        },
      },
      status: {
        conditions: [
          {
            type: 'ManagedClusterConditionAvailable',
            status: 'True',
          },
        ],
      },
    }

    const clusterWithoutMetadata = {}

    it('should return only available clusters when includeAll is false', () => {
      const clusters = [availableCluster, unavailableCluster, clusterWithoutName, clusterWithoutMetadata]
      const result = filterClusters(clusters, false)
      expect(result).toEqual([availableCluster])
    })

    it('should return all clusters with names when includeAll is true', () => {
      const clusters = [availableCluster, unavailableCluster, clusterWithoutName, clusterWithoutMetadata]
      const result = filterClusters(clusters, true)
      expect(result).toEqual([availableCluster, unavailableCluster])
    })

    it('should handle empty clusters array', () => {
      expect(filterClusters([], false)).toEqual([])
      expect(filterClusters([], true)).toEqual([])
    })

    it('should filter out clusters without metadata', () => {
      const clusters = [clusterWithoutMetadata, availableCluster]
      const result = filterClusters(clusters, true)
      expect(result).toEqual([availableCluster])
    })

    it('should filter out clusters without name', () => {
      const clusters = [clusterWithoutName, availableCluster]
      const result = filterClusters(clusters, true)
      expect(result).toEqual([availableCluster])
    })
  })
})
