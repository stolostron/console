/* Copyright Contributors to the Open Cluster Management project */

import { V1CustomResourceDefinitionCondition } from '@kubernetes/client-node'
import { Provider, StatusType } from '../../ui-components'
import {
  isDraft,
  getIsSNOCluster,
  getConsoleUrl as getConsoleUrlAI,
  getClusterApiUrl as getClusterApiUrlAI,
  AgentClusterInstallK8sResource,
  HostedClusterK8sResource,
  NodePoolK8sResource,
  ClusterDeploymentK8sResource,
} from '@openshift-assisted/ui-lib/cim'
import { CertificateSigningRequest, CSR_CLUSTER_LABEL } from '../certificate-signing-requests'
import { ClusterClaim } from '../cluster-claim'
import { ClusterCurator, isAutomationTemplate } from '../cluster-curator'
import { ClusterDeployment } from '../cluster-deployment'
import { ManagedCluster } from '../managed-cluster'
import { ManagedClusterInfo, NodeInfo, OpenShiftDistributionInfo, getRoles } from '../managed-cluster-info'
import { managedClusterSetLabel } from '../managed-cluster-set'
import { getLatest } from './utils'
import { AddonStatus, mapAddons } from './get-addons'
import { AgentClusterInstallKind } from '../agent-cluster-install'
import semver from 'semver'
import { TFunction } from 'react-i18next'
import { ClusterManagementAddOn, DiscoveredCluster, ManagedClusterAddOn } from '../'
import { HypershiftCloudPlatformType } from './constants'
import {
  checkCuratorLatestOperation,
  checkCuratorLatestFailedOperation,
  checkCuratorConditionFailed,
  getConditionMessage,
  checkCuratorConditionInProgress,
  checkCuratorConditionDone,
  checkForRequirementsMetConditionFailureReason,
  checkForCondition,
  getConditionReason,
} from './status-conditions'
import keyBy from 'lodash/keyBy'
import { Dictionary } from 'lodash'

export enum ClusterStatus {
  'pending' = 'pending',
  'destroying' = 'destroying',
  'creating' = 'creating',
  'notstarted' = 'notstarted',
  'provisionfailed' = 'provisionfailed',
  'deprovisionfailed' = 'deprovisionfailed',
  'failed' = 'failed',
  'detached' = 'detached',
  'detaching' = 'detaching',
  'notaccepted' = 'notaccepted',
  'needsapproval' = 'needsapproval',
  'pendingimport' = 'pendingimport',
  'importing' = 'importing',
  'ready' = 'ready',
  'offline' = 'offline',
  'hibernating' = 'hibernating',
  'stopping' = 'stopping',
  'resuming' = 'resuming',
  'degraded' = 'degraded',
  'unknown' = 'unknown',
  'prehookjob' = 'prehookjob',
  'prehookfailed' = 'prehookfailed',
  'posthookjob' = 'posthookjob',
  'posthookfailed' = 'posthookfailed',
  'importfailed' = 'importfailed',
  'draft' = 'draft',
  'running' = 'running',
  'upgradefailed' = 'upgradefailed',
}

export const getClusterStatusLabel = (status: ClusterStatus | undefined, t: TFunction) => {
  switch (status) {
    case ClusterStatus.creating:
      return t('status.creating')
    case ClusterStatus.degraded:
      return t('status.degraded')
    case ClusterStatus.deprovisionfailed:
      return t('status.deprovisionfailed')
    case ClusterStatus.destroying:
      return t('status.destroying')
    case ClusterStatus.detached:
      return t('status.detached')
    case ClusterStatus.detaching:
      return t('status.detaching')
    case ClusterStatus.draft:
      return t('status.draft')
    case ClusterStatus.failed:
      return t('status.failed')
    case ClusterStatus.hibernating:
      return t('status.hibernating')
    case ClusterStatus.importfailed:
      return t('status.importfailed')
    case ClusterStatus.importing:
      return t('status.importing')
    case ClusterStatus.needsapproval:
      return t('status.needsapproval')
    case ClusterStatus.notaccepted:
      return t('status.notaccepted')
    case ClusterStatus.notstarted:
      return t('status.notstarted')
    case ClusterStatus.offline:
      return t('status.offline')
    case ClusterStatus.pending:
      return t('status.pending')
    case ClusterStatus.pendingimport:
      return t('status.pendingimport')
    case ClusterStatus.prehookjob:
      return t('status.prehook')
    case ClusterStatus.posthookjob:
      return t('status.posthook')
    case ClusterStatus.posthookfailed:
      return t('status.posthookfailed')
    case ClusterStatus.prehookfailed:
      return t('status.prehookfailed')
    case ClusterStatus.provisionfailed:
      return t('status.provisionfailed')
    case ClusterStatus.ready:
      return t('status.ready')
    case ClusterStatus.resuming:
      return t('status.resuming')
    case ClusterStatus.running:
      return t('status.running')
    case ClusterStatus.stopping:
      return t('status.stopping')
    default:
      return t('status.unknown')
  }
}

export const getClusterStatusType = (clusterStatus: ClusterStatus): StatusType => {
  switch (clusterStatus) {
    case ClusterStatus.ready:
      return StatusType.healthy
    case ClusterStatus.running:
      return StatusType.running
    case ClusterStatus.needsapproval:
      return StatusType.warning
    case ClusterStatus.failed:
    case ClusterStatus.notstarted:
    case ClusterStatus.provisionfailed:
    case ClusterStatus.deprovisionfailed:
    case ClusterStatus.notaccepted:
    case ClusterStatus.offline:
    case ClusterStatus.degraded:
    case ClusterStatus.prehookfailed:
    case ClusterStatus.posthookfailed:
    case ClusterStatus.importfailed:
      return StatusType.danger
    case ClusterStatus.creating:
    case ClusterStatus.destroying:
    case ClusterStatus.detaching:
    case ClusterStatus.stopping:
    case ClusterStatus.resuming:
    case ClusterStatus.prehookjob:
    case ClusterStatus.posthookjob:
    case ClusterStatus.importing:
      return StatusType.progress
    case ClusterStatus.detached:
      return StatusType.detached
    case ClusterStatus.hibernating:
      return StatusType.sleep
    case ClusterStatus.unknown:
      return StatusType.unknown
    case ClusterStatus.draft:
      return StatusType.draft
    case ClusterStatus.pending:
    case ClusterStatus.pendingimport:
    default:
      return StatusType.pending
  }
}

export const getProvisionNotification = (status: ClusterStatus | undefined, t: TFunction) => {
  switch (status) {
    case ClusterStatus.creating:
      return t('provision.notification.creating')
    case ClusterStatus.deprovisionfailed:
      return t('provision.notification.deprovisionfailed')
    case ClusterStatus.destroying:
      return t('provision.notification.destroying')
    case ClusterStatus.provisionfailed:
      return t('provision.notification.provisionfailed')
    default:
      return ''
  }
}

export const getAlertTitle = (status: ClusterStatus | undefined, t: TFunction) => {
  switch (status) {
    case ClusterStatus.importfailed:
      return t('status.importfailed.alert.title')
    case ClusterStatus.notstarted:
      return t('status.notstarted.alert.title')
    case ClusterStatus.offline:
      return t('status.offline.alert.title')
    case ClusterStatus.posthookfailed:
      return t('status.posthookfailed.alert.title')
    case ClusterStatus.prehookfailed:
      return t('status.prehookfailed.alert.title')
    case ClusterStatus.provisionfailed:
      return t('status.provisionfailed.alert.title')
    case ClusterStatus.ready:
      return t('status.ready.alert.title')
    case ClusterStatus.resuming:
      return t('status.resuming.alert.title')
    case ClusterStatus.stopping:
      return t('status.stopping.alert.title')
    case ClusterStatus.upgradefailed:
      return t('status.upgradefailed.alert.title')
    default:
      return t('status.unknown.alert.title')
  }
}

