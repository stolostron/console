/* Copyright Contributors to the Open Cluster Management project */

import { ClusterPool, getClusterStatusType, ManagedClusterSet } from '../../../../../resources'
import { AcmInlineStatusGroup, StatusType } from '../../../../../ui-components'
import { useClusters } from './useClusters'

export function ClusterStatuses(props: {
  managedClusterSet?: ManagedClusterSet
  clusterPool?: ClusterPool
  isGlobalClusterSet?: boolean
}) {
  const clusters = useClusters(props.managedClusterSet, props.clusterPool, props.isGlobalClusterSet)
  let healthy = 0
  let running = 0
  let warning = 0
  let progress = 0
  let danger = 0
  let detached = 0
  let pending = 0
  let sleep = 0
  let unknown = 0

  clusters.forEach((cluster) => {
    switch (getClusterStatusType(cluster.status)) {
      case StatusType.healthy:
        healthy++
        break
      case StatusType.running:
        running++
        break
      case StatusType.warning:
        warning++
        break
      case StatusType.progress:
        progress++
        break
      case StatusType.danger:
        danger++
        break
      case StatusType.sleep:
        sleep++
        break
      case StatusType.pending:
        pending++
        break
      case StatusType.detached:
        detached++
        break
      case StatusType.draft: // No separate count for draft; they don't appear in ClusterPools anyway
      case StatusType.unknown:
      default:
        unknown++
        break
    }
  })

  return clusters.length === 0 ? (
    <>-</>
  ) : (
    <AcmInlineStatusGroup
      healthy={healthy}
      running={running}
      warning={warning}
      progress={progress}
      danger={danger}
      pending={pending}
      sleep={sleep}
      unknown={unknown}
      detached={detached}
    />
  )
}
