/* Copyright Contributors to the Open Cluster Management project */
import { V1ObjectMeta } from '@kubernetes/client-node/dist/gen/model/v1ObjectMeta'
import { IResourceDefinition } from './resource'
import { getResource, listResources } from '../lib/resource-request'

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
            finished: Date
            started: Date
        }
    }
}

export function getAnsibleJob(metadata: { name: string; namespace: string }) {
    return getResource<AnsibleJob>({ apiVersion: AnsibleJobApiVersion, kind: AnsibleJobKind, metadata })
}

export function listAnsibleJobs() {
    return listResources<AnsibleJob>({
        apiVersion: AnsibleJobApiVersion,
        kind: AnsibleJobKind,
    })
}

export function getLatestAnsibleJob(ansibleJobs: AnsibleJob[], namespace: string) {
    console.log(ansibleJobs)
    const jobs = ansibleJobs.filter((job) => job.metadata.namespace === namespace)
    const prehookJobs = jobs.filter((job) => job.metadata.annotations?.jobtype === 'prehook')
    const posthookJobs = jobs.filter((job) => job.metadata.annotations?.jobtype === 'posthook')

    let latestPrehookJob = prehookJobs[0]
    let latestPosthookJob = posthookJobs[0]

    if (prehookJobs.length > 0) {
        prehookJobs.forEach((job) => {
            if (job.status?.ansibleJobResult?.started) {
                if (
                    new Date(job.status.ansibleJobResult.started).getTime() >
                    new Date(latestPrehookJob.status!.ansibleJobResult.started).getTime()
                ) {
                    latestPrehookJob = job
                }
            }
        })
    }

    if (posthookJobs.length > 0) {
        posthookJobs.forEach((job) => {
            if (job.status?.ansibleJobResult?.started) {
                if (
                    new Date(job.status.ansibleJobResult.started).getTime() >
                    new Date(latestPosthookJob.status!.ansibleJobResult.started).getTime()
                ) {
                    latestPosthookJob = job
                }
            }
        })
    }

    return {
        prehook: latestPrehookJob,
        posthook: latestPosthookJob,
    }
}
