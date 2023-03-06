/* Copyright Contributors to the Open Cluster Management project */

import { TFunction } from 'i18next'
import { ClusterManagementAddOn, ClusterManagementAddOnDefinition } from '../cluster-management-add-on'
import { ManagedClusterAddOn } from '../managed-cluster-add-on'

export type Addon = {
  name: string
  status: string
  message: string | undefined
  launchLink: LaunchLink | undefined
}

export enum AddonStatus {
  'Available' = 'Available',
  'Progressing' = 'Progressing',
  'Degraded' = 'Degraded',
  'Unknown' = 'Unknown',
}

export type LaunchLink = {
  displayText: string
  href: string
}

export const addonPathKey = 'console.open-cluster-management.io/launch-link'
export const addonTextKey = 'console.open-cluster-management.io/launch-link-text'

export function mapAddons(
  clusterManagementAddons: ClusterManagementAddOn[],
  managedClusterAddons: ManagedClusterAddOn[] = []
) {
  const addons: Addon[] = managedClusterAddons.map((mca) => {
    let cma: ClusterManagementAddOn | undefined = clusterManagementAddons.find(
      (clusterManagementAddOn) => mca.metadata.name === clusterManagementAddOn?.metadata.name
    )
    if (cma === undefined) {
      cma = {
        ...ClusterManagementAddOnDefinition,
        metadata: {
          name: mca.metadata.name,
        },
        spec: {
          addOnMeta: {
            displayName: mca.status?.addOnMeta?.displayName ?? '',
            description: mca.status?.addOnMeta?.description ?? '',
          },
          addOnConfiguration: {
            crdName: mca.status?.addOnConfiguration?.crdName ?? '',
            crName: mca.status?.addOnConfiguration?.crName ?? '',
          },
        },
      } as ClusterManagementAddOn
    }
    return {
      name: cma.metadata.name as string,
      status: getDisplayStatus(cma, managedClusterAddons),
      message: getDisplayMessage(cma, managedClusterAddons),
      launchLink: getLaunchLink(cma, managedClusterAddons),
    }
  })
  return addons
}

function getDisplayStatus(cma: ClusterManagementAddOn | undefined, mcas: ManagedClusterAddOn[]): string {
  const mcaStatus = mcas?.find((mca) => mca.metadata.name === cma?.metadata.name)

  if (mcaStatus?.status?.conditions === undefined) {
    return AddonStatus.Unknown
  }

  const managedClusterAddOnConditionDegraded = mcaStatus?.status.conditions.find(
    (condition) => condition.type === AddonStatus.Degraded
  )
  if (managedClusterAddOnConditionDegraded?.status === 'True') {
    return AddonStatus.Degraded
  }
  const managedClusterAddOnConditionProgressing = mcaStatus?.status.conditions.find(
    (condition) => condition.type === AddonStatus.Progressing
  )
  if (managedClusterAddOnConditionProgressing?.status === 'True') {
    return AddonStatus.Progressing
  }
  const managedClusterAddOnConditionAvailable = mcaStatus?.status.conditions.find(
    (condition) => condition.type === AddonStatus.Available
  )
  if (managedClusterAddOnConditionAvailable?.status === 'True') {
    return AddonStatus.Available
  }
  if (managedClusterAddOnConditionAvailable?.status === 'Unknown') {
    return AddonStatus.Unknown
  }
  if (
    managedClusterAddOnConditionAvailable?.status === 'False' ||
    managedClusterAddOnConditionProgressing?.status === 'False' ||
    managedClusterAddOnConditionDegraded?.status === 'False'
  ) {
    return AddonStatus.Progressing
  }

  return AddonStatus.Unknown
}

function getDisplayMessage(cma: ClusterManagementAddOn, mcas: ManagedClusterAddOn[]): string | undefined {
  const mcaStatus = mcas?.find((mca) => mca.metadata.name === cma.metadata.name)
  if (mcaStatus?.status?.conditions === undefined) {
    return undefined
  }
  const managedClusterAddOnConditionDegraded = mcaStatus?.status.conditions.find(
    (condition) => condition.type === AddonStatus.Degraded
  )
  if (managedClusterAddOnConditionDegraded?.status === 'True') {
    return managedClusterAddOnConditionDegraded.message
  }
  const managedClusterAddOnConditionProgressing = mcaStatus?.status.conditions.find(
    (condition) => condition.type === AddonStatus.Progressing
  )
  if (managedClusterAddOnConditionProgressing?.status === 'True') {
    return managedClusterAddOnConditionProgressing.message
  }
  const managedClusterAddOnConditionAvailable = mcaStatus?.status.conditions.find(
    (condition) => condition.type === AddonStatus.Available
  )
  if (managedClusterAddOnConditionAvailable?.status === 'True') {
    return managedClusterAddOnConditionAvailable.message
  }
  if (managedClusterAddOnConditionAvailable?.status === 'Unknown') {
    return managedClusterAddOnConditionAvailable.message
  }
  if (
    managedClusterAddOnConditionAvailable?.status === 'False' ||
    managedClusterAddOnConditionProgressing?.status === 'False' ||
    managedClusterAddOnConditionDegraded?.status === 'False'
  ) {
    return ''
  }

  return AddonStatus.Unknown
}

export function getLaunchLink(cma: ClusterManagementAddOn, mcas: ManagedClusterAddOn[]): LaunchLink | undefined {
  const mca = mcas.find((mca) => mca.metadata.name === cma.metadata.name)
  const cmaAnnotations = Object.keys(cma.metadata.annotations ?? {})
  const cmaHasLaunchLink = cmaAnnotations.includes(addonPathKey) && cmaAnnotations.includes(addonTextKey)
  if (mca) {
    const mcaAnnotations = Object.keys(mca.metadata.annotations ?? [])
    const mcaHasLaunchLink = mcaAnnotations.includes(addonPathKey) && mcaAnnotations.includes(addonTextKey)
    if (mcaHasLaunchLink) {
      return {
        displayText: mca?.metadata?.annotations?.[addonTextKey] ?? '',
        href: mca?.metadata?.annotations?.[addonPathKey] ?? '',
      }
    } else {
      if (cmaHasLaunchLink) {
        return {
          displayText: cma?.metadata?.annotations?.[addonTextKey] ?? '',
          href: cma?.metadata?.annotations?.[addonPathKey] ?? '',
        }
      } else {
        return undefined
      }
    }
  } else {
    if (cmaHasLaunchLink) {
      return {
        displayText: cma?.metadata?.annotations?.[addonTextKey] ?? '',
        href: cma?.metadata?.annotations?.[addonPathKey] ?? '',
      }
    } else {
      return undefined
    }
  }
}

export const getAddonStatusLabel = (status: AddonStatus | undefined, t: TFunction) => {
  switch (status) {
    case AddonStatus.Available:
      return t('Available')
    case AddonStatus.Degraded:
      return t('Degraded')
    case AddonStatus.Progressing:
      return t('Progressing')
    case AddonStatus.Unknown:
    default:
      return t('Unknown')
  }
}
