/* Copyright Contributors to the Open Cluster Management project */
/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
 *
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 *******************************************************************************/
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import _ from 'lodash'
import moment from 'moment'
import R from 'ramda'
import { openArgoCDEditor, openRouteURL } from '../model/topologyAppSet'
import { getURLSearchData } from './diagram-helpers-argo'
import { getEditLink } from './resource-helper'
import { isSearchAvailable } from './search-helper'

const showResourceYaml = 'show_resource_yaml'
const apiVersionPath = 'specs.raw.apiVersion'
export const pulseValueArr = ['red', 'orange', 'yellow', 'green', undefined]

export const getAge = (value) => {
  if (value) {
    if (value.includes('T')) {
      return moment(value, 'YYYY-MM-DDTHH:mm:ssZ').fromNow()
    } else {
      return moment(value, 'YYYY-MM-DD HH:mm:ss').fromNow()
    }
  }
  return '-'
}

export const addDetails = (details, dets) => {
  dets.forEach(({ labelValue, value, indent, status }) => {
    if (value !== undefined) {
      details.push({
        type: 'label',
        labelValue,
        value,
        indent,
        status: status,
      })
    }
  })
}

export const getNodePropery = (node, propPath, key, defaultValue, status) => {
  const dataObj = R.pathOr(undefined, propPath)(node)

  let data = dataObj
  if (data) {
    data = R.replace(/:/g, '=', R.toString(data))
    data = R.replace(/{/g, '', data)
    data = R.replace(/}/g, '', data)
    data = R.replace(/"/g, '', data)
    data = R.replace(/ /g, '', data)
    data = R.replace(/\/\//g, ',', data)
  } else {
    if (defaultValue) {
      data = defaultValue
    }
  }

  if (data !== undefined) {
    // must show 0 values as well
    return {
      labelValue: key,
      value: data,
      status: status && !dataObj, //show as error message if data not defined and marked for error
    }
  }

  return undefined
}

export const addPropertyToList = (list, data) => {
  if (list && data) {
    list.push(data)
  }

  return list
}

export const createEditLink = (node, overrideKind, overrideCluster, overrideApiVersion) => {
  let kind = overrideKind || _.get(node, 'specs.raw.kind') || _.get(node, 'kind')
  const apigroup = _.get(node, 'apigroup')
  const apiversion = _.get(node, 'apiversion')
  let cluster = overrideCluster || _.get(node, 'cluster')
  if (!cluster) {
    cluster = getURLSearchData().cluster
  }
  let apiVersion = _.get(node, apiVersionPath)
  if (!apiVersion) {
    apiVersion = apigroup && apiversion ? apigroup + '/' + apiversion : apiversion
  }
  if (overrideApiVersion) {
    apiVersion = overrideApiVersion
  }

  kind = kind ? kind.toLowerCase() : undefined
  if (kind === 'subscriptionstatus') {
    kind = 'SubscriptionStatus'
  }

  return getEditLink({
    name: _.get(node, 'name'),
    namespace: _.get(node, 'namespace'),
    kind: kind,
    apiVersion,
    cluster: cluster ? cluster : undefined,
  })
}

export const createDeployableYamlLink = (node, details, t) => {
  //returns yaml for the deployable
  if (
    details &&
    node &&
    R.includes(_.get(node, 'type', ''), ['application', 'placements', 'subscription']) &&
    node.specs.isDesign // only for top-level resources
  ) {
    const editLink = createEditLink(node)
    editLink &&
      isSearchAvailable() &&
      details.push({
        type: 'link',
        value: {
          label: t('View resource YAML'),
          data: {
            action: showResourceYaml,
            cluster: 'local-cluster',
            editLink: editLink,
          },
        },
      })
  }

  return details
}

export const inflateKubeValue = (value) => {
  if (value) {
    const match = value.match(/\D/g)
    if (match) {
      // if value has suffix
      const unit = match.join('')
      const val = value.match(/\d+/g).map(Number)[0]
      const BINARY_PREFIXES = ['Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei']
      const SI_PREFIXES = ['m', 'k', 'M', 'G', 'T', 'P', 'E']
      const num =
        unit && unit.length === 2 ? factorize(BINARY_PREFIXES, unit, 'binary') : factorize(SI_PREFIXES, unit, 'si')
      return val * num
    }
    return parseFloat(value)
  }
  return ''
}

function factorize(prefixes, unit, type) {
  let factorizeNb = 1
  for (let index = 0; index < prefixes.length; index++) {
    if (unit === prefixes[index]) {
      const base = type === 'binary' ? 1024 : 1000
      const unitM = unit === 'm' ? -1 : index
      const exponent = type === 'binary' ? index + 1 : unitM
      factorizeNb = Math.pow(base, exponent)
    }
  }
  return factorizeNb
}

export const getPercentage = (value, total) => {
  return Math.floor((100 * (total - value)) / total) || 0
}

export const createResourceSearchLink = (node, t) => {
  let result = {
    type: 'link',
    value: null,
  }

  const nodeType = _.get(node, 'type', '')
  //returns search link for resource
  if (nodeType === 'cluster') {
    if (isSearchAvailable()) {
      let clusterNames = _.get(node, 'specs.clustersNames') || []
      if (clusterNames.length === 0) {
        clusterNames = _.get(node, 'specs.appClusters') || []
      }
      if (clusterNames.length === 0) {
        const nodeClusters = _.get(node, 'specs.clusters')
        nodeClusters.forEach((cls) => {
          clusterNames.push(cls.name)
        })
      }
      const clusterNameStr = clusterNames ? clusterNames.join() : undefined
      result = {
        type: 'link',
        value: {
          label: t('Launch resource in Search'),
          id: node.id,
          data: {
            action: 'show_search',
            name: (node.name && R.replace(/ /g, '')(node.name)) || clusterNameStr || 'undefined', // take out spaces
            kind: 'cluster',
          },
          indent: true,
        },
      }
    }
  } else if (node && R.pathOr('', ['specs', 'pulse'])(node) !== 'orange') {
    const kindModel = _.get(node, `specs.${nodeType}Model`, {})
    let computedNameList = []
    let computedNSList = []
    _.flatten(Object.values(kindModel)).forEach((item) => {
      computedNameList = R.union(computedNameList, [item.name])
      computedNSList = R.union(computedNSList, [item.namespace])
    })
    let computedName = ''
    computedNameList.forEach((item) => {
      computedName = computedName.length === 0 ? item : `${computedName},${item}`
    })
    if (!computedName && nodeType === 'application') {
      computedName = parseApplicationNodeName(node.id)
    }
    let computedNS = ''
    computedNSList.forEach((item) => {
      computedNS = computedNS.length === 0 ? item : `${computedNS},${item}`
    })

    //get the list of all names from the related list; for helm charts, they are different than the deployable name
    //pulse orange means not deployed on any cluster so don't show link to search page
    if (isSearchAvailable()) {
      result = {
        type: 'link',
        value: {
          label: t('Launch resource in Search'),
          id: node.id,
          data: {
            action: 'show_search',
            name: computedName && computedName.length > 0 ? computedName : node.name,
            namespace:
              computedNS && computedNS.length > 0
                ? computedNS
                : R.pathOr('', ['specs', 'raw', 'metadata', 'namespace'])(node),
            kind: nodeType === 'placements' ? 'placementrule' : _.get(node, 'type', ''),
          },
          indent: true,
        },
      }
    }
  }
  return result
}

export const parseApplicationNodeName = (id) => {
  if (id.startsWith('application--')) {
    return id.slice(13, id.length)
  }
  return id
}

export const createResourceURL = (node, t, isLogURL = false) => {
  const cluster = _.get(node, 'cluster', '')
  const type = _.get(node, 'type', '')
  const apiVersion = _.get(node, 'specs.raw.apiVersion', '')
  const namespace = _.get(node, 'namespace', '')
  const name = _.get(node, 'name', '')

  if (!isLogURL) {
    return (
      '/multicloud/home/search/resources/yaml?' +
      encodeURIComponent(`cluster=${cluster}&kind=${type}&apiversion=${apiVersion}&namespace=${namespace}&name=${name}`)
    )
  }
  return (
    '/multicloud/home/search/resources/logs?' +
    encodeURIComponent(`cluster=${cluster}&kind=${type}&apiversion=${apiVersion}&namespace=${namespace}&name=${name}`)
  )
}

export const removeReleaseGeneratedSuffix = (name) => {
  return name.replace(/-[0-9a-zA-Z]{4,5}$/, '')
}

//for charts remove release name
export const getNameWithoutChartRelease = (relatedKind, name, hasHelmReleases) => {
  const kind = _.get(relatedKind, 'kind', '').toLowerCase()
  if (kind === 'subscription' || !hasHelmReleases.value) {
    return name //ignore subscription objects or objects where the name is not created from the _hostingDeployable
  }

  //for resources deployed from charts, remove release name
  //note that the name parameter is the _hostingDeployable
  //and is in this format ch-git-helm/git-helm-chart1-1.1.1
  const savedName = name
  const labelAttr = _.get(relatedKind, 'label', '')
  const labels = _.split(labelAttr, ';')
  const labelMap = {}
  let foundReleaseLabel = false
  labels.forEach((label) => {
    const splitLabelContent = _.split(label, '=')

    if (splitLabelContent.length === 2) {
      const splitLabelTrimmed = _.trim(splitLabelContent[0])
      labelMap[splitLabelTrimmed] = splitLabelContent[1]
      if (splitLabelTrimmed === 'release') {
        //get label for release name
        foundReleaseLabel = true
        const releaseName = _.trim(splitLabelContent[1])
        if (name === releaseName) {
          return name //name identical with release name, no extra processing needed, exit
        }
        name = _.replace(name, `${releaseName}-`, '')
        name = _.replace(name, releaseName, '')

        if (name.length === 0) {
          // release name is used as name, need to strip generated suffix
          name = removeReleaseGeneratedSuffix(savedName)
        }
      }
    }
  })

  if (!foundReleaseLabel && kind === 'helmrelease') {
    //try to guess the release name from the name, which is the _hostingDeployable
    //and is in this format ch-git-helm/git-helm-chart1-1.1.1 - we want chart1-1.1.1
    const resourceName = _.get(relatedKind, 'name', '')
    let resourceNameNoHash = resourceName.replace(/-[0-9a-fA-F]{8,10}-[0-9a-zA-Z]{4,5}$/, '')
    if (resourceName === resourceNameNoHash) {
      const idx = resourceNameNoHash.lastIndexOf('-')
      if (idx !== -1) {
        resourceNameNoHash = resourceNameNoHash.substr(0, idx)
      }
    }

    const values = _.split(name, '-')
    if (values.length > 2) {
      //take the last value which is the version
      name = `${resourceNameNoHash}-${values[values.length - 1]}`
    }
  }

  if (!foundReleaseLabel && kind !== 'helmrelease' && labelMap['app.kubernetes.io/instance']) {
    //if name = alias-resourceName, remove alias- from name
    name =
      name.indexOf(`${labelMap['app.kubernetes.io/instance']}-`) === 0
        ? name.substring(labelMap['app.kubernetes.io/instance'].length + 1)
        : name
  }

  return name
}

export const computeResourceName = (relatedKind, deployableName, name, isClusterGrouped) => {
  if (relatedKind.kind.toLowerCase() === 'pod' && !_.get(relatedKind, '_hostingDeployable') && !deployableName) {
    name = getNameWithoutPodHash(relatedKind).nameNoHash
  }

  if (relatedKind.kind.toLowerCase() !== 'subscription') {
    //expect for subscriptions, use cluster name to group resources
    name = isClusterGrouped.value
      ? `${relatedKind.kind.toLowerCase()}-${name}`
      : `${relatedKind.kind.toLowerCase()}-${name}-${relatedKind.cluster}`
  }

  return name
}

//look for pod template hash and remove it from the name if there
export const getNameWithoutPodHash = (relatedKind) => {
  let nameNoHash = relatedKind.name
  let podHash = null
  let deployableName = null
  let podTemplateHashLabelFound = false

  if (_.get(relatedKind, 'kind', '').toLowerCase() === 'helmrelease') {
    //for helm releases use hosting deployable to match parent
    nameNoHash = _.get(relatedKind, '_hostingDeployable', nameNoHash)
  }

  const labelsList = relatedKind.label ? R.split(';')(relatedKind.label) : []
  labelsList.forEach((resLabel) => {
    const values = R.split('=')(resLabel)
    if (values.length === 2) {
      const labelKey = values[0].trim()
      const isControllerRevision = labelKey === 'controller-revision-hash'
      if (labelKey === 'pod-template-hash' || isControllerRevision || labelKey === 'controller.kubernetes.io/hash') {
        podHash = values[1].trim()
        if (podHash.indexOf('-') > -1) {
          // for hashes that include prefix, always take last section
          const hashValues = R.split('-')(podHash)
          podHash = hashValues[hashValues.length - 1]
        }
        nameNoHash = nameNoHash.split(`-${podHash}`)[0]
        if (isControllerRevision && relatedKind.kind.toLowerCase() === 'pod') {
          // need to remove additional pod suffix
          nameNoHash = nameNoHash.substring(0, nameNoHash.lastIndexOf('-'))
        }
        podTemplateHashLabelFound = true
      }
      if (labelKey === 'openshift.io/deployment-config.name' || R.includes('deploymentconfig')(resLabel)) {
        //look for deployment config info in the label; the name of the resource could be different than the one defined by the deployable
        //openshift.io/deployment-config.name
        deployableName = values[1].trim()
        nameNoHash = deployableName
        podTemplateHashLabelFound = true
      }
    }
  })

  if (!podTemplateHashLabelFound && relatedKind.kind.toLowerCase() === 'pod' && relatedKind._ownerUID) {
    // standalone pods has no ownerUID and no hash at the end
    nameNoHash = nameNoHash.substring(0, nameNoHash.lastIndexOf('-'))
  }

  //return podHash as well, it will be used to map pods with parent resource
  return { nameNoHash, deployableName, podHash }
}

//add deployed object to the matching resource in the map
export const addResourceToModel = (resourceMapObject, kind, relatedKind, nameWithoutChartRelease) => {
  const resourceType = _.get(resourceMapObject, 'type', '')
  const kindModel =
    resourceType === 'project'
      ? _.get(resourceMapObject, `specs.projectModel`, {})
      : _.get(resourceMapObject, `specs.${kind.toLowerCase()}Model`, {})
  const modelKey = relatedKind.namespace
    ? `${nameWithoutChartRelease}-${relatedKind.cluster}-${relatedKind.namespace}`
    : `${nameWithoutChartRelease}-${relatedKind.cluster}`
  const kindList = kindModel[modelKey] || []
  kindList.push(relatedKind)
  kindModel[modelKey] = kindList
  _.set(resourceMapObject, `specs.${resourceType === 'project' ? 'project' : kind.toLowerCase()}Model`, kindModel)
}

// reduce complexity for code smell
export const checkNotOrObjects = (obj1, obj2) => {
  return !obj1 || !obj2
}

// reduce complexity for code smell
export const checkAndObjects = (obj1, obj2) => {
  return obj1 && obj2
}

export const addNodeOCPRouteLocationForCluster = (node, typeObject, details, t) => {
  const rules = R.pathOr([], ['specs', 'raw', 'spec', 'rules'])(node)
  if (rules.length > 1) {
    //we don't know how to process more then one hosts if the Ingress generates more than one route
    return details
  }

  const clustersList = _.get(node, 'specs.searchClusters', [])
  let hostName = R.pathOr(undefined, ['specs', 'raw', 'spec', 'host'])(node)
  if (typeObject && _.get(node, 'name', '') !== _.get(typeObject, 'name', '')) {
    //if route name on remote cluster doesn't match the main route name ( generated from Ingress ), show the name here
    //this is to cover the scenario when the Ingress object defines multiple routes,
    //so it generates multiple Route objects on the same cluster
    addPropertyToList(details, getNodePropery(typeObject, ['name'], 'spec.route.cluster.name'))
  }

  if (!hostName && rules.length === 1) {
    //check rules path, for route generated by Ingress
    hostName = _.get(rules[0], 'host')
  }

  if (clustersList.length === 0 && !hostName) {
    // this is a local app deploy, check hostname in ingress
    const ingress = R.pathOr([], ['specs', 'raw', 'spec', 'ingress'])(node)
    if (ingress.length > 0) {
      hostName = ingress[0].host
    }
  }

  if (hostName && typeObject) {
    return details // this info is in the main Location status since we have a spec host
  }

  const linkId = typeObject ? _.get(typeObject, 'id', '0') : _.get(node, 'uid', '0')

  if (!typeObject && clustersList.length === 1) {
    //this is called from the main details
    if (!hostName) {
      return details //return since there is no global host
    }

    details.push({
      type: 'spacer',
    })

    details.push({
      type: 'label',
      labelValue: t('Location'),
    })
  }

  if (!hostName && typeObject) {
    details.push({
      type: 'link',
      value: {
        labelValue: t('Launch Route URL'),
        id: `${_.get(typeObject, '_uid', '0')}`,
        data: {
          action: 'open_route_url',
          routeObject: typeObject,
        },
      },
      indent: true,
    })
    return details
  }
  const transport = R.pathOr(undefined, ['specs', 'template', 'template', 'spec', 'tls'])(node) ? 'https' : 'http'
  const hostLink = `${transport}://${hostName}/`

  //argo app doesn't have spec info
  if (hostName) {
    details.push({
      type: 'link',
      value: {
        label: hostLink,
        id: `${linkId}-location`,
        data: {
          action: 'open_link',
          targetLink: hostLink,
        },
      },
      indent: true,
    })
  }

  !typeObject &&
    details.push({
      type: 'spacer',
    })

  return details
}

//route
export const addOCPRouteLocation = (node, clusterName, targetNS, details, t) => {
  if (
    R.pathOr('', ['specs', 'template', 'template', 'kind'])(node).toLowerCase() === 'route' ||
    node.type === 'route'
  ) {
    return addNodeInfoPerCluster(node, clusterName, targetNS, details, addNodeOCPRouteLocationForCluster, t)
  }

  return details //process only routes
}

//ingress
export const addIngressNodeInfo = (node, details, t) => {
  if (R.pathOr('', ['specs', 'raw', 'kind'])(node) === 'Ingress') {
    details.push({
      type: 'label',
      labelValue: t('Location'),
    })

    //ingress - single service
    addPropertyToList(
      details,
      getNodePropery(node, ['specs', 'raw', 'spec', 'backend', 'serviceName'], t('raw.spec.ingress.service'))
    )
    addPropertyToList(
      details,
      getNodePropery(node, ['specs', 'raw', 'spec', 'backend', 'servicePort'], t('raw.spec.ingress.service.port'))
    )

    const rules = R.pathOr([], ['specs', 'raw', 'spec', 'rules'])(node)
    rules.forEach((ruleInfo) => {
      const hostName = R.pathOr('NA', ['host'])(ruleInfo)
      details.push({
        labelValue: t('Host'),
        value: hostName,
      })
      const paths = R.pathOr([], ['http', 'paths'])(ruleInfo)
      paths.forEach((pathInfo) => {
        details.push({
          labelValue: t('Service Name'),
          value: R.pathOr('NA', ['backend', 'serviceName'])(pathInfo),
        })
        details.push({
          labelValue: t('Service Port'),
          value: R.pathOr('NA', ['backend', 'servicePort'])(pathInfo),
        })
      })
      details.push({
        type: 'spacer',
      })
    })
  }

  return details //process only routes
}

//for service
export const addNodeServiceLocation = (node, clusterName, targetNS, details, t) => {
  if (node.type === 'service') {
    return addNodeInfoPerCluster(node, clusterName, targetNS, details, addNodeServiceLocationForCluster, t) //process only services
  }
  return details
}

//generic function to write location info
export const addNodeInfoPerCluster = (node, clusterName, targetNS, details, getDetailsFunction, t) => {
  const resourceName = _.get(node, 'name', '')
  const resourceNamespace = _.get(node, 'namespace')
  const resourceMap = _.get(node, `specs.${node.type}Model`, {})

  const locationDetails = []
  const modelKey = resourceNamespace
    ? `${resourceName}-${clusterName}-${resourceNamespace}`
    : `${resourceName}-${clusterName}`
  const resourcesForCluster = resourceMap[modelKey] || []
  const typeObject = _.find(resourcesForCluster, (obj) => _.get(obj, 'namespace', '') === targetNS)
  if (typeObject) {
    getDetailsFunction(node, typeObject, locationDetails, t, clusterName)
  }

  locationDetails.forEach((locationDetail) => {
    details.push(locationDetail)
  })

  return details
}

export const addNodeServiceLocationForCluster = (node, typeObject, details, t) => {
  if (node && typeObject && typeObject.clusterIP && typeObject.port) {
    let port = R.split(':', typeObject.port)[0] // take care of 80:etc format
    port = R.split('/', port)[0] //now remove any 80/TCP

    const location = `${typeObject.clusterIP}:${port}`
    details.push({
      labelValue: t('Location'),
      value: location,
    })
  }

  return details
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const processResourceActionLink = (resource, toggleLoading, t) => {
  let targetLink = ''
  const linkPath = R.pathOr('', ['action'])(resource)
  const { name, namespace, editLink, kind, cluster } = resource //routeObject
  const nsData = namespace
    ? kind === 'ocpapplication' || kind === 'fluxapplication'
      ? `namespace:${namespace}`
      : ` namespace:${namespace}`
    : ''
  const kindData = kind === 'ocpapplication' || kind === 'fluxapplication' ? '' : `kind:${kind}`
  let nameData
  if (kind === 'ocpapplication') {
    nameData = `label:app=${name},app.kubernetes.io/part-of=${name}`
  } else if (kind === 'fluxapplication') {
    nameData = `label:kustomize.toolkit.fluxcd.io/name=${name},helm.toolkit.fluxcd.io/name=${name}`
  } else {
    nameData = `name:${name}`
  }

  switch (linkPath) {
    case showResourceYaml:
      targetLink = editLink
      break
    case 'show_search':
      targetLink = `/multicloud/home/search?filters={"textsearch":"${kindData}${nsData} ${nameData}"}`
      break
    case 'open_argo_editor': {
      openArgoCDEditor(cluster, namespace, name, toggleLoading, t) // the editor opens here
      break
    }
    case 'open_route_url': {
      const routeObject = R.pathOr('', ['routeObject'])(resource)
      openRouteURL(routeObject, toggleLoading) // the route url opens here
      break
    }
    default:
      targetLink = R.pathOr('', ['targetLink'])(resource)
  }
  if (targetLink !== '') {
    window.open(targetLink, '_blank')
  }
  return targetLink
}

export const getFilteredNode = (node, item) => {
  const { name, namespace, cluster } = item
  const filterNode = {
    ...node,
    name: item.name,
    namespace: item.namespace,
    cluster,
  }

  // filter statuses to just this one
  if (node.podStatusMap) {
    const filtered = Object.entries(node.podStatusMap).filter(([k]) => {
      return k === `${cluster}-${namespace}-${node.type}-${name}`
    })
    filterNode.podStatusMap = Object.fromEntries(filtered)
  }
  filterNode.specs = {
    ...node.specs,
    resourceCount: 0,
    resources: undefined,
  }
  const kindModelKey = `${node.type}Model`
  const kindModel = _.get(node, ['specs', kindModelKey])
  if (kindModel) {
    const filtered = {}
    Object.entries(kindModel).forEach(([k, v]) => {
      v.forEach((stat) => {
        if (stat.name === name && stat.namespace === namespace && stat.cluster === cluster) {
          filtered[k] = [stat]
        }
      })
    })
    filterNode.specs[kindModelKey] = filtered
  }
  return filterNode
}
