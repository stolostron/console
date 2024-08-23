/* Copyright Contributors to the Open Cluster Management project */

import R from 'ramda'
import _ from 'lodash'
import {
  addResourceToModel,
  checkNotOrObjects,
  getNameWithoutPodHash,
  getNameWithoutChartRelease,
  computeResourceName,
} from '../helpers/diagram-helpers'
import {
  getClusterName,
  getRouteNameWithoutIngressHash,
  updateAppClustersMatchingSearch,
  getResourcesClustersForApp,
  getNameWithoutVolumePostfix,
  getNameWithoutVMTypeHash,
  getVMNameWithoutPodHash,
} from '../helpers/diagram-helpers-utils'

///////////////////////////////////////////////////////////////////////////
////////////////////// CREATE MAP OF RELATED TYPES ///////////////////////
///////////////////////////////////////////////////////////////////////////

//creates a map with all related kinds for this app, not only pod types
export const addDiagramDetails = (resourceStatuses, resourceMap, isClusterGrouped, hasHelmReleases, topology) => {
  if (checkNotOrObjects(resourceStatuses, resourceMap)) {
    return resourceMap
  }
  let related = []
  if (resourceStatuses.data.searchResult.length > 1) {
    const searchResultArr = []

    resourceStatuses.data.searchResult.forEach((result) => {
      searchResultArr.push(..._.get(mapSingleApplication(_.cloneDeep(result)), 'related', []))
    })
    related = [...new Set(searchResultArr)]
  } else {
    related = _.get(mapSingleApplication(_.cloneDeep(resourceStatuses.data.searchResult[0])), 'related', [])
  }

  // store cluster objects and cluster names as returned by search; these are clusters related to the app
  const eqIgnoreCase = R.curry((a, b) => String(a).toLowerCase() === String(b).toLowerCase())

  const clustersObjects = getResourcesClustersForApp(
    R.find(R.propSatisfies(eqIgnoreCase('cluster'), 'kind'))(related) || {},
    topology.nodes
  )

  const clusterNamesList = R.sortBy(R.identity)(R.pluck('name')(clustersObjects))
  if (topology.nodes) {
    const appNode =
      _.find(
        topology.nodes,
        (node) => _.get(node, 'id', '').startsWith('application--') && _.get(node, 'type', '') === 'application'
      ) || {}
    const hasMultipleSubs = _.get(appNode, 'specs.allSubscriptions', []).length > 1

    topology.nodes.forEach((node) => {
      if (node.type === 'cluster') {
        // only do this for Argo clusters
        //cluster node, set search found clusters objects here
        updateAppClustersMatchingSearch(node, clustersObjects)
      }
      const nodeClusters = node.type === 'subscription' ? clusterNamesList : _.get(node, 'specs.clustersNames')
      _.set(
        node,
        'specs.searchClusters',
        hasMultipleSubs && node.type !== 'application'
          ? _.filter(clustersObjects, (cls) => _.includes(nodeClusters, _.get(cls, 'name', '')))
          : clustersObjects // get all search clusters when one cluster node or this is the main app node
      )
    })
    // set clusters status on the app node
    // we have all clusters information here
    const appNodeSearchClusters = _.get(appNode, 'specs.searchClusters', [])
    // search returns clusters information, use it here
    const isLocal = _.find(appNodeSearchClusters, (cls) => _.get(cls, 'name', '') === 'local-cluster') ? true : false
    _.set(appNode, 'specs.allClusters', {
      isLocal,
      remoteCount: isLocal ? appNodeSearchClusters.length - 1 : appNodeSearchClusters.length,
    })
  }
  let podIndex = _.findIndex(related, ['kind', 'pod'])
  // Also need to check uppercase due to search inconsistency
  if (podIndex === -1) {
    podIndex = _.findIndex(related, ['kind', 'Pod'])
  }
  //move pods last in the related to be processed after all resources producing pods have been processed
  //we want to add the pods to the map by using the pod hash
  let orderedList =
    podIndex === -1
      ? related
      : _.concat(_.slice(related, 0, podIndex), _.slice(related, podIndex + 1), related[podIndex])
  orderedList = _.pullAllBy(orderedList, [{ kind: 'deployable' }, { kind: 'cluster' }], 'kind')
  // Need to do it again for uppercase
  orderedList = _.pullAllBy(orderedList, [{ kind: 'Deployable' }, { kind: 'Cluster' }], 'kind')
  orderedList.forEach((kindArray) => {
    const relatedKindList = R.pathOr([], ['items'])(kindArray)
    for (let i = 0; i < relatedKindList.length; i++) {
      const { kind, cluster } = relatedKindList[i]

      if (kind.toLowerCase() === 'replicaset' && relatedKindList[i].desired === 0) {
        // skip old replicasets
        continue
      }
      //look for pod template hash and remove it from the name if there
      let { nameNoHash, deployableName } = getNameWithoutPodHash(relatedKindList[i])

      if (isVirtualMachineResource(relatedKindList[i].label)) {
        // handle vm resources differently
        switch (kind) {
          case 'PersistentVolumeClaim':
          case 'DataVolume':
            nameNoHash = getNameWithoutVolumePostfix(nameNoHash)
            break
          case 'ControllerRevision':
            nameNoHash = getNameWithoutVMTypeHash(relatedKindList[i])
            break
          case 'Pod':
            nameNoHash = getVMNameWithoutPodHash(relatedKindList[i])
        }
      }

      //for routes generated by Ingress, remove route name hash
      const nameNoHashIngressPod = getRouteNameWithoutIngressHash(relatedKindList[i], nameNoHash)

      const nameWithoutChartRelease = getNameWithoutChartRelease(
        relatedKindList[i],
        nameNoHashIngressPod,
        hasHelmReleases
      )

      let resourceName = computeResourceName(
        relatedKindList[i],
        deployableName,
        nameWithoutChartRelease,
        isClusterGrouped
      )

      if (
        kind.toLowerCase() === 'subscription' &&
        cluster === 'local-cluster' &&
        _.get(relatedKindList[i], 'localPlacement', '') === 'true' &&
        _.endsWith(resourceName, '-local')
      ) {
        //match local hub subscription after removing -local suffix
        resourceName = _.trimEnd(resourceName, '-local')
      }

      const resourceMapForObject = Object.values(resourceMap).find(({ name, namespace, type, specs = {} }) => {
        const replacedType = type === 'project' ? 'namespace' : type
        if (specs.resources) {
          if (
            replacedType === relatedKindList[i].kind.toLowerCase() &&
            (specs.clustersNames || []).includes(relatedKindList[i].cluster)
          ) {
            return (
              (specs.resources || []).findIndex((spec) => {
                return spec.name === nameNoHash && spec.namespace === relatedKindList[i].namespace
              }) !== -1
            )
          } else {
            return false
          }
        } else {
          return (
            (kind.toLowerCase() === 'subscription' ? name === resourceName : name === nameNoHash) &&
            namespace === relatedKindList[i].namespace &&
            replacedType === relatedKindList[i].kind.toLowerCase() &&
            ((specs.clustersNames || []).includes(relatedKindList[i].cluster) ||
              (specs.searchClusters || []).find((cls) => cls.name === relatedKindList[i].cluster) ||
              relatedKindList[i].cluster === 'local-cluster') // fallback to searchclusters if SubscriptionReport is not created
          )
        }
      })
      if (resourceMapForObject) {
        addResourceToModel(resourceMapForObject, kind, relatedKindList[i], nameWithoutChartRelease)
      }
    }
  })

  // need to preprocess and sync up podStatusMap for controllerrevision to parent
  syncControllerRevisionPodStatusMap(resourceMap)
  return resourceMap
}

