/* Copyright Contributors to the Open Cluster Management project */

import { nodeDetailsProvider, kubeNaming, typeToShapeMap } from './NodeDetailsProvider'
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

      expect(result).toHaveLength(5) // spacer, label, spacer
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
})
