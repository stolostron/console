/* Copyright Contributors to the Open Cluster Management project */

import { mergePushModelPodStatuses } from '../../../src/routes/aggregators/applicationsArgo'
import { type PushModelResourceMap } from '../../../src/routes/aggregators/applicationsPushModel'
import {
  type ApplicationClusterStatusMap,
  type ApplicationStatuses,
  ScoreColumn,
  StatusColumn,
} from '../../../src/routes/aggregators/applications'
import type { ISearchResource, SearchResult } from '../../../src/resources/resource'

function makeEmptyStatuses(): ApplicationStatuses {
  return {
    health: [[0, 0, 0, 0, 0], []],
    synced: [[0, 0, 0, 0, 0], []],
    deployed: [[0, 0, 0, 0, 0], []],
  }
}

function makeSearchItem(
  uid: string,
  cluster: string,
  namespace: string,
  name: string,
  kind = 'Deployment'
): ISearchResource {
  return {
    _uid: uid,
    apigroup: 'apps',
    apiversion: 'v1',
    kind,
    name,
    namespace,
    cluster,
    created: '2024-01-01T00:00:00Z',
  }
}

function makePod(
  uid: string,
  cluster: string,
  namespace: string,
  name: string,
  status: string,
  relatedUids: string[]
): ISearchResource {
  return {
    _uid: uid,
    _relatedUids: relatedUids,
    apigroup: '',
    apiversion: 'v1',
    kind: 'Pod',
    name,
    namespace,
    cluster,
    created: '2024-01-01T00:00:00Z',
    status,
  }
}

function makeSearchResult(items: ISearchResource[], pods: ISearchResource[]): SearchResult {
  return {
    items,
    related: pods.length > 0 ? [{ kind: 'Pod', items: pods }] : [],
  }
}

