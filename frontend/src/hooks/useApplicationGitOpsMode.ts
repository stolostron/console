/* Copyright Contributors to the Open Cluster Management project */

import { useSharedAtoms, useSharedSelectors, useSharedValue } from '~/shared-atoms'
import { get } from 'lodash'

export function useApplicationGitOpsMode() {
  const { gitOpsClustersState, argoCDsState } = useSharedAtoms()
  const { isArgoCDAgentModeEnabledValue } = useSharedSelectors()
  const gitOpsClusters = useSharedValue(gitOpsClustersState)
  const argoCDs = useSharedValue(argoCDsState)
  const isArgoCDAgentModeEnabled = useSharedValue(isArgoCDAgentModeEnabledValue)
  const isPushModelEnabled =
    !isArgoCDAgentModeEnabled ||
    gitOpsClusters.some((gitOpsCluster) => {
      const namespace = gitOpsCluster.spec?.argoServer?.argoNamespace ?? gitOpsCluster.metadata.namespace
      return argoCDs.some(
        (argoCD) => argoCD.metadata?.namespace === namespace && get(argoCD, 'spec.controller.enabled') !== false
      )
    })

  return {
    hasGitOpsCluster: gitOpsClusters.length > 0,
    isArgoCDAgentModeEnabled,
    isPushModelEnabled,
  }
}
