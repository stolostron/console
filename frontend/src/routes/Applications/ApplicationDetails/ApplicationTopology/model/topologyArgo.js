/* Copyright Contributors to the Open Cluster Management project */
import { get, uniq, uniqBy } from 'lodash'
import { getClusterName, addClusters } from './utils'
import { createReplicaChild } from './topologySubscription'

export function getArgoTopology(application, managedClusters, argoData) {
    const { topology, cluster } = argoData
    const links = []
    const nodes = []
    let name
    let namespace
    ;({ name, namespace } = application)
    const clusters = []
    let clusterNames = []
    const destination = get(application, 'app.spec.destination', [])
    if (cluster) {
        // set to empty string for now, depends on backend to provide argoapi from secrets
        const remoteClusterDestination = ''
        clusterNames.push(cluster)
        clusters.push({ metadata: { name: cluster, namespace: cluster }, remoteClusterDestination, status: 'ok' })
    } else {
        //serverDestinations.forEach((destination) => {
        try {
            let clusterName
            const serverApi = get(destination, 'server')
            if (serverApi) {
                const serverURI = new URL(serverApi)
                clusterName =
                    serverURI && serverURI.hostname && serverURI.hostname.split('.').length > 1
                        ? serverURI.hostname.split('.')[1]
                        : 'unknown'
                if (clusterName === 'default') {
                    // mark this as default cluster
                    clusterName = 'local-cluster'
                }
            } else {
                // target destination was set using the name property
                clusterName = get(destination, 'name', 'unknown')
            }
            clusterNames.push(clusterName)
            clusters.push({ metadata: { name: clusterName, namespace: clusterName }, destination, status: 'ok' })
        } catch (err) {
            //logger.error(err)
        }
        //})
    }
    clusterNames = uniq(clusterNames)
    const relatedApps = topology ? topology.nodes[0].specs.relatedApps : undefined

    const appId = `application--${name}`
    nodes.push({
        name: '',
        namespace,
        type: 'application',
        id: appId,
        uid: appId,
        specs: {
            isDesign: true,
            resourceCount: 0,
            raw: application.app,
            activeChannel: application.activeChannel,
            allSubscriptions: [],
            allChannels: [],
            allClusters: {
                isLocal: clusterNames.includes('local-cluster'),
                remoteCount: clusterNames.includes('local-cluster') ? clusterNames.length - 1 : clusterNames.length,
            },
            clusterNames,
            channels: application.channels,
            relatedApps,
        },
    })

    delete application.app.spec.apps

    // create cluster node
    const source = get(application, 'app.spec.source.path', '')
    const clusterId = addClusters(
        appId,
        null,
        source,
        clusterNames,
        uniqBy(clusters, 'metadata.name'),
        links,
        nodes,
        topology
    )
    const resources = get(application, 'app.status.resources', [])

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