export const mapSingleApplication = (application) => {
  const items = (application ? _.get(application, 'items', []) : []) || []

  const result =
    items.length > 0
      ? _.cloneDeep(items[0])
      : {
          name: '',
          namespace: '',
          dashboard: '',
          selfLink: '',
          _uid: '',
          created: '',
          apigroup: '',
          cluster: '',
          kind: '',
          label: '',
          _hubClusterResource: '',
          _rbac: '',
          related: [],
        }

  result.related = application ? application.related || [] : []

  items.forEach((item) => {
    //if this is an argo app, the related kinds query should be built from the items section
    //for argo we ask for namespace:targetNamespace label:appLabel kind:<comma separated string of resource kind>
    //this code moves all these items under the related section
    const kind = _.get(item, 'kind')
    const cluster = _.get(item, 'cluster')
    const label = _.get(item, 'label', '')

    // We still need app objects for Argo app of apps
    if (kind === 'application' && label.indexOf('app.kubernetes.io/instance=') === -1) {
      //this is a legit app object , just leave it
      return
    }

    if (kind === 'subscription' && cluster !== 'local-cluster') {
      // this is a legit subscription object that needs no alternation
      return
    }

    //find under the related array an object matching this kind
    const queryKind = _.filter(result.related, (filtertype) => _.get(filtertype, 'kind', '') === kind)
    //if that kind section was found add this object to it, otherwise create a new kind object for it
    const kindSection = queryKind && queryKind.length > 0 ? queryKind : { kind, items: [item] }
    if (!queryKind || queryKind.length === 0) {
      //link this kind section directly to the results array
      result.related.push(kindSection)
    } else {
      kindSection[0].items.push(item)
    }
  })
  return result
}

// The controllerrevision resource doesn't contain any desired pod count so
// we need to get it from the parent; either a daemonset or statefulset
export const syncControllerRevisionPodStatusMap = (resourceMap) => {
  Object.keys(resourceMap).forEach((resourceName) => {
    if (resourceName.startsWith('controllerrevision-')) {
      const controllerRevision = resourceMap[resourceName]
      const parentName = _.get(controllerRevision, 'specs.parent.parentName', '')
      const parentType = _.get(controllerRevision, 'specs.parent.parentType', '')
      const parentId = _.get(controllerRevision, 'specs.parent.parentId', '')
      const clusterName = getClusterName(parentId).toString()
      const parentResource =
        resourceMap[`${parentType}-${parentName}-${clusterName}`] || resourceMap[`${parentType}-${parentName}-`]
      if (parentResource) {
        const parentModel = {
          ..._.get(parentResource, `specs.${parentResource.type}Model`, ''),
        }
        if (parentModel) {
          const currentModel = _.get(controllerRevision, 'specs.controllerrevisionModel')
          if (currentModel) {
            parentModel[Object.keys(parentModel)[0]][0].name = currentModel[Object.keys(currentModel)[0]][0].name
          }
          _.set(controllerRevision, 'specs.controllerrevisionModel', parentModel)
        }
      }
    }
  })
}

// Check if resource is part of a VM by reading the label keys
export const isVirtualMachineResource = (labels) => {
  if (!labels || labels === '') {
    // we can't determine without labels
    return false
  }

  const labelsList = labels ? R.split(';')(labels) : []

  for (let i = 0; i < labelsList.length; i++) {
    const values = R.split('=')(labelsList[i])
    if (values.length === 2) {
      const labelKey = values[0].trim()
      if (labelKey.indexOf('instancetype.kubevirt.io') > -1 || labelKey.indexOf('kubevirt.io') > -1) {
        return true
      }
    }
  }

  return false
}
