/* Copyright Contributors to the Open Cluster Management project */

import { listMCIs } from '../resources/managed-cluster-info'
import { createResource, replaceResource } from './resource-request'
import { syncBMAs, attachBMAs } from './bare-metal-assets'
import { createProject } from '../resources/project'
import { get, keyBy } from 'lodash'

export async function createCluster(resources: JsonArray) {
    // if creating a bare metal cluster
    // make sure all the bare metal assets exist
    let assets
    let errors = []
    const resourcesMap = keyBy(resources, 'kind')
    const hosts = get(resourcesMap, 'ClusterDeployment.spec.platform.baremetal.hosts')
    if (hosts) {
        ;({ assets, errors } = await syncBMAs(hosts, resources))
        if (errors.length) {
            return errors
        }
    }

    // get namespace and filter out any namespace resource
    // get ClusterDeployment and filter it out to create at the very end
    let response
    let namespace
    const clusterResources = []
    resources = resources.filter((resource) => {
        const { kind, metadata = {}, spec = {} } = resource
        switch (kind) {
            case 'Namespace':
                namespace = metadata.name
                return false

            case 'ClusterDeployment':
                clusterResources.push(resource)
                ;({ namespace } = metadata)
                return false

            case 'ManagedCluster':
                ;({ name: namespace } = metadata)
                break

            default:
                if (spec && spec.clusterNamespace) {
                    namespace = spec.clusterNamespace
                }
                break
        }
        return true
    })

    // make sure this cluster doesn't already exist
    response = await listMCIs().promise
    const clusterMap = keyBy(response, 'metadata.name')
    if (clusterMap[namespace]) {
        return {
            status: 'ERROR',
            messages: [{ message: `The ${namespace} cluster already exists` }],
        }
    }

    // create project
    try {
        await createProject(namespace).promise
    } catch (err) {
        if (err.code !== 409) {
            return {
                status: 'ERROR',
                messages: [{ message: err.message }],
            }
        }
    }

    // create cluster resources
    errors = []
    const replaces = []
    let results = resources.map((resource) => createResource(resource))
    response = await Promise.allSettled(results.map((result) => result.promise))
    response.forEach(({ status, reason }, inx) => {
        if (status === 'rejected') {
            if (reason.code === 409) {
                replaces.push(resources[inx])
            } else {
                errors.push({ message: reason.message })
            }
        }
    })

    // if the only errors were "already existing", rerplace those resources
    if (errors.length === 0 && replaces.length > 0) {
        results = replaces.map((resource) => replaceResource(resource))
        response = await Promise.allSettled(results.map((result) => result.promise))
        response.forEach(({ status, reason }, inx) => {
            if (status === 'rejected') {
                errors.push({ message: reason.message })
            }
        })
    }

    // create cluster resources
    if (errors.length === 0 && clusterResources.length > 0) {
        results = clusterResources.map((resource) => createResource(resource))
        response = await Promise.allSettled(results.map((result) => result.promise))
        response.forEach(({ status, reason }, inx) => {
            if (status === 'rejected') {
                errors.push({ message: reason.message })
            }
        })
    }

    // if this was a bare metal cluster mark the bare metal assets that are used
    if (errors.length === 0 && assets) {
        const clusterName = get(resourcesMap, 'ClusterDeployment.metadata.name')
        await attachBMAs(assets, hosts, clusterName, errors)
    }

    return {
        status: errors.length > 0 ? 'ERROR' : 'DONE',
        messages: errors.length > 0 ? errors : null,
    }
}
