/* Copyright Contributors to the Open Cluster Management project */
import { getPagedSearchResources } from '../../lib/search'
import { IResource } from '../../resources/resource'
import { getKubeResources } from '../events'

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
        ],
        limit: 200000,
      },
    ],
  },
  query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}',
}

const labelArr: string[] = [
  'kustomize.toolkit.fluxcd.io/name=',
  'helm.toolkit.fluxcd.io/name=',
  'app=',
  'app.kubernetes.io/part-of=',
]

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

export async function getOCPApps(argAppSet: Set<string>, pass: number) {
  const ocpApps = (await getPagedSearchResources(query, 'remote ocp', pass)) as unknown as IOCPAppResource[]
  const helmReleases = getKubeResources('HelmRelease', 'apps.open-cluster-management.io/v1')

  // filter ocp apps from search
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
    const apps = value.cluster === 'local-cluster' ? localOCPApps : remoteOCPApps
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

  return { localOCPApps, remoteOCPApps }
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
