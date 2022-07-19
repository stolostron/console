/* Copyright Contributors to the Open Cluster Management project */
import { IResource, ManagedCluster, ManagedClusterKind } from '../resources'
import { eventQueue, resetEventQueue } from './event-queue'
import { mockResources } from './mocks/mock-resources'

let resourceVersion = 0

export const mockCluster: {
    [apiVersion: string]: { [kind: string]: { [namespace: string]: { [name: string]: IResource } } }
} = {}

function mockGetResourceMap(resource: IResource) {
    if (!resource.metadata) throw new Error('resource does not have metadata')
    if (!resource.metadata.name) throw new Error('resource does not have metadata')

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

    const namespace = resource.metadata?.namespace ?? ''
    let resourceMap = namespaceMap[namespace]
    if (!resourceMap) {
        resourceMap = {}
        namespaceMap[namespace] = resourceMap
    }

    return resourceMap
}

export function mockCreateResource(resource: IResource) {
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
    resourceMap[resource.metadata.name] = resource

    eventQueue.push({ type: 'DELETED', resource })
}

let processTimeout: NodeJS.Timeout | undefined
export function startMockCluster() {
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
    }, 1000)
}

export function processManagedCluster(managedCluster: ManagedCluster) {
    // TODO update state
    mockModifyResource(managedCluster)
}
