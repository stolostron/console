/* Copyright Contributors to the Open Cluster Management project */
import { get } from 'lodash'
import { useEffect, useState } from 'react'
import { ArgoApplication, Cluster, HelmRelease, OCPAppResource } from '../resources'
import { getArgoDestinationCluster } from '../routes/Applications/ApplicationDetails/ApplicationTopology/model/topologyArgo'
import { hostingSubAnnotationStr } from '../routes/Applications/helpers/resource-helper'
import { partOfAnnotationStr } from '../routes/Applications/Overview'

function getValues(labels: { annotation: any; value: any }[]) {
  let itemLabel = ''
  let argoInstanceLabelValue
  let isManagedByHelm

  labels &&
    labels.forEach(({ annotation, value }) => {
      if (annotation === 'app') {
        itemLabel = value
      } else if (annotation === partOfAnnotationStr) {
        if (!itemLabel) {
          itemLabel = value
        }
      }
      if (annotation === 'app.kubernetes.io/instance') {
        argoInstanceLabelValue = value
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

export function GetOpenShiftAppResourceMaps(
  ocpApps: OCPAppResource[],
  helmReleases: HelmRelease[],
  argoApplicationsHashSet: Set<string>
) {
  const openShiftAppResourceMaps: Record<string, any> = {}
  for (const ocpApp of ocpApps) {
    if ((ocpApp as any)._hostingSubscription) {
      // don't list subscription apps as ocp
      continue
    }

    const labels: [] =
      (ocpApp as any).label &&
      (ocpApp as any).label
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
      if (helmRelease && helmRelease.metadata.annotations?.[hostingSubAnnotationStr]) {
        // don't list helm subscription apps as ocp
        continue
      }
    }
    if (itemLabel) {
      const key = `${itemLabel}-${(ocpApp as any).namespace}-${(ocpApp as any).cluster}`
      const argoKey = `${argoInstanceLabelValue}-${(ocpApp as any).namespace}-${(ocpApp as any).cluster}`
      if (!argoApplicationsHashSet.has(argoKey)) {
        openShiftAppResourceMaps[key] = ocpApp
      }
    }
  }
  return openShiftAppResourceMaps
}

export function GetArgoApplicationsHashSet(
  discoveredApplications: ArgoApplication[],
  argoApps: ArgoApplication[],
  clusters: Cluster[]
) {
  const [argoApplicationsHashSet, setArgoApplicationsHashSet] = useState<Set<string>>(new Set<string>())
  useEffect(() => {
    discoveredApplications.forEach((remoteArgoApp: any) => {
      setArgoApplicationsHashSet(
        (prev) =>
          new Set(prev.add(`${remoteArgoApp.name}-${remoteArgoApp.destinationNamespace}-${remoteArgoApp.cluster}`))
      )
    })
    argoApps.forEach((argoApp: any) => {
      const resources = argoApp.status ? argoApp.status.resources : undefined
      const definedNamespace = get(resources, '[0].namespace')
      // cache Argo app signature for filtering OCP apps later
      setArgoApplicationsHashSet(
        (prev) =>
          new Set(
            prev.add(
              `${argoApp.metadata.name}-${
                definedNamespace ? definedNamespace : argoApp.spec.destination.namespace
              }-${getArgoDestinationCluster(argoApp.spec.destination, clusters, 'local-cluster')}`
            )
          )
      )
    })
  }, [argoApps, clusters, discoveredApplications])
  return argoApplicationsHashSet
}
