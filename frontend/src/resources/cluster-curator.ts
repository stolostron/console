/* Copyright Contributors to the Open Cluster Management project */
import { V1CustomResourceDefinitionCondition } from '@kubernetes/client-node/dist/gen/model/v1CustomResourceDefinitionCondition'
import { createResource, getResource, listResources, replaceResource } from './utils/resource-request'
import { IResourceDefinition } from './resource'
import { Metadata } from './metadata'
import { set } from 'lodash'
import { AnsibleJobTemplateType } from './ansible-job'

export const ClusterCuratorApiVersion = 'cluster.open-cluster-management.io/v1beta1'
export type ClusterCuratorApiVersionType = 'cluster.open-cluster-management.io/v1beta1'

export const ClusterCuratorKind = 'ClusterCurator'
export type ClusterCuratorKindType = 'ClusterCurator'

export type Curation = 'install' | 'upgrade' | 'scale' | 'destroy'

export type CuratorAction = {
  towerAuthSecret?: string
  prehook?: ClusterCuratorAnsibleJob[]
  posthook?: ClusterCuratorAnsibleJob[]
  jobMonitorTimeout?: number
}

type CuratorUpgradeAction = CuratorAction & {
  desiredUpdate?: string
  channel?: string
  upstream?: string
  monitorTimeout?: number
}

export const ClusterCuratorDefinition: IResourceDefinition = {
  apiVersion: ClusterCuratorApiVersion,
  kind: ClusterCuratorKind,
}

export interface ClusterCurator {
  apiVersion: ClusterCuratorApiVersionType
  kind: ClusterCuratorKindType
  metadata: Metadata
  spec?: {
    desiredCuration?: Curation
    install?: CuratorAction
    upgrade?: CuratorUpgradeAction
    inventory?: string
    scale?: CuratorAction
    destroy?: CuratorAction
  }
  status?: {
    conditions: V1CustomResourceDefinitionCondition[]
  }
}

export interface ClusterCuratorAnsibleJob {
  name: string
  type?: AnsibleJobTemplateType
  extra_vars?: Record<string, string>
  skip_tags?: string
  job_tags?: string
}

export function createClusterCurator(clusterCurator: ClusterCurator) {
  set(clusterCurator, 'metadata.labels["open-cluster-management"]', 'curator')
  return createResource<ClusterCurator>(clusterCurator)
}

export function getClusterCurator(metadata: { name: string; namespace: string }) {
  return getResource<ClusterCurator>({ apiVersion: ClusterCuratorApiVersion, kind: ClusterCuratorKind, metadata })
}

export function listClusterCurators() {
  return listResources<ClusterCurator>({
    apiVersion: ClusterCuratorApiVersion,
    kind: ClusterCuratorKind,
  })
}

export function getTemplateJobsNum(clusterCurator: ClusterCurator) {
  let num = 0
  if (clusterCurator.spec?.upgrade?.prehook) num += clusterCurator.spec?.upgrade?.prehook.length
  if (clusterCurator.spec?.upgrade?.posthook) num += clusterCurator.spec?.upgrade?.posthook.length
  if (clusterCurator.spec?.install?.prehook) num += clusterCurator.spec?.install?.prehook.length
  if (clusterCurator.spec?.install?.posthook) num += clusterCurator.spec?.install?.posthook.length
  if (clusterCurator.spec?.scale?.prehook) num += clusterCurator.spec?.scale?.prehook.length
  if (clusterCurator.spec?.scale?.posthook) num += clusterCurator.spec?.scale?.posthook.length
  if (clusterCurator.spec?.destroy?.prehook) num += clusterCurator.spec?.destroy?.prehook.length
  if (clusterCurator.spec?.destroy?.posthook) num += clusterCurator.spec?.destroy?.posthook.length

  return num
}

export function LinkAnsibleCredential(template: ClusterCurator, ansibleCredentialName: string) {
  const copy = JSON.parse(JSON.stringify(template)) as ClusterCurator

  if (!copy.spec) copy.spec = {}
  if (!copy.spec.install) copy.spec.install = {}
  if (!copy.spec.upgrade) copy.spec.upgrade = {}
  if (!copy.spec.scale) copy.spec.scale = {}
  if (!copy.spec.destroy) copy.spec.destroy = {}

  if (!copy.spec.install.towerAuthSecret) copy.spec.install.towerAuthSecret = ansibleCredentialName
  if (!copy.spec.upgrade.towerAuthSecret) copy.spec.upgrade.towerAuthSecret = ansibleCredentialName
  if (!copy.spec.scale.towerAuthSecret) copy.spec.scale.towerAuthSecret = ansibleCredentialName
  if (!copy.spec.destroy.towerAuthSecret) copy.spec.destroy.towerAuthSecret = ansibleCredentialName

  return replaceResource<ClusterCurator>(copy)
}

export function curatorActionHasJobs(curatorAction: CuratorAction | undefined) {
  return !!(curatorAction?.prehook?.length || curatorAction?.posthook?.length)
}

export function isAutomationTemplate(clusterCurator: ClusterCurator) {
  return getTemplateJobsNum(clusterCurator) > 0
}
