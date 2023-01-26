/* Copyright Contributors to the Open Cluster Management project */
import { CronJobApiVersion, CronJobKind } from './cronjob'
import { DaemonSetApiVersion, DaemonSetKind } from './daemonset'
import { DeploymentApiVersion, DeploymentKind } from './deployment'
import { DeploymentConfigApiVersion, DeploymentConfigKind } from './deployment-config'
import { JobApiVersion, JobKind } from './job'
import { IResource } from './resource'
import { StatefulSetApiVersion, StatefulSetKind } from './stateful-set'

export const OCPAppResourceApiVersion =
  CronJobApiVersion ||
  DaemonSetApiVersion ||
  DeploymentApiVersion ||
  DeploymentConfigApiVersion ||
  JobApiVersion ||
  StatefulSetApiVersion
export type OCPAppResourceApiVersionType = 'apps/v1' | 'batch/v1' | 'v1'
export const OCPAppResourceKind =
  CronJobKind || DaemonSetKind || DeploymentKind || DeploymentConfigKind || JobKind || StatefulSetKind
export type OCPAppResourceKindType = 'cronjob' | 'daemonSet' | 'deployment' | 'deploymentconfig' | 'job' | 'statefulset'
export interface OCPAppResource extends IResource {
  apiVersion: OCPAppResourceApiVersionType
  kind: OCPAppResourceKindType
  name: string
  namespace: string
  label: string
  status?: any
  transformed?: {
    clusterCount?: string
  }
}
