/* Copyright Contributors to the Open Cluster Management project */

import { t } from 'i18next'
import { Provider } from '../../../../../ui-components'

// InfrastructureProviders is the list of infrastructure providers to discover. This can be
// a list of cloud providers or platforms (e.g., AWS, Azure, GCP) where clusters might be running.
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
 * Returns a localized display name for the given infrastructure provider for UI display
 * Uses i18next translations for consistent naming across the application.
 *
 * @param provider - The infrastructure provider name as a string (case insensitive)
 * @returns The localized display name for the provider
 */

export function getDisplayNameForInfrastructureProvider(provider: string): string {
  switch (provider.toLowerCase()) {
    case 'aws':
      return t('infra.aws')
    case 'azure':
      return t('infra.azure')
    case 'baremetal':
      return t('infra.baremetal')
    case 'external':
      return t('infra.external')
    case 'gcp':
      return t('infra.gcp')
    case 'ibmcloud':
      return t('infra.ibmcloud')
    case 'kubevirt':
      return t('infra.kubevirt')
    case 'libvirt':
      return t('infra.libvirt')
    case 'none':
      return t('infra.none')
    case 'nutanix':
      return t('infra.nutanix')
    case 'openstack':
      return t('infra.openstack')
    case 'ovirt':
      return t('infra.ovirt')
    case 'powervs':
      return t('infra.powervs')
    case 'vsphere':
      return t('infra.vsphere')
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

// ClusterTypes is the list of cluster types to discover. These types represent the platform
// the cluster is running on, such as OpenShift Container Platform (OCP), Azure Red Hat OpenShift (ARO), or others.

export function getFullTypeByAcronymForDiscoveryClustersType(acronym: string) {
  switch (acronym.toUpperCase()) {
    case 'MOA':
      return t('type.rosa')
    case 'MOA-HostedControlPlane': //MOA-HostedControlPlane
      return t('type.rosa.hcp')
    case 'ROSA': //ROSA (Red Hat OpenShift on AWS)
      return t('type.rosa')
    case 'ROSA-HCP': //ROSA-HyperShift (ROSA with HyperShift)
      return t('type.rosa.hcp')
    case 'OCP-ASSISTEDINSTALL': //OCP-AssistedInstall (OpenShift Assisted Installer)
      return t('type.ocp.assisted.install')
    case 'OCP': //OCP (OpenShift Container Platform)
      return t('type.ocp')
    case 'OSD': //OSD (OpenShift Dedicated)
      return t('type.osd')
    case 'OSD-TRIAL': //OSDTrial (Trial version of OpenShift Dedicated)
      return t('type.osd.trial')
    case 'ARO': //ARO (Azure Red Hat OpenShift)
      return t('type.aro')
    case 'RHMI': //RHMI (Red Hat Managed Integration)
      return t('type.rhmi')
    case 'RHOIC': //RHOIC (Red Hat OpenShift on IBM Cloud)
      return t('type.rhoic')
    default:
      // Unable to find match, return existing acronym
      return acronym
  }
}

export const DISCOVERY_CLUSTER_TYPES = [
  'OSD',
  'OSDTrial',
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
