/* Copyright Contributors to the Open Cluster Management project */

import {
    ClusterDeploymentApiVersion,
    ClusterDeploymentKind,
    createProject,
    createResource,
    IResource,
    ManagedClusterApiVersion,
    ManagedClusterKind,
    clusterPoolNamespaceLabels,
    AgentClusterInstallKind,
} from '../resources'
import { get, keyBy } from 'lodash'
import { attachBMAs, syncBMAs } from './bare-metal-assets'
import { deleteResources } from './delete-resources'

export async function createCluster(resources: any[]) {
    // if creating a bare metal cluster
    // make sure all the bare metal assets exist

    let assets
    let errors: any[] = []
    const resourcesMap = keyBy(resources, 'kind')
    const hosts = get(resourcesMap, 'ClusterDeployment.spec.platform.baremetal.hosts')
    if (hosts) {
        ;({ assets, errors } = await syncBMAs(hosts, resources))
        if (errors.length) {
            return {
                status: 'ERROR',
                messages: errors,
            }
        }
    }

    // get namespace and filter out any namespace resource
    // get ClusterDeployment and filter it out to create at the very end
    let response
    let namespace = ''
    let labels = undefined
    const clusterResources: any = []
    resources = resources.filter((resource: any) => {
        const { kind, metadata = {}, spec = {} } = resource
        switch (kind) {
            case 'Namespace':
                namespace = metadata.name
                return false

            case 'ClusterPool':
                clusterResources.push(resource)
                ;({ namespace } = metadata)
                labels = clusterPoolNamespaceLabels
                return false

            case 'ClusterDeployment':
                clusterResources.push(resource)
                ;({ namespace } = metadata)
                return false

            case 'ManagedCluster':
                ;({ name: namespace } = metadata)
                break

            case 'HostedCluster':
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

    // create project and ignore if it already exists
    try {
        await createProject(namespace, labels).promise
    } catch (err) {
        if ((err as unknown as { code: number }).code !== 409) {
            return {
                status: 'ERROR',
                messages: [{ message: (err as Error).message }],
            }
        }
    }

    // create resources
    errors = []
    let results = resources.map((resource: any) => createResource(resource))
    response = await Promise.allSettled(results.map((result: any) => result.promise))
    response.forEach((result) => {
        if (result.status === 'rejected') {
            errors.push({ message: result.reason.message })
        }
    })

    // create cluster resources
    if (errors.length === 0 && clusterResources.length > 0) {
        results = clusterResources.map((resource: any) => createResource(resource))
        response = await Promise.allSettled(results.map((result) => result.promise))
        response.forEach((result) => {
            if (result.status === 'rejected') {
                errors.push({ message: result.reason.message })
            }
        })
    }

    // if there were errors, delete any cluster resources
    if (errors.length > 0) {
        let resourcesToDelete: IResource[] = []
        // if trying to create ManagedCluster, cleanup
        if (resources.find((r) => r.kind === ManagedClusterKind)) {
            resourcesToDelete = [
                {
                    apiVersion: ManagedClusterApiVersion,
                    kind: ManagedClusterKind,
                    metadata: { name: namespace },
                },
                {
                    apiVersion: ClusterDeploymentApiVersion,
                    kind: ClusterDeploymentKind,
                    metadata: { name: namespace, namespace },
                },
            ]
        }
        // if trying to create ClusterInstall, cleanup
        if (resources.find((r) => r.kind === AgentClusterInstallKind)) {
            resourcesToDelete = resources
                .filter((r) => r.apiVersion && r.kind && r.metadata?.name && r.metadata?.namespace)
                .map(
                    (r) =>
                        ({
                            apiVersion: r.apiVersion,
                            kind: r.kind,
                            metadata: { name: r.metadata.name, namespace: r.metadata.namespace },
                        } as IResource)
                )
        }

        try {
            await deleteResources(resourcesToDelete).promise
            return {
                status: 'ERROR',
                messages: errors,
            }
        } catch {
            return {
                status: 'ERROR',
                messages: errors,
            }
        }
    }
    // if this was a bare metal cluster mark the bare metal assets that are used
    else if (assets) {
        const clusterName = get(resourcesMap, 'ClusterDeployment.metadata.name')
        await attachBMAs(assets, hosts, clusterName, errors)
    }

    return {
        status: errors.length > 0 ? 'ERROR' : 'DONE',
        messages: errors.length > 0 ? errors : null,
    }
}
