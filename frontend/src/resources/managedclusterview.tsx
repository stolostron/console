/* Copyright Contributors to the Open Cluster Management project */
import crypto from 'crypto'
import _ from 'lodash'
import { createResource, deleteResource, getResource } from './utils/resource-request'

export const ManagedClusterViewApiVersion = 'view.open-cluster-management.io/v1beta1'
export type ManagedClusterViewApiVersionType = 'view.open-cluster-management.io/v1beta1'

export const ManagedClusterViewKind = 'ManagedClusterView'
export type ManagedClusterViewKindType = 'ManagedClusterView'

export const ManagedClusterViewDefinition = {
    apiVersion: ManagedClusterViewApiVersion,
    kind: ManagedClusterViewKind,
}

export const ManagedClusterViewConditionType = 'Completed'
export const ManagedClusterViewApiGroup = 'view.open-cluster-management.io'
export const ManagedClusterViewVersion = 'v1beta1'
export const ManagedClusterViewResources = 'ManagedClusterViews'

export interface ManagedClusterView {
    apiVersion: ManagedClusterViewApiVersionType
    kind: ManagedClusterViewKindType
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
        scope: {
            resource: string
            name: string
            namespace?: string
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

function getManagedClusterView(metadata: { name: string; namespace: string }) {
    return getResource<ManagedClusterView>({
        apiVersion: ManagedClusterViewApiVersion,
        kind: ManagedClusterViewKind,
        metadata,
    })
}

function deleteManagedClusterView(metadata: { name: string; namespace: string }) {
    deleteResource<ManagedClusterView>({
        apiVersion: ManagedClusterViewApiVersion,
        kind: ManagedClusterViewKind,
        metadata,
    })
}

export async function fireManagedClusterView(
    clusterName: string,
    resourceKind: string,
    resourceApiVersion: string,
    resourceName: string,
    resourceNamespace?: string
) {
    if (
        clusterName !== 'local-cluster' &&
        (resourceKind.toLowerCase() === 'secret' || resourceKind.toLowerCase() === 'secrets')
    ) {
        // We do not allow users to view secrets as this could allow lesser permissioned users to get around RBAC.
        return [
            {
                message:
                    'Viewing managed cluster secrets is not allowed for security reasons. To view this secret, you must access it from the specific managed cluster.',
            },
        ]
    }

    const viewName = crypto
        .createHash('sha1')
        .update(`${clusterName}-${resourceName}-${resourceKind}`)
        .digest('hex')
        .substr(0, 63)
    // Try to get and return the managedClusterView if it exsits -> if not create one and poll
    const getResult = await getManagedClusterView({ namespace: clusterName, name: viewName })
        .promise.then((viewResponse) => {
            const isProcessing = _.get(viewResponse, 'status.conditions[0].type', undefined)
            const reason = _.get(viewResponse, 'status.conditions[0].reason', undefined)
            const message = _.get(viewResponse, 'status.conditions[0].message', undefined)
            if (isProcessing && reason) {
                if (isProcessing === 'Processing' && reason === 'GetResourceProcessing') {
                    return {
                        processing: isProcessing,
                        reason: reason,
                        result: viewResponse.status?.result,
                    }
                } else if (isProcessing === 'Processing' && reason !== 'GetResourceProcessing') {
                    return { message: message }
                }
            } else {
                return {
                    message:
                        'There was an error while getting the managed resource. Make sure the managed cluster is online and helthy, and that the work manager pod in namespace open-cluster-management-agent-addon is healthy ',
                }
            }
            deleteManagedClusterView({ namespace: clusterName, name: viewName })
        })
        .catch((err) => {
            return err
        })

    if (getResult && getResult.code >= 400) {
        const { apiGroup, version } = getGroupFromApiVersion(resourceApiVersion)
        const body: ManagedClusterView = {
            apiVersion: ManagedClusterViewApiVersion,
            kind: ManagedClusterViewKind,
            metadata: {
                name: viewName,
                namespace: clusterName,
                labels: {
                    viewName,
                },
            },
            spec: {
                scope: {
                    name: resourceName,
                    resource: apiGroup
                        ? `${resourceKind.toLowerCase()}.${version}.${apiGroup}`
                        : `${resourceKind.toLowerCase()}`,
                },
            },
        }
        // Only set namespace if not null
        if (resourceNamespace) {
            body.spec!.scope.namespace = resourceNamespace
        }
        return createResource<ManagedClusterView>(body)
            .promise.then(async () => {
                return pollManagedClusterView(viewName, clusterName)
            })
            .catch((err) => {
                console.error(err)
                return err
            })
    }
    return getResult
}

export async function pollManagedClusterView(viewName: string, clusterName: string): Promise<ManagedClusterView> {
    let retries = process.env.NODE_ENV === 'test' ? 0 : 20
    const poll = async (resolve: any, reject: any) => {
        getManagedClusterView({ namespace: clusterName, name: viewName })
            .promise.then((viewResponse) => {
                const isProcessing = _.get(viewResponse, 'status.conditions[0].type', undefined)
                const reason = _.get(viewResponse, 'status.conditions[0].reason', undefined)
                const message = _.get(viewResponse, 'status.conditions[0].message', undefined)
                if (isProcessing && reason) {
                    if (isProcessing === 'Processing' && reason === 'GetResourceProcessing') {
                        resolve({
                            processing: isProcessing,
                            reason: reason,
                            result: viewResponse.status?.result,
                        })
                    } else if (isProcessing === 'Processing' && reason !== 'GetResourceProcessing') {
                        reject({ message: message })
                    }
                } else {
                    reject({
                        message:
                            'There was an error while getting the managed resource. Make sure the managed cluster is online and helthy, and that the work manager pod in namespace open-cluster-management-agent-addon is healthy ',
                    })
                }
                deleteManagedClusterView({ namespace: clusterName, name: viewName })
            })
            .catch((err) => {
                if (retries-- > 0) {
                    setTimeout(poll, 100, resolve, reject)
                } else {
                    reject(err)
                }
            })
    }
    return new Promise(poll)
}
