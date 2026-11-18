/* Copyright Contributors to the Open Cluster Management project */

import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { argoCDsState, gitOpsClustersState } from '~/atoms'
import { StateProvider } from '~/lib/state-provider'
import type { GitOpsCluster, IResource } from '~/resources'
import { useSetSharedValue, useSharedAtoms } from '~/shared-atoms'
import { useApplicationGitOpsMode } from './useApplicationGitOpsMode'

function renderMode(gitOpsAddon?: NonNullable<GitOpsCluster['spec']>['gitopsAddon'], argoCDs: IResource[] = []) {
  return renderHook(
    () => {
      const { gitOpsClustersState, argoCDsState } = useSharedAtoms()
      return {
        ...useApplicationGitOpsMode(),
        setGitOpsClusters: useSetSharedValue(gitOpsClustersState),
        setArgoCDs: useSetSharedValue(argoCDsState),
      }
    },
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <StateProvider
          initializeStore={(store) => {
            store.set(argoCDsState, argoCDs)
            store.set(
              gitOpsClustersState,
              gitOpsAddon
                ? [
                    {
                      apiVersion: 'apps.open-cluster-management.io/v1beta1',
                      kind: 'GitOpsCluster',
                      metadata: { name: 'gitops', namespace: 'configuration' },
                      spec: { argoServer: { argoNamespace: 'openshift-gitops' }, gitopsAddon: gitOpsAddon },
                    },
                  ]
                : []
            )
          }}
        >
          {children}
        </StateProvider>
      ),
    }
  )
}

test('reports no GitOpsCluster and keeps push available before configuration', () => {
  const { result } = renderMode()
  expect(result.current.hasGitOpsCluster).toBe(false)
  expect(result.current.isArgoCDAgentModeEnabled).toBe(false)
  expect(result.current.isPushModelEnabled).toBe(true)
})

test.each([
  { enabled: true, argoCDAgent: { enabled: true }, agentMode: true },
  { enabled: false, argoCDAgent: { enabled: true }, agentMode: false },
  { enabled: true, argoCDAgent: { enabled: false }, agentMode: false },
  { enabled: true, agentMode: false },
])('reads live GitOpsCluster flags: %j', ({ agentMode, ...gitOpsAddon }) => {
  const { result } = renderMode(gitOpsAddon)
  expect(result.current.hasGitOpsCluster).toBe(true)
  expect(result.current.isArgoCDAgentModeEnabled).toBe(agentMode)

  act(() => result.current.setGitOpsClusters([]))
  expect(result.current.hasGitOpsCluster).toBe(false)
  expect(result.current.isArgoCDAgentModeEnabled).toBe(false)
})

test.each([
  { enabled: true, expected: true },
  { enabled: false, expected: false },
  { enabled: undefined, expected: true },
])('checks the matching ArgoCD controller in Agent mode: %j', ({ enabled, expected }) => {
  const { result } = renderMode({ enabled: true, argoCDAgent: { enabled: true } }, [
    {
      apiVersion: 'argoproj.io/v1beta1',
      kind: 'ArgoCD',
      metadata: { name: 'openshift-gitops', namespace: 'openshift-gitops' },
      ...{ spec: { controller: { enabled } } },
    },
  ])
  expect(result.current.isPushModelEnabled).toBe(expected)

  act(() => result.current.setArgoCDs([]))
  expect(result.current.isPushModelEnabled).toBe(false)
})

test('does not use an ArgoCD controller from another namespace', () => {
  const { result } = renderMode({ enabled: true, argoCDAgent: { enabled: true } }, [
    {
      apiVersion: 'argoproj.io/v1beta1',
      kind: 'ArgoCD',
      metadata: { name: 'other', namespace: 'other' },
      ...{ spec: { controller: { enabled: true } } },
    },
  ])
  expect(result.current.isPushModelEnabled).toBe(false)
})
