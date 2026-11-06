/* Copyright Contributors to the Open Cluster Management project */

import type { GitOpsCluster } from '~/resources/gitops-cluster'

/** Only the successful legacy status message contains cluster names, not the conditions. */
export function getGitOpsClusterNames(status: GitOpsCluster['status']): string[] | undefined {
  const registered = status?.conditions?.find((condition) => condition.type === 'ClustersRegistered')
  if (status?.phase === 'failed' || registered?.status === 'False') return undefined
  if (status?.phase !== 'successful' && registered?.status !== 'True') return undefined

  const message = status?.message ?? ''
  const prefix = 'Added managed clusters ['
  if (!message.startsWith(prefix)) return undefined
  const remainder = message.slice(prefix.length)
  const closingBracket = remainder.indexOf(']')
  const ellipsis = remainder.indexOf('...')
  let names: string
  if (ellipsis !== -1 && (closingBracket === -1 || ellipsis < closingBracket)) {
    // The upstream byte limit can cut through a name. Keep only whitespace-terminated tokens.
    const completePrefix = remainder.slice(0, ellipsis)
    names = completePrefix.slice(0, completePrefix.search(/\S*$/))
    if (!names.trim()) return undefined
  } else if (closingBracket !== -1) {
    names = remainder.slice(0, closingBracket)
  } else {
    return undefined
  }
  return [...new Set(names.trim().split(/\s+/).filter(Boolean))]
}
