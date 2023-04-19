/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResourceDefinition } from './resource'
import { getLatest } from './utils/utils'

export const AnsibleJobApiVersion = 'tower.ansible.com/v1alpha1'
export type AnsibleJobApiVersionType = 'tower.ansible.com/v1alpha1'

export const AnsibleJobKind = 'AnsibleJob'
export type AnsibleJobKindType = 'AnsibleJob'

export type AnsibleJobTemplateType = 'Job' | 'Workflow'
export type AnsibleApiJobTemplateType = 'job_template' | 'workflow_job_template'

export const AnsibleJobDefinition: IResourceDefinition = {
  apiVersion: AnsibleJobApiVersion,
  kind: AnsibleJobKind,
}

export interface AnsibleJob {
  apiVersion: AnsibleJobApiVersionType
  kind: AnsibleJobKindType
  metadata: Metadata
  spec?: {
    extra_vars: {}
  }
  status?: {
    ansibleJobResult: {
      changed: boolean
      failed: boolean
      status: string
      url?: string
      finished: string
      started: string
    }
    conditions?: [
      {
        ansibleResult?: {
          changed?: number
          completion?: string
          failures?: number
          ok?: number
          skipped?: number
        }
        lastTransitionTime?: string
        message?: string
        reason?: string
        status?: string
        type?: string
      }
    ]
  }
}

export function getLatestAnsibleJob(ansibleJobs: AnsibleJob[], namespace: string) {
  const jobs = ansibleJobs.filter((job) => job.metadata.namespace === namespace)

  //  considers unstarted jobs that failed
  const failedUnstartedJob = jobs.filter(
    (job) => job.status?.ansibleJobResult?.status === 'error' && job.status?.ansibleJobResult?.started === undefined
  )
  const prehookJob = getLatest<AnsibleJob>(
    jobs.filter((job) => job.metadata.annotations?.jobtype === 'prehook'),
    'status.ansibleJobResult.started'
  )
  const posthookJob = getLatest<AnsibleJob>(
    jobs.filter((job) => job.metadata.annotations?.jobtype === 'posthook'),
    'status.ansibleJobResult.started'
  )

  if (failedUnstartedJob.length) {
    if (failedUnstartedJob[0].metadata?.annotations?.jobtype === 'prehook') {
      return {
        prehook: failedUnstartedJob[0],
        posthook: undefined,
      }
    } else {
      return {
        prehook: prehookJob,
        posthook: failedUnstartedJob[0],
      }
    }
  }

  return {
    prehook: prehookJob,
    posthook: posthookJob,
  }
}

export interface AnsibleTowerJobTemplateList {
  count?: number
  next?: string
  results: Array<AnsibleTowerJobTemplate>
}
export interface AnsibleTowerJobTemplate {
  name: string
  type?: AnsibleApiJobTemplateType
  description?: string
  id: string
}
