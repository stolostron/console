/* Copyright Contributors to the Open Cluster Management project */

import { uniqBy, get } from 'lodash'
import { getClusterName, addClusters } from './utils'
import { createReplicaChild } from './topologySubscription'

export function getAppSetTopology(application) {
    const links = []
    const nodes = []
    const { name, namespace, appSetClusters, appSetApps } = application
    const clusterNames = appSetClusters.map((cluster) => {
        return cluster.name
    })

    const appId = `application--${name}`
    nodes.push({
        name,
        namespace,
        type: 'applicationset',
        id: appId,
        uid: appId,
        specs: {
            isDesign: true,
            raw: application.app,
            allClusters: {
                isLocal: clusterNames.includes('local-cluster'),
                remoteCount: clusterNames.includes('local-cluster') ? clusterNames.length - 1 : clusterNames.length,
            },
            clusterNames,
            appSetApps,
        },
    })

    delete application.app.spec.apps

    // create placement node
    const placement = get(application, 'placement', '')
    const placementId = `member--placements--${namespace}--${name}`
    if (placement) {
        const {
            metadata: { name, namespace },
        } = placement

        nodes.push({
            name,
            namespace,
            type: 'placement',
            id: placementId,
            uid: placementId,
            specs: {
                isDesign: true,
                raw: placement,
            },
        })
        links.push({
            from: { uid: appId },
            to: { uid: placementId },
            type: '',
            specs: { isDesign: true },
        })
    }

    const clusterParentId = placement ? placementId : appId
    const clusterId = addClusters(clusterParentId, new Set(), null, clusterNames, clusterNames, links, nodes)
    const firstAppWithResourceStatus = appSetApps.find((app) => app.status.resources !== undefined)
    const resources = appSetApps.length > 0 ? get(firstAppWithResourceStatus, 'status.resources', []) : []

    resources.forEach((deployable) => {
        const { name: deployableName, namespace: deployableNamespace, kind, version, group } = deployable
        const type = kind.toLowerCase()

        const memberId = `member--member--deployable--member--clusters--${getClusterName(
            clusterId
        )}--${type}--${deployableNamespace}--${deployableName}`

        const raw = {
            metadata: {
                name: deployableName,
                namespace: deployableNamespace,
            },
            ...deployable,
        }

        let apiVersion = null
        if (version) {
            apiVersion = group ? `${group}/${version}` : version
        }
        if (apiVersion) {
            raw.apiVersion = apiVersion
        }

        const deployableObj = {
            name: deployableName,
            namespace: deployableNamespace,
            type,
            id: memberId,
            uid: memberId,
            specs: {
                isDesign: false,
                raw,
                parent: {
                    clusterId,
                },
            },
        }

        nodes.push(deployableObj)
        links.push({
            from: { uid: clusterId },
            to: { uid: memberId },
            type: '',
        })

        const template = { metadata: {} }
        // create replica subobject, if this object defines a replicas
        createReplicaChild(deployableObj, template, links, nodes)
    })

    return { nodes: uniqBy(nodes, 'uid'), links }
}
