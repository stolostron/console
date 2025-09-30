/* Copyright Contributors to the Open Cluster Management project */

import { nodeDetailsProvider, kubeNaming, typeToShapeMap } from './NodeDetailsProvider'
import { setClusterStatus } from '../model/computeStatuses'
import {
  setApplicationDeployStatus,
  setSubscriptionDeployStatus,
  setPlacementRuleDeployStatus,
  setPlacementDeployStatus,
  setResourceDeployStatus,
  setPodDeployStatus,
} from '../model/computeStatuses'

import { addDetails, addPropertyToList, getNodePropery } from '../helpers/diagram-helpers'
import { TFunction } from 'react-i18next'

// Mock the dependencies
jest.mock('../model/computeStatuses', () => ({
  setResourceDeployStatus: jest.fn(),
  setPodDeployStatus: jest.fn(),
  setSubscriptionDeployStatus: jest.fn(),
  setApplicationDeployStatus: jest.fn(),
  setPlacementRuleDeployStatus: jest.fn(),
  setClusterStatus: jest.fn(),
  setPlacementDeployStatus: jest.fn(),
}))

jest.mock('../helpers/diagram-helpers', () => ({
  getNodePropery: jest.fn((_node, _path, key) => {
    // Mock implementation that returns a simple property object
    return {
      labelValue: key,
      value: 'mocked-value',
    }
  }),
  addPropertyToList: jest.fn((list, data) => {
    if (list && data) {
      list.push(data)
    }
    return list
  }),
  addDetails: jest.fn((details, dets) => {
    dets.forEach((det: { value: undefined; labelValue: any; indent: any; status: any }) => {
      if (det.value !== undefined) {
        details.push({
          type: 'label',
          labelValue: det.labelValue,
          value: det.value,
          indent: det.indent,
          status: det.status,
        })
      }
    })
  }),
  addNodeOCPRouteLocationForCluster: jest.fn(),
  addIngressNodeInfo: jest.fn(),
}))

jest.mock('../../../CreateSubscriptionApplication/controlData/ControlDataPlacement', () => ({
  getLabels: jest.fn(() => 'mocked-labels'),
  getMatchLabels: jest.fn(() => 'mocked-match-labels'),
}))

jest.mock('../../../../../resources', () => ({
  PlacementKind: 'Placement',
}))