export const clusterDangerStatuses = [
  ClusterStatus.notstarted,
  ClusterStatus.provisionfailed,
  ClusterStatus.deprovisionfailed,
  ClusterStatus.failed,
  ClusterStatus.offline,
  ClusterStatus.degraded,
  ClusterStatus.notaccepted,
  ClusterStatus.prehookfailed,
  ClusterStatus.posthookfailed,
  ClusterStatus.importfailed,
]

export type Cluster = {
  name: string
  displayName?: string
  namespace?: string
  uid: string
  status: ClusterStatus
  statusMessage?: string
  provider?: Provider
  distribution?: DistributionInfo
  acmDistribution?: ACMDistributionInfo
  microshiftDistribution?: MicroshiftDistributionInfo
  addons?: Addons
  labels?: Record<string, string>
  nodes?: Nodes
  kubeApiServer?: string
  consoleURL?: string
  acmConsoleURL?: string
  hasAutomationTemplate: boolean
  hive: {
    clusterPool?: string
    clusterPoolNamespace?: string
    isHibernatable: boolean
    secrets?: HiveSecrets
    clusterClaimName?: string
    lifetime?: string
  }
  isHive: boolean
  isManaged: boolean
  isCurator: boolean
  isHostedCluster: boolean
  isRegionalHubCluster: boolean
  clusterSet?: string
  owner: {
    createdBy?: string
    claimedBy?: string
  }
  isSNOCluster: boolean
  creationTimestamp?: string
  isHypershift: boolean
  kubeconfig?: string
  kubeadmin?: string
  hypershift?: {
    agent: boolean
    nodePools?: NodePoolK8sResource[]
    secretNames: string[]
    hostingNamespace: string
    isUpgrading?: boolean
    upgradePercentage?: string
  }
}

export type DistributionInfo = {
  k8sVersion?: string
  ocp?: OpenShiftDistributionInfo
  displayVersion?: string
  isManagedOpenShift: boolean
  upgradeInfo?: UpgradeInfo
}

export type ACMDistributionInfo = {
  version?: string
  channel?: string
}

export type MicroshiftDistributionInfo = {
  version?: string
}

export type HiveSecrets = {
  installConfig?: string
  pullSecret?: string
  kubeconfig?: string
  kubeadmin?: string
}

export type Nodes = {
  ready: number
  unhealthy: number
  unknown: number
  nodeList: NodeInfo[]
}

export type Addons = {
  available: number
  progressing: number
  degraded: number
  unknown: number
  addonList: ManagedClusterAddOn[]
}

export type UpgradeInfo = {
  isUpgrading: boolean
  isReadyUpdates: boolean
  upgradePercentage?: string
  upgradeFailed?: boolean
  hooksInProgress?: boolean
  hookFailed?: boolean
  posthookDidNotRun?: boolean
  latestJob: {
    conditionMessage?: string
    step?: CuratorCondition | undefined
  }
  currentVersion?: string
  desiredVersion?: string
  availableUpdates: string[]
  isReadySelectChannels: boolean
  isSelectingChannel?: boolean
  isUpgradeCuration?: boolean
  currentChannel?: string
  desiredChannel?: string
  availableChannels?: string[]
  prehooks?: {
    hasHooks: boolean
    inProgress: boolean
    success: boolean
    failed: boolean
  }
  posthooks?: {
    hasHooks: boolean
    inProgress: boolean
    success: boolean
    failed: boolean
  }
}

//** for testing only; allows mapping of partial data */
export function testMapClusters(params: Partial<Parameters<typeof mapClusters>[0]>) {
  const {
    clusterDeployments = [],
    managedClusterInfos = [],
    certificateSigningRequests = [],
    managedClusters = [],
    managedClusterAddOns = {},
    clusterManagementAddOns = [],
    clusterClaims = [],
    clusterCurators = [],
    agentClusterInstalls = [],
    hostedClusters = [],
    nodePools = [],
    discoveredClusters = [],
  } = params
  return mapClusters({
    clusterDeployments,
    managedClusterInfos,
    certificateSigningRequests,
    managedClusters,
    managedClusterAddOns,
    clusterManagementAddOns,
    clusterClaims,
    clusterCurators,
    agentClusterInstalls,
    hostedClusters,
    nodePools,
    discoveredClusters,
  })
}

export function mapClusters({
  clusterDeployments,
  managedClusterInfos,
  certificateSigningRequests,
  managedClusters,
  managedClusterAddOns: allManagedClusterAddOns,
  clusterManagementAddOns: allClusterManagementAddOns,
  clusterClaims,
  clusterCurators,
  agentClusterInstalls,
  hostedClusters,
  nodePools,
  discoveredClusters,
}: {
  clusterDeployments: ClusterDeployment[]
  managedClusterInfos: ManagedClusterInfo[]
  certificateSigningRequests: CertificateSigningRequest[]
  managedClusters: ManagedCluster[]
  managedClusterAddOns: Record<string, ManagedClusterAddOn[]>
  clusterManagementAddOns: ClusterManagementAddOn[]
  clusterClaims: ClusterClaim[]
  clusterCurators: ClusterCurator[]
  agentClusterInstalls: AgentClusterInstallK8sResource[]
  hostedClusters: HostedClusterK8sResource[]
  nodePools: NodePoolK8sResource[]
  discoveredClusters: DiscoveredCluster[]
}) {
  const mcs = managedClusters.filter((mc) => mc.metadata?.name) ?? []
  const cds = clusterDeployments.filter(
    // CDs with AgentCluster as owner are just meta objects for AI. We can ignore them.
    (cd) => (cd.metadata.ownerReferences ? !cd.metadata.ownerReferences.some((o) => o.kind === 'AgentCluster') : true)
  )
  const uniqueClusterNames = Array.from(
    new Set([
      ...cds.map((cd) => cd.metadata.name),
      ...managedClusterInfos.map((mc) => mc.metadata.name),
      ...mcs.map((mc) => mc.metadata.name),
      ...hostedClusters.map((hc) => hc.metadata?.name),
    ])
  )

  // create maps so we don't do a linear find on each of these
  // affecting performance on an environment with lots of clusters
  const agentClusterInstallsMap = keyBy(agentClusterInstalls, (install) => {
    return `${install.metadata?.namespace}/${install.metadata?.name}`
  })
  const clusterCuratorsMap1 = keyBy(clusterCurators, 'metadata.name')
  const clusterCuratorsMap2 = keyBy(clusterCurators, 'metadata.namespace')
  const managedClusterMap = keyBy(managedClusters, 'metadata.name')
  const clusterClaimsMap = keyBy(clusterClaims, 'spec.namespace')
  const clusterDeploymentsMap = keyBy(cds, 'metadata.name')
  const managedClusterInfosMap = keyBy(managedClusterInfos, 'metadata.name')
  const hostedClusterMap = keyBy(hostedClusters, 'metadata.name')
  const clusterManagementAddOns = keyBy(allClusterManagementAddOns, 'metadata.name')
  const discoveredClustersMap = keyBy(discoveredClusters, 'spec.displayName')

  return uniqueClusterNames.map((cluster) => {
    const clusterDeployment = clusterDeploymentsMap[cluster!]
    const managedCluster = managedClusterMap[cluster!]
    const clusterClaim = clusterClaimsMap[cluster!]
    const managedClusterInfo = managedClusterInfosMap[cluster!]
    const hostedCluster = hostedClusterMap[cluster!]
    const clusterCurator = clusterCuratorsMap2[cluster!] || clusterCuratorsMap1[cluster!]
    const managedClusterAddOns: ManagedClusterAddOn[] = allManagedClusterAddOns?.[cluster ?? ''] || []
    const agentClusterInstall =
      clusterDeployment?.spec?.clusterInstallRef &&
      agentClusterInstallsMap[
        `${clusterDeployment.metadata.namespace}/${clusterDeployment?.spec?.clusterInstallRef?.name}`
      ]
    const discoveredCluster = discoveredClustersMap[cluster!]

    return getCluster({
      managedClusterInfo,
      clusterDeployment,
      certificateSigningRequests,
      managedCluster,
      managedClusterAddOns,
      clusterManagementAddOns,
      clusterClaim,
      clusterCurator,
      agentClusterInstall,
      hostedCluster,
      nodePools,
      discoveredCluster,
    })
  })
}

