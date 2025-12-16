/* Copyright Contributors to the Open Cluster Management project */
import { isClusterInClusters } from './utils'
import { Cluster } from '../../routes/UserManagement/RoleAssignments/hook/RoleAssignmentDataHook'

describe('isClusterInClusters', () => {
  const createCluster = (name: string, namespaces?: string[]): Cluster => ({
    name,
    namespaces,
  })

  it('returns true when cluster is found in the list', () => {
    const clusters: Cluster[] = [createCluster('cluster-a'), createCluster('cluster-b'), createCluster('cluster-c')]
    const cluster = createCluster('cluster-b')

    expect(isClusterInClusters(clusters, cluster)).toBe(true)
  })

  it('returns false when cluster is not found in the list', () => {
    const clusters: Cluster[] = [createCluster('cluster-a'), createCluster('cluster-b')]
    const cluster = createCluster('cluster-x')

    expect(isClusterInClusters(clusters, cluster)).toBe(false)
  })

  it('returns false when clusters list is empty', () => {
    const clusters: Cluster[] = []
    const cluster = createCluster('cluster-a')

    expect(isClusterInClusters(clusters, cluster)).toBe(false)
  })

  it('handles cluster names with leading/trailing whitespace', () => {
    const clusters: Cluster[] = [createCluster('  cluster-a  '), createCluster('cluster-b')]
    const cluster = createCluster('cluster-a')

    expect(isClusterInClusters(clusters, cluster)).toBe(true)
  })

  it('handles search cluster name with leading/trailing whitespace', () => {
    const clusters: Cluster[] = [createCluster('cluster-a'), createCluster('cluster-b')]
    const cluster = createCluster('  cluster-a  ')

    expect(isClusterInClusters(clusters, cluster)).toBe(true)
  })

  it('performs case-sensitive comparison', () => {
    const clusters: Cluster[] = [createCluster('Cluster-A'), createCluster('cluster-b')]
    const cluster = createCluster('cluster-a')

    expect(isClusterInClusters(clusters, cluster)).toBe(false)
  })

  it('matches first occurrence when duplicates exist', () => {
    const clusters: Cluster[] = [createCluster('cluster-a'), createCluster('cluster-a'), createCluster('cluster-b')]
    const cluster = createCluster('cluster-a')

    expect(isClusterInClusters(clusters, cluster)).toBe(true)
  })

  it('ignores other cluster properties when matching', () => {
    const clusters: Cluster[] = [createCluster('cluster-a', ['ns-1', 'ns-2']), createCluster('cluster-b', ['ns-3'])]
    const cluster = createCluster('cluster-a', ['different-ns'])

    expect(isClusterInClusters(clusters, cluster)).toBe(true)
  })
})
