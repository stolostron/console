/* Copyright Contributors to the Open Cluster Management project */
import { Cluster, ClusterStatus } from '../../../../../resources/utils'
import { Provider } from '../../../../../ui-components'

export enum ClusterAction {
  EditLabels = 'edit-labels',
  Upgrade = 'upgrade-cluster',
  SelectChannel = 'select-channel',
  Search = 'search-cluster',
  Import = 'import-cluster',
  Hibernate = 'hibernate-cluster',
  Resume = 'resume-cluster',
  Detach = 'detach-cluster',
  Destroy = 'destroy-cluster',
  EditAI = 'ai-edit',
  ScaleUpAI = 'ai-scale-up',
  DestroyHosted = 'destroy-hypershift-cluster',
  UpdateAutomationTemplate = 'update-automation-template',
  RemoveAutomationTemplate = 'remove-automation-template',
  DestroyManaged = 'destroy-managed-cluster',
  ImportHosted = 'import-hypershift-cluster',
}

function clusterSupportsAutomationTemplateChange(cluster: Cluster) {
  return (
    !!cluster.name && // name is set
    !!cluster.distribution?.ocp?.version && // is OpenShift
    cluster.labels?.cloud !== 'auto-detect' && // cloud label is set
    cluster.status === ClusterStatus.ready && // cluster is ready
    (!cluster.distribution?.isManagedOpenShift ||
      (cluster.distribution?.isManagedOpenShift && cluster.provider === Provider.azure)) && // is not managed OpenShift or ARO
    !cluster.distribution?.upgradeInfo?.isUpgrading && // is not currently upgrading
    cluster.provider !== Provider.ibm && // is not ROKS
    !cluster.isHostedCluster // is not HyperShift
  )
}

export function clusterDestroyable(cluster: Cluster) {
  if (cluster.isHive) {
    // hive clusters can be destroyed
    return true
  }

  if (cluster.isHypershift && (cluster.provider === Provider.hostinventory || cluster.provider === Provider.kubevirt)) {
    // BM hosted clusters & kubevirt can be destroyed
    return true
  }

  return false
}

export function clusterSupportsAction(
  cluster: Cluster,
  clusterAction: ClusterAction,
  isHypershiftUpdatesReady?: boolean
): boolean {
  if (!isHypershiftUpdatesReady) {
    isHypershiftUpdatesReady = false
  }
  switch (clusterAction) {
    case ClusterAction.EditLabels:
      return cluster.isManaged && cluster.status !== ClusterStatus.detaching
    case ClusterAction.Upgrade:
      return (
        !!cluster.name &&
        cluster.status === ClusterStatus.ready &&
        ((!!cluster.distribution?.upgradeInfo?.isReadyUpdates && !cluster?.isHostedCluster) ||
          (cluster.isHypershift && isHypershiftUpdatesReady))
      )
    case ClusterAction.SelectChannel:
      return (
        !!cluster.name &&
        cluster.status === ClusterStatus.ready &&
        !!cluster.distribution?.upgradeInfo?.isReadySelectChannels
      )
    case ClusterAction.Import:
      return cluster.status === ClusterStatus.detached
    case ClusterAction.Hibernate:
      return (
        cluster.hive.isHibernatable &&
        ![ClusterStatus.hibernating, ClusterStatus.resuming, ClusterStatus.stopping].includes(cluster.status)
      )
    case ClusterAction.Resume:
      return cluster.status === ClusterStatus.hibernating
    case ClusterAction.Search:
    case ClusterAction.Detach:
      return (
        cluster.isManaged &&
        ![
          ClusterStatus.detaching,
          ClusterStatus.hibernating,
          ClusterStatus.prehookfailed,
          ClusterStatus.prehookjob,
          ClusterStatus.stopping,
          ClusterStatus.resuming,
        ].includes(cluster.status)
      )
    case ClusterAction.DestroyManaged:
      return !cluster.isHive && cluster.isManaged && !cluster.isHostedCluster
    case ClusterAction.Destroy:
      return cluster.isHive && !(cluster.hive.clusterPool && !cluster.hive.clusterClaimName)
    case ClusterAction.EditAI:
      return (
        !!cluster.provider &&
        [Provider.hostinventory, Provider.nutanix].includes(cluster.provider) &&
        !cluster.isHypershift
      )
    case ClusterAction.ScaleUpAI:
      return (
        !!cluster.provider &&
        [Provider.hostinventory, Provider.nutanix].includes(cluster.provider) &&
        !cluster.isHypershift &&
        [ClusterStatus.pendingimport, ClusterStatus.ready, ClusterStatus.unknown].includes(cluster.status)
      )
    case ClusterAction.DestroyHosted:
      return cluster.isHypershift && cluster.status !== ClusterStatus.destroying
    case ClusterAction.ImportHosted:
      return cluster.isHypershift && cluster.status === ClusterStatus.pendingimport
    case ClusterAction.UpdateAutomationTemplate:
      return clusterSupportsAutomationTemplateChange(cluster)
    case ClusterAction.RemoveAutomationTemplate:
      return cluster.hasAutomationTemplate && !cluster.distribution?.upgradeInfo?.isUpgrading // is not currently upgrading
    default:
      return false
  }
}
