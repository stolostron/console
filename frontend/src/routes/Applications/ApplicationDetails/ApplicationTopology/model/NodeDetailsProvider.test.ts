/* Copyright Contributors to the Open Cluster Management project */

import { nodeDetailsProvider, kubeNaming, typeToShapeMap } from './NodeDetailsProvider'
import {
  setApplicationDeployStatus,
  setClusterStatus,
  setPlacementDeployStatus,
  setPlacementRuleDeployStatus,
  setPodDeployStatus,
  setResourceDeployStatus,
  setSubscriptionDeployStatus,
} from './NodeDetailsProviderStatuses'
import { TFunction } from 'react-i18next'

// Mock the dependencies (NodeDetailsProvider imports status helpers from NodeDetailsProviderStatuses)
jest.mock('./NodeDetailsProviderStatuses', () => ({
  setResourceDeployStatus: jest.fn(),
  setPodDeployStatus: jest.fn(),
  setSubscriptionDeployStatus: jest.fn(),
  setApplicationDeployStatus: jest.fn(),
  setPlacementRuleDeployStatus: jest.fn(),
  setClusterStatus: jest.fn(),
  setPlacementDeployStatus: jest.fn(),
}))

jest.mock('../helpers/diagram-helpers', () => {
  const actual = jest.requireActual('../helpers/diagram-helpers') as typeof import('../helpers/diagram-helpers')
  return {
    ...actual,
    addNodeOCPRouteLocationForCluster: jest.fn(),
    addIngressNodeInfo: jest.fn(),
  }
})

const mockGetLabels = jest.fn((...args: unknown[]) => (void args, 'mocked-labels'))
const mockGetMatchLabels = jest.fn((...args: unknown[]) => (void args, 'mocked-match-labels'))

jest.mock('../../../CreateSubscriptionApplication/controlData/ControlDataPlacement', () => ({
  getLabels: (...args: unknown[]) => mockGetLabels(...args),
  getMatchLabels: (...args: unknown[]) => mockGetMatchLabels(...args),
}))

jest.mock('../../../../../resources', () => ({
  PlacementKind: 'Placement',
}))

