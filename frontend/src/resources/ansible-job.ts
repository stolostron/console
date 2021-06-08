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
            finished: string
            started: string
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

export function sortJobs(lhs:AnsibleJob, rhs:AnsibleJob){
    if(lhs.status?.ansibleJobResult?.started === undefined && rhs.status?.ansibleJobResult?.started === undefined)
        return 0

    if(lhs.status?.ansibleJobResult?.started === undefined)
        return -1

    if(rhs.status?.ansibleJobResult?.started === undefined)
        return 1

    return new Date (lhs.status.ansibleJobResult.started).getTime() - new Date(rhs.status.ansibleJobResult.started).getTime()

}

export function getLatestAnsibleJob(ansibleJobs: AnsibleJob[], namespace: string) {
    console.log(ansibleJobs)
    const jobs = ansibleJobs.filter((job) => job.metadata.namespace === namespace)
    const prehookJobs = jobs.filter((job) => job.metadata.annotations?.jobtype === 'prehook').sort(sortJobs)
    const posthookJobs = jobs.filter((job) => job.metadata.annotations?.jobtype === 'posthook').sort(sortJobs)


    return {
        prehook: prehookJobs.length >= 0 ? prehookJobs[0] : undefined,
        posthook: posthookJobs.length >= 0 ? posthookJobs[0] : undefined,
    }
}