export function getCluster({
  managedClusterInfo,
  clusterDeployment,
  certificateSigningRequests,
  managedCluster,
  managedClusterAddOns,
  clusterManagementAddOns,
  clusterClaim,
  clusterCurator,
  agentClusterInstall,
  hostedCluster,
  nodePools,
  discoveredCluster,
}: {
  managedClusterInfo?: ManagedClusterInfo
  clusterDeployment?: ClusterDeployment
  certificateSigningRequests?: CertificateSigningRequest[]
  managedCluster?: ManagedCluster
  managedClusterAddOns: ManagedClusterAddOn[]
  clusterManagementAddOns: Dictionary<ClusterManagementAddOn>
  clusterClaim?: ClusterClaim
  clusterCurator?: ClusterCurator
  agentClusterInstall?: AgentClusterInstallK8sResource
  hostedCluster?: HostedClusterK8sResource
  nodePools: NodePoolK8sResource[]
  discoveredCluster?: DiscoveredCluster
}): Cluster {
  const { status, statusMessage } = getClusterStatus(
    clusterDeployment,
    managedClusterInfo,
    certificateSigningRequests,
    managedCluster,
    clusterCurator,
    agentClusterInstall,
    hostedCluster
  )

  const clusterNodePools = nodePools?.filter(
    (np) =>
      np.spec.clusterName === hostedCluster?.metadata?.name &&
      np.metadata?.namespace === hostedCluster?.metadata?.namespace
  )

  const acmDistribution = getACMDistributionInfo(managedCluster)
  const consoleURL = getConsoleUrl(
    clusterDeployment,
    managedClusterInfo,
    managedCluster,
    agentClusterInstall,
    hostedCluster
  )

  return {
    name:
      clusterDeployment?.metadata.name ??
      managedCluster?.metadata.name ??
      managedClusterInfo?.metadata.name ??
      hostedCluster?.metadata?.name ??
      '',
    displayName:
      // clusterDeployment?.spec?.clusterPoolRef?.claimName ??
      clusterDeployment?.metadata.name ??
      managedCluster?.metadata.name ??
      managedClusterInfo?.metadata.name ??
      hostedCluster?.metadata?.name,
    namespace:
      clusterDeployment?.metadata.namespace ??
      hostedCluster?.metadata?.namespace ??
      managedClusterInfo?.metadata.namespace,
    uid:
      managedCluster?.metadata.uid ??
      clusterDeployment?.metadata.uid ??
      managedClusterInfo?.metadata.uid ??
      hostedCluster?.metadata?.uid ??
      '',
    status,
    statusMessage,
    provider: getProvider({
      managedClusterInfo,
      managedCluster,
      clusterDeployment,
      hostedCluster,
      agentClusterInstall,
      discoveredCluster,
    }),
    distribution: getDistributionInfo(managedClusterInfo, managedCluster, clusterDeployment, clusterCurator),
    acmDistribution,
    microshiftDistribution: getMicroshiftDistributionInfo(managedCluster),
    acmConsoleURL: getACMConsoleURL(acmDistribution.version, consoleURL),
    addons: getAddons(managedClusterAddOns, clusterManagementAddOns),
    labels: managedCluster?.metadata.labels ?? managedClusterInfo?.metadata.labels,
    nodes: getNodes(managedClusterInfo),
    kubeApiServer: getKubeApiServer(clusterDeployment, managedClusterInfo, agentClusterInstall),
    consoleURL: consoleURL,
    isHive: !!clusterDeployment && !hostedCluster,
    isHypershift: !!hostedCluster,
    isManaged: !!managedCluster || !!managedClusterInfo,
    isCurator: !!clusterCurator,
    hasAutomationTemplate: !!(clusterCurator && isAutomationTemplate(clusterCurator)),
    isHostedCluster: getIsHostedCluster(managedCluster),
    isSNOCluster: agentClusterInstall ? getIsSNOCluster(agentClusterInstall) : false,
    isRegionalHubCluster: getIsRegionalHubCluster(managedCluster),
    hive: getHiveConfig(clusterDeployment, clusterClaim),
    clusterSet:
      managedCluster?.metadata?.labels?.[managedClusterSetLabel] ||
      managedClusterInfo?.metadata?.labels?.[managedClusterSetLabel] ||
      clusterDeployment?.metadata?.labels?.[managedClusterSetLabel],
    owner: getOwner(clusterDeployment, clusterClaim),
    creationTimestamp:
      clusterDeployment?.metadata.creationTimestamp ??
      managedCluster?.metadata.creationTimestamp ??
      managedClusterInfo?.metadata.creationTimestamp,
    kubeconfig:
      clusterDeployment?.spec?.clusterMetadata?.adminKubeconfigSecretRef?.name ||
      hostedCluster?.status?.kubeconfig?.name,
    kubeadmin:
      clusterDeployment?.spec?.clusterMetadata?.adminPasswordSecretRef?.name ||
      hostedCluster?.status?.kubeadminPassword?.name,
    hypershift: hostedCluster
      ? {
          agent: !!hostedCluster.spec.platform?.agent,
          nodePools: clusterNodePools,
          secretNames: [hostedCluster.spec?.sshKey.name || '', hostedCluster.spec?.pullSecret?.name || ''].filter(
            (name) => !!name
          ),
          hostingNamespace: hostedCluster.metadata?.namespace || '',
          isUpgrading: getHCUpgradeStatus(hostedCluster),
          upgradePercentage: getHCUpgradePercent(hostedCluster),
        }
      : undefined,
  }
}

export function getOwner(clusterDeployment?: ClusterDeployment, clusterClaim?: ClusterClaim) {
  const userIdentity = 'open-cluster-management.io/user-identity'
  const cdUserIdentity = clusterDeployment?.metadata.annotations?.[userIdentity]
  const ccUserIdentity = clusterClaim?.metadata.annotations?.[userIdentity]

  const decode = (value?: string) => {
    if (!value) return undefined
    const buff = new Buffer(value, 'base64')
    return buff.toString('ascii')
  }

  return {
    createdBy: decode(cdUserIdentity),
    claimedBy: decode(ccUserIdentity),
  }
}

export function getHiveConfig(clusterDeployment?: ClusterDeployment, clusterClaim?: ClusterClaim): Cluster['hive'] {
  const isInstalled = clusterDeployment?.spec?.installed
  const hibernatingCondition = clusterDeployment?.status?.conditions?.find((c) => c.type === 'Hibernating')
  const supportsHibernation = hibernatingCondition?.status === 'False' && hibernatingCondition?.reason !== 'Unsupported'
  const isHibernatable = !!isInstalled && !!supportsHibernation

  return {
    isHibernatable,
    clusterPool: clusterDeployment?.spec?.clusterPoolRef?.poolName,
    clusterPoolNamespace: clusterDeployment?.spec?.clusterPoolRef?.namespace,
    // only include clusterClaimName if the claim is visible to user; used to filter from tables
    clusterClaimName: clusterClaim ? clusterDeployment?.spec?.clusterPoolRef?.claimName : undefined,
    secrets: {
      kubeconfig: clusterDeployment?.spec?.clusterMetadata?.adminKubeconfigSecretRef?.name,
      kubeadmin: clusterDeployment?.spec?.clusterMetadata?.adminPasswordSecretRef?.name,
      installConfig: clusterDeployment?.spec?.provisioning?.installConfigSecretRef?.name,
      pullSecret: clusterDeployment?.spec?.pullSecretRef?.name,
    },
    lifetime: clusterClaim?.spec?.lifetime,
  }
}

