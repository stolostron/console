/* Copyright Contributors to the Open Cluster Management project */
import { get, uniq, uniqBy } from 'lodash'
import { getClusterName, addClusters, processMultiples } from './utils'
import {
  createReplicaChild,
  createControllerRevisionChild,
  createDataVolumeChild,
  createVirtualMachineInstance,
} from './topologySubscription'

export function getArgoTopology(application, argoData, managedClusters) {
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
    // Argo app defined on remote cluster
    // set to empty string for now, depends on backend to provide argoapi from secrets
    const clusterName = getArgoDestinationCluster(destination, managedClusters, cluster)
    const remoteClusterDestination = ''
    clusterNames.push(clusterName)
    clusters.push({
      metadata: { name: clusterName, namespace: clusterName },
      remoteClusterDestination,
      status: 'ok',
    })
  } else {
    try {
      const clusterName = getArgoDestinationCluster(destination, managedClusters)
      clusterNames.push(clusterName)
      clusters.push({ metadata: { name: clusterName, namespace: clusterName }, destination, status: 'ok' })
    } catch {
      //logger.error(err)
    }
  }
  clusterNames = uniq(clusterNames)
  const relatedApps = topology ? topology.nodes[0].specs.relatedApps : undefined

  const appId = `application--${name}`
  nodes.push({
    name,
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

  processMultiples(resources).forEach((deployable) => {
    const {
      name: deployableName,
      namespace: deployableNamespace,
      kind,
      version,
      group,
      resourceCount,
      resources: deployableResources,
    } = deployable
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
        clustersNames: clusterNames,
        parent: {
          clusterId,
        },
        resources: deployableResources,
        resourceCount: resourceCount || 0 + clusterNames.length,
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
    createReplicaChild(deployableObj, clusterNames, template, links, nodes)

    createControllerRevisionChild(deployableObj, clusterNames, links, nodes)

    createDataVolumeChild(deployableObj, clusterNames, links, nodes)

    createVirtualMachineInstance(deployableObj, clusterNames, links, nodes)
  })

  return { nodes: uniqBy(nodes, 'uid'), links }
}

export function getArgoDestinationCluster(destination, managedClusters, cluster) {
  // cluster is the name of the managed cluster where the Argo app is defined
  let clusterName
  const serverApi = get(destination, 'server')
  if (serverApi) {
    if (serverApi === 'https://kubernetes.default.svc') {
      clusterName = cluster ? cluster : 'local-cluster'
    } else {
      const server = managedClusters.find((cls) => cls.kubeApiServer === serverApi)
      clusterName = server ? server.name : 'unknown'
    }
  } else {
    // target destination was set using the name property
    clusterName = get(destination, 'name', 'unknown')
    if (cluster && (clusterName === 'in-cluster' || clusterName === 'local-cluster')) {
      clusterName = cluster
    }

    if (clusterName === 'in-cluster') {
      clusterName = 'local-cluster'
    }
  }

  return clusterName
}
