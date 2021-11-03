/* Copyright Contributors to the Open Cluster Management project */
import crypto from 'crypto'
import _ from 'lodash'
import { createResource, deleteResource, getResource } from './utils/resource-request'

export const ManagedClusterActionApiVersion = 'action.open-cluster-management.io/v1beta1'
export type ManagedClusterActionApiVersionType = 'action.open-cluster-management.io/v1beta1'

export const ManagedClusterActionKind = 'ManagedClusterAction'
export type ManagedClusterActionKindType = 'ManagedClusterAction'

export const ManagedClusterActionDefinition = {
    apiVersion: ManagedClusterActionApiVersion,
    kind: ManagedClusterActionKind,
}

export const ManagedClusterActionConditionType = 'Completed'
export const ManagedClusterActionApiGroup = 'action.open-cluster-management.io'
export const ManagedClusterActionVersion = 'v1beta1'
export const ManagedClusterActionResources = 'managedclusteractions'

export interface ManagedClusterAction {
    apiVersion: ManagedClusterActionApiVersionType
    kind: ManagedClusterActionKindType
    metadata: {
        name?: string
        namespace?: string
        annotations?: {
            [key: string]: string
        }
        labels?: {
            [key: string]: string
        }
    }
    spec?: {
        cluster?: {
            name: string
        }
        type?: 'Action'
        actionType?: 'Update' | 'Delete'
        scope?: {
            resourceType: string
            namespace: string
        }
        kube?: {
            resource?: string
            name?: string
            namespace?: string
            template: Record<string, unknown>
        }
    }
    status?: {
        conditions?: Array<{
            lastTransitionTime: Date
            message: string
            reason: string
            status: string
            type: string
        }>
        result?: Record<string, unknown>
    }
}

function getGroupFromApiVersion(apiVersion: string) {
    if (apiVersion.indexOf('/') >= 0) {
        return { apiGroup: apiVersion.split('/')[0], version: apiVersion.split('/')[1] }
    }
    return { apiGroup: '', version: apiVersion }
}

export function getManagedClusterAction(metadata: { name: string; namespace: string }) {
    return getResource<ManagedClusterAction>({
        apiVersion: ManagedClusterActionApiVersion,
        kind: ManagedClusterActionKind,
        metadata,
    })
}

function deleteManagedClusterAction(metadata: { name: string; namespace: string }) {
    deleteResource<ManagedClusterAction>({
        apiVersion: ManagedClusterActionApiVersion,
        kind: ManagedClusterActionKind,
        metadata,
    })
}

export const fireManagedClusterAction = (
    actionType: 'Update' | 'Delete',
    clusterName: string,
    resourceKind: string,
    resourceApiVersion: string,
    resourceName: string,
    resourceNamespace: string,
    resourceBody?: any
) => {
    const actionName = crypto
        .createHash('sha1')
        .update(`${actionType}-${resourceName}-${resourceKind}`)
        .digest('hex')
        .substr(0, 63)
    const { apiGroup, version } = getGroupFromApiVersion(resourceApiVersion)
    return createResource<ManagedClusterAction>({
        apiVersion: ManagedClusterActionApiVersion,
        kind: ManagedClusterActionKind,
        metadata: {
            name: actionName,
            namespace: clusterName,
        },
        spec: {
            cluster: {
                name: clusterName,
            },
            type: 'Action',
            scope: {
                resourceType: apiGroup
                    ? `${resourceKind.toLowerCase()}.${version}.${apiGroup}`
                    : `${resourceKind.toLowerCase()}`,
                namespace: resourceNamespace,
            },
            actionType: actionType,
            kube: {
                resource: apiGroup
                    ? `${resourceKind.toLowerCase()}.${version}.${apiGroup}`
                    : `${resourceKind.toLowerCase()}`,
                name: resourceName,
                namespace: resourceNamespace,
                template: resourceBody,
            },
        },
    })
        .promise.then(async () => {
            return pollManagedClusterAction(actionName, clusterName)
        })
        .catch((err) => {
            console.error(err)
            return err
        })
}

export async function pollManagedClusterAction(actionName: string, clusterName: string): Promise<ManagedClusterAction> {
    let retries = process.env.NODE_ENV === 'test' ? 0 : 20
    const poll = async (resolve: any, reject: any) => {
        getManagedClusterAction({ namespace: clusterName, name: actionName })
            .promise.then((actionResponse) => {
                const isComplete = _.get(actionResponse, 'status.conditions[0].type', '')
                const isActionDone = _.get(actionResponse, 'status.conditions[0].reason', '')
                const actionMessage = _.get(actionResponse, 'status.conditions[0].message', '')
                if (isComplete === 'Completed' && isActionDone === 'ActionDone') {
                    resolve({
                        complete: isComplete,
                        actionDone: isActionDone,
                        message: actionMessage,
                        result: actionResponse.status?.result,
                    })
                } else if (isComplete === 'Completed' && isActionDone !== 'ActionDone') {
                    reject({ message: actionMessage })
                }
                deleteManagedClusterAction({ name: actionName, namespace: clusterName })
            })
            .catch((err) => {
                if (retries-- > 0) {
                    setTimeout(poll, 500, resolve, reject)
                } else {
                    reject(err)
                }
            })
    }
    return new Promise(poll)
}