function getHostedClusterProvider(hostedCluster: HostedClusterK8sResource) {
  if (hostedCluster.spec?.platform?.agent) {
    return Provider.hostinventory
  }
  switch (hostedCluster.spec.platform.type) {
    case HypershiftCloudPlatformType.AWS:
      return Provider.aws
    case HypershiftCloudPlatformType.Azure:
      return Provider.azure
    case HypershiftCloudPlatformType.PowerVS:
      return Provider.ibmpower
    case HypershiftCloudPlatformType.KubeVirt:
      return Provider.kubevirt
    default:
      return Provider.hypershift
  }
}

export function getProvider({
  managedClusterInfo,
  managedCluster,
  clusterDeployment,
  hostedCluster,
  agentClusterInstall,
  discoveredCluster,
}: {
  managedClusterInfo?: ManagedClusterInfo
  managedCluster?: ManagedCluster
  clusterDeployment?: ClusterDeployment
  hostedCluster?: HostedClusterK8sResource
  agentClusterInstall?: AgentClusterInstallK8sResource
  discoveredCluster?: DiscoveredCluster
} = {}) {
  if (hostedCluster) return getHostedClusterProvider(hostedCluster)

  const clusterInstallRef = clusterDeployment?.spec?.clusterInstallRef
  if (clusterInstallRef?.kind === AgentClusterInstallKind) {
    return agentClusterInstall?.spec?.platformType === 'Nutanix' ? Provider.nutanix : Provider.hostinventory
  }

  const productClusterClaim = managedCluster?.status?.clusterClaims?.find(
    (claim) => claim.name === 'product.open-cluster-management.io'
  )
  const productLabel = (productClusterClaim?.value ?? '').toUpperCase()

  if (productLabel === 'MICROSHIFT') {
    return Provider.microshift
  }

  const cloudLabel = managedClusterInfo?.metadata?.labels?.['cloud']
  const platformClusterClaim = managedCluster?.status?.clusterClaims?.find(
    (claim) => claim.name === 'platform.open-cluster-management.io'
  )
  const hivePlatformLabel = clusterDeployment?.metadata?.labels?.['hive.openshift.io/cluster-platform']

  if (!cloudLabel && !platformClusterClaim && !hivePlatformLabel) {
    return undefined
  }

  let providerLabel = (
    hivePlatformLabel && hivePlatformLabel !== 'unknown'
      ? hivePlatformLabel
      : cloudLabel ?? platformClusterClaim?.value ?? ''
  ).toUpperCase()

  // Hosted clusters imported from a managed MCE cluster will not have provider set
  // Look it up from the corresponding DiscoveredCluster
  if (getIsHostedCluster(managedCluster) && providerLabel === 'OTHER') {
    if (discoveredCluster?.spec.isManagedCluster && discoveredCluster?.spec.cloudProvider) {
      providerLabel = discoveredCluster.spec.cloudProvider.toUpperCase()
    } else if (platformClusterClaim !== undefined) {
      providerLabel = platformClusterClaim.value.toUpperCase()
    }
  }

  let provider: Provider | undefined
  switch (providerLabel) {
    case 'OPENSTACK':
      provider = Provider.openstack
      break
    case 'AMAZON':
    case 'AWS':
    case 'EKS':
      provider = Provider.aws
      break
    case 'GOOGLE':
    case 'GKE':
    case 'GCP':
    case 'GCE':
      provider = Provider.gcp
      break
    case 'AZURE':
    case 'AKS':
      provider = Provider.azure
      break
    case 'IBM':
    case 'IKS':
      provider = Provider.ibm
      break
    case 'IBMPOWERPLATFORM':
      provider = Provider.ibmpower
      break
    case 'IBMZPLATFORM':
      provider = Provider.ibmz
      break
    case 'BAREMETAL':
      provider = Provider.baremetal
      break
    case 'VMWARE':
    case 'VSPHERE':
      provider = Provider.vmware
      break
    case 'ALIBABA':
    case 'ALICLOUD':
    case 'ALIBABACLOUD':
      provider = Provider.alibaba
      break
    case 'AUTO-DETECT':
      provider = undefined
      break
    case 'KUBEVIRT':
      provider = Provider.kubevirt
      break
    case 'OTHER':
    default:
      provider = Provider.other
  }
  return provider
}

export enum CuratorCondition {
  curatorjob = 'clustercurator-job',
  prehook = 'prehook-ansiblejob',
  monitor = 'activate-and-monitor',
  provision = 'hive-provisioning-job',
  import = 'monitor-import',
  posthook = 'posthook-ansiblejob',
  install = 'DesiredCuration: install',
  upgrade = 'DesiredCuration: upgrade',
}

export function getACMDistributionInfo(managedCluster?: ManagedCluster): ACMDistributionInfo {
  let version: string | undefined
  let channel: string | undefined

  if (managedCluster?.status?.clusterClaims) {
    version =
      managedCluster?.status?.clusterClaims?.find((claim) => claim.name === 'version.open-cluster-management.io')
        ?.value ?? undefined
    if (version) {
      channel = `release-` + version.substring(0, version.lastIndexOf('.'))
    }
  }

  return {
    version: version,
    channel: channel,
  }
}

