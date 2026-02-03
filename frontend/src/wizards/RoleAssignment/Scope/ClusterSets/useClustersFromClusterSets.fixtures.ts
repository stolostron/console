/* Copyright Contributors to the Open Cluster Management project */

import { ManagedClusterSet, ManagedClusterSetApiVersion, ManagedClusterSetKind } from '../../../../resources'
import { Cluster } from '../../../../resources/utils'

export const createClusterSet = (name: string): ManagedClusterSet => ({
  apiVersion: ManagedClusterSetApiVersion,
  kind: ManagedClusterSetKind,
  metadata: {
    name,
  },
})

export const createMockCluster = (name: string, clusterSet?: string): Cluster => ({
  name,
  uid: `uid-${name}`,
  status: 'ready' as any,
  hasAutomationTemplate: false,
  hive: {
    isHibernatable: false,
  },
  isHive: false,
  isManaged: true,
  isCurator: false,
  isHostedCluster: false,
  isRegionalHubCluster: false,
  owner: {},
  isSNOCluster: false,
  isHypershift: false,
  clusterSet,
})

const mockedClusters: Cluster[] = [
  createMockCluster('cluster-1', 'cluster-set-1'),
  createMockCluster('cluster-2', 'cluster-set-1'),
  createMockCluster('cluster-3', 'cluster-set-2'),
  createMockCluster('cluster-4', 'cluster-set-2'),
  createMockCluster('cluster-5', 'cluster-set-3'),
  createMockCluster('cluster-6'), // cluster without clusterSet
]

type ManagedClusterSetTestCase = {
  description: string
  selectedClusterSets?: (ManagedClusterSet | string)[]
  mockClusters: Cluster[]
  expectedResult: Cluster[]
}

export const testCases: ManagedClusterSetTestCase[] = [
  {
    description: 'should return empty when undefined',
    selectedClusterSets: undefined,
    mockClusters: mockedClusters,
    expectedResult: [],
  },
  {
    description: 'should return empty when empty array',
    selectedClusterSets: [],
    mockClusters: mockedClusters,
    expectedResult: [],
  },
  {
    description: 'should return clusters when single cluster set is provided',
    selectedClusterSets: [createClusterSet('cluster-set-1')],
    mockClusters: mockedClusters,
    expectedResult: [createMockCluster('cluster-1', 'cluster-set-1'), createMockCluster('cluster-2', 'cluster-set-1')],
  },
  {
    description: 'should return clusters when multiple cluster sets are provided',
    selectedClusterSets: [createClusterSet('cluster-set-1'), createClusterSet('cluster-set-2')],
    mockClusters: mockedClusters,
    expectedResult: [
      createMockCluster('cluster-1', 'cluster-set-1'),
      createMockCluster('cluster-2', 'cluster-set-1'),
      createMockCluster('cluster-3', 'cluster-set-2'),
      createMockCluster('cluster-4', 'cluster-set-2'),
    ],
  },
  {
    description: 'should return empty when no clusters match the cluster set',
    selectedClusterSets: [createClusterSet('non-existent-cluster-set')],
    mockClusters: mockedClusters,
    expectedResult: [],
  },
  {
    description: 'should return empty when clusters have no clusterSet property',
    selectedClusterSets: [createClusterSet('cluster-set-1')],
    mockClusters: [createMockCluster('cluster-1'), createMockCluster('cluster-2')],
    expectedResult: [],
  },
  {
    description: 'should handle string cluster set names',
    selectedClusterSets: ['cluster-set-1'],
    mockClusters: mockedClusters,
    expectedResult: [createMockCluster('cluster-1', 'cluster-set-1'), createMockCluster('cluster-2', 'cluster-set-1')],
  },
  {
    description: 'should handle mixed ManagedClusterSet objects and strings',
    selectedClusterSets: [createClusterSet('cluster-set-1'), 'cluster-set-2'],
    mockClusters: mockedClusters,
    expectedResult: [
      createMockCluster('cluster-1', 'cluster-set-1'),
      createMockCluster('cluster-2', 'cluster-set-1'),
      createMockCluster('cluster-3', 'cluster-set-2'),
      createMockCluster('cluster-4', 'cluster-set-2'),
    ],
  },
]