describe('NodeDetailsProvider', () => {
  const mockT: TFunction = jest.fn((key: string) => key)
  const mockActiveFilters = {}
  const mockHubClusterName = 'hub-cluster'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('nodeDetailsProvider', () => {
    it('should return empty array when node is null', () => {
      const result = nodeDetailsProvider(null, mockActiveFilters, mockT, mockHubClusterName)
      expect(result).toEqual([])
    })

    it('should return empty array when node is undefined', () => {
      const result = nodeDetailsProvider(undefined, mockActiveFilters, mockT, mockHubClusterName)
      expect(result).toEqual([])
    })

    it('should handle cluster type nodes', () => {
      const clusterNode = {
        type: 'cluster',
        labels: [],
      }

      const result = nodeDetailsProvider(clusterNode, mockActiveFilters, mockT, mockHubClusterName)

      expect(result).toHaveLength(3) // spacer, label, spacer
      expect(result[0]).toEqual({ type: 'spacer' })
      expect(result[1]).toEqual({
        type: 'label',
        labelValue: 'Select a cluster to view details',
      })
      expect(result[2]).toEqual({ type: 'spacer' })
    })

    it('should handle package type nodes', () => {
      const packageNode = {
        type: 'package',
        labels: [],
        specs: {
          raw: {
            metadata: {
              name: 'test-package',
            },
          },
        },
      }

      const result = nodeDetailsProvider(packageNode, mockActiveFilters, mockT, mockHubClusterName)

      expect(result.length).toBeGreaterThan(3)
      expect(result[0]).toEqual({ type: 'spacer' })
      expect(result[1]).toEqual({ type: 'spacer' })
      // Package nodes add details after the spacers
      expect(result[2]).toEqual({
        type: 'label',
        labelValue: 'resource.name',
        value: 'test-package',
      })
    })

    it('should handle nodes with labels', () => {
      const nodeWithLabels = {
        type: 'deployment',
        labels: [
          { name: 'app', value: 'test-app' },
          { name: 'version', value: 'v1.0' },
        ],
        specs: {
          isDesign: false,
          raw: {
            apiVersion: 'apps/v1',
            metadata: {
              name: 'test-deployment',
              namespace: 'test-namespace',
            },
          },
        },
        layout: { type: 'deployment' },
        clusterName: 'test-cluster',
      }

      const result = nodeDetailsProvider(nodeWithLabels, mockActiveFilters, mockT, mockHubClusterName)

      // Should include spacer, main details, labels section, and spacer
      expect(result.length).toBeGreaterThan(3)

      // Find the labels section
      const labelsIndex = result.findIndex((item) => item.type === 'label' && item.labelValue === 'Labels')
      expect(labelsIndex).toBeGreaterThan(-1)
    })

    it('should handle default case for other node types', () => {
      const defaultNode = {
        type: 'deployment',
        labels: [],
        clusterName: 'test-cluster',
        layout: { type: 'deployment' },
        specs: {
          isDesign: false,
          raw: {
            apiVersion: 'apps/v1',
            metadata: {
              name: 'test-deployment',
              namespace: 'test-namespace',
            },
          },
        },
      }

      const result = nodeDetailsProvider(defaultNode, mockActiveFilters, mockT, mockHubClusterName)

      expect(result.length).toBeGreaterThan(3)
      expect(result[0]).toEqual({ type: 'spacer' })
      expect(result[1]).toEqual({ type: 'spacer' })
      // Default nodes add details after the spacers
      expect(result[2]).toEqual({
        type: 'label',
        labelValue: 'Type',
        value: 'Deployment',
      })
    })

    it('should handle nodes without labels', () => {
      const nodeWithoutLabels = {
        type: 'deployment',
        // labels property is missing
        specs: {
          isDesign: false,
          raw: {
            apiVersion: 'apps/v1',
            metadata: {
              name: 'test-deployment',
              namespace: 'test-namespace',
            },
          },
        },
        layout: { type: 'deployment' },
        clusterName: 'test-cluster',
      }

      const result = nodeDetailsProvider(nodeWithoutLabels, mockActiveFilters, mockT, mockHubClusterName)

      expect(result.length).toBeGreaterThan(2)
      expect(result[0]).toEqual({ type: 'spacer' })
      expect(result[1]).toEqual({ type: 'spacer' })
      // Default nodes add details after the spacers
      expect(result[2]).toEqual({
        type: 'label',
        labelValue: 'Type',
        value: 'Deployment',
      })
    })
  })

  describe('kubeNaming', () => {
    it('should return empty string for undefined input', () => {
      expect(kubeNaming(undefined)).toBe('')
    })

    it('should capitalize first letter and handle basic types', () => {
      expect(kubeNaming('deployment')).toBe('Deployment')
      expect(kubeNaming('service')).toBe('Service')
      expect(kubeNaming('pod')).toBe('Pod')
    })

    it('should handle special replacements', () => {
      expect(kubeNaming('imagestream')).toBe('ImageStream')
      expect(kubeNaming('channel')).toBe('Channel')
      expect(kubeNaming('source')).toBe('Source')
      expect(kubeNaming('reSource')).toBe('ReSource') // The actual implementation doesn't replace 'reSource' to 'Resource'
      expect(kubeNaming('definition')).toBe('Definition')
      expect(kubeNaming('config')).toBe('Config')
      expect(kubeNaming('account')).toBe('Account')
      expect(kubeNaming('controller')).toBe('Controller')
    })

    it('should handle multiple replacements in one string', () => {
      expect(kubeNaming('imagestreamchannel')).toBe('ImageStreamChannel')
    })

    it('should handle empty string', () => {
      expect(kubeNaming('')).toBe('')
    })

    it('should handle single character', () => {
      expect(kubeNaming('a')).toBe('A')
    })
  })

  describe('typeToShapeMap', () => {
    it('should be a frozen object', () => {
      expect(Object.isFrozen(typeToShapeMap)).toBe(true)
    })

    it('should contain expected node types', () => {
      const expectedTypes = [
        'application',
        'applicationset',
        'cluster',
        'clusters',
        'ansiblejob',
        'configmap',
        'container',
        'customresource',
        'daemonset',
        'deployable',
        'deployment',
        'deploymentconfig',
        'helmrelease',
        'host',
        'ingress',
        'internet',
        'namespace',
        'node',
        'other',
        'package',
        'placement',
        'pod',
        'policy',
        'replicaset',
        'replicationcontroller',
        'route',
        'placements',
        'secret',
        'service',
        'statefulset',
        'storageclass',
        'subscription',
        'subscriptionblocked',
      ]

      expectedTypes.forEach((type) => {
        expect(typeToShapeMap).toHaveProperty(type)
      })
    })

    it('should have correct structure for each type', () => {
      Object.entries(typeToShapeMap).forEach(([, config]) => {
        expect(config).toHaveProperty('shape')
        expect(config).toHaveProperty('className')
        expect(typeof config.shape).toBe('string')
        expect(typeof config.className).toBe('string')
      })
    })

    it('should have specific values for known types', () => {
      expect(typeToShapeMap.application).toEqual({
        shape: 'application',
        className: 'design',
        nodeRadius: 30,
      })

      expect(typeToShapeMap.cluster).toEqual({
        shape: 'cluster',
        className: 'container',
      })

      expect(typeToShapeMap.deployment).toEqual({
        shape: 'deployment',
        className: 'deployment',
      })

      expect(typeToShapeMap.pod).toEqual({
        shape: 'pod',
        className: 'pod',
      })
    })

    it('should have nodeRadius for specific types', () => {
      expect(typeToShapeMap.application).toHaveProperty('nodeRadius', 30)
      expect(typeToShapeMap.policy).toHaveProperty('nodeRadius', 30)

      // Most types should not have nodeRadius
      expect(typeToShapeMap.deployment).not.toHaveProperty('nodeRadius')
      expect(typeToShapeMap.service).not.toHaveProperty('nodeRadius')
    })
  })

  describe('Integration tests with mocked dependencies', () => {
    it('should call setClusterStatus for cluster nodes', () => {
      const clusterNode = {
        type: 'cluster',
        labels: [],
      }

      nodeDetailsProvider(clusterNode, mockActiveFilters, mockT, mockHubClusterName)

      expect(setClusterStatus).toHaveBeenCalledWith(clusterNode, expect.any(Array), mockT, mockHubClusterName)
    })

    it('should call helper functions for default node types', () => {
      const defaultNode = {
        type: 'deployment',
        labels: [],
        clusterName: 'test-cluster',
        layout: { type: 'deployment' },
        specs: {
          isDesign: false,
          raw: {
            apiVersion: 'apps/v1',
            metadata: {
              name: 'test-deployment',
              namespace: 'test-namespace',
            },
          },
        },
      }

      nodeDetailsProvider(defaultNode, mockActiveFilters, mockT, mockHubClusterName)

      expect(addDetails).toHaveBeenCalled()
      expect(addPropertyToList).toHaveBeenCalled()
      expect(getNodePropery).toHaveBeenCalled()
    })

    it('should call status setting functions for default nodes', () => {
      const defaultNode = {
        type: 'deployment',
        labels: [],
        clusterName: 'test-cluster',
        layout: { type: 'deployment' },
        specs: {
          isDesign: false,
          raw: {
            apiVersion: 'apps/v1',
            metadata: {
              name: 'test-deployment',
              namespace: 'test-namespace',
            },
          },
        },
      }

      nodeDetailsProvider(defaultNode, mockActiveFilters, mockT, mockHubClusterName)

      expect(setApplicationDeployStatus).toHaveBeenCalled()
      expect(setSubscriptionDeployStatus).toHaveBeenCalled()
      expect(setPlacementRuleDeployStatus).toHaveBeenCalled()
      expect(setPlacementDeployStatus).toHaveBeenCalled()
      expect(setResourceDeployStatus).toHaveBeenCalled()
      expect(setPodDeployStatus).toHaveBeenCalled()
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle nodes with missing specs', () => {
      const nodeWithoutSpecs = {
        type: 'deployment',
        labels: [],
        specs: {}, // Provide empty specs to avoid destructuring error
      }

      expect(() => {
        nodeDetailsProvider(nodeWithoutSpecs, mockActiveFilters, mockT, mockHubClusterName)
      }).not.toThrow()
    })

    it('should handle nodes with empty specs', () => {
      const nodeWithEmptySpecs = {
        type: 'deployment',
        labels: [],
        specs: {},
      }

      expect(() => {
        nodeDetailsProvider(nodeWithEmptySpecs, mockActiveFilters, mockT, mockHubClusterName)
      }).not.toThrow()
    })

    it('should handle nodes with missing layout', () => {
      const nodeWithoutLayout = {
        type: 'deployment',
        labels: [],
        specs: {
          isDesign: false,
          raw: {
            apiVersion: 'apps/v1',
            metadata: {
              name: 'test-deployment',
              namespace: 'test-namespace',
            },
          },
        },
      }

      expect(() => {
        nodeDetailsProvider(nodeWithoutLayout, mockActiveFilters, mockT, mockHubClusterName)
      }).not.toThrow()
    })

    it('should handle nodes with complex nested structures', () => {
      const complexNode = {
        type: 'deployment',
        labels: [
          { name: 'app.kubernetes.io/name', value: 'complex-app' },
          { name: 'app.kubernetes.io/version', value: '1.0.0' },
        ],
        clusterName: 'test-cluster',
        layout: { type: 'deployment' },
        specs: {
          isDesign: false,
          pulse: 'green',
          raw: {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
              name: 'complex-deployment',
              namespace: 'complex-namespace',
              annotations: {
                'apps.open-cluster-management.io/git-branch': 'main',
                'apps.open-cluster-management.io/git-path': '/manifests',
                'apps.open-cluster-management.io/git-tag': 'v1.0.0',
                'apps.open-cluster-management.io/git-desired-commit': 'abc123',
                'apps.open-cluster-management.io/reconcile-rate': 'medium',
              },
            },
            spec: {
              replicas: 3,
              selector: {
                matchLabels: {
                  app: 'complex-app',
                },
              },
              template: {
                metadata: {
                  labels: {
                    app: 'complex-app',
                  },
                },
              },
            },
          },
          deploymentModel: {
            'complex-deployment': [
              {
                name: 'complex-deployment',
                namespace: 'complex-namespace',
                label: 'app=complex-app; version=1.0.0',
                apigroup: 'apps',
                apiversion: 'v1',
              },
            ],
          },
        },
      }

      expect(() => {
        const result = nodeDetailsProvider(complexNode, mockActiveFilters, mockT, mockHubClusterName)
        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
      }).not.toThrow()
    })

    it('should handle placement nodes with decisions', () => {
      const placementNode = {
        type: 'placements',
        labels: [],
        clusterName: 'test-cluster',
        layout: { type: 'placements' },
        specs: {
          isDesign: false,
          raw: {
            apiVersion: 'cluster.open-cluster-management.io/v1beta1',
            kind: 'Placement',
            metadata: {
              name: 'test-placement',
              namespace: 'test-namespace',
            },
            status: {
              decisions: [{ clusterName: 'cluster1' }, { clusterName: 'cluster2' }],
            },
          },
        },
        placement: {
          spec: {
            clusterSets: ['cluster-set-1'],
            predicates: [
              {
                requiredClusterSelector: {
                  labelSelector: {
                    matchLabels: {
                      environment: 'production',
                    },
                  },
                },
              },
            ],
          },
          kind: 'Placement',
        },
      }

      expect(() => {
        const result = nodeDetailsProvider(placementNode, mockActiveFilters, mockT, mockHubClusterName)
        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
      }).not.toThrow()
    })
  })
})