export function getDistributionInfo(
  managedClusterInfo?: ManagedClusterInfo,
  managedCluster?: ManagedCluster,
  clusterDeployment?: ClusterDeployment,
  clusterCurator?: ClusterCurator
) {
  let k8sVersion: string | undefined
  let ocp: OpenShiftDistributionInfo | undefined
  let displayVersion: string | undefined

  const hasControlPlaneNodes = () => {
    const { nodeList } = getNodes(managedClusterInfo)
    const roleList = nodeList?.map((node: NodeInfo) => getRoles(node))
    const hasControlPlane = roleList.filter((roles) => {
      return roles.includes('control-plane') || roles.includes('master')
    })
    return hasControlPlane.length > 0
  }

  const productClaim: string | undefined = managedCluster?.status?.clusterClaims?.find(
    (cc) => cc.name === 'product.open-cluster-management.io'
  )?.value

  const isHostedCluster = getIsHostedCluster(managedCluster) || !hasControlPlaneNodes()

  let isManagedOpenShift = false // OSD (and ARO, ROKS once supported)
  let distributionValue = 'OpenShift'
  switch (productClaim) {
    case 'OpenShiftDedicated':
      distributionValue = 'OSD'
      isManagedOpenShift = true
      break
    case 'ROSA':
      distributionValue = isHostedCluster ? 'ROSA' : 'ROSA Classic'
      isManagedOpenShift = true
      break
    case 'ARO':
      distributionValue = 'ARO'
      isManagedOpenShift = true
      break
    case 'ROKS':
      isManagedOpenShift = true
      break
  }

  if (managedCluster) {
    const k8sVersionClaim = managedCluster.status?.clusterClaims?.find(
      (cc) => cc.name === 'kubeversion.open-cluster-management.io'
    )
    if (k8sVersionClaim) k8sVersion = k8sVersionClaim.value
    const versionClaim = managedCluster.status?.clusterClaims?.find((cc) => cc.name === 'version.openshift.io')
    if (versionClaim) displayVersion = `${distributionValue} ${versionClaim.value}`
  }

  if (managedClusterInfo) {
    k8sVersion = managedClusterInfo.status?.version
    ocp = managedClusterInfo.status?.distributionInfo?.ocp
    if (displayVersion === undefined) {
      displayVersion = ocp?.version ? `${distributionValue} ${ocp.version}` : k8sVersion
    }
  }

  if (clusterDeployment) {
    if (displayVersion === undefined) {
      const cdVersion = clusterDeployment.metadata.labels?.['hive.openshift.io/version-major-minor-patch']
      displayVersion = cdVersion ? `OpenShift ${cdVersion}` : undefined
    }
  }

  const upgradeInfo: UpgradeInfo = {
    isUpgrading: false,
    isReadyUpdates: false,
    upgradePercentage: '',
    upgradeFailed: false,
    hooksInProgress: false,
    hookFailed: false,
    latestJob: {
      conditionMessage: '',
      step: undefined,
    },
    currentVersion: undefined,
    desiredVersion: undefined,
    isReadySelectChannels: false,
    isSelectingChannel: false,
    isUpgradeCuration: false,
    currentChannel: undefined,
    desiredChannel: undefined,
    availableUpdates: [],
    availableChannels: [],
    prehooks: {
      hasHooks: false,
      inProgress: false,
      success: false,
      failed: false,
    },
    posthooks: {
      hasHooks: false,
      inProgress: false,
      success: false,
      failed: false,
    },
  }

  const versionRegex = /([\d]{1,5})\.([\d]{1,5})\.([\d]{1,5})/

  function isVersionGreater(versionX: string, versionY: string) {
    const matchesA = versionX.match(versionRegex)
    const matchesB = versionY.match(versionRegex)
    if (matchesA && matchesB && matchesA.length === 4 && matchesB.length === 4) {
      for (let index = 1; index < 4; index++) {
        const parsedMatchA = parseInt(matchesA[index], 10)
        const parsedMatchB = parseInt(matchesB[index], 10)
        if (parsedMatchA > parsedMatchB) {
          return true
        }
        if (parsedMatchA < parsedMatchB) {
          return false
        }
      }
      return false
    }
  }

  function isVersionEqual(versionX: string, versionY: string) {
    const matchesA = versionX.match(versionRegex)
    const matchesB = versionY.match(versionRegex)
    if (matchesA && matchesB && matchesA.length === 4 && matchesB.length === 4) {
      for (let index = 1; index < 4; index++) {
        const parsedMatchA = parseInt(matchesA[index], 10)
        const parsedMatchB = parseInt(matchesB[index], 10)
        if (parsedMatchA !== parsedMatchB) {
          return false
        }
      }
      return true
    }
  }
  const desiredVersion =
    managedClusterInfo?.status?.distributionInfo?.ocp?.desired?.version ||
    managedClusterInfo?.status?.distributionInfo?.ocp.desiredVersion || // backward compatibility
    ''
  const currentVersionMCI = managedClusterInfo?.status?.distributionInfo?.ocp.version
  const desiredVersionCC = clusterCurator?.spec?.upgrade?.desiredUpdate

  if (clusterCurator || managedClusterInfo) {
    // check that currentVersionMCI && desiredVersionCC && desiredVersion exist,
    // then validate that CC desiredVersion is greater than current MCI version
    // and that CC desiredVersion is greater than or equal to MCI desiredVersion
    const curatorUpgradeVersionValid =
      currentVersionMCI &&
      desiredVersionCC &&
      desiredVersion &&
      isVersionGreater(desiredVersionCC, currentVersionMCI) &&
      (isVersionEqual(desiredVersionCC, desiredVersion) || isVersionGreater(desiredVersionCC, desiredVersion))

    const curatorConditions = clusterCurator?.status?.conditions ?? []
    const isUpgradeCuration =
      clusterCurator?.spec?.desiredCuration === 'upgrade' ||
      checkCuratorLatestOperation(CuratorCondition.upgrade, curatorConditions) ||
      checkCuratorLatestFailedOperation(CuratorCondition.upgrade, curatorConditions)
    upgradeInfo.isUpgradeCuration = isUpgradeCuration
    upgradeInfo.hookFailed =
      checkCuratorLatestFailedOperation(CuratorCondition.upgrade, curatorConditions) &&
      (checkCuratorConditionFailed(CuratorCondition.prehook, curatorConditions) ||
        checkCuratorConditionFailed(CuratorCondition.posthook, curatorConditions))
    upgradeInfo.latestJob.conditionMessage = getConditionMessage(CuratorCondition.curatorjob, curatorConditions) || ''
    upgradeInfo.latestJob.step =
      isUpgradeCuration && checkCuratorLatestOperation(CuratorCondition.posthook, curatorConditions)
        ? CuratorCondition.posthook
        : CuratorCondition.prehook
    const curatorIsIdle = !checkCuratorConditionInProgress('clustercurator-job', curatorConditions)
    upgradeInfo.hooksInProgress =
      checkCuratorConditionInProgress(CuratorCondition.prehook, curatorConditions) ||
      checkCuratorConditionInProgress(CuratorCondition.posthook, curatorConditions)
    const curatorIsUpgrading = curatorUpgradeVersionValid && isUpgradeCuration && !curatorIsIdle
    const isSelectingChannel =
      isUpgradeCuration &&
      clusterCurator?.spec?.upgrade?.channel &&
      clusterCurator?.spec?.upgrade?.channel !== managedClusterInfo?.status?.distributionInfo?.ocp.channel &&
      !curatorIsIdle

    const upgradeDetailedMessage = getConditionMessage('monitor-upgrade', curatorConditions) || ''
    const percentageMatch = upgradeDetailedMessage.match(/\d+%/) || []
    upgradeInfo.upgradePercentage = percentageMatch.length > 0 && curatorIsUpgrading ? percentageMatch[0] : ''
    upgradeInfo.isSelectingChannel = !!isSelectingChannel
    upgradeInfo.isUpgrading =
      curatorIsUpgrading ||
      (!!desiredVersion && desiredVersion !== managedClusterInfo?.status?.distributionInfo?.ocp?.version)

    upgradeInfo.upgradeFailed =
      (!!desiredVersion &&
        desiredVersion !== managedClusterInfo?.status?.distributionInfo?.ocp?.version &&
        managedClusterInfo?.status?.distributionInfo?.ocp?.upgradeFailed) ??
      false

    upgradeInfo.availableUpdates =
      managedClusterInfo?.status?.distributionInfo?.ocp?.versionAvailableUpdates
        ?.map((versionRelease) => {
          return versionRelease.version || ''
        })
        .filter((version) => {
          return !!version
        }) || []

    const isAROClassic = productClaim === 'ARO' && !isHostedCluster

    const isReadyUpdates =
      upgradeInfo.availableUpdates &&
      upgradeInfo.availableUpdates.length > 0 &&
      !upgradeInfo.upgradeFailed &&
      (!isManagedOpenShift || isAROClassic) &&
      !upgradeInfo.isUpgrading &&
      curatorIsIdle
    upgradeInfo.isReadyUpdates = !!isReadyUpdates

    upgradeInfo.availableChannels = managedClusterInfo?.status?.distributionInfo?.ocp.desired?.channels || []
    const isReadySelectChannels =
      upgradeInfo.availableChannels &&
      upgradeInfo.availableChannels.length > 0 &&
      (!isManagedOpenShift || isAROClassic) &&
      !upgradeInfo.isSelectingChannel &&
      curatorIsIdle
    upgradeInfo.isReadySelectChannels = !!isReadySelectChannels

    upgradeInfo.prehooks = {
      hasHooks: (clusterCurator?.spec?.upgrade?.prehook ?? []).length > 0,
      inProgress: isUpgradeCuration && checkCuratorConditionInProgress('prehook-ansiblejob', curatorConditions),
      success: isUpgradeCuration && checkCuratorConditionDone('prehook-ansiblejob', curatorConditions),
      failed: isUpgradeCuration && checkCuratorConditionFailed('prehook-ansiblejob', curatorConditions),
    }
    upgradeInfo.posthooks = {
      hasHooks: (clusterCurator?.spec?.upgrade?.posthook ?? []).length > 0,
      inProgress: isUpgradeCuration && checkCuratorConditionInProgress('posthook-ansiblejob', curatorConditions),
      success: isUpgradeCuration && checkCuratorConditionDone('posthook-ansiblejob', curatorConditions),
      failed: isUpgradeCuration && checkCuratorConditionFailed('posthook-ansiblejob', curatorConditions),
    }
    upgradeInfo.currentVersion = managedClusterInfo?.status?.distributionInfo?.ocp?.version
    upgradeInfo.desiredVersion = curatorIsUpgrading ? clusterCurator?.spec?.upgrade?.desiredUpdate : desiredVersion
    upgradeInfo.currentChannel = managedClusterInfo?.status?.distributionInfo?.ocp?.channel
    upgradeInfo.desiredChannel = isSelectingChannel
      ? clusterCurator?.spec?.upgrade?.channel
      : upgradeInfo.currentChannel

    upgradeInfo.posthookDidNotRun =
      !upgradeInfo.isUpgrading &&
      checkCuratorLatestFailedOperation(CuratorCondition.upgrade, curatorConditions) &&
      upgradeInfo.posthooks?.hasHooks &&
      !upgradeInfo.posthooks?.success &&
      !upgradeInfo.posthooks?.failed
  }

  if (displayVersion) {
    return {
      k8sVersion,
      ocp,
      displayVersion,
      isManagedOpenShift,
      upgradeInfo,
    }
  }

  return undefined
}

