/* Copyright Contributors to the Open Cluster Management project */
import { V1CustomResourceDefinitionCondition } from '@kubernetes/client-node'
import { IResource, ManagedCluster, ManagedClusterKind, SelfSubjectAccessReviewKind } from '../resources'
import { eventQueue, resetEventQueue } from './event-queue'
import { mockResources } from './mocks/mock-resources'

let resourceVersion = 0

let mockCluster: {
    [apiVersion: string]: { [kind: string]: { [namespace: string]: { [name: string]: IResource } } }
} = {}

function mockGetNamepaceMap(resource: IResource) {
    let kindMap = mockCluster[resource.apiVersion]
    if (!kindMap) {
        kindMap = {}
        mockCluster[resource.apiVersion] = kindMap
    }

    let namespaceMap = kindMap[resource.kind]
    if (!namespaceMap) {
        namespaceMap = {}
        kindMap[resource.kind] = namespaceMap
    }

    return namespaceMap
}

function mockGetResourceMap(resource: IResource) {
    const namespaceMap = mockGetNamepaceMap(resource)
    const namespace = resource.metadata?.namespace ?? ''
    let resourceMap = namespaceMap[namespace]
    if (!resourceMap) {
        resourceMap = {}
        namespaceMap[namespace] = resourceMap
    }
    return resourceMap
}

export function mockListResources(resource: IResource) {
    const resources: IResource[] = []
    const namespaceMap = mockGetNamepaceMap(resource)
    for (const namespace in namespaceMap) {
        const resourceMap = namespaceMap[namespace]
        for (const name in resourceMap) {
            resources.push(resourceMap[name])
        }
    }
    return resources
}

export function mockGetResource(resource: IResource) {
    if (!resource.metadata?.name) {
        throw new Error('resource does not have metadata')
    }
    const resourceMap = mockGetResourceMap(resource)
    return resourceMap[resource.metadata.name]
}

export function mockCreateResource(resource: IResource) {
    if (resource.kind === SelfSubjectAccessReviewKind) {
        return { ...resource, status: { allowed: true } }
    }

    if (!resource.metadata?.name) {
        throw new Error('resource does not have metadata')
    }

    const resourceMap = mockGetResourceMap(resource)

    const existingResource = resourceMap[resource.metadata.name]
    if (existingResource) {
        throw new Error('resource already exists')
    }

    resource.metadata.resourceVersion = (++resourceVersion).toString()
    resource.metadata.uid = Math.random().toString()
    resource.metadata.creationTimestamp = new Date(Date.now()).toISOString()

    resourceMap[resource.metadata.name] = resource

    eventQueue.push({ type: 'ADDED', resource })

    return resource
}

export function mockModifyResource(resource: IResource) {
    if (!resource.metadata?.name) {
        throw new Error('resource does not have metadata')
    }

    const resourceMap = mockGetResourceMap(resource)

    const existingResource = resourceMap[resource.metadata.name]
    if (!existingResource) {
        throw new Error('resource does not exist')
    }

    resource.metadata.resourceVersion = (++resourceVersion).toString()
    resourceMap[resource.metadata.name] = resource

    eventQueue.push({ type: 'MODIFIED', resource })
}

export function mockDeleteResource(resource: IResource) {
    if (!resource.metadata?.name) {
        throw new Error('resource does not have metadata')
    }

    const resourceMap = mockGetResourceMap(resource)

    const existingResource = resourceMap[resource.metadata.name]
    if (!existingResource) {
        throw new Error('resource does not exist')
    }

    resource.metadata.resourceVersion = (++resourceVersion).toString()
    resource.metadata.deletionTimestamp = new Date(Date.now()).toISOString()
    delete resourceMap[resource.metadata.name]

    eventQueue.push({ type: 'DELETED', resource })
}

let processTimeout: NodeJS.Timeout | undefined
export function startMockCluster() {
    mockCluster = {}
    stopMockCluster()
    resetEventQueue()
    initializeMock()
    processMockCluster()
}

export function initializeMock() {
    for (const resource of mockResources) {
        mockCreateResource(resource)
    }
    eventQueue.push({ type: 'LOADED' })
}

export function stopMockCluster() {
    if (processTimeout) {
        clearInterval(processTimeout)
        processTimeout = undefined
    }
}

export function processMockCluster() {
    for (const apiVersion in mockCluster) {
        const kindMap = mockCluster[apiVersion]
        for (const kind in kindMap) {
            const namespaceMap = kindMap[kind]
            for (const namespace in namespaceMap) {
                const resourceMap = namespaceMap[namespace]
                for (const name in resourceMap) {
                    const resource = resourceMap[name]
                    switch (resource.kind) {
                        case ManagedClusterKind:
                            processManagedCluster(resource as ManagedCluster)
                            break
                    }
                }
            }
        }
    }

    processTimeout = setTimeout(() => {
        processTimeout = undefined
        processMockCluster()
    }, 500)
}

export function processManagedCluster(managedCluster: ManagedCluster) {
    if (Math.random() > 0.2 && managedCluster.metadata.name !== 'local-cluster') return

    managedCluster = JSON.parse(JSON.stringify(managedCluster))

    let changed = false
    if (!managedCluster.status) {
        changed = true
        managedCluster.status = {
            allocatable: { cpu: '12', memory: '50000000Ki' },
            capacity: { cpu: '24', memory: '100000000Ki' },
            clusterClaims: [
                { name: 'id.k8s.io', value: 'local-cluster' },
                { name: 'kubeversion.open-cluster-management.io', value: 'v1.24.0+9546431' },
                { name: 'platform.open-cluster-management.io', value: 'AWS' },
                { name: 'product.open-cluster-management.io', value: 'OpenShift' },
                { name: 'controlplanetopology.openshift.io', value: 'HighlyAvailable' },
                { name: 'region.open-cluster-management.io', value: 'us-east-1' },
                { name: 'version.openshift.io', value: '4.11.0-rc.2' },
            ],
            conditions: [],
            version: { kubernetes: 'v1.24.0+9546431' },
        }
    }

    if (!managedCluster.status.conditions) {
        managedCluster.status.conditions = []
    }

    changed = updateConditions(
        [
            'HubAcceptedManagedCluster',
            'ManagedClusterImportSucceeded',
            'ManagedClusterJoined',
            'ManagedClusterConditionAvailable',
        ],
        managedCluster.status.conditions
    )

    if (changed) {
        mockModifyResource(managedCluster)
    }
}

function updateConditions(names: string[], conditions: V1CustomResourceDefinitionCondition[]) {
    let changed = false
    for (const conditionName of names) {
        changed = updateCondition(conditionName, conditions)
        if (changed) break
    }
    return changed
}

function updateCondition(name: string, conditions: V1CustomResourceDefinitionCondition[]) {
    let changed = false

    let condition: V1CustomResourceDefinitionCondition | undefined = conditions.find(
        (condition) => condition.type === name
    )
    if (!condition) {
        changed = true
        condition = {
            lastTransitionTime: new Date(Date.now()).toISOString() as unknown as Date,
            message: 'Message',
            reason: 'Reason',
            status: 'Unknown',
            type: name,
        }
        conditions.push(condition)
    } else {
        switch (condition.status) {
            case 'Unknown':
                changed = true
                condition.status = 'False'
                condition.lastTransitionTime = new Date(Date.now()).toISOString() as unknown as Date
                break
            case 'False':
                changed = true
                condition.status = 'True'
                condition.lastTransitionTime = new Date(Date.now()).toISOString() as unknown as Date
                break
        }
    }

    return changed
}
