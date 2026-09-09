/* Copyright Contributors to the Open Cluster Management project */

import { t } from '~/lib/test-helpers'
import { setClusterStatus } from './NodeDetailsProviderStatuses'
import type { ClusterInfo, DetailItem, TopologyNodeWithStatus } from '../types'

jest.mock('../../../../../lib/AcmTimestamp', () => () => null)
jest.mock('../../../../../resources', () => ({}))
jest.mock('../helpers/ansible-task', () => ({ showAnsibleJobDetails: jest.fn() }))
jest.mock('../helpers/diagram-helpers', () => ({
  addDetails: jest.fn(),
  addNodeServiceLocation: jest.fn(),
  addOCPRouteLocation: jest.fn(),
  addPropertyToList: jest.fn(),
  createEditLink: jest.fn(),
  getNodePropery: jest.fn(),
}))
jest.mock('../helpers/diagram-helpers-utils', () => ({
  filterSubscriptionObject: jest.fn(),
  getActiveFilterCodes: jest.fn(),
  getClusterName: jest.fn(),
  getTargetNsForNode: jest.fn(),
  isDeployableResource: jest.fn(),
  nodeMustHavePods: jest.fn(),
  showMissingClusterDetails: jest.fn(),
}))
jest.mock('../helpers/search-helper', () => ({ isSearchAvailable: jest.fn() }))
jest.mock('./computeStatuses', () => ({
  apiVersionPath: 'apiVersion',
  argoAppHealthyStatus: 'Healthy',
  argoAppProgressingStatus: 'Progressing',
  argoAppUnknownStatus: 'Unknown',
  checkmarkCode: 'checkmark',
  checkmarkStatus: 'checkmark',
  failureCode: 'failure',
  failureStatus: 'failure',
  getOnlineClusters: jest.fn(() => []),
  metadataName: 'metadata.name',
  pendingCode: 'pending',
  pendingStatus: 'pending',
  resErrorStates: [],
  showResourceYaml: jest.fn(),
  warningCode: 'warning',
  warningStatus: 'warning',
}))

const hubClusterName = 'local-cluster'

const makeClusterNode = (overrides: Record<string, unknown> = {}): TopologyNodeWithStatus =>
  ({
    id: 'member--clusters--test',
    type: 'cluster',
    specs: {
      clusters: [],
      appClusters: [],
      clustersNames: [],
      searchClusters: [],
      targetNamespaces: {},
      ...overrides,
    },
  }) as unknown as TopologyNodeWithStatus

describe('setClusterStatus', () => {
  it('should enrich clusters with consoleURL from searchClusters', () => {
    const node = makeClusterNode({
      clusters: [{ name: 'managed-1', status: 'ok' }] as ClusterInfo[],
      searchClusters: [
        { name: 'managed-1', status: 'ok', consoleURL: 'https://console.managed-1.example.com' },
      ] as ClusterInfo[],
    })

    const details: DetailItem[] = []
    setClusterStatus(node, details, t, hubClusterName)

    const combobox = details.find((d) => d.type === 'clusterdetailcombobox')
    expect(combobox).toBeDefined()
    const clusterList = combobox!.comboboxdata!.clusterList
    expect(clusterList).toHaveLength(1)
    expect(clusterList[0].consoleURL).toBe('https://console.managed-1.example.com')
  })

  it('should not overwrite existing consoleURL on clusters', () => {
    const node = makeClusterNode({
      clusters: [{ name: 'managed-1', status: 'ok', consoleURL: 'https://original.example.com' }] as ClusterInfo[],
      searchClusters: [{ name: 'managed-1', status: 'ok', consoleURL: 'https://search.example.com' }] as ClusterInfo[],
    })

    const details: DetailItem[] = []
    setClusterStatus(node, details, t, hubClusterName)

    const combobox = details.find((d) => d.type === 'clusterdetailcombobox')
    const clusterList = combobox!.comboboxdata!.clusterList
    expect(clusterList[0].consoleURL).toBe('https://original.example.com')
  })

  it('should add consoleURL to Argo appClusters not in specs.clusters', () => {
    const node = makeClusterNode({
      clusters: [] as ClusterInfo[],
      appClusters: ['argo-cluster'],
      searchClusters: [
        { name: 'argo-cluster', status: 'ok', consoleURL: 'https://console.argo-cluster.example.com' },
      ] as ClusterInfo[],
    })

    const details: DetailItem[] = []
    setClusterStatus(node, details, t, hubClusterName)

    const combobox = details.find((d) => d.type === 'clusterdetailcombobox')
    const clusterList = combobox!.comboboxdata!.clusterList
    const argoCluster = clusterList.find((c) => c.name === 'argo-cluster')
    expect(argoCluster).toBeDefined()
    expect(argoCluster!.consoleURL).toBe('https://console.argo-cluster.example.com')
  })

  it('should handle missing searchClusters gracefully', () => {
    const node = makeClusterNode({
      clusters: [{ name: 'managed-1', status: 'ok' }] as ClusterInfo[],
    })
    delete (node.specs as Record<string, unknown>).searchClusters

    const details: DetailItem[] = []
    setClusterStatus(node, details, t, hubClusterName)

    const combobox = details.find((d) => d.type === 'clusterdetailcombobox')
    const clusterList = combobox!.comboboxdata!.clusterList
    expect(clusterList).toHaveLength(1)
    expect(clusterList[0].consoleURL).toBeUndefined()
  })

  it('should enrich multiple clusters from searchClusters', () => {
    const node = makeClusterNode({
      clusters: [
        { name: 'cluster-a', status: 'ok' },
        { name: 'cluster-b', status: 'ok' },
      ] as ClusterInfo[],
      searchClusters: [
        { name: 'cluster-a', status: 'ok', consoleURL: 'https://console.cluster-a.example.com' },
        { name: 'cluster-b', status: 'ok', consoleURL: 'https://console.cluster-b.example.com' },
      ] as ClusterInfo[],
    })

    const details: DetailItem[] = []
    setClusterStatus(node, details, t, hubClusterName)

    const combobox = details.find((d) => d.type === 'clusterdetailcombobox')
    const clusterList = combobox!.comboboxdata!.clusterList
    expect(clusterList).toHaveLength(2)
    expect(clusterList[0].consoleURL).toBe('https://console.cluster-a.example.com')
    expect(clusterList[1].consoleURL).toBe('https://console.cluster-b.example.com')
  })
})