function getMicroshiftDistributionInfo(managedCluster?: ManagedCluster): ACMDistributionInfo {
  return {
    version:
      managedCluster?.status?.clusterClaims?.find((claim) => claim.name === 'version.microshift.io')?.value ??
      undefined,
  }
}

export function getKubeApiServer(
  clusterDeployment?: ClusterDeployment,
  managedClusterInfo?: ManagedClusterInfo,
  agentClusterInstall?: AgentClusterInstallK8sResource
) {
  return (
    clusterDeployment?.status?.apiURL ??
    managedClusterInfo?.spec?.masterEndpoint ??
    // Temporary workaround until https://issues.redhat.com/browse/HIVE-1666
    getClusterApiUrlAI(clusterDeployment as ClusterDeploymentK8sResource, agentClusterInstall)
  )
}

const getHypershiftConsoleURL = (hostedCluster?: HostedClusterK8sResource) => {
  if (!hostedCluster) {
    return undefined
  }
  return `https://console-openshift-console.apps.${hostedCluster.metadata?.name}.${hostedCluster.spec?.dns.baseDomain}`
}

const getACMConsoleURL = (acmVersion: string | undefined, consoleURL: string | undefined) => {
  if (!acmVersion) {
    return undefined
  }
  if (semver.gte(acmVersion, '2.7.0')) {
    return consoleURL + '/multicloud/infrastructure/clusters/managed?perspective=acm'
  } else {
    return consoleURL?.replace('console-openshift', 'multicloud')
  }
}

export function getConsoleUrl(
  clusterDeployment?: ClusterDeployment,
  managedClusterInfo?: ManagedClusterInfo,
  managedCluster?: ManagedCluster,
  agentClusterInstall?: AgentClusterInstallK8sResource,
  hostedCluster?: HostedClusterK8sResource
) {
  const consoleUrlClaim = managedCluster?.status?.clusterClaims?.find(
    (cc) => cc.name === 'consoleurl.cluster.open-cluster-management.io'
  )
  if (consoleUrlClaim) return consoleUrlClaim.value
  return (
    clusterDeployment?.status?.webConsoleURL ??
    managedClusterInfo?.status?.consoleURL ??
    // Temporary workaround until https://issues.redhat.com/browse/HIVE-1666
    getConsoleUrlAI(clusterDeployment as ClusterDeploymentK8sResource, agentClusterInstall) ??
    getHypershiftConsoleURL(hostedCluster)
  )
}

export function getNodes(managedClusterInfo?: ManagedClusterInfo) {
  const nodeList: NodeInfo[] = managedClusterInfo?.status?.nodeList ?? []
  let ready = 0
  let unhealthy = 0
  let unknown = 0

  nodeList.forEach((node: NodeInfo) => {
    const readyCondition = node.conditions?.find((condition) => condition.type === 'Ready')
    switch (readyCondition?.status) {
      case 'True':
        ready++
        break
      case 'False':
        unhealthy++
        break
      case 'Unknown':
      default:
        unknown++
    }
  })
  return { nodeList, ready, unhealthy, unknown }
}

export function getAddons(addons: ManagedClusterAddOn[], clusterManagementAddons: Dictionary<ClusterManagementAddOn>) {
  let available = 0
  let progressing = 0
  let degraded = 0
  let unknown = 0

  const addonsStatus = mapAddons(clusterManagementAddons, addons)

  addonsStatus?.forEach((addon) => {
    switch (addon.status) {
      case AddonStatus.Available:
        available++
        break
      case AddonStatus.Progressing:
        progressing++
        break
      case AddonStatus.Degraded:
        degraded++
        break
      case AddonStatus.Unknown:
        unknown++
        break
      default:
        break
    }
  })

  return { addonList: addons, available, progressing, degraded, unknown }
}

