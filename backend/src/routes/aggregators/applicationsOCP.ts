/* Copyright Contributors to the Open Cluster Management project */
import { getClusterMap } from '../../lib/clusters'
import { getPagedSearchResources } from '../../lib/search'
import { IResource } from '../../resources/resource'
import { getKubeResources } from '../events'
import { ApplicationCacheType, generateTransforms, IOCPApplication, MODE } from './applications'

const labelArr: string[] = [
  'kustomize.toolkit.fluxcd.io/name=',
  'helm.toolkit.fluxcd.io/name=',
  'app=',
  'app.kubernetes.io/part-of=',
]

// when there are lots of clusters there will be 34 identical ocp apps on each
// rather then overtax the search api to gewt all these apps, we will just
// grab the ocp apps from one remote cluster and duplicate then for each cluster;
// therefore these become placeholders in the list which when clicked will cause
// the ui to then use the \search api to get the details
const FILL_SYSTEM_APP_THRESHOLD = 10

const query = {
  operationName: 'searchResult',
  variables: {
    input: [
      {
        filters: [
          {
            property: 'kind',
            values: ['Deployment'],
          },
          {
            property: 'label',
            values: [...labelArr.map((label) => `${label}*`)],
          },
        ],
        limit: 20000,
      },
    ],
  },
  query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}',
}

export interface IOCPAppResource extends IResource {
  apigroup: string
  apiversion: string
  kind: string
  name: string
  namespace: string
  cluster: string
  label?: string
  created: string
  _hostingSubscription?: boolean
}

export async function getOCPApps(
  applicationCache: ApplicationCacheType,
  argAppSet: Set<string>,
  mode: MODE,
  pass: number
) {
  let clusterMap = undefined
  const _query = structuredClone(query)
  const filters = _query.variables.input[0].filters
  if (mode === MODE.ExcludeSystemApps) {
    // NO system apps
    filters.push(
      {
        property: 'namespace',
        values: ['!openshift*'],
      },
      {
        property: 'namespace',
        values: ['!open-cluster-management*'],
      }
    )
  } else if (mode === MODE.OnlySystemApps) {
    // ONLY system apps
    filters.push({
      property: 'namespace',
      values: ['openshift*', 'open-cluster-management*'],
    })

    // if lots of clusters we just get apps from local and one remote cluster
    // and then duplicate the remote cluster for every cluster
    clusterMap = getClusterMap()
    const clusterNames = Object.keys(clusterMap)
    if (clusterNames.length > FILL_SYSTEM_APP_THRESHOLD) {
      const remoteClusterName = clusterNames.find((name) => name !== 'local-cluster')
      filters.push({
        property: 'cluster',
        values: ['local-cluster', `${remoteClusterName}`],
      })
    }
  }

  const ocpApps = (await getPagedSearchResources(
    _query,
    mode !== MODE.OnlySystemApps,
    pass
  )) as unknown as IOCPAppResource[]
  const helmReleases = getKubeResources('HelmRelease', 'apps.open-cluster-management.io/v1')

  // filter ocp apps from this search
  const openShiftAppResourceMaps: Record<string, IOCPAppResource> = {}
  ocpApps.forEach((ocpApp: IOCPAppResource) => {
    if (ocpApp._hostingSubscription) {
      // don't list subscription apps as ocp
      return
    }

    const labels = (ocpApp.label || '')
      .replace(/\s/g, '')
      .split(';')
      .map((label: string) => {
        const [annotation, value] = label.split('=')
        return { annotation, value } as { annotation: string; value: string }
      })

    const { itemLabel, isManagedByHelm, argoInstanceLabelValue } = getValues(labels)

    if (itemLabel && isManagedByHelm) {
      const helmRelease = helmReleases.find(
        (hr) => hr.metadata.name === itemLabel && hr.metadata.namespace === ocpApp.namespace
      )
      if (helmRelease && helmRelease.metadata.annotations?.['apps.open-cluster-management.io/hosting-subscription']) {
        // don't list helm subscription apps as ocp
        return
      }
    }
    if (itemLabel) {
      const key = `${itemLabel}-${ocpApp.namespace}-${ocpApp.cluster}`
      const argoKey = `${argoInstanceLabelValue}-${ocpApp.namespace}-${ocpApp.cluster}`
      if (!argAppSet.has(argoKey)) {
        openShiftAppResourceMaps[key] = ocpApp
      }
    }
  })

  const localOCPApps: IResource[] = []
  const remoteOCPApps: IResource[] = []
  Object.entries(openShiftAppResourceMaps).forEach(([, value]) => {
    let labelIdx
    let i
    for (i = 0; i < labelArr.length; i++) {
      labelIdx = value.label?.indexOf(labelArr[i])
      if (labelIdx > -1) {
        break
      }
    }
    labelIdx += labelArr[i].length

    const semicolon = value.label?.indexOf(';', labelIdx)
    const appLabel = value.label?.substring(labelIdx, semicolon > -1 ? semicolon : value.label?.length)
    const resourceName = value.name
    let apps
    if (value.cluster === 'local-cluster') {
      apps = localOCPApps
    } else {
      apps = remoteOCPApps
    }
    apps.push({
      apiVersion: value.apigroup ? `${value.apigroup}/${value.apiversion}` : value.apiversion,
      kind: value.kind,
      label: value.label,
      metadata: {
        name: appLabel,
        namespace: value.namespace,
        creationTimestamp: value.created,
      },
      status: {
        cluster: value.cluster,
        resourceName,
      },
    } as unknown as IResource)
  })
  if (mode === MODE.ExcludeSystemApps) {
    applicationCache['localOCPApps'] = generateTransforms(localOCPApps)
    applicationCache['remoteOCPApps'] = generateTransforms(remoteOCPApps, true)
  } else if (mode === MODE.OnlySystemApps) {
    applicationCache['localSysApps'] = generateTransforms(localOCPApps)
    applicationCache['remoteSysApps'] = generateTransforms(fillSystemApps(remoteOCPApps, clusterMap), true)
  }
}

