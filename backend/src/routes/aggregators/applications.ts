/* Copyright Contributors to the Open Cluster Management project */
import { getKubeResources } from '../events'
import { AggregatedCacheType } from '../aggregator'
import { getOCPApps } from './applicationsOCP'
import { getArgoApps } from './applicationsArgo'

export async function aggregateApplications(aggregatedCache: AggregatedCacheType, key: string): Promise<void> {
  // ACM Apps
  const acmApps = getKubeResources('Application', 'app.k8s.io/v1beta1')

  // Argo Apps
  const { argoApps, argoAppSet } = await getArgoApps()

  // Argo AppSets
  const argoAppSets = getKubeResources('ApplicationSet', 'argoproj.io/v1alpha1')

  // OCP Apps
  const ocpApps = await getOCPApps(argoAppSet)

  aggregatedCache[key] = acmApps.concat(argoAppSets).concat(argoApps).concat(ocpApps)
}
