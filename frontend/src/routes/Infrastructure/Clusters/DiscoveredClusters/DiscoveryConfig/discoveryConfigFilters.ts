/* Copyright Contributors to the Open Cluster Management project */

import { Provider } from '../../../../../ui-components'

export type TranslationFunction = (key: string, params?: Record<string, string>) => string

/**
 * Converts a provider string to a normalized Provider enum value.
 * Maps various provider name formats to their standardized enum representation.
 *
 * @param provider - The infrastructure provider name as a string (case insensitive)
 * @returns The normalized Provider enum value
 */

export function getInfrastructureProvider(provider: string): Provider {
  switch (provider) {
    case Provider.gcp:
      return Provider.gcp
    case Provider.aws:
      return Provider.aws
    case 'azure':
      return Provider.azure
    case 'vsphere':
      return Provider.vmware
    case 'baremetal':
      return Provider.baremetal
    case 'openstack':
      return Provider.openstack
    case 'kubevirt':
      return Provider.kubevirt
    case 'powervs':
      return Provider.ibmpowervs
    case 'ibmcloud':
      return Provider.ibm
    case 'external':
      return Provider.external
    case 'libvirt':
      return Provider.libvirt
    case 'none':
      return Provider.other
    case 'nutanix':
      return Provider.nutanix
    case 'ovirt':
      return Provider.ovirt
    case Provider.other:
    default:
      return Provider.other
  }
}

/**
 * Returns a display name for the given infrastructure provider for UI display
 * *
 * @param provider - The infrastructure provider name as a string (case insensitive)
 * @returns The display name for the provider
 */
export function getDisplayNameForInfrastructureProvider(provider: string, t?: TranslationFunction): string {
  switch (provider.toLowerCase()) {
    case 'aws':
      return 'Amazon Web Services'
    case 'azure':
      return 'Microsoft Azure'
    case 'baremetal':
      return t ? t('infra.baremetal') : 'Bare Metal'
    case 'external':
      return t ? t('infra.external') : 'External'
    case 'libvirt':
      return t ? t('infra.libvirt') : 'Libvirt'
    case 'none':
      return t ? t('infra.none') : 'None'
    case 'gcp':
      return 'Google Cloud Platform'
    case 'ibmcloud':
      return 'IBM Cloud'
    case 'kubevirt':
      return 'Red Hat OpenShift Virtualization'
    case 'nutanix':
      return 'Nutanix'
    case 'openstack':
      return 'Red Hat OpenStack'
    case 'ovirt':
      return 'Red Hat Virtualization'
    case 'powervs':
      return 'IBM Power Virtual Server'
    case 'vsphere':
      return 'VMware vSphere'
    default:
      return provider
  }
}

/**
 * Returns an array of search terms related to the given infrastructure provider.
 * Used specifically for table filtering functionality to match against provider cells
 * that contain icons rather than plain text.
 *
 * Since table search is case insensitive, this function provides standardized
 * searchable text values that represent each provider, including common alternative names.
 * This ensures users can find providers regardless of how they type the search term
 * (e.g., "aws", "amazon", "amazon web services").
 *
 * @param provider - The infrastructure provider name as a string (case insensitive)
 * @returns An array of strings containing the provider name and related search terms
 */

export function searchInfrastructureProvider(provider: string) {
  switch (provider.toLowerCase()) {
    case Provider.gcp:
      return [Provider.gcp, 'google cloud platform']
    case Provider.aws:
      return [Provider.aws, 'amazon web services']
    case 'azure':
      return [Provider.azure, 'microsoft azure']
    case 'vsphere':
      return [Provider.vmware, 'vsphere', 'vmware vsphere']
    case 'baremetal':
      return [Provider.baremetal, 'bare metal']
    case 'openstack':
      return [Provider.openstack, 'red hat openstack']
    case 'kubevirt':
      return [Provider.kubevirt, 'red hat openshift virtualization']
    case 'powervs':
      return [Provider.ibmpowervs, 'ibm power virtual server']
    case 'ibmcloud':
      return [Provider.ibm, 'ibm cloud']
    case 'external':
      return [Provider.external, 'external provider']
    case 'libvirt':
      return [Provider.libvirt, 'libvirt virtualization']
    case 'none':
      return [Provider.none, 'no provider']
    case 'nutanix':
      return [Provider.nutanix, 'nutanix cloud']
    case 'ovirt':
      return [Provider.ovirt, 'red hat virtualization']
    case Provider.other:
    default:
      return [Provider.other, provider]
  }
}

/**
 * Converts a cluster type acronym to its full display name.
 *
 * @param acronym - The cluster type acronym to convert (case insensitive)
 * @returns The full display name of the cluster type, or the original acronym if not recognized
 */

