/* Copyright Contributors to the Open Cluster Management project */
import { getKubeResources } from '../events'
import { AggregatedCacheType } from '../aggregator'
import { getOCPApps } from './applicationsOCP'
import { getArgoApps } from './applicationsArgo'
import { IResource } from '../../resources/resource'

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

  aggregatedCache[key] = acmApps
    .concat(argoAppSets)
    .concat(argoApps)
    .concat(ocpApps)
    .map((app) => generateTransformData(app))
}

function generateTransformData(app: IResource): IResource {
  app.transform = [
    app.metadata.name,
    app.kind,
    getAppNamespace(app),
    'clusters',
    'repos',
    'timewindow',
    app.metadata.creationTimestamp as string,
  ]
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
