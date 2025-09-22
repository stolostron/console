/* Copyright Contributors to the Open Cluster Management project */

import { openArgoCDEditor, openRouteURL } from '../topologyAppSet'
import { isSearchAvailable } from './search-helper'
import queryString from 'query-string'
import type {
  DetailsList,
  NodeLike,
  ResourceAction,
  Translator,
  Pulse,
  URLSearchData,
  EditLinkParams,
  DetailItem,
  StatusType,
} from '../../types'
import { getNestedProperty } from '../../utils'

const showResourceYaml = 'show_resource_yaml'
const apiVersionPath = 'specs.raw.apiVersion'

// Ordered by severity for UI legend and filtering
export const pulseValueArr: Array<Pulse | undefined> = ['red', 'orange', 'yellow', 'green', undefined]

/**
 * Push non-empty detail rows into the provided list.
 */
export const addDetails = (
  details: DetailsList,
  dets: Array<{ labelValue: string; value: unknown; indent?: boolean; status?: string }>
): void => {
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

/**
 * Read a property from a node and format it for display as a label row.
 */
export const getNodePropery = (
  node: NodeLike,
  propPath: string | number | (string | number)[],
  key: string,
  defaultValue?: string,
  status?: string
): DetailItem | undefined => {
  const dataObj = getNestedProperty(node, propPath)

  let data = dataObj as unknown as string | undefined
  if (data) {
    data = String(data).replace(/:/g, '=')
    data = data.replace(/{/g, '')
    data = data.replace(/}/g, '')
    data = data.replace(/"/g, '')
    data = data.replace(/ /g, '')
    data = data.replace(/\//g, ',')
  } else {
    if (defaultValue) {
      data = defaultValue
    }
  }

  if (data !== undefined) {
    return {
      labelValue: key,
      value: data,
      status: status && !dataObj ? (status as StatusType) : undefined,
    }
  }

  return undefined
}

/**
 * Conditionally push an item into a list if both are defined.
 */
export const addPropertyToList = <T>(list: T[] | undefined, data: T | undefined): T[] | undefined => {
  if (list && data) {
    list.push(data)
  }

  return list
}

/**
 * Build the edit link for a node's resource yaml in Search.
 */
export const createEditLink = (
  node: NodeLike,
  hubClusterName: string,
  overrideKind?: string,
  overrideCluster?: string,
  overrideApiVersion?: string
): string => {
  let kind: string | undefined =
    overrideKind ||
    (getNestedProperty(node, 'specs.raw.kind') as string | undefined) ||
    (getNestedProperty(node, 'kind') as string | undefined)
  const apigroup = getNestedProperty(node, 'apigroup') as string | undefined
  const apiversion = getNestedProperty(node, 'apiversion') as string | undefined
  let cluster: string | undefined = overrideCluster || (getNestedProperty(node, 'cluster') as string | undefined)
  if (!cluster) {
    cluster = getURLSearchData().cluster
  }
  let apiVersion = getNestedProperty(node, apiVersionPath) as string | undefined
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

  return getEditLink(
    {
      name: getNestedProperty(node, 'name') as string | undefined,
      namespace: getNestedProperty(node, 'namespace') as string | undefined,
      kind: kind,
      apiVersion,
      cluster: cluster ? cluster : undefined,
    },
    hubClusterName
  )
}

/**
 * Convert Kubernetes CPU/Memory string values into numeric units (bytes or SI).
 */
export const inflateKubeValue = (value?: string | number | null): number => {
  if (value) {
    const valueStr = String(value)
    const match = valueStr.match(/\D/g)
    if (match) {
      const unit = match.join('')
      const valMatch = valueStr.match(/\d+/g)
      const val = valMatch ? Number(valMatch[0]) : 0
      const BINARY_PREFIXES = ['Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei']
      const SI_PREFIXES = ['m', 'k', 'M', 'G', 'T', 'P', 'E']
      const num =
        unit && unit.length === 2 ? factorize(BINARY_PREFIXES, unit, 'binary') : factorize(SI_PREFIXES, unit, 'si')
      return val * num
    }
    return parseFloat(valueStr)
  }
  return 0
}

function factorize(prefixes: string[], unit: string, type: 'binary' | 'si'): number {
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

/**
 * Return percentage of total that is remaining (used by progress ring).
 */
export const getPercentage = (value: number, total: number): number => {
  return Math.floor((100 * (total - value)) / total) || 0
}

/**
 * Build a Search link details entry for the given resource node.
 */
export const createResourceSearchLink = (node: NodeLike, t: Translator): { type: 'link'; value: any } => {
  let result = {
    type: 'link' as const,
    value: null as any,
  }

  const nodeType = getNestedProperty(node, 'type', '') as string
  if (nodeType === 'cluster') {
    if (isSearchAvailable()) {
      let clusterNames = (getNestedProperty(node, 'specs.clustersNames') as string[]) || []
      if (clusterNames.length === 0) {
        clusterNames = ((getNestedProperty(node, 'specs.appClusters') as string[]) || []) as string[]
      }
      if (clusterNames.length === 0) {
        const nodeClusters = getNestedProperty(node, 'specs.clusters') as Array<{ name: string }>
        nodeClusters?.forEach((cls) => {
          clusterNames.push(cls.name)
        })
      }
      const clusterNameStr = clusterNames ? clusterNames.join() : undefined
      result = {
        type: 'link',
        value: {
          label: t('Launch resource in Search'),
          id: (node as any).id,
          data: {
            action: 'show_search',
            name: ((node as any).name && (node as any).name.replace(/ /g, '')) || clusterNameStr || 'undefined',
            kind: 'cluster',
          },
          indent: true,
        },
      }
    }
  } else if (node && getNestedProperty(node, ['specs', 'pulse'], '') !== 'orange') {
    const kindModel = getNestedProperty(node, `specs.${nodeType}Model`, {}) as Record<string, any[]>
    let computedNameList: string[] = []
    let computedNSList: string[] = []
    Object.values(kindModel)
      .flat()
      .forEach((item: any) => {
        computedNameList = [...new Set([...computedNameList, item.name])]
        computedNSList = [...new Set([...computedNSList, item.namespace])]
      })
    let computedName = ''
    computedNameList.forEach((item) => {
      computedName = computedName.length === 0 ? item : `${computedName},${item}`
    })
    if (!computedName && nodeType === 'application') {
      computedName = parseApplicationNodeName(String((node as any).id))
    }
    let computedNS = ''
    computedNSList.forEach((item) => {
      computedNS = computedNS.length === 0 ? item : `${computedNS},${item}`
    })

    if (isSearchAvailable()) {
      let kindVal: string
      switch (nodeType) {
        case 'placements':
        case 'placement':
          kindVal = 'PlacementDecision'
          break
        default:
          kindVal = getNestedProperty(node, 'type', '') as string
      }
      result = {
        type: 'link',
        value: {
          label: t('Launch resource in Search'),
          id: (node as any).id,
          data: {
            action: 'show_search',
            name: computedName && computedName.length > 0 ? computedName : (node as any).name,
            namespace:
              computedNS && computedNS.length > 0
                ? computedNS
                : (getNestedProperty(node, ['specs', 'raw', 'metadata', 'namespace'], '') as string),
            kind: kindVal,
          },
          indent: true,
        },
      }
    }
  }
  return result
}

/**
 * Strip the application id prefix from a node id to obtain the resource name.
 */
export const parseApplicationNodeName = (id: string): string => {
  if (id.startsWith('application--')) {
    return id.slice(13, id.length)
  }
  return id
}

/**
 * Build a link to the resource YAML or logs for the given node.
 */
export const createResourceURL = (node: NodeLike, _t: Translator, isLogURL = false): string => {
  const cluster = getNestedProperty(node, 'cluster', '') as string
  const type = getNestedProperty(node, 'type', '') as string
  const apiVersion = getNestedProperty(node, 'specs.raw.apiVersion', '') as string
  const namespace = getNestedProperty(node, 'namespace', '') as string
  const name = getNestedProperty(node, 'name', '') as string

  if (!isLogURL) {
    return (
      '/multicloud/search/resources/yaml?' +
      encodeURIComponent(`cluster=${cluster}&kind=${type}&apiversion=${apiVersion}&namespace=${namespace}&name=${name}`)
    )
  }
  return (
    '/multicloud/search/resources/logs?' +
    encodeURIComponent(`cluster=${cluster}&kind=${type}&apiversion=${apiVersion}&namespace=${namespace}&name=${name}`)
  )
}

/**
 * Remove a common release-generated suffix from a resource name.
 */
export const removeReleaseGeneratedSuffix = (name: string): string => {
  return name.replace(/-[0-9a-zA-Z]{4,5}$/, '')
}

/**
 * For Helm chart resources, remove the release name prefix to normalize to base name.
 */
export const getNameWithoutChartRelease = (
  relatedKind: Record<string, any>,
  name: string,
  hasHelmReleases: { value: boolean }
): string => {
  const kind = String(getNestedProperty(relatedKind, 'kind', '')).toLowerCase()
  if (kind === 'subscription' || !hasHelmReleases.value) {
    return name
  }

  const savedName = name
  const labelAttr = getNestedProperty(relatedKind, 'label', '') as string
  const labels = labelAttr.split(';')
  const labelMap: Record<string, string> = {}
  let foundReleaseLabel = false
  labels.forEach((label) => {
    const splitLabelContent = label.split('=')

    if (splitLabelContent.length === 2) {
      const splitLabelTrimmed = splitLabelContent[0].trim()
      labelMap[splitLabelTrimmed] = splitLabelContent[1]
      if (splitLabelTrimmed === 'release') {
        foundReleaseLabel = true
        const releaseName = splitLabelContent[1].trim()
        if (name === releaseName) {
          return name
        }
        name = name.replace(`${releaseName}-`, '')
        name = name.replace(releaseName, '')

        if (name.length === 0) {
          name = removeReleaseGeneratedSuffix(savedName)
        }
      }
    }
  })

  if (!foundReleaseLabel && kind === 'helmrelease') {
    const resourceName = getNestedProperty(relatedKind, 'name', '') as string
    let resourceNameNoHash = resourceName.replace(/-[0-9a-fA-F]{8,10}-[0-9a-zA-Z]{4,5}$/, '')
    if (resourceName === resourceNameNoHash) {
      const idx = resourceNameNoHash.lastIndexOf('-')
      if (idx !== -1) {
        resourceNameNoHash = resourceNameNoHash.substr(0, idx)
      }
    }

    const values = name.split('-')
    if (values.length > 2) {
      name = `${resourceNameNoHash}-${values[values.length - 1]}`
    }
  }

  if (!foundReleaseLabel && kind !== 'helmrelease' && labelMap['app.kubernetes.io/instance']) {
    name =
      name.indexOf(`${labelMap['app.kubernetes.io/instance']}-`) === 0
        ? name.substring(labelMap['app.kubernetes.io/instance'].length + 1)
        : name
  }

  return name
}

/**
 * Compute the resource map key name considering grouping and resource kind.
 */
export const computeResourceName = (
  relatedKind: { kind: string; cluster: string },
  _deployableName: string | null,
  name: string,
  isClusterGrouped: { value: boolean }
): string => {
  if (
    relatedKind.kind.toLowerCase() === 'pod' &&
    !getNestedProperty(relatedKind, '_hostingDeployable') &&
    !_deployableName
  ) {
    name = getNameWithoutPodHash(relatedKind as any).nameNoHash
  }

  if (relatedKind.kind.toLowerCase() !== 'subscription') {
    name = isClusterGrouped.value
      ? `${relatedKind.kind.toLowerCase()}-${name}`
      : `${relatedKind.kind.toLowerCase()}-${name}-${relatedKind.cluster}`
  }

  return name
}

/**
 * Remove known pod hash/labels from a resource name and return mapping data.
 */
export const getNameWithoutPodHash = (relatedKind: {
  name: string
  kind: string
  label?: string
  _ownerUID?: string
  cluster?: string
  _hostingDeployable?: string
}): { nameNoHash: string; deployableName: string | null; podHash: string | null } => {
  let nameNoHash = relatedKind.name
  let podHash: string | null = null
  let deployableName: string | null = null
  let podTemplateHashLabelFound = false

  if (getNestedProperty(relatedKind, 'kind', '').toLowerCase() === 'helmrelease') {
    nameNoHash = getNestedProperty(relatedKind, '_hostingDeployable', nameNoHash) as string
  }

  const labelsList = relatedKind.label ? relatedKind.label.split(';') : []
  labelsList.forEach((resLabel) => {
    const values = resLabel.split('=')
    if (values.length === 2) {
      const labelKey = values[0].trim()
      const isControllerRevision = labelKey === 'controller-revision-hash'
      if (labelKey === 'pod-template-hash' || isControllerRevision || labelKey === 'controller.kubernetes.io/hash') {
        podHash = values[1].trim()
        if (podHash.indexOf('-') > -1) {
          const hashValues = podHash.split('-')
          podHash = hashValues[hashValues.length - 1]
        }
        nameNoHash = nameNoHash.split(`-${podHash}`)[0]
        if (isControllerRevision && relatedKind.kind.toLowerCase() === 'pod') {
          nameNoHash = nameNoHash.substring(0, nameNoHash.lastIndexOf('-'))
        }
        podTemplateHashLabelFound = true
      }
      if (labelKey === 'openshift.io/deployment-config.name' || resLabel.includes('deploymentconfig')) {
        deployableName = values[1].trim()
        nameNoHash = deployableName
        podTemplateHashLabelFound = true
      }
    }
  })

  if (!podTemplateHashLabelFound && relatedKind.kind.toLowerCase() === 'pod' && (relatedKind as any)._ownerUID) {
    nameNoHash = nameNoHash.substring(0, nameNoHash.lastIndexOf('-'))
  }

  return { nameNoHash, deployableName, podHash }
}

/**
 * Add a resource instance into the corresponding model map for the resourceMapObject.
 */
export const addResourceToModel = (
  resourceMapObject: any,
  kind: string,
  relatedKind: any,
  nameWithoutChartRelease: string
): void => {
  const resourceType = getNestedProperty(resourceMapObject, 'type', '') as string
  const kindModel =
    resourceType === 'project'
      ? (getNestedProperty(resourceMapObject, `specs.projectModel`, {}) as Record<string, any[]>)
      : (getNestedProperty(resourceMapObject, `specs.${kind.toLowerCase()}Model`, {}) as Record<string, any[]>)
  const modelKey = (relatedKind as any).namespace
    ? `${nameWithoutChartRelease}-${(relatedKind as any).cluster}-${(relatedKind as any).namespace}`
    : `${nameWithoutChartRelease}-${(relatedKind as any).cluster}`
  const kindList = kindModel[modelKey] || []
  kindList.push(relatedKind)
  kindModel[modelKey] = kindList
  const modelPath = resourceType === 'project' ? 'project' : kind.toLowerCase()
  if (!resourceMapObject.specs) resourceMapObject.specs = {}
  resourceMapObject.specs[`${modelPath}Model`] = kindModel
}

/** Reduce complexity: return true if either object is falsy. */
export const checkNotOrObjects = (obj1?: unknown, obj2?: unknown): boolean => {
  return !obj1 || !obj2
}

/** Reduce complexity: return true only if both objects are truthy. */
export const checkAndObjects = (obj1?: unknown, obj2?: unknown): boolean => {
  return !!(obj1 && obj2)
}

/**
 * Add OCP Route location link(s) for a specific cluster/namespace.
 */
export const addNodeOCPRouteLocationForCluster = (
  node: NodeLike,
  typeObject: any,
  details: DetailsList,
  t: Translator
): DetailsList => {
  const rules = getNestedProperty(node, ['specs', 'raw', 'spec', 'rules'], []) as any[]
  if (rules.length > 1) {
    return details
  }

  const clustersList = (getNestedProperty(node, 'specs.searchClusters', []) as any[]) || []
  let hostName = getNestedProperty(node, ['specs', 'raw', 'spec', 'host']) as string | undefined
  if (typeObject && getNestedProperty(node, 'name', '') !== getNestedProperty(typeObject, 'name', '')) {
    addPropertyToList(details as any, getNodePropery(typeObject, ['name'], 'spec.route.cluster.name'))
  }

  if (!hostName && rules.length === 1) {
    hostName = getNestedProperty(rules[0], 'host')
  }

  if (clustersList.length === 0 && !hostName) {
    const ingress = getNestedProperty(node, ['specs', 'raw', 'spec', 'ingress'], []) as any[]
    if (ingress.length > 0) {
      hostName = ingress[0].host
    }
  }

  if (hostName && typeObject) {
    return details
  }

  const linkId = typeObject ? getNestedProperty(typeObject, 'id', '0') : getNestedProperty(node, 'uid', '0')

  if (!typeObject && clustersList.length === 1) {
    if (!hostName) {
      return details
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
        id: `${getNestedProperty(typeObject, '_uid', '0')}`,
        data: {
          action: 'open_route_url',
          routeObject: typeObject,
        },
      },
      indent: true,
    })
    return details
  }
  const transport = getNestedProperty(node, ['specs', 'template', 'template', 'spec', 'tls']) ? 'https' : 'http'
  const hostLink = `${transport}://${hostName}/`

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

  if (!typeObject) {
    details.push({
      type: 'spacer',
    })
  }

  return details
}

/**
 * Add OCP Route location details for the node when the node is a Route.
 */
export const addOCPRouteLocation = (
  node: NodeLike,
  clusterName: string,
  targetNS: string,
  details: DetailsList,
  t: Translator
): DetailsList => {
  if (
    (getNestedProperty(node, ['specs', 'template', 'template', 'kind'], '') as string).toLowerCase() === 'route' ||
    (node as any).type === 'route'
  ) {
    return addNodeInfoPerCluster(node, clusterName, targetNS, details, addNodeOCPRouteLocationForCluster, t)
  }

  return details
}

/**
 * Add Ingress node location information such as host and backend services.
 */
export const addIngressNodeInfo = (node: NodeLike, details: DetailsList, t: Translator): DetailsList => {
  if (getNestedProperty(node, ['specs', 'raw', 'kind'], '') === 'Ingress') {
    details.push({
      type: 'label',
      labelValue: t('Location'),
    })

    addPropertyToList(
      details as any,
      getNodePropery(node, ['specs', 'raw', 'spec', 'backend', 'serviceName'], t('raw.spec.ingress.service'))
    )
    addPropertyToList(
      details as any,
      getNodePropery(node, ['specs', 'raw', 'spec', 'backend', 'servicePort'], t('raw.spec.ingress.service.port'))
    )

    const rules = getNestedProperty(node, ['specs', 'raw', 'spec', 'rules'], []) as any[]
    rules.forEach((ruleInfo) => {
      const hostName = getNestedProperty(ruleInfo, ['host'], 'NA')
      details.push({
        labelValue: t('Host'),
        value: hostName,
      })
      const paths = getNestedProperty(ruleInfo, ['http', 'paths'], []) as any[]
      paths.forEach((pathInfo) => {
        details.push({
          labelValue: t('Service Name'),
          value: getNestedProperty(pathInfo, ['backend', 'serviceName'], 'NA'),
        })
        details.push({
          labelValue: t('Service Port'),
          value: getNestedProperty(pathInfo, ['backend', 'servicePort'], 'NA'),
        })
      })
      details.push({
        type: 'spacer',
      })
    })
  }

  return details
}

/**
 * Add Service location for the node when node is a Service.
 */
export const addNodeServiceLocation = (
  node: NodeLike,
  clusterName: string,
  targetNS: string,
  details: DetailsList,
  t: Translator
): DetailsList => {
  if ((node as any).type === 'service') {
    return addNodeInfoPerCluster(node, clusterName, targetNS, details, addNodeServiceLocationForCluster, t)
  }
  return details
}

/**
 * Helper to compute and push per-cluster location information using a callback.
 */
export const addNodeInfoPerCluster = (
  node: NodeLike,
  clusterName: string,
  targetNS: string,
  details: DetailsList,
  getDetailsFunction: (
    node: NodeLike,
    typeObject: any,
    details: DetailsList,
    t: Translator,
    clusterName?: string
  ) => DetailsList,
  t: Translator
): DetailsList => {
  const resourceName = getNestedProperty(node, 'name', '') as string
  const resourceNamespace = getNestedProperty(node, 'namespace') as string | undefined
  const resourceMap = getNestedProperty(node, `specs.${(node as any).type}Model`, {}) as Record<string, any[]>

  const locationDetails: DetailsList = []
  const modelKey = resourceNamespace
    ? `${resourceName}-${clusterName}-${resourceNamespace}`
    : `${resourceName}-${clusterName}`
  const resourcesForCluster = (resourceMap[modelKey] || []) as any[]
  const typeObject = resourcesForCluster.find((obj) => getNestedProperty(obj, 'namespace', '') === targetNS)
  if (typeObject) {
    getDetailsFunction(node, typeObject, locationDetails, t, clusterName)
  }

  locationDetails.forEach((locationDetail) => {
    details.push(locationDetail)
  })

  return details
}

/**
 * Build the Service location for a specific cluster/namespace.
 */
export const addNodeServiceLocationForCluster = (
  node: NodeLike,
  typeObject: any,
  details: DetailsList,
  t: Translator
): DetailsList => {
  if (node && typeObject && typeObject.clusterIP && typeObject.port) {
    let port = (typeObject.port as string).split(':')[0]
    port = port.split('/')[0]

    const location = `${typeObject.clusterIP}:${port}`
    details.push({
      labelValue: t('Location'),
      value: location,
    })
  }

  return details
}

/**
 * Handle clicks on detail links: open Search, Argo editor, route URL, etc.
 */
export const processResourceActionLink = (
  resource: ResourceAction,
  toggleLoading: () => void,
  t: Translator,
  hubClusterName: string
): string => {
  let targetLink = ''
  const linkPath = getNestedProperty(resource as any, ['action'], '') as string
  const { name = '', namespace = '', editLink, kind, cluster = '' } = resource
  const nsData = namespace
    ? kind === 'ocpapplication' || kind === 'fluxapplication'
      ? `namespace:${namespace}`
      : ` namespace:${namespace}`
    : ''
  const kindData = kind === 'ocpapplication' || kind === 'fluxapplication' ? '' : `kind:${kind}`
  let nameData: string
  if (kind === 'ocpapplication') {
    nameData = `label:app=${name},app.kubernetes.io/part-of=${name}`
  } else if (kind === 'fluxapplication') {
    nameData = `label:kustomize.toolkit.fluxcd.io/name=${name},helm.toolkit.fluxcd.io/name=${name}`
  } else {
    nameData = `name:${name}`
  }

  switch (linkPath) {
    case showResourceYaml:
      targetLink = editLink || ''
      break
    case 'show_search':
      targetLink = `/multicloud/search?filters={"textsearch":"${kindData}${nsData} ${nameData}"}`
      break
    case 'open_argo_editor': {
      openArgoCDEditor(cluster, namespace, name, toggleLoading, t, hubClusterName)
      break
    }
    case 'open_route_url': {
      const routeObject = getNestedProperty(resource as any, ['routeObject'], '')
      openRouteURL(routeObject, toggleLoading, hubClusterName)
      break
    }
    default:
      targetLink = getNestedProperty(resource as any, ['targetLink'], '') as string
  }
  if (targetLink !== '') {
    window.open(targetLink, '_blank')
  }
  return targetLink
}

/**
 * Build a filtered clone of a node containing only data for a specific resource instance.
 */
export const getFilteredNode = (node: any, item: { name: string; namespace: string; cluster: string }): any => {
  const { name, namespace, cluster } = item
  const filterNode: any = {
    ...node,
    name: item.name,
    namespace: item.namespace,
    cluster,
  }

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
  const kindModel = getNestedProperty(node, ['specs', kindModelKey]) as Record<string, any[]> | undefined
  if (kindModel) {
    const filtered: Record<string, any[]> = {}
    Object.entries(kindModel).forEach(([k, v]) => {
      v.forEach((stat: any) => {
        if (stat.name === name && stat.namespace === namespace && stat.cluster === cluster) {
          filtered[k] = [stat]
        }
      })
    })
    filterNode.specs[kindModelKey] = filtered
  }
  return filterNode
}

/**
 * Parse the browser's current query string and return supported parameters.
 *
 * Currently recognized keys:
 * - apiVersion: string (e.g., "argoproj.io/v1alpha1")
 * - cluster: string (e.g., a cluster name)
 *
 * Values are optional and omitted if not present in the URL.
 */
export const getURLSearchData = (): URLSearchData => {
  const search: string = window.location.search
  const searchItems: URLSearchParams | undefined = search ? new URLSearchParams(search) : undefined

  let cluster: string | undefined
  let apiVersion: string | undefined

  if (searchItems && searchItems.get('apiVersion')) {
    apiVersion = searchItems.get('apiVersion') || undefined
  }
  if (searchItems && searchItems.get('cluster')) {
    cluster = searchItems.get('cluster') || undefined
  }

  return {
    apiVersion,
    cluster,
  }
}

/**
 * Build a Search YAML editor link for a Kubernetes resource.
 * Falls back to the hub cluster when a specific cluster is not provided.
 */
export const getEditLink = (
  { name, namespace, kind, apiVersion, cluster }: EditLinkParams,
  hubClusterName: string
): string => {
  const cls = cluster ? cluster : hubClusterName
  return `/multicloud/search/resources/yaml?${queryString.stringify({
    cluster: cls,
    name,
    namespace,
    kind,
    apiversion: apiVersion,
  })}`
}