function fillSystemApps(remoteSysApps: IResource[], clusterMap: { [cluster: string]: IResource }) {
  const clusterNames = Object.keys(clusterMap)
  // if environment has lots of clusters, we duplicate the apps on  this remote cluster
  if (clusterNames.length > FILL_SYSTEM_APP_THRESHOLD) {
    const fillerSysApps: IResource[] = []
    clusterNames.forEach((cluster) => {
      if (cluster !== 'local-cluster') {
        remoteSysApps.forEach((app) => {
          const dup = structuredClone(app) as IOCPApplication
          dup.status.cluster = cluster
          dup.metadata.creationTimestamp = clusterMap[cluster].metadata.creationTimestamp
          fillerSysApps.push(dup)
        })
      }
    })
    return fillerSysApps
  }
  return remoteSysApps
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getValues(labels: { annotation: any; value: any }[]) {
  let itemLabel = ''
  let argoInstanceLabelValue = ''
  let isManagedByHelm

  labels &&
    labels.forEach(({ annotation, value }) => {
      value = value as string
      if (annotation === 'app') {
        itemLabel = value as string
      } else if (annotation === 'app.kubernetes.io/part-of') {
        if (!itemLabel) {
          itemLabel = value as string
        }
      }
      if (annotation === 'app.kubernetes.io/instance') {
        argoInstanceLabelValue = value as string
      }
      if (annotation === 'app.kubernetes.io/managed-by' && value === 'Helm') {
        isManagedByHelm = true
      }
    })
  return {
    itemLabel,
    isManagedByHelm,
    argoInstanceLabelValue,
  }
}

export function isSystemApp(namespace?: string) {
  return (
    namespace &&
    (namespace.startsWith('openshift') ||
      namespace.startsWith('open-cluster-management') ||
      namespace.startsWith('hive') ||
      namespace.startsWith('multicluster-engine'))
  )
}