describe('mergePushModelPodStatuses', () => {
  const appSetKey = 'appset/openshift-gitops/my-appset'

  it('should count healthy running pods', () => {
    const statusMap: ApplicationClusterStatusMap = {
      [appSetKey]: {
        'remote-1': makeEmptyStatuses(),
      },
    }
    const resourceMap: PushModelResourceMap = new Map([
      ['remote-1/default/web-server', { appSetKey, targetCluster: 'remote-1' }],
    ])

    const deployUid = 'deploy-uid-1'
    const searchResult = makeSearchResult(
      [makeSearchItem(deployUid, 'remote-1', 'default', 'web-server')],
      [makePod('pod-1', 'remote-1', 'default', 'web-server-abc', 'Running', [deployUid])]
    )

    mergePushModelPodStatuses(searchResult, resourceMap, statusMap)

    const deployed = statusMap[appSetKey]['remote-1'].deployed
    expect(deployed[StatusColumn.counts][ScoreColumn.healthy]).toBe(1)
    expect(deployed[StatusColumn.counts][ScoreColumn.danger]).toBe(0)
    expect(deployed[StatusColumn.counts][ScoreColumn.warning]).toBe(0)
  })

  it('should count multiple pods with different statuses', () => {
    const statusMap: ApplicationClusterStatusMap = {
      [appSetKey]: {
        'remote-1': makeEmptyStatuses(),
      },
    }
    const resourceMap: PushModelResourceMap = new Map([
      ['remote-1/default/web-server', { appSetKey, targetCluster: 'remote-1' }],
    ])

    const deployUid = 'deploy-uid-1'
    const searchResult = makeSearchResult(
      [makeSearchItem(deployUid, 'remote-1', 'default', 'web-server')],
      [
        makePod('pod-1', 'remote-1', 'default', 'web-server-aaa', 'Running', [deployUid]),
        makePod('pod-2', 'remote-1', 'default', 'web-server-bbb', 'CrashLoopBackOff', [deployUid]),
        makePod('pod-3', 'remote-1', 'default', 'web-server-ccc', 'Pending', [deployUid]),
      ]
    )

    mergePushModelPodStatuses(searchResult, resourceMap, statusMap)

    const deployed = statusMap[appSetKey]['remote-1'].deployed
    expect(deployed[StatusColumn.counts][ScoreColumn.healthy]).toBe(1)
    expect(deployed[StatusColumn.counts][ScoreColumn.danger]).toBe(1)
    expect(deployed[StatusColumn.counts][ScoreColumn.warning]).toBe(1)
  })

  it('should classify error pod statuses correctly', () => {
    const errorStatuses = [
      'err',
      'off',
      'invalid',
      'kill',
      'propagationfailed',
      'imagepullbackoff',
      'crashloopbackoff',
      'lost',
    ]
    for (const errorStatus of errorStatuses) {
      const statusMap: ApplicationClusterStatusMap = {
        [appSetKey]: { 'remote-1': makeEmptyStatuses() },
      }
      const resourceMap: PushModelResourceMap = new Map([
        ['remote-1/default/web', { appSetKey, targetCluster: 'remote-1' }],
      ])
      const deployUid = 'deploy-uid'
      const searchResult = makeSearchResult(
        [makeSearchItem(deployUid, 'remote-1', 'default', 'web')],
        [makePod('pod-1', 'remote-1', 'default', 'web-aaa', errorStatus, [deployUid])]
      )

      mergePushModelPodStatuses(searchResult, resourceMap, statusMap)

      const deployed = statusMap[appSetKey]['remote-1'].deployed
      expect(deployed[StatusColumn.counts][ScoreColumn.danger]).toBe(1)
    }
  })

  it('should classify warning pod statuses correctly', () => {
    const warningStatuses = ['pending', 'creating']
    for (const warnStatus of warningStatuses) {
      const statusMap: ApplicationClusterStatusMap = {
        [appSetKey]: { 'remote-1': makeEmptyStatuses() },
      }
      const resourceMap: PushModelResourceMap = new Map([
        ['remote-1/default/web', { appSetKey, targetCluster: 'remote-1' }],
      ])
      const deployUid = 'deploy-uid'
      const searchResult = makeSearchResult(
        [makeSearchItem(deployUid, 'remote-1', 'default', 'web')],
        [makePod('pod-1', 'remote-1', 'default', 'web-aaa', warnStatus, [deployUid])]
      )

      mergePushModelPodStatuses(searchResult, resourceMap, statusMap)

      const deployed = statusMap[appSetKey]['remote-1'].deployed
      expect(deployed[StatusColumn.counts][ScoreColumn.warning]).toBe(1)
    }
  })

  it('should skip terminating pods', () => {
    const statusMap: ApplicationClusterStatusMap = {
      [appSetKey]: { 'remote-1': makeEmptyStatuses() },
    }
    const resourceMap: PushModelResourceMap = new Map([
      ['remote-1/default/web', { appSetKey, targetCluster: 'remote-1' }],
    ])
    const deployUid = 'deploy-uid'
    const searchResult = makeSearchResult(
      [makeSearchItem(deployUid, 'remote-1', 'default', 'web')],
      [makePod('pod-1', 'remote-1', 'default', 'web-aaa', 'Terminating', [deployUid])]
    )

    mergePushModelPodStatuses(searchResult, resourceMap, statusMap)

    const counts = statusMap[appSetKey]['remote-1'].deployed[StatusColumn.counts]
    const total =
      counts[ScoreColumn.healthy] +
      counts[ScoreColumn.danger] +
      counts[ScoreColumn.warning] +
      counts[ScoreColumn.progress]
    expect(total).toBe(0)
  })

  it('should not double-count pods when deployed counts already populated', () => {
    const statuses = makeEmptyStatuses()
    statuses.deployed[StatusColumn.counts][ScoreColumn.healthy] = 2
    const statusMap: ApplicationClusterStatusMap = {
      [appSetKey]: { 'remote-1': statuses },
    }
    const resourceMap: PushModelResourceMap = new Map([
      ['remote-1/default/web', { appSetKey, targetCluster: 'remote-1' }],
    ])
    const deployUid = 'deploy-uid'
    const searchResult = makeSearchResult(
      [makeSearchItem(deployUid, 'remote-1', 'default', 'web')],
      [makePod('pod-1', 'remote-1', 'default', 'web-aaa', 'Running', [deployUid])]
    )

    mergePushModelPodStatuses(searchResult, resourceMap, statusMap)

    // Should NOT have been incremented — entry was already populated
    expect(statusMap[appSetKey]['remote-1'].deployed[StatusColumn.counts][ScoreColumn.healthy]).toBe(2)
  })

  it('should skip already-populated entries even when danger/warning counts exist', () => {
    const statuses = makeEmptyStatuses()
    statuses.deployed[StatusColumn.counts][ScoreColumn.danger] = 1
    const statusMap: ApplicationClusterStatusMap = {
      [appSetKey]: { 'remote-1': statuses },
    }
    const resourceMap: PushModelResourceMap = new Map([
      ['remote-1/default/web', { appSetKey, targetCluster: 'remote-1' }],
    ])
    const deployUid = 'deploy-uid'
    const searchResult = makeSearchResult(
      [makeSearchItem(deployUid, 'remote-1', 'default', 'web')],
      [makePod('pod-1', 'remote-1', 'default', 'web-aaa', 'Running', [deployUid])]
    )

    mergePushModelPodStatuses(searchResult, resourceMap, statusMap)

    expect(statusMap[appSetKey]['remote-1'].deployed[StatusColumn.counts][ScoreColumn.healthy]).toBe(0)
    expect(statusMap[appSetKey]['remote-1'].deployed[StatusColumn.counts][ScoreColumn.danger]).toBe(1)
  })

  it('should still add pods for entries that are NOT already populated', () => {
    const populatedStatuses = makeEmptyStatuses()
    populatedStatuses.deployed[StatusColumn.counts][ScoreColumn.healthy] = 1
    const statusMap: ApplicationClusterStatusMap = {
      [appSetKey]: {
        'local-cluster': populatedStatuses,
        'remote-1': makeEmptyStatuses(),
      },
    }
    const resourceMap: PushModelResourceMap = new Map([
      ['remote-1/default/web', { appSetKey, targetCluster: 'remote-1' }],
    ])
    const deployUid = 'deploy-uid'
    const searchResult = makeSearchResult(
      [makeSearchItem(deployUid, 'remote-1', 'default', 'web')],
      [makePod('pod-1', 'remote-1', 'default', 'web-aaa', 'Running', [deployUid])]
    )

    mergePushModelPodStatuses(searchResult, resourceMap, statusMap)

    // remote-1 was not pre-populated, so the pod should be counted
    expect(statusMap[appSetKey]['remote-1'].deployed[StatusColumn.counts][ScoreColumn.healthy]).toBe(1)
    // local-cluster was pre-populated, should stay unchanged
    expect(statusMap[appSetKey]['local-cluster'].deployed[StatusColumn.counts][ScoreColumn.healthy]).toBe(1)
  })

  it('should skip pods that are not related to any known workload', () => {
    const statusMap: ApplicationClusterStatusMap = {
      [appSetKey]: { 'remote-1': makeEmptyStatuses() },
    }
    const resourceMap: PushModelResourceMap = new Map([
      ['remote-1/default/web', { appSetKey, targetCluster: 'remote-1' }],
    ])
    const deployUid = 'deploy-uid'
    const searchResult = makeSearchResult(
      [makeSearchItem(deployUid, 'remote-1', 'default', 'web')],
      [makePod('pod-1', 'remote-1', 'default', 'other-pod', 'Running', ['unrelated-uid'])]
    )

    mergePushModelPodStatuses(searchResult, resourceMap, statusMap)

    const counts = statusMap[appSetKey]['remote-1'].deployed[StatusColumn.counts]
    expect(counts[ScoreColumn.healthy]).toBe(0)
  })

  it('should skip pods without _relatedUids', () => {
    const statusMap: ApplicationClusterStatusMap = {
      [appSetKey]: { 'remote-1': makeEmptyStatuses() },
    }
    const resourceMap: PushModelResourceMap = new Map([
      ['remote-1/default/web', { appSetKey, targetCluster: 'remote-1' }],
    ])
    const deployUid = 'deploy-uid'
    const searchResult = makeSearchResult(
      [makeSearchItem(deployUid, 'remote-1', 'default', 'web')],
      [
        {
          _uid: 'pod-1',
          apigroup: '',
          apiversion: 'v1',
          kind: 'Pod',
          name: 'web-aaa',
          namespace: 'default',
          cluster: 'remote-1',
          created: '2024-01-01T00:00:00Z',
          status: 'Running',
        },
      ]
    )

    mergePushModelPodStatuses(searchResult, resourceMap, statusMap)

    expect(statusMap[appSetKey]['remote-1'].deployed[StatusColumn.counts][ScoreColumn.healthy]).toBe(0)
  })

  it('should handle empty search result items gracefully', () => {
    const statusMap: ApplicationClusterStatusMap = {
      [appSetKey]: { 'remote-1': makeEmptyStatuses() },
    }
    const resourceMap: PushModelResourceMap = new Map([
      ['remote-1/default/web', { appSetKey, targetCluster: 'remote-1' }],
    ])

    mergePushModelPodStatuses({ items: [], related: [] }, resourceMap, statusMap)

    const counts = statusMap[appSetKey]['remote-1'].deployed[StatusColumn.counts]
    const total =
      counts[ScoreColumn.healthy] +
      counts[ScoreColumn.danger] +
      counts[ScoreColumn.warning] +
      counts[ScoreColumn.progress]
    expect(total).toBe(0)
  })

  it('should handle search result with no Pod related kind', () => {
    const statusMap: ApplicationClusterStatusMap = {
      [appSetKey]: { 'remote-1': makeEmptyStatuses() },
    }
    const resourceMap: PushModelResourceMap = new Map([
      ['remote-1/default/web', { appSetKey, targetCluster: 'remote-1' }],
    ])
    const deployUid = 'deploy-uid'

    mergePushModelPodStatuses(
      {
        items: [makeSearchItem(deployUid, 'remote-1', 'default', 'web')],
        related: [{ kind: 'ReplicaSet', items: [] }],
      },
      resourceMap,
      statusMap
    )

    const counts = statusMap[appSetKey]['remote-1'].deployed[StatusColumn.counts]
    const total =
      counts[ScoreColumn.healthy] +
      counts[ScoreColumn.danger] +
      counts[ScoreColumn.warning] +
      counts[ScoreColumn.progress]
    expect(total).toBe(0)
  })

  it('should skip pods whose appSetKey has no entry in the status map', () => {
    const statusMap: ApplicationClusterStatusMap = {}
    const resourceMap: PushModelResourceMap = new Map([
      ['remote-1/default/web', { appSetKey, targetCluster: 'remote-1' }],
    ])
    const deployUid = 'deploy-uid'
    const searchResult = makeSearchResult(
      [makeSearchItem(deployUid, 'remote-1', 'default', 'web')],
      [makePod('pod-1', 'remote-1', 'default', 'web-aaa', 'Running', [deployUid])]
    )

    // Should not throw
    expect(() => mergePushModelPodStatuses(searchResult, resourceMap, statusMap)).not.toThrow()
  })

  it('should handle workloads from multiple appsets independently', () => {
    const appSetKeyA = 'appset/ns-a/appset-a'
    const appSetKeyB = 'appset/ns-b/appset-b'
    const statusMap: ApplicationClusterStatusMap = {
      [appSetKeyA]: { 'remote-1': makeEmptyStatuses() },
      [appSetKeyB]: { 'remote-2': makeEmptyStatuses() },
    }
    const resourceMap: PushModelResourceMap = new Map([
      ['remote-1/default/web-a', { appSetKey: appSetKeyA, targetCluster: 'remote-1' }],
      ['remote-2/default/web-b', { appSetKey: appSetKeyB, targetCluster: 'remote-2' }],
    ])
    const deployUidA = 'deploy-uid-a'
    const deployUidB = 'deploy-uid-b'
    const searchResult = makeSearchResult(
      [
        makeSearchItem(deployUidA, 'remote-1', 'default', 'web-a'),
        makeSearchItem(deployUidB, 'remote-2', 'default', 'web-b'),
      ],
      [
        makePod('pod-a', 'remote-1', 'default', 'web-a-aaa', 'Running', [deployUidA]),
        makePod('pod-b', 'remote-2', 'default', 'web-b-bbb', 'CrashLoopBackOff', [deployUidB]),
      ]
    )

    mergePushModelPodStatuses(searchResult, resourceMap, statusMap)

    expect(statusMap[appSetKeyA]['remote-1'].deployed[StatusColumn.counts][ScoreColumn.healthy]).toBe(1)
    expect(statusMap[appSetKeyA]['remote-1'].deployed[StatusColumn.counts][ScoreColumn.danger]).toBe(0)
    expect(statusMap[appSetKeyB]['remote-2'].deployed[StatusColumn.counts][ScoreColumn.healthy]).toBe(0)
    expect(statusMap[appSetKeyB]['remote-2'].deployed[StatusColumn.counts][ScoreColumn.danger]).toBe(1)
  })

  it('should match pods via ReplicaSet UID in the related chain', () => {
    const statusMap: ApplicationClusterStatusMap = {
      [appSetKey]: { 'remote-1': makeEmptyStatuses() },
    }
    const resourceMap: PushModelResourceMap = new Map([
      ['remote-1/default/web', { appSetKey, targetCluster: 'remote-1' }],
    ])
    const deployUid = 'deploy-uid'
    const rsUid = 'replicaset-uid'
    const searchResult = makeSearchResult(
      [makeSearchItem(deployUid, 'remote-1', 'default', 'web')],
      // Pod is related to BOTH the ReplicaSet and the Deployment
      [makePod('pod-1', 'remote-1', 'default', 'web-aaa', 'Running', [rsUid, deployUid])]
    )

    mergePushModelPodStatuses(searchResult, resourceMap, statusMap)

    expect(statusMap[appSetKey]['remote-1'].deployed[StatusColumn.counts][ScoreColumn.healthy]).toBe(1)
  })

  it('should handle search result items that do not match any resource map entry', () => {
    const statusMap: ApplicationClusterStatusMap = {
      [appSetKey]: { 'remote-1': makeEmptyStatuses() },
    }
    const resourceMap: PushModelResourceMap = new Map([
      ['remote-1/default/web', { appSetKey, targetCluster: 'remote-1' }],
    ])
    // Search returns a different deployment that is not in the resource map
    const unknownUid = 'unknown-deploy-uid'
    const searchResult = makeSearchResult(
      [makeSearchItem(unknownUid, 'remote-1', 'other-ns', 'other-deploy')],
      [makePod('pod-1', 'remote-1', 'other-ns', 'other-pod', 'Running', [unknownUid])]
    )

    mergePushModelPodStatuses(searchResult, resourceMap, statusMap)

    expect(statusMap[appSetKey]['remote-1'].deployed[StatusColumn.counts][ScoreColumn.healthy]).toBe(0)
  })

  it('should handle StatefulSet items the same as Deployments', () => {
    const statusMap: ApplicationClusterStatusMap = {
      [appSetKey]: { 'remote-1': makeEmptyStatuses() },
    }
    const resourceMap: PushModelResourceMap = new Map([
      ['remote-1/data-ns/db', { appSetKey, targetCluster: 'remote-1' }],
    ])
    const stsUid = 'sts-uid'
    const searchResult = makeSearchResult(
      [makeSearchItem(stsUid, 'remote-1', 'data-ns', 'db', 'StatefulSet')],
      [makePod('pod-1', 'remote-1', 'data-ns', 'db-0', 'Running', [stsUid])]
    )

    mergePushModelPodStatuses(searchResult, resourceMap, statusMap)

    expect(statusMap[appSetKey]['remote-1'].deployed[StatusColumn.counts][ScoreColumn.healthy]).toBe(1)
  })
})
