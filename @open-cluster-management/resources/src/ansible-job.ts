/* Copyright Contributors to the Open Cluster Management project */
import { V1ObjectMeta } from '@kubernetes/client-node/dist/gen/model/v1ObjectMeta'
import { IResourceDefinition } from './resource'
import { getLatest } from './utils/utils'

export const AnsibleJobApiVersion = 'tower.ansible.com/v1alpha1'
export type AnsibleJobApiVersionType = 'tower.ansible.com/v1alpha1'

export const AnsibleJobKind = 'AnsibleJob'
export type AnsibleJobKindType = 'AnsibleJob'

export const AnsibleJobDefinition: IResourceDefinition = {
    apiVersion: AnsibleJobApiVersion,
    kind: AnsibleJobKind,
}

export interface AnsibleJob {
    apiVersion: AnsibleJobApiVersionType
    kind: AnsibleJobKindType
    metadata: V1ObjectMeta
    spec?: {
        extra_vars: {}
    }
    status?: {
        ansibleJobResult: {
            changed: boolean
            failed: boolean
            status: string
            url: string
            finished: string
            started: string
        }
    }
}

export function getLatestAnsibleJob(ansibleJobs: AnsibleJob[], namespace: string) {
    const jobs = ansibleJobs.filter((job) => job.metadata.namespace === namespace)

    const prehookJobs = getLatest<AnsibleJob>(
        jobs.filter((job) => job.metadata.annotations?.jobtype === 'prehook'),
        'status.ansibleJobResult.started'
    )
    const posthookJobs = getLatest<AnsibleJob>(
        jobs.filter((job) => job.metadata.annotations?.jobtype === 'posthook'),
        'status.ansibleJobResult.started'
    )

    return {
        prehook: prehookJobs,
        posthook: posthookJobs,
    }
}
