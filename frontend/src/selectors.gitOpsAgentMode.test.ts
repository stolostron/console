/* Copyright Contributors to the Open Cluster Management project */
import { createStore } from 'jotai'
import { gitOpsClustersState } from './atoms'
import { GitOpsClusterApiVersion, GitOpsClusterKind } from './resources/gitops-cluster'
import type { GitOpsCluster } from './resources/gitops-cluster'
import { isArgoCDAgentModeEnabledValue } from './selectors'

function buildGitOpsCluster(overrides: Partial<GitOpsCluster['spec']>): GitOpsCluster {
  return {
    apiVersion: GitOpsClusterApiVersion,
    kind: GitOpsClusterKind,
    metadata: { name: 'gitops-cluster', namespace: 'openshift-gitops' },
    spec: overrides,
  }
}

describe('isArgoCDAgentModeEnabledValue', () => {
  it('returns false when there are no GitOpsCluster resources', () => {
    const store = createStore()
    store.set(gitOpsClustersState, [])
    expect(store.get(isArgoCDAgentModeEnabledValue)).toBe(false)
  })

  it('returns false when gitopsAddon is disabled', () => {
    const store = createStore()
    store.set(gitOpsClustersState, [
      buildGitOpsCluster({ gitopsAddon: { enabled: false, argoCDAgent: { enabled: true } } }),
    ])
    expect(store.get(isArgoCDAgentModeEnabledValue)).toBe(false)
  })

  it('returns false when gitopsAddon is enabled but argoCDAgent is disabled', () => {
    const store = createStore()
    store.set(gitOpsClustersState, [
      buildGitOpsCluster({ gitopsAddon: { enabled: true, argoCDAgent: { enabled: false } } }),
    ])
    expect(store.get(isArgoCDAgentModeEnabledValue)).toBe(false)
  })

  it('returns true when gitopsAddon and argoCDAgent are both enabled', () => {
    const store = createStore()
    store.set(gitOpsClustersState, [
      buildGitOpsCluster({ gitopsAddon: { enabled: true, argoCDAgent: { enabled: true, mode: 'managed' } } }),
    ])
    expect(store.get(isArgoCDAgentModeEnabledValue)).toBe(true)
  })

  it('returns true when any GitOpsCluster resource has agent mode enabled', () => {
    const store = createStore()
    store.set(gitOpsClustersState, [
      buildGitOpsCluster({ gitopsAddon: { enabled: false } }),
      buildGitOpsCluster({ gitopsAddon: { enabled: true, argoCDAgent: { enabled: true } } }),
    ])
    expect(store.get(isArgoCDAgentModeEnabledValue)).toBe(true)
  })
})