export function getFullTypeByAcronymForDiscoveryClustersType(acronym: string, t?: TranslationFunction) {
  switch (acronym.toUpperCase()) {
    case 'MOA':
      return 'Red Hat OpenShift Service on AWS'
    case 'MOA-HOSTEDCONTROLPLANE':
      return 'Red Hat OpenShift Service on AWS Hosted Control Plane'
    case 'ROSA':
      return 'Red Hat OpenShift Service on AWS'
    case 'ROSA-HYPERSHIFT':
      return 'Red Hat OpenShift Service on AWS Hosted Control Plane'
    case 'OCP-ASSISTEDINSTALL':
      return 'OpenShift Container Platform (Assisted Installer)'
    case 'OCP':
      return 'OpenShift Container Platform'
    case 'OSD':
      return 'OpenShift Dedicated'
    case 'OSDTRIAL':
      return t ? t('type.trialVersionOf', { product: 'OpenShift Dedicated' }) : 'Trial version of OpenShift Dedicated'
    case 'ARO':
      return 'Azure Red Hat OpenShift'
    case 'RHMI':
      return 'Red Hat Managed Integration'
    case 'RHOIC':
      return 'Red Hat OpenShift on IBM Cloud'
    default:
      return acronym
  }
}

// ClusterTypes is the list of cluster types to discover. These types represent the platform the cluster is running on

export const DISCOVERY_CLUSTER_TYPES = [
  'OSD',
  'OSDTrial',
  'OSD-Trial',
  'OCP',
  'RHMI',
  'ROSA',
  'RHOIC',
  'MOA',
  'MOA-HostedControlPlane',
  'ROSA-HyperShift',
  'ARO',
  'OCP-ASSISTEDINSTALL',
]

// InfrastructureProviders is the list of infrastructure providers to discover. This can be a list of cloud providers or platforms (e.g., AWS, Azure, GCP) where clusters might be running.
export const INFRASTRUCTURE_PROVIDERS = [
  'aws',
  'azure',
  'baremetal',
  'external',
  'gcp',
  'ibmcloud',
  'kubevirt',
  'libvirt',
  'none',
  'nutanix',
  'openstack',
  'ovirt',
  'powervs',
  'vsphere',
]

export const CLUSTER_TYPE_GROUPS: {
  [key: string]: { displayName: string; types: string[] }
} = {
  OCP: {
    displayName: 'OpenShift Container Platform',
    types: ['OCP', 'OCP-AssistedInstall'],
  },
  OSD: {
    displayName: 'OpenShift Dedicated',
    types: ['OSD', 'OSDTrial', 'OSD-Trial'],
  },
  ROSA_CLASSIC: {
    displayName: 'ROSA Classic',
    types: ['ROSA', 'MOA'],
  },
  ROSA_HCP: {
    displayName: 'ROSA - Hosted Control Plane',
    types: ['ROSA-HyperShift', 'MOA-HostedControlPlane'],
  },
  ARO: {
    displayName: 'Azure Red Hat OpenShift',
    types: ['ARO'],
  },
  RHOIC: {
    displayName: 'Red Hat OpenShift on IBM Cloud',
    types: ['RHOIC'],
  },
  RHMI: {
    displayName: 'Red Hat Managed Integration',
    types: ['RHMI'],
  },
}

/**
 * Maps a specific cluster type to its group key
 */
export function getClusterTypeGroup(clusterType: string): string | undefined {
  if (!clusterType) return undefined

  const clusterTypeUpperCase = clusterType.toUpperCase()

  for (const [groupKey, groupInfo] of Object.entries(CLUSTER_TYPE_GROUPS)) {
    if (groupInfo.types.some((type) => type.toUpperCase() === clusterTypeUpperCase)) {
      return groupKey
    }
  }

  return undefined
}

/**
 * Gets all cluster types that are from a group
 */
export function getClusterTypesInGroup(groupKey: string): string[] {
  return CLUSTER_TYPE_GROUPS[groupKey]?.types ?? []
}

/**
 * Maps an array of cluster types to an array of group keys, transforms API data into UI groups and selection
 */
export function getGroupsFromClusterTypes(clusterTypes: string[] | undefined): string[] {
  if (!clusterTypes || clusterTypes.length === 0) return []

  const groups = new Set<string>()

  clusterTypes.forEach((type) => {
    const group = getClusterTypeGroup(type)
    if (group) {
      groups.add(group)
    }
  })

  return Array.from(groups)
}

/**
 * Gets all cluster types from multiple groups
 * Used when converting selected groups back to types for the API
 */
export function getAllClusterTypesFromGroups(groupKeys: string[]): string[] {
  if (!groupKeys || groupKeys.length === 0) return []

  return groupKeys.flatMap((group) => getClusterTypesInGroup(group))
}
