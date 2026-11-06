/* Copyright Contributors to the Open Cluster Management project */

import { getGitOpsClusterNames } from '~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterStatus'

describe('getGitOpsClusterNames', () => {
  const message = 'Added managed clusters [weekly weekly-managed] to gitops namespace openshift-gitops'

  it('reads whitespace-separated names from a successful phase', () => {
    expect(getGitOpsClusterNames({ phase: 'successful', message })).toEqual(['weekly', 'weekly-managed'])
  })

  it('uses a true ClustersRegistered condition but never parses its count message', () => {
    expect(
      getGitOpsClusterNames({
        message,
        conditions: [{ type: 'ClustersRegistered', status: 'True', message: 'Registered 2 clusters' }],
      })
    ).toEqual(['weekly', 'weekly-managed'])
    expect(
      getGitOpsClusterNames({ conditions: [{ type: 'ClustersRegistered', status: 'True', message }] })
    ).toBeUndefined()
  })

  it('does not expose stale names after failure', () => {
    expect(getGitOpsClusterNames({ phase: 'failed', message })).toBeUndefined()
    expect(
      getGitOpsClusterNames({
        phase: 'successful',
        message,
        conditions: [{ type: 'ClustersRegistered', status: 'False' }],
      })
    ).toBeUndefined()
    expect(getGitOpsClusterNames({ message })).toBeUndefined()
  })

  it('handles missing status, message and names', () => {
    expect(getGitOpsClusterNames(undefined)).toBeUndefined()
    expect(getGitOpsClusterNames({ phase: 'successful' })).toBeUndefined()
    expect(
      getGitOpsClusterNames({
        phase: 'successful',
        message: 'Added managed clusters [] to gitops namespace openshift-gitops',
      })
    ).toEqual([])
  })

  it('keeps complete names but never links a truncated token', () => {
    expect(
      getGitOpsClusterNames({ phase: 'successful', message: 'Added managed clusters [weekly weekly-man...' })
    ).toEqual(['weekly'])
    expect(getGitOpsClusterNames({ phase: 'successful', message: 'Added managed clusters [weekly ...' })).toEqual([
      'weekly',
    ])
    expect(getGitOpsClusterNames({ phase: 'successful', message: 'Added managed clusters [week...' })).toBeUndefined()
    expect(getGitOpsClusterNames({ phase: 'successful', message: 'Added managed clusters [weekly' })).toBeUndefined()
  })
})
