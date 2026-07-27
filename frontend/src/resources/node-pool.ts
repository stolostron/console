/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const NodePoolApiVersion = 'hypershift.openshift.io/v1beta1'
export type NodePoolApiVersionType = 'hypershift.openshift.io/v1beta1'

export const NodePoolKind = 'NodePool'
export type NodePoolKindType = 'NodePool'

export const NodePoolDefinition: IResourceDefinition = {
  apiVersion: NodePoolApiVersion,
  kind: NodePoolKind,
}

export enum NodePoolConditionType {
  Ready = 'Ready',
  AllMachinesReady = 'AllMachinesReady',
  AllNodesHealthy = 'AllNodesHealthy',
  ValidGeneratedPayload = 'ValidGeneratedPayload',
  ValidReleaseImage = 'ValidReleaseImage',
  ValidPlatformImage = 'ValidPlatformImage',
  ValidMachineConfig = 'ValidMachineConfig',
  ValidArchPlatform = 'ValidArchPlatform',
  ValidPlatformConfig = 'ValidPlatformConfig',
  UpdatingVersion = 'UpdatingVersion',
  UpdatingConfig = 'UpdatingConfig',
  AutoscalingEnabled = 'AutoscalingEnabled',
  AutorepairEnabled = 'AutorepairEnabled',
  UpdateManagementEnabled = 'UpdateManagementEnabled',
  ReconciliationActive = 'ReconciliationActive',
  ReachedIgnitionEndpoint = 'ReachedIgnitionEndpoint',
  AWSSecurityGroupAvailable = 'AWSSecurityGroupAvailable',
  SupportedVersionSkew = 'SupportedVersionSkew',
}

export type NodePoolStatusType = 'error' | 'warning' | 'updating' | 'pending' | 'ok'

export interface NodePoolStatus {
  type: NodePoolStatusType
  statusText: string
  isReady: boolean
  conditions: NodePoolCondition[]
}

export interface NodePoolCondition {
  type: string
  status: string
  reason?: string
  message?: string
}

const ERROR_CONDITIONS: string[] = [
  NodePoolConditionType.ValidGeneratedPayload,
  NodePoolConditionType.ValidReleaseImage,
  NodePoolConditionType.ValidPlatformImage,
  NodePoolConditionType.ValidMachineConfig,
  NodePoolConditionType.ValidArchPlatform,
  NodePoolConditionType.ValidPlatformConfig,
  NodePoolConditionType.AWSSecurityGroupAvailable,
  NodePoolConditionType.ReconciliationActive,
]

const WARNING_CONDITIONS: string[] = [
  NodePoolConditionType.AllNodesHealthy,
  NodePoolConditionType.SupportedVersionSkew,
  NodePoolConditionType.ReachedIgnitionEndpoint,
]

function findCondition(conditions: NodePoolCondition[], conditionType: string): NodePoolCondition | undefined {
  return conditions.find((c) => c.type === conditionType)
}

export function getNodePoolStatus(nodePool: { status?: { conditions?: NodePoolCondition[] } }): NodePoolStatus {
  const conditions = nodePool.status?.conditions ?? []

  // Priority 1: Error — validation/config conditions with status: 'False'
  for (const errorType of ERROR_CONDITIONS) {
    const condition = findCondition(conditions, errorType)
    if (condition && condition.status === 'False') {
      return {
        type: 'error',
        statusText: condition.message || condition.reason || errorType,
        isReady: false,
        conditions,
      }
    }
  }

  // Priority 2: Warning
  const readyCondition = findCondition(conditions, NodePoolConditionType.Ready)
  const allMachinesReady = findCondition(conditions, NodePoolConditionType.AllMachinesReady)
  if (allMachinesReady && allMachinesReady.status === 'False' && readyCondition && readyCondition.status === 'True') {
    return {
      type: 'warning',
      statusText: allMachinesReady.message || allMachinesReady.reason || 'Not all machines ready',
      isReady: false,
      conditions,
    }
  }

  for (const warningType of WARNING_CONDITIONS) {
    const condition = findCondition(conditions, warningType)
    if (condition && condition.status === 'False') {
      return {
        type: 'warning',
        statusText: condition.message || condition.reason || warningType,
        isReady: false,
        conditions,
      }
    }
  }

  // Priority 3: Updating
  const updatingVersion = findCondition(conditions, NodePoolConditionType.UpdatingVersion)
  if (updatingVersion && updatingVersion.status === 'True') {
    return {
      type: 'updating',
      statusText: updatingVersion.message || 'Updating version',
      isReady: false,
      conditions,
    }
  }

  const updatingConfig = findCondition(conditions, NodePoolConditionType.UpdatingConfig)
  if (updatingConfig && updatingConfig.status === 'True') {
    return {
      type: 'updating',
      statusText: updatingConfig.message || 'Updating config',
      isReady: false,
      conditions,
    }
  }

  // Priority 4: Ready
  if (readyCondition && readyCondition.status === 'True') {
    return {
      type: 'ok',
      statusText: 'Ready',
      isReady: true,
      conditions,
    }
  }

  // Priority 5: Pending (Ready is False/Unknown or missing, no errors)
  return {
    type: 'pending',
    statusText: 'Pending',
    isReady: false,
    conditions,
  }
}

/**
 * Returns true if any node pool in the list is ready and running a version
 * older than the given target (typically the hosted control plane version).
 */
export function hasReadyNodePoolWithUpdate(
  nodePools: { status?: { conditions?: NodePoolCondition[]; version?: string } }[] | undefined,
  targetVersion: string | undefined
): boolean {
  if (!nodePools?.length || !targetVersion) return false
  return nodePools.some((np) => {
    if (!getNodePoolStatus(np).isReady) return false
    const npVersion = np.status?.version
    if (!npVersion) return false
    return compareNodePoolVersion(npVersion, targetVersion) < 0
  })
}

function compareNodePoolVersion(a: string, b: string): number {
  const aParts = a.split('.').map((s) => Number.parseInt(s, 10) || 0)
  const bParts = b.split('.').map((s) => Number.parseInt(s, 10) || 0)
  const len = Math.max(aParts.length, bParts.length)
  for (let i = 0; i < len; i++) {
    const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

export interface NodePool extends IResource {
  apiVersion: NodePoolApiVersionType
  kind: NodePoolKindType
  metadata: Metadata
  spec: {
    clusterName: string
    management: any
    platform: {
      aws?: {
        instanceProfile: string
        instanceType: string
        rootVolume: {
          size: number
          type: string
        }
        securityGroups: any[]
        subnet: {
          id: string
        }
      }
      type: string
    }
    release: {
      image: string
    }
    replicas?: number
    autoScaling?: {
      min: number
      max: number
    }
  }
  status?: {
    conditions?: {
      type: string
      status: string
      reason: string
      message: string
    }[]
    version: string
  }
}
