/* Copyright Contributors to the Open Cluster Management project */

import { ClusterPool, ClusterStatus, ManagedClusterSet } from '../../../../../resources'
import { AcmInlineStatusGroup } from '../../../../../ui-components'
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
        switch (cluster.status) {
            case ClusterStatus.ready:
                healthy++
                break
            case ClusterStatus.running:
                running++
                break
            case ClusterStatus.needsapproval:
                warning++
                break
            case ClusterStatus.creating:
            case ClusterStatus.destroying:
            case ClusterStatus.detaching:
            case ClusterStatus.stopping:
            case ClusterStatus.resuming:
            case ClusterStatus.prehookjob:
            case ClusterStatus.posthookjob:
            case ClusterStatus.importing:
                progress++
                break
            case ClusterStatus.failed:
            case ClusterStatus.provisionfailed:
            case ClusterStatus.deprovisionfailed:
            case ClusterStatus.notaccepted:
            case ClusterStatus.offline:
            case ClusterStatus.degraded:
            case ClusterStatus.prehookfailed:
            case ClusterStatus.posthookfailed:
            case ClusterStatus.importfailed:
                danger++
                break
            // temporary
            case ClusterStatus.hibernating:
                sleep++
                break
            case ClusterStatus.pending:
            case ClusterStatus.pendingimport:
                pending++
                break
            case ClusterStatus.unknown:
                unknown++
                break
            // detached clusters don't have a ManagedCluster
            case ClusterStatus.detached:
                detached++
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
