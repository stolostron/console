/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useState } from 'react'
import { queryOCPAppResources, queryRemoteArgoApps } from '../lib/search'
import { useQuery } from '../lib/useQuery'
import { HelmRelease, OCPAppResource } from '../resources'
import { hostingSubAnnotationStr } from '../routes/Applications/helpers/resource-helper'
import { partOfAnnotationStr } from '../routes/Applications/Overview'
import { useSetRecoilState, useSharedAtoms } from '../shared-recoil'
import { LoadingPage } from './LoadingPage'

/* Copyright Contributors to the Open Cluster Management project */
export function GetDiscoveredOCPApps(stop: boolean, waitForSearch: boolean) {
  const { discoveredApplicationsState, discoveredOCPAppResourcesState } = useSharedAtoms()
  const { data, loading, startPolling, stopPolling } = useQuery(queryRemoteArgoApps)

  const {
    data: dataOCPResources,
    loading: loadingOCPResources,
    startPolling: startPollingOCPResources,
    stopPolling: stopPollingOCPResources,
  } = useQuery(queryOCPAppResources)

  const [timedOut, setTimedOut] = useState<boolean>()
  const setDiscoveredApplications = useSetRecoilState(discoveredApplicationsState)
  const setDiscoveredOCPAppResources = useSetRecoilState(discoveredOCPAppResourcesState)

  useEffect(() => {
    if (stop) {
      // No need to poll for Advanced configuration page
      startPolling()
      if (waitForSearch) {
        startPollingOCPResources()
      } else {
        stopPollingOCPResources()
      }
    } else {
      stopPolling()
      stopPollingOCPResources()
    }
  }, [waitForSearch, stop, startPolling, stopPolling, startPollingOCPResources, stopPollingOCPResources])

  useEffect(() => {
    const remoteArgoApps = data?.[0]?.data?.searchResult?.[0]?.items || []
    setDiscoveredApplications(remoteArgoApps)
    const ocpAppResources = dataOCPResources?.[0]?.data?.searchResult?.[0]?.items || []
    setDiscoveredOCPAppResources(ocpAppResources)
  }, [data, dataOCPResources, setDiscoveredApplications, setDiscoveredOCPAppResources])

  // failsafe in case search api is sleeping
  useEffect(() => {
    const handle = setTimeout(() => {
      setTimedOut(true)
    }, 5000)

    return () => {
      clearInterval(handle)
    }
  }, [])

  if (waitForSearch && (loading || loadingOCPResources) && !timedOut) {
    return <LoadingPage />
  }
}

export function GetOpenShiftAppResourceMaps(
  ocpApps: OCPAppResource[],
  helmReleases: HelmRelease[],
  argoApplicationsHashSet: Set<string>
) {
  const openShiftAppResourceMaps: Record<string, any> = {}
  for (let i = 0; i < ocpApps.length; i++) {
    let argoInstanceLabelValue
    if ((ocpApps[i] as any)._hostingSubscription) {
      // don't list subscription apps as ocp
      continue
    }

    let itemLabel = ''
    let isManagedByHelm = false
    const labels: [] =
      (ocpApps[i] as any).label &&
      (ocpApps[i] as any).label
        .replace(/\s/g, '')
        .split(';')
        .map((label: string) => {
          const [annotation, value] = label.split('=')
          return { annotation, value } as { annotation: string; value: string }
        })
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
    if (itemLabel && isManagedByHelm) {
      const helmRelease = helmReleases.find(
        (hr) => hr.metadata.name === itemLabel && hr.metadata.namespace === ocpApps[i].namespace
      )
      if (helmRelease && helmRelease.metadata.annotations?.[hostingSubAnnotationStr]) {
        // don't list helm subscription apps as ocp
        continue
      }
    }
    if (itemLabel) {
      const key = `${itemLabel}-${(ocpApps[i] as any).namespace}-${(ocpApps[i] as any).cluster}`
      const argoKey = `${argoInstanceLabelValue}-${(ocpApps[i] as any).namespace}-${(ocpApps[i] as any).cluster}`
      if (!argoApplicationsHashSet.has(argoKey)) {
        openShiftAppResourceMaps[key] = ocpApps[i]
      }
    }
  }
  return openShiftAppResourceMaps
}
