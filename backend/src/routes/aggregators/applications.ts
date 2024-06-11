/* Copyright Contributors to the Open Cluster Management project */
import { getKubeResources } from '../events'
import { AggregatedCacheType } from '../aggregator'
import { IOCPAppResource, getOCPApps } from './applicationsOCP'
import { getArgoApps } from './applicationsArgo'
import { IResource } from '../../resources/resource'
import { FilterSelections, FilterCounts } from '../../lib/pagination'

interface IArgoApplication extends IResource {
  cluster?: string
  spec: {
    destination: {
      name?: string
      namespace: string
      server?: string
    }
  }
}

export async function aggregateApplications(aggregatedCache: AggregatedCacheType, key: string): Promise<void> {
  // ACM Apps
  const acmApps = getKubeResources('Application', 'app.k8s.io/v1beta1')

  // Argo Apps
  const { argoApps, argoAppSet } = await getArgoApps()

  // Argo AppSets
  const argoAppSets = getKubeResources('ApplicationSet', 'argoproj.io/v1alpha1')

  // OCP Apps
  const ocpApps = await getOCPApps(argoAppSet)

  const filterCounts: FilterCounts = {}
  const allApps = acmApps
    .concat(argoAppSets)
    .concat(argoApps)
    .concat(ocpApps)
    .map((app) => generateTransformData(app, filterCounts))
  aggregatedCache[key] = {
    filterCounts,
    data: allApps,
  }
}

function generateTransformData(app: IResource, filterCounts: FilterCounts): IResource {
  const type = getApplicationType(app)
  app.transform = [
    app.metadata.name,
    type,
    getAppNamespace(app),
    'clusters',
    'repos',
    'timewindow',
    app.metadata.creationTimestamp as string,
  ]
  if (type in filterCounts) {
    filterCounts[type]++
  } else {
    filterCounts[type] = 1
  }
  return app
}

function getAppNamespace(resource: IResource): string {
  let namespace = resource.metadata?.namespace
  if (resource.apiVersion === 'argoproj.io/v1alpha1' && resource.kind === 'Application') {
    const argoApp = resource as IArgoApplication
    namespace = argoApp.spec.destination.namespace
  }
  return namespace
}

const fluxAnnotations = {
  helm: ['helm.toolkit.fluxcd.io/name', 'helm.toolkit.fluxcd.io/namespace'],
  git: ['kustomize.toolkit.fluxcd.io/name', 'kustomize.toolkit.fluxcd.io/namespace'],
}

function isFluxApplication(label: string) {
  let isFlux = false
  Object.entries(fluxAnnotations).forEach(([, values]) => {
    const [nameAnnotation, namespaceAnnotation] = values
    if (label.includes(nameAnnotation) && label.includes(namespaceAnnotation)) {
      isFlux = true
    }
  })
  return isFlux
}

function getApplicationType(resource: IResource | IOCPAppResource) {
  if (resource.apiVersion === 'app.k8s.io/v1beta1') {
    if (resource.kind === 'Application') {
      return 'subscription'
    }
  } else if (resource.apiVersion === 'argoproj.io/v1alpha1') {
    if (resource.kind === 'Application') {
      return 'argo'
    } else if (resource.kind === 'ApplicationSet') {
      return 'appset'
    }
  } else if ('label' in resource) {
    const isFlux = isFluxApplication(resource.label)
    if (isFlux) {
      return 'flux'
    }
    return 'openshift'
  }
  return '-'
}

export function filterApplications(filters: FilterSelections, items: IResource[]) {
  const filterCategories = Object.keys(filters)
  return items.filter((item) => {
    let isFilterMatch = true
    // Item must match 1 filter of each category
    filterCategories.forEach((filter: string) => {
      let isMatch = true
      switch (filter) {
        case 'type':
          isMatch = filters['type'].some((value: string) => value === item.transform[1])
          break
      }
      if (!isMatch) {
        isFilterMatch = false
      }
    })
    return isFilterMatch
  })
}