describe('NodeDetailsProvider', () => {
  const mockT: TFunction = jest.fn((key: string) => key)
  const mockActiveFilters = {}
  const mockHubClusterName = 'hub-cluster'

  /** Rows from getNodePropery/addPropertyToList omit `type: 'label'`; rows from addDetails include it. */
  const detail = (result: unknown[], labelValue: string, value?: unknown) =>
    result.some((d) => {
      const row = d as { labelValue?: string; value?: unknown }
      return row.labelValue === labelValue && (value === undefined || row.value === value)
    })

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

      expect(result).toHaveLength(3) // spacer, label, spacer (setClusterStatus is mocked)
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

    it('should call setClusterStatus for cluster type nodes', () => {
      const clusterNode = { type: 'cluster', labels: [] }
      nodeDetailsProvider(clusterNode, mockActiveFilters, mockT, mockHubClusterName)
      expect(setClusterStatus).toHaveBeenCalledWith(clusterNode, expect.any(Array), mockT, mockHubClusterName)
    })

    it('should render git ApplicationSet source rows, sync policy (automated + sync options), and labels', () => {
      const gitNode = {
        type: 'git',
        labels: [{ name: 'env', value: 'prod' }],
        specs: {
          resources: [
            {
              repoURL: 'https://git.example/repo',
              chart: ' my-chart ',
              path: ' charts/app ',
              targetRevision: ' 1.0 ',
            },
            { repoURL: 'https://minimal.example' },
          ],
          raw: {
            spec: {
              template: {
                spec: {
                  syncPolicy: {
                    automated: { enabled: false, selfHeal: true, prune: true, allowEmpty: false },
                    syncOptions: ['ServerSideApply=true', 'CreateNamespace', 'PlainKey'],
                  },
                },
              },
            },
          },
        },
      }

      const result = nodeDetailsProvider(gitNode, mockActiveFilters, mockT, mockHubClusterName)

      expect(detail(result, 'Repository', 'https://git.example/repo')).toBe(true)
      expect(detail(result, 'Chart name', ' my-chart ')).toBe(true)
      expect(detail(result, 'Path', ' charts/app ')).toBe(true)
      expect(detail(result, 'Revision', ' 1.0 ')).toBe(true)
      expect(detail(result, 'Enabled', 'false')).toBe(true)
      expect(detail(result, 'Self-heal', 'true')).toBe(true)
      expect(detail(result, 'Prune', 'true')).toBe(true)
      expect(detail(result, 'ServerSideApply', 'true')).toBe(true)
      expect(detail(result, 'CreateNamespace', '')).toBe(true)
      expect(detail(result, 'PlainKey', '')).toBe(true)
      expect(
        result.some(
          (d) => (d as { type?: string }).type === 'label' && (d as { labelValue?: string }).labelValue === 'Labels'
        )
      ).toBe(true)
      expect(result.some((d) => (d as { value?: string }).value === 'env = prod')).toBe(true)
    })

    it('should treat chart nodes like git for ApplicationSet sources', () => {
      const chartNode = {
        type: 'chart',
        labels: [],
        specs: {
          resources: [{ repoURL: 'oci://quay.io/chart' }],
          raw: { spec: { template: { spec: {} } } },
        },
      }
      const result = nodeDetailsProvider(chartNode, mockActiveFilters, mockT, mockHubClusterName)
      expect(detail(result, 'Repository', 'oci://quay.io/chart')).toBe(true)
    })

    it('should not iterate specs.resources when it is not an array', () => {
      const gitNode = {
        type: 'git',
        labels: [],
        specs: { resources: { not: 'array' } as unknown as unknown[] },
      }
      const result = nodeDetailsProvider(gitNode, mockActiveFilters, mockT, mockHubClusterName)
      expect(result.filter((d) => (d as { labelValue?: string }).labelValue === 'Repository')).toHaveLength(0)
    })

    it('should render legacy automated fields on template syncPolicy when automated is null', () => {
      const gitNode = {
        type: 'git',
        labels: [],
        specs: {
          resources: [{ repoURL: 'https://example.com' }],
          raw: {
            spec: {
              template: {
                spec: {
                  syncPolicy: {
                    automated: null,
                    prune: true,
                    selfHeal: false,
                    allowEmpty: true,
                    syncOptions: ['RespectIgnoreDifferences=true'],
                  },
                },
              },
            },
          },
        },
      }
      const result = nodeDetailsProvider(gitNode, mockActiveFilters, mockT, mockHubClusterName)
      expect(result.filter((d) => (d as { labelValue?: string }).labelValue === 'Prune').length).toBeGreaterThanOrEqual(
        1
      )
      expect(detail(result, 'Allow empty', 'true')).toBe(true)
      expect(detail(result, 'RespectIgnoreDifferences', 'true')).toBe(true)
    })

    it('should render sync options alone when automated and legacy fields are absent', () => {
      const gitNode = {
        type: 'git',
        labels: [],
        specs: {
          resources: [{ repoURL: 'https://example.com' }],
          raw: {
            spec: {
              template: {
                spec: {
                  syncPolicy: {
                    syncOptions: ['OptionOnly'],
                  },
                },
              },
            },
          },
        },
      }
      const result = nodeDetailsProvider(gitNode, mockActiveFilters, mockT, mockHubClusterName)
      expect(
        result.some(
          (d) =>
            (d as { type?: string; labelValue?: string }).type === 'label' &&
            (d as { labelValue: string }).labelValue === 'Sync options'
        )
      ).toBe(true)
      expect(detail(result, 'OptionOnly', '')).toBe(true)
    })

    it('should use default boolean strings when automated object omits fields', () => {
      const gitNode = {
        type: 'git',
        labels: [],
        specs: {
          resources: [{ repoURL: 'https://example.com' }],
          raw: {
            spec: {
              template: {
                spec: {
                  syncPolicy: {
                    automated: {},
                  },
                },
              },
            },
          },
        },
      }
      const result = nodeDetailsProvider(gitNode, mockActiveFilters, mockT, mockHubClusterName)
      expect(detail(result, 'Enabled', 'true')).toBe(true)
      expect(detail(result, 'Self-heal', 'false')).toBe(true)
      expect(detail(result, 'Prune', 'false')).toBe(true)
    })

    it('should add allow empty from nested automated when set', () => {
      const gitNode = {
        type: 'git',
        labels: [],
        specs: {
          resources: [{ repoURL: 'https://example.com' }],
          raw: {
            spec: {
              template: {
                spec: {
                  syncPolicy: {
                    automated: { allowEmpty: true },
                  },
                },
              },
            },
          },
        },
      }
      const result = nodeDetailsProvider(gitNode, mockActiveFilters, mockT, mockHubClusterName)
      expect(detail(result, 'Allow empty', 'true')).toBe(true)
    })

    it('should skip template sync policy details when syncPolicy is empty', () => {
      const gitNode = {
        type: 'git',
        labels: [],
        specs: {
          resources: [{ repoURL: 'https://example.com' }],
          raw: { spec: { template: { spec: { syncPolicy: {} } } } },
        },
      }
      const result = nodeDetailsProvider(gitNode, mockActiveFilters, mockT, mockHubClusterName)
      expect(
        result.some(
          (d) =>
            (d as { type?: string; labelValue?: string }).type === 'label' &&
            (d as { labelValue: string }).labelValue === 'Automated'
        )
      ).toBe(false)
      expect(
        result.some(
          (d) =>
            (d as { type?: string; labelValue?: string }).type === 'label' &&
            (d as { labelValue: string }).labelValue === 'Sync options'
        )
      ).toBe(false)
    })

    it('should invoke addK8Details path for default types and call status helpers', () => {
      const deploymentNode = {
        type: 'deployment',
        name: 'd1',
        namespace: 'ns1',
        clusterName: 'local-cluster',
        layout: { type: 'deployment' },
        labels: [],
        specs: {
          isDesign: true,
          raw: {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: { name: 'd1', namespace: 'ns1', labels: { app: 'x' } },
            spec: { replicas: 1 },
          },
          deploymentModel: {},
        },
      }

      nodeDetailsProvider(deploymentNode, mockActiveFilters, mockT, mockHubClusterName)

      expect(setApplicationDeployStatus).toHaveBeenCalled()
      expect(setSubscriptionDeployStatus).toHaveBeenCalled()
      expect(setPlacementRuleDeployStatus).toHaveBeenCalled()
      expect(setPlacementDeployStatus).toHaveBeenCalled()
      expect(setResourceDeployStatus).toHaveBeenCalled()
      expect(setPodDeployStatus).toHaveBeenCalled()
    })

    it('should resolve unknown apiVersion from search model data', () => {
      const deploymentNode = {
        type: 'deployment',
        name: 'd1',
        clusterName: 'c1',
        layout: { type: 'deployment' },
        labels: [],
        specs: {
          isDesign: true,
          raw: {
            apiVersion: 'unknown',
            kind: 'Deployment',
            metadata: { name: 'd1' },
          },
          deploymentModel: {
            key: [{ namespace: 'ns-from-search', apigroup: 'apps', apiversion: 'v1' }],
          },
        },
      }

      const result = nodeDetailsProvider(deploymentNode, mockActiveFilters, mockT, mockHubClusterName)
      expect(detail(result, 'API Version', 'apps/v1')).toBe(true)
    })

    it('should skip namespace aggregation when pulse is orange and fall back to node.namespace', () => {
      const deploymentNode = {
        type: 'deployment',
        name: 'd1',
        namespace: 'fallback-ns',
        clusterName: 'c1',
        layout: { type: 'deployment' },
        labels: [],
        specs: {
          pulse: 'orange',
          isDesign: true,
          raw: {
            apiVersion: 'apps/v1',
            metadata: { name: 'd1' },
          },
          deploymentModel: {
            key: [{ namespace: 'ignored-ns' }],
          },
        },
      }

      const result = nodeDetailsProvider(deploymentNode, mockActiveFilters, mockT, mockHubClusterName)
      expect(detail(result, 'Namespace', 'fallback-ns')).toBe(true)
    })

    it('should use hardcoded No labels when not design and resource model is absent', () => {
      const deploymentNode = {
        type: 'deployment',
        name: 'd1',
        clusterName: 'c1',
        layout: { type: 'deployment' },
        labels: [],
        specs: {
          isDesign: false,
          raw: { apiVersion: 'apps/v1', metadata: { name: 'd1' } },
        },
      }

      const result = nodeDetailsProvider(deploymentNode, mockActiveFilters, mockT, mockHubClusterName)
      expect(detail(result, 'Labels', 'No labels')).toBe(true)
    })

    it('should use resource model labels when not design', () => {
      const deploymentNode = {
        type: 'deployment',
        name: 'd1',
        clusterName: 'c1',
        layout: { type: 'deployment' },
        labels: [],
        specs: {
          isDesign: false,
          raw: {
            apiVersion: 'apps/v1',
            metadata: { name: 'd1' },
          },
          deploymentModel: {
            k: [{ namespace: 'n1', label: 'a; b' }],
          },
        },
      }

      const result = nodeDetailsProvider(deploymentNode, mockActiveFilters, mockT, mockHubClusterName)
      expect(result.find((d) => (d as { labelValue?: string }).labelValue === 'Labels')).toEqual(
        expect.objectContaining({ type: 'label', labelValue: 'Labels', value: 'a,b' })
      )
    })

    it('should use translated No labels when resource model has no label field', () => {
      const deploymentNode = {
        type: 'deployment',
        name: 'd1',
        clusterName: 'c1',
        layout: { type: 'deployment' },
        labels: [],
        specs: {
          isDesign: false,
          raw: { apiVersion: 'apps/v1', metadata: { name: 'd1' } },
          deploymentModel: {
            k: [{ namespace: 'n1' }],
          },
        },
      }

      const result = nodeDetailsProvider(deploymentNode, mockActiveFilters, mockT, mockHubClusterName)
      expect(detail(result, 'Labels', 'No labels')).toBe(true)
    })

    it('should prefer git-branch and git-path annotation keys when present', () => {
      const deploymentNode = {
        type: 'deployment',
        name: 'd1',
        clusterName: 'c1',
        layout: { type: 'deployment' },
        labels: [],
        specs: {
          isDesign: true,
          raw: {
            apiVersion: 'apps/v1',
            metadata: {
              name: 'd1',
              annotations: {
                'apps.open-cluster-management.io/git-branch': 'main',
                'apps.open-cluster-management.io/git-path': 'deploy',
                'apps.open-cluster-management.io/git-tag': 'v1',
                'apps.open-cluster-management.io/git-desired-commit': 'abc',
                'apps.open-cluster-management.io/reconcile-rate': 'medium',
              },
            },
          },
          deploymentModel: {},
        },
      }

      const result = nodeDetailsProvider(deploymentNode, mockActiveFilters, mockT, mockHubClusterName)
      expect(
        result.some(
          (d) =>
            (d as { labelValue?: string; value?: unknown }).labelValue === 'Git branch' &&
            String((d as { value?: unknown }).value).includes('main')
        )
      ).toBe(true)
      expect(
        result.some(
          (d) =>
            (d as { labelValue?: string; value?: unknown }).labelValue === 'Git path' &&
            String((d as { value?: unknown }).value).includes('deploy')
        )
      ).toBe(true)
      expect(detail(result, 'Git tag')).toBe(true)
      expect(detail(result, 'Git commit')).toBe(true)
      expect(detail(result, 'Reconcile rate')).toBe(true)
    })

    it('should use getLabels for Placement-kind placement decision', () => {
      mockGetLabels.mockClear()
      mockGetMatchLabels.mockClear()

      const placementNode = {
        type: 'placement',
        name: 'p1',
        clusterName: 'hub',
        layout: { type: 'placement' },
        labels: [],
        specs: {
          isDesign: true,
          raw: {
            apiVersion: 'cluster.open-cluster-management.io/v1beta1',
            kind: 'Placement',
            metadata: { name: 'p1' },
            status: { decisions: [{ clusterName: 'c1' }] },
          },
          placementModel: {},
        },
        placementDecision: {
          kind: 'Placement',
          spec: {
            clusterSets: ['dev'],
            predicates: [{ requiredClusterSelector: { labelSelector: { matchLabels: { region: 'us' } } } }],
          },
        },
      }

      nodeDetailsProvider(placementNode, mockActiveFilters, mockT, mockHubClusterName)
      expect(mockGetLabels).toHaveBeenCalled()
      expect(mockGetMatchLabels).not.toHaveBeenCalled()
    })

    it('should use getMatchLabels for non-Placement placement decision kind', () => {
      mockGetLabels.mockClear()
      mockGetMatchLabels.mockClear()

      const placementNode = {
        type: 'placement',
        name: 'p1',
        clusterName: 'hub',
        layout: { type: 'placement' },
        labels: [],
        specs: {
          isDesign: true,
          raw: {
            apiVersion: 'cluster.open-cluster-management.io/v1beta1',
            kind: 'Placement',
            metadata: { name: 'p1' },
            status: { decisions: [] },
          },
          placementModel: {},
        },
        placementDecision: {
          kind: 'PlacementDecision',
          spec: {
            clusterSelector: { matchLabels: { env: 'prod' } },
          },
        },
      }

      nodeDetailsProvider(placementNode, mockActiveFilters, mockT, mockHubClusterName)
      expect(mockGetMatchLabels).toHaveBeenCalled()
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
        'git',
        'chart',
        'host',
        'ingress',
        'internet',
        'namespace',
        'node',
        'other',
        'package',
        'placement',
        'placementDecision',
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