export function getClusterStatus(
  clusterDeployment: ClusterDeployment | undefined,
  managedClusterInfo: ManagedClusterInfo | undefined,
  certificateSigningRequests: CertificateSigningRequest[] | undefined,
  managedCluster: ManagedCluster | undefined,
  clusterCurator: ClusterCurator | undefined,
  agentClusterInstall: AgentClusterInstallK8sResource | undefined,
  hostedCluster: HostedClusterK8sResource | undefined
) {
  let statusMessage: string | undefined

  // ClusterCurator status
  let ccStatus: ClusterStatus = ClusterStatus.pending
  if (clusterCurator) {
    const ccConditions: V1CustomResourceDefinitionCondition[] = clusterCurator.status?.conditions ?? []
    // ClusterCurator has not completed so loop through statuses
    if (
      clusterCurator?.spec?.desiredCuration === 'install' &&
      (!checkCuratorConditionDone(CuratorCondition.curatorjob, ccConditions) ||
        checkCuratorConditionFailed(CuratorCondition.curatorjob, ccConditions))
    ) {
      if (
        !checkCuratorConditionDone(CuratorCondition.prehook, ccConditions) &&
        (clusterCurator.spec?.install?.prehook?.length ?? 0) > 0
      ) {
        // Check if pre-hook is in progress or failed
        if (checkCuratorConditionFailed(CuratorCondition.prehook, ccConditions)) {
          ccStatus = ClusterStatus.prehookfailed
          statusMessage = getConditionMessage(CuratorCondition.prehook, ccConditions)
        } else {
          ccStatus = ClusterStatus.prehookjob
        }
      } else if (!checkCuratorConditionDone(CuratorCondition.monitor, ccConditions)) {
        ccStatus = checkCuratorConditionFailed(CuratorCondition.monitor, ccConditions)
          ? ClusterStatus.provisionfailed
          : checkCuratorConditionFailed(CuratorCondition.provision, ccConditions)
            ? ClusterStatus.provisionfailed
            : ClusterStatus.creating
      } else if (!checkCuratorConditionDone(CuratorCondition.import, ccConditions)) {
        // check if import is in progress or failed
        if (checkCuratorConditionFailed(CuratorCondition.import, ccConditions)) {
          ccStatus = ClusterStatus.importfailed
          statusMessage = getConditionMessage(CuratorCondition.import, ccConditions)
        } else {
          ccStatus = ClusterStatus.importing
        }
      } else if (
        !checkCuratorConditionDone(CuratorCondition.posthook, ccConditions) &&
        (clusterCurator.spec?.install?.posthook?.length ?? 0) > 0
      ) {
        // check if post-hook is in progress or failed
        if (checkCuratorConditionFailed(CuratorCondition.posthook, ccConditions)) {
          ccStatus = ClusterStatus.posthookfailed
          statusMessage = getConditionMessage(CuratorCondition.posthook, ccConditions)
        } else {
          ccStatus = ClusterStatus.posthookjob
        }
      }

      return { status: ccStatus, statusMessage }
    } else if (clusterDeployment) {
      // when curator is no longer installing, catch the prehook/posthook failure here
      if (clusterDeployment.metadata.deletionTimestamp) {
        ccStatus = ClusterStatus.destroying
      } else if (
        checkCuratorConditionFailed(CuratorCondition.curatorjob, ccConditions) &&
        checkCuratorLatestFailedOperation(CuratorCondition.install, ccConditions) &&
        (checkCuratorConditionFailed(CuratorCondition.prehook, ccConditions) ||
          checkCuratorConditionFailed(CuratorCondition.posthook, ccConditions))
      ) {
        if (!clusterDeployment.spec?.installed) {
          ccStatus = ClusterStatus.prehookfailed
        } else {
          ccStatus = ClusterStatus.posthookfailed
        }
        statusMessage = clusterCurator.status?.conditions[0].message
        return { status: ccStatus, statusMessage }
      }
    } else if (hostedCluster) {
      if (
        checkCuratorConditionFailed(CuratorCondition.curatorjob, ccConditions) &&
        checkCuratorLatestFailedOperation(CuratorCondition.install, ccConditions)
      ) {
        if (checkCuratorConditionFailed(CuratorCondition.prehook, ccConditions)) {
          ccStatus = ClusterStatus.prehookfailed
        } else if (checkCuratorConditionFailed(CuratorCondition.posthook, ccConditions)) {
          ccStatus = ClusterStatus.posthookfailed
        }
        statusMessage = clusterCurator.status?.conditions[0].message
        return { status: ccStatus, statusMessage }
      }
    }
  }

  if (hostedCluster) {
    if (hostedCluster?.metadata?.deletionTimestamp) {
      return { status: ClusterStatus.destroying }
    }
    const availableCondition = hostedCluster?.status?.conditions?.find((c: any) => c.type === 'Available')
    if (!availableCondition || availableCondition.status === 'False') {
      return { status: ClusterStatus.creating }
    }
  }

  // ClusterDeployment status
  let cdStatus = ClusterStatus.pendingimport
  if (clusterDeployment) {
    const cdConditions: V1CustomResourceDefinitionCondition[] = clusterDeployment?.status?.conditions ?? []
    //const hasInvalidImageSet = checkForCondition('ClusterImageSetNotFound', cdConditions)
    const hasInvalidImageSet = checkForRequirementsMetConditionFailureReason('ClusterImageSetNotFound', cdConditions)
    const hasInvalidInstallConfig = checkForRequirementsMetConditionFailureReason(
      'InstallConfigValidationFailed',
      cdConditions
    )
    const authenticationError = checkForCondition('AuthenticationFailure', cdConditions)
    const provisionFailed = checkForCondition('ProvisionFailed', cdConditions)
    const provisionLaunchError = checkForCondition('InstallLaunchError', cdConditions)
    const deprovisionLaunchError = checkForCondition('DeprovisionLaunchError', cdConditions)

    // deprovision failure
    if (deprovisionLaunchError) {
      cdStatus = ClusterStatus.deprovisionfailed

      // destroying
    } else if (clusterDeployment.metadata.deletionTimestamp) {
      cdStatus = ClusterStatus.destroying

      // provision failure
    } else if (provisionLaunchError) {
      cdStatus = ClusterStatus.provisionfailed

      // provision success
    } else if (clusterDeployment.spec?.installed) {
      cdStatus = ClusterStatus.detached
      const powerState = clusterDeployment?.status?.powerState
      if (powerState) {
        switch (powerState) {
          case 'Running':
            cdStatus =
              clusterDeployment.spec?.clusterPoolRef && !clusterDeployment.spec.clusterPoolRef.claimName
                ? ClusterStatus.running
                : ClusterStatus.detached
            break
          case 'Hibernating':
            cdStatus = ClusterStatus.hibernating
            break
          default: {
            if (clusterDeployment.spec.powerState === 'Hibernating') {
              cdStatus = ClusterStatus.stopping
              const readyCondition = clusterDeployment?.status?.conditions?.find((c) => c.type === 'Hibernating')
              statusMessage = readyCondition?.message
            } else {
              const readyCondition = clusterDeployment?.status?.conditions?.find((c) => c.type === 'Ready')
              statusMessage = readyCondition?.message
              if (clusterDeployment.spec.powerState === 'Running') {
                cdStatus = ClusterStatus.resuming
              } else if (
                !clusterDeployment.spec.powerState &&
                ['WaitingForNodes', 'PausingForClusterOperatorsToSettle', 'WaitingForClusterOperators'].includes(
                  powerState
                )
              ) {
                // spec.powerState is not set initially - most likely a new deployment that is almost ready
                cdStatus = ClusterStatus.running
              } else {
                cdStatus = ClusterStatus.unknown
              }
            }
          }
        }
      } else {
        const hibernatingCondition = clusterDeployment?.status?.conditions?.find((c) => c.type === 'Hibernating')
        // covers reason = Running or Unsupported
        if (hibernatingCondition?.status === 'True') {
          switch (hibernatingCondition?.reason) {
            case 'Resuming':
              cdStatus = ClusterStatus.resuming
              break
            case 'Stopping':
              cdStatus = ClusterStatus.stopping
              break
            case 'Hibernating':
              cdStatus = ClusterStatus.hibernating
              break
          }
        }
      }

      // provisioning - default
    } else if (!clusterDeployment.spec?.installed) {
      if (hasInvalidImageSet) {
        const invalidImageSetCondition = cdConditions.find(
          (c) => c.type === 'RequirementsMet' && c.reason === 'ClusterImageSetNotFound'
        )
        cdStatus = ClusterStatus.provisionfailed
        statusMessage = invalidImageSetCondition?.message
      } else if (hasInvalidInstallConfig) {
        const invalidInstallConfigCondition = cdConditions.find(
          (c) => c.type === 'RequirementsMet' && c.reason === 'InstallConfigValidationFailed'
        )
        cdStatus = ClusterStatus.notstarted
        statusMessage = invalidInstallConfigCondition?.message
      } else if (authenticationError) {
        const authenticationErrorCondition = cdConditions.find((c) => c.type === 'AuthenticationFailure')
        cdStatus = ClusterStatus.provisionfailed
        statusMessage = authenticationErrorCondition?.message
      } else if (provisionFailed) {
        const provisionFailedCondition = cdConditions.find((c) => c.type === 'ProvisionFailed')
        const currentProvisionRef = clusterDeployment.status?.provisionRef?.name ?? ''
        if (
          provisionFailedCondition?.message?.includes(currentProvisionRef) ||
          provisionFailedCondition?.reason === 'InvalidInstallConfig' ||
          provisionFailedCondition?.reason === 'FallbackInvalidInstallConfig'
        ) {
          cdStatus = ClusterStatus.provisionfailed
        } else {
          cdStatus = ClusterStatus.creating
        }
      } else if (isDraft(agentClusterInstall)) {
        cdStatus = ClusterStatus.draft
      } else {
        cdStatus = ClusterStatus.creating
      }
    }
  }

  // if mc doesn't exist, default to cd status
  if (!managedClusterInfo && !managedCluster) {
    return { status: cdStatus, statusMessage }

    // return the cd status when a hibernation state is detected
  } else if ([ClusterStatus.hibernating, ClusterStatus.resuming, ClusterStatus.stopping].includes(cdStatus)) {
    return { status: cdStatus, statusMessage }
  }

  const mc = managedCluster ?? managedClusterInfo!

  // ManagedCluster status
  let mcStatus = ClusterStatus.pending
  const mcConditions: V1CustomResourceDefinitionCondition[] = mc.status?.conditions ?? []
  const clusterAccepted = checkForCondition('HubAcceptedManagedCluster', mcConditions)
  const clusterJoined = checkForCondition('ManagedClusterJoined', mcConditions)
  const clusterAvailable = checkForCondition('ManagedClusterConditionAvailable', mcConditions)

  // detaching
  if (mc?.metadata.deletionTimestamp) {
    mcStatus = ClusterStatus.detaching

    // registration controller may not report status when in failed state
  } else if (mcConditions.length === 0) {
    mcStatus = ClusterStatus.failed

    // not accepted
  } else if (!clusterAccepted) {
    mcStatus = ClusterStatus.notaccepted

    // not joined
  } else if (!clusterJoined && !hostedCluster) {
    mcStatus = ClusterStatus.pendingimport

    // Check if cluster is being automatically imported or has failed automatic import
    const mcConditionImportSucceeded = mcConditions.find((c) => c.type === 'ManagedClusterImportSucceeded')
    if (mcConditionImportSucceeded?.status === 'False') {
      switch (mcConditionImportSucceeded.reason) {
        case 'ManagedClusterImporting':
          mcStatus = ClusterStatus.importing
          statusMessage = mcConditionImportSucceeded.message
          break
        case 'ManagedClusterImportFailed':
          mcStatus = ClusterStatus.importfailed
          statusMessage = mcConditionImportSucceeded.message
          break
      }
    }

    // check for respective csrs awaiting approval
    if (certificateSigningRequests && certificateSigningRequests.length) {
      const clusterCsrs =
        certificateSigningRequests?.filter((csr) => {
          return csr.metadata.labels?.[CSR_CLUSTER_LABEL] === mc.metadata.name
        }) ?? []
      const activeCsr = getLatest<CertificateSigningRequest>(clusterCsrs, 'metadata.creationTimestamp')
      if (activeCsr && !activeCsr?.status?.certificate) {
        mcStatus = ClusterStatus.needsapproval
      }
    }
  } else if (hostedCluster && !clusterAvailable) {
    // HC import
    const hcConditions = hostedCluster.status?.conditions ?? []
    const HostedClusterReadyStatus = hcConditions.find(
      (c) =>
        c.reason === 'HostedClusterAsExpected' ||
        (c.reason === 'AsExpected' && c.message === 'The hosted control plane is available')
    )

    if (managedCluster && HostedClusterReadyStatus?.status === 'True') {
      const stuckImport =
        checkForCondition('HubAcceptedManagedCluster', mcConditions) &&
        getConditionReason('HubAcceptedManagedCluster', mcConditions) === 'Error'
      if (stuckImport) {
        mcStatus = ClusterStatus.importfailed
        statusMessage = getConditionMessage('HubAcceptedManagedCluster', mcConditions)
      } else {
        mcStatus = ClusterStatus.importing
      }

      const mcConditionAvailable = mcConditions.find((c) => c.type === 'ManagedClusterConditionAvailable')
      if (mcConditionAvailable) {
        mcStatus = ClusterStatus.unknown
        statusMessage = mcConditionAvailable?.message
      }
    }
  } else {
    if (clusterAvailable) {
      mcStatus = ClusterStatus.ready
    } else {
      const clusterUnavailable = checkForCondition('ManagedClusterConditionAvailable', mcConditions, 'False')
      const managedClusterAvailableConditionMessage = mcConditions.find(
        (c) => c.type === 'ManagedClusterConditionAvailable'
      )
      mcStatus = clusterUnavailable ? ClusterStatus.offline : ClusterStatus.unknown
      statusMessage = managedClusterAvailableConditionMessage?.message
    }
  }

  // if the ManagedCluster is in failed state because the registration controller is unavailable
  if (mcStatus === ClusterStatus.failed) {
    return clusterDeployment && cdStatus !== ClusterStatus.detached
      ? { status: cdStatus, statusMessage } // show the ClusterDeployment status, as long as it exists and is not 'detached' (which is the ready state when there is no attached ManagedCluster)
      : { status: mcStatus, statusMessage }

    // if ManagedCluster has not joined or is detaching, show ClusterDeployment status
    // as long as it is not 'detached' (which is the ready state when there is no attached ManagedCluster,
    // so this is the case is the cluster is being detached but not destroyed)
  } else if (
    (mcStatus === ClusterStatus.detaching || !clusterJoined) &&
    clusterDeployment &&
    cdStatus !== ClusterStatus.detached
  ) {
    return { status: cdStatus, statusMessage }
  } else {
    return { status: mcStatus, statusMessage }
  }
}

export function getIsHostedCluster(managedCluster?: ManagedCluster) {
  const hostedClusterClaim = managedCluster?.status?.clusterClaims?.find(
    (claim) => claim.name === 'hostedcluster.hypershift.openshift.io'
  )

  if (
    managedCluster?.metadata.annotations &&
    managedCluster?.metadata.annotations['import.open-cluster-management.io/klusterlet-deploy-mode'] &&
    managedCluster?.metadata.annotations['import.open-cluster-management.io/klusterlet-deploy-mode'] === 'Hosted'
  ) {
    return true
  } else if (hostedClusterClaim !== undefined && hostedClusterClaim.value === 'true') {
    return true
  } else {
    return false
  }
}

export function getIsRegionalHubCluster(managedCluster?: ManagedCluster) {
  if (
    managedCluster?.metadata.labels &&
    managedCluster?.metadata.labels?.['feature.open-cluster-management.io/addon-multicluster-global-hub-controller'] &&
    managedCluster?.metadata.labels?.['feature.open-cluster-management.io/addon-multicluster-global-hub-controller'] ===
      'available'
  ) {
    return true
  } else {
    return false
  }
}

//Return true if HC is upgrading, false if HS is not upgrading, undefined if no info
export function getHCUpgradeStatus(hostedCluster?: HostedClusterK8sResource) {
  //Check whether the required version fields exist
  if (
    hostedCluster?.status?.version?.desired.image !== undefined ||
    hostedCluster?.status?.version?.history !== undefined
  ) {
    const desiredVersion = hostedCluster?.status?.version?.desired.image

    const pastVersions = hostedCluster?.status?.version?.history

    const mostRecentVersion = pastVersions[0].image
    //If desired version is > current version and progressing, HC is currently updating

    return desiredVersion !== mostRecentVersion || pastVersions[0].state === 'Partial'
  } else {
    return
  }
}

//Return the progress of an HC upgrade as a percentage
export function getHCUpgradePercent(hostedCluster?: HostedClusterK8sResource) {
  // Check if hostedCluster, status, and conditions are not null
  if (hostedCluster?.status?.conditions) {
    const iterator = hostedCluster.status.conditions.entries()
    let matches = null
    for (const condition of iterator) {
      if (
        !matches &&
        (condition[1].type == 'ClusterVersionSucceeding' || condition[1].type == 'ClusterVersionProgressing')
      ) {
        const regExp = /\(([^)]+)\)/
        matches = regExp.exec(condition[1].message || '')
        if (matches) {
          return matches[0]
        }
      }
    }
  }
  return ''
}
