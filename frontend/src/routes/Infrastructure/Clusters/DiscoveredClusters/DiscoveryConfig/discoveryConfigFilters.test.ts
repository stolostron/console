/* Copyright Contributors to the Open Cluster Management project */
import { Provider } from '../../../../../ui-components'
import {
  getInfrastructureProvider,
  searchInfrastructureProvider,
  getFullTypeByAcronymForDiscoveryClustersType,
  getClusterTypeGroup,
  getClusterTypesInGroup,
  getGroupsFromClusterTypes,
  getAllClusterTypesFromGroups,
  CLUSTER_TYPE_GROUPS,
  DISCOVERY_CLUSTER_TYPES,
  INFRASTRUCTURE_PROVIDERS,
  getDisplayNameForInfrastructureProvider,
} from './discoveryConfigFilters'

// Testing getDisplayNameForInfrastructureProvider function
describe('getDisplayNameForInfrastructureProvider', () => {
  it('returns translated name for AWS', () => {
    expect(getDisplayNameForInfrastructureProvider('aws')).toBe('Amazon Web Services')
  })

  it('returns translated name for Azure', () => {
    expect(getDisplayNameForInfrastructureProvider('azure')).toBe('Microsoft Azure')
  })

  it('returns translated name for GCP', () => {
    expect(getDisplayNameForInfrastructureProvider('gcp')).toBe('Google Cloud Platform')
  })

  it('returns translated name for baremetal', () => {
    expect(getDisplayNameForInfrastructureProvider('baremetal')).toBe('Bare Metal')
  })

  it('returns translated name for vsphere', () => {
    expect(getDisplayNameForInfrastructureProvider('vsphere')).toBe('VMware vSphere')
  })
})

// Testing additional search infrastructure provider cases
describe('searchInfrastructureProvider additional cases', () => {
  it('returns correct search terms for kubevirt', () => {
    expect(searchInfrastructureProvider('kubevirt')).toEqual([Provider.kubevirt, 'red hat openshift virtualization'])
  })

  it('returns correct search terms for powervs', () => {
    expect(searchInfrastructureProvider('powervs')).toEqual([Provider.ibmpowervs, 'ibm power virtual server'])
  })

  it('returns correct search terms for ibmcloud', () => {
    expect(searchInfrastructureProvider('ibmcloud')).toEqual([Provider.ibm, 'ibm cloud'])
  })

  it('returns correct search terms for nutanix', () => {
    expect(searchInfrastructureProvider('nutanix')).toEqual([Provider.nutanix, 'nutanix cloud'])
  })

  it('returns correct search terms for ovirt', () => {
    expect(searchInfrastructureProvider('ovirt')).toEqual([Provider.ovirt, 'red hat virtualization'])
  })

  it('returns correct search terms for none', () => {
    expect(searchInfrastructureProvider('none')).toEqual([Provider.none, 'no provider'])
  })
})

// Testing exported constants
describe('Exported constants', () => {
  it('DISCOVERY_CLUSTER_TYPES contains all expected cluster types', () => {
    expect(DISCOVERY_CLUSTER_TYPES).toContain('OSD')
    expect(DISCOVERY_CLUSTER_TYPES).toContain('OCP')
    expect(DISCOVERY_CLUSTER_TYPES).toContain('ROSA')
    expect(DISCOVERY_CLUSTER_TYPES).toContain('MOA')
    expect(DISCOVERY_CLUSTER_TYPES).toContain('ARO')
    expect(DISCOVERY_CLUSTER_TYPES.length).toBeGreaterThan(0)
  })

  it('INFRASTRUCTURE_PROVIDERS contains all expected providers', () => {
    expect(INFRASTRUCTURE_PROVIDERS).toContain('aws')
    expect(INFRASTRUCTURE_PROVIDERS).toContain('azure')
    expect(INFRASTRUCTURE_PROVIDERS).toContain('gcp')
    expect(INFRASTRUCTURE_PROVIDERS).toContain('vsphere')
    expect(INFRASTRUCTURE_PROVIDERS.length).toBeGreaterThan(0)
  })

  it('CLUSTER_TYPE_GROUPS contains all expected groups with their types', () => {
    expect(CLUSTER_TYPE_GROUPS).toHaveProperty('OCP')
    expect(CLUSTER_TYPE_GROUPS).toHaveProperty('ROSA_CLASSIC')
    expect(CLUSTER_TYPE_GROUPS).toHaveProperty('ROSA_HCP')
    expect(CLUSTER_TYPE_GROUPS.OCP.types).toContain('OCP')
    expect(CLUSTER_TYPE_GROUPS.ROSA_CLASSIC.types).toContain('ROSA')
  })
})

describe('getInfrastructureProvider', () => {
  it('returns correct Provider enum for GCP', () => {
    expect(getInfrastructureProvider(Provider.gcp)).toBe(Provider.gcp)
  })

  it('returns correct Provider enum for Azure', () => {
    expect(getInfrastructureProvider('azure')).toBe(Provider.azure)
  })

  it('returns correct Provider enum for vsphere', () => {
    expect(getInfrastructureProvider('vsphere')).toBe(Provider.vmware)
  })

  it('returns correct Provider enum for baremetal', () => {
    expect(getInfrastructureProvider('baremetal')).toBe(Provider.baremetal)
  })

  it('returns correct Provider enum for openstack', () => {
    expect(getInfrastructureProvider('openstack')).toBe(Provider.openstack)
  })

  it('returns correct Provider enum for kubevirt', () => {
    expect(getInfrastructureProvider('kubevirt')).toBe(Provider.kubevirt)
  })

  it('returns correct Provider enum for powervs', () => {
    expect(getInfrastructureProvider('powervs')).toBe(Provider.ibmpowervs)
  })

  it('returns correct Provider enum for ibmcloud', () => {
    expect(getInfrastructureProvider('ibmcloud')).toBe(Provider.ibm)
  })

  it('returns correct Provider enum for external', () => {
    expect(getInfrastructureProvider('external')).toBe(Provider.external)
  })

  it('returns correct Provider enum for libvirt', () => {
    expect(getInfrastructureProvider('libvirt')).toBe(Provider.libvirt)
  })

  it('returns correct Provider enum for none', () => {
    expect(getInfrastructureProvider('none')).toBe(Provider.other)
  })

  it('returns correct Provider enum for nutanix', () => {
    expect(getInfrastructureProvider('nutanix')).toBe(Provider.nutanix)
  })

  it('returns correct Provider enum for ovirt', () => {
    expect(getInfrastructureProvider('ovirt')).toBe(Provider.ovirt)
  })

  it('returns Provider.other for unknown providers', () => {
    expect(getInfrastructureProvider('unknown')).toBe(Provider.other)
  })
})

// Testing searchInfrastructureProvider function
describe('searchInfrastructureProvider', () => {
  it('returns correct search terms for AWS', () => {
    expect(searchInfrastructureProvider(Provider.aws)).toEqual([Provider.aws, 'amazon web services'])
  })

  it('returns correct search terms for GCP', () => {
    expect(searchInfrastructureProvider(Provider.gcp)).toEqual([Provider.gcp, 'google cloud platform'])
  })

  it('returns correct search terms for Azure', () => {
    expect(searchInfrastructureProvider('azure')).toEqual([Provider.azure, 'microsoft azure'])
  })

  it('returns correct search terms for vsphere', () => {
    expect(searchInfrastructureProvider('vsphere')).toEqual([Provider.vmware, 'vsphere', 'vmware vsphere'])
  })

  it('returns correct search terms for baremetal', () => {
    expect(searchInfrastructureProvider('baremetal')).toEqual([Provider.baremetal, 'bare metal'])
  })

  it('returns correct search terms for openstack', () => {
    expect(searchInfrastructureProvider('openstack')).toEqual([Provider.openstack, 'red hat openstack'])
  })

  it('returns correct search terms for unknown provider', () => {
    const unknownProvider = 'unknown-provider'
    expect(searchInfrastructureProvider(unknownProvider)).toEqual([Provider.other, unknownProvider])
  })

  it('handles case insensitivity correctly', () => {
    expect(searchInfrastructureProvider('AWS')).toEqual([Provider.aws, 'amazon web services'])
    expect(searchInfrastructureProvider('Gcp')).toEqual([Provider.gcp, 'google cloud platform'])
  })
})

// Testing getFullTypeByAcronymForDiscoveryClustersType function
describe('getFullTypeByAcronymForDiscoveryClustersType', () => {
  it('returns correct translated type for MOA', () => {
    expect(getFullTypeByAcronymForDiscoveryClustersType('MOA')).toBe('Red Hat OpenShift Service on AWS')
  })

  it('returns correct translated type for MOA-HostedControlPlane', () => {
    expect(getFullTypeByAcronymForDiscoveryClustersType('MOA-HostedControlPlane')).toBe(
      'Red Hat OpenShift Service on AWS Hosted Control Plane'
    )
  })

  it('returns correct translated type for ROSA', () => {
    expect(getFullTypeByAcronymForDiscoveryClustersType('ROSA')).toBe('Red Hat OpenShift Service on AWS')
  })

  it('returns correct translated type for ROSA-HyperShift', () => {
    expect(getFullTypeByAcronymForDiscoveryClustersType('ROSA-HyperShift')).toBe(
      'Red Hat OpenShift Service on AWS Hosted Control Plane'
    )
  })

  it('returns correct translated type for OCP-AssistedInstall', () => {
    expect(getFullTypeByAcronymForDiscoveryClustersType('OCP-AssistedInstall')).toBe('OpenShift Assisted Installer')
  })

  it('returns correct translated type for OCP', () => {
    expect(getFullTypeByAcronymForDiscoveryClustersType('OCP')).toBe('OpenShift Container Platform')
  })

  it('returns correct translated type for OSD', () => {
    expect(getFullTypeByAcronymForDiscoveryClustersType('OSD')).toBe('OpenShift Dedicated')
  })

  it('returns correct translated type for OSDTrial', () => {
    expect(getFullTypeByAcronymForDiscoveryClustersType('OSDTrial')).toBe('Trial version of OpenShift Dedicated')
  })

  it('returns correct translated type for ARO', () => {
    expect(getFullTypeByAcronymForDiscoveryClustersType('ARO')).toBe('Azure Red Hat OpenShift')
  })

  it('returns correct translated type for RHMI', () => {
    expect(getFullTypeByAcronymForDiscoveryClustersType('RHMI')).toBe('Red Hat Managed Integration')
  })

  it('returns correct translated type for RHOIC', () => {
    expect(getFullTypeByAcronymForDiscoveryClustersType('RHOIC')).toBe('Red Hat OpenShift on IBM Cloud')
  })
})

// Testing cluster type group related functions
describe('Cluster type group functions', () => {
  describe('getClusterTypeGroup', () => {
    it('returns correct group for OCP cluster type', () => {
      expect(getClusterTypeGroup('OCP')).toBe('OCP')
    })

    it('returns correct group for OCP-ASSISTEDINSTALL cluster type', () => {
      expect(getClusterTypeGroup('OCP-ASSISTEDINSTALL')).toBe('OCP')
    })

    it('returns correct group for ROSA cluster type', () => {
      expect(getClusterTypeGroup('ROSA')).toBe('ROSA_CLASSIC')
    })

    it('returns correct group for MOA cluster type', () => {
      expect(getClusterTypeGroup('MOA')).toBe('ROSA_CLASSIC')
    })

    it('returns correct group for ROSA-HyperShift cluster type', () => {
      expect(getClusterTypeGroup('ROSA-HyperShift')).toBe('ROSA_HCP')
    })

    it('returns correct group for MOA-HostedControlPlane cluster type', () => {
      expect(getClusterTypeGroup('MOA-HostedControlPlane')).toBe('ROSA_HCP')
    })

    it('handles case insensitivity correctly', () => {
      expect(getClusterTypeGroup('ocp')).toBe('OCP')
      expect(getClusterTypeGroup('rosa')).toBe('ROSA_CLASSIC')
    })

    it('returns undefined for unknown cluster type', () => {
      expect(getClusterTypeGroup('UNKNOWN')).toBeUndefined()
    })

    it('returns undefined for empty cluster type', () => {
      expect(getClusterTypeGroup('')).toBeUndefined()
    })

    it('returns undefined for null or undefined cluster type', () => {
      expect(getClusterTypeGroup(null as any)).toBeUndefined()
    })
  })

  describe('getClusterTypesInGroup', () => {
    it('returns correct types for OCP group', () => {
      expect(getClusterTypesInGroup('OCP')).toEqual(['OCP', 'OCP-ASSISTEDINSTALL'])
    })

    it('returns correct types for OSD group', () => {
      expect(getClusterTypesInGroup('OSD')).toEqual(['OSD', 'OSDTrial', 'OSD-Trial'])
    })

    it('returns correct types for ROSA_CLASSIC group', () => {
      expect(getClusterTypesInGroup('ROSA_CLASSIC')).toEqual(['ROSA', 'MOA'])
    })

    it('returns correct types for ROSA_HCP group', () => {
      expect(getClusterTypesInGroup('ROSA_HCP')).toEqual(['ROSA-HyperShift', 'MOA-HostedControlPlane'])
    })

    it('returns empty array for unknown group', () => {
      expect(getClusterTypesInGroup('UNKNOWN')).toEqual([])
    })
  })

  describe('getGroupsFromClusterTypes', () => {
    it('returns correct groups for a list of cluster types', () => {
      expect(getGroupsFromClusterTypes(['OCP', 'ROSA', 'ARO'])).toEqual(['OCP', 'ROSA_CLASSIC', 'ARO'])
    })

    it('returns correct groups when there are duplicates in the same group', () => {
      expect(getGroupsFromClusterTypes(['OCP', 'OCP-ASSISTEDINSTALL'])).toEqual(['OCP'])
    })

    it('returns correct groups when types are case insensitive', () => {
      expect(getGroupsFromClusterTypes(['ocp', 'rosa'])).toEqual(['OCP', 'ROSA_CLASSIC'])
    })

    it('ignores unknown cluster types', () => {
      expect(getGroupsFromClusterTypes(['OCP', 'UNKNOWN'])).toEqual(['OCP'])
    })

    it('returns empty array for empty or undefined input', () => {
      expect(getGroupsFromClusterTypes([])).toEqual([])
      expect(getGroupsFromClusterTypes(undefined)).toEqual([])
    })
  })

  describe('getAllClusterTypesFromGroups', () => {
    it('returns correct types for a list of groups', () => {
      expect(getAllClusterTypesFromGroups(['OCP', 'ROSA_CLASSIC'])).toEqual([
        'OCP',
        'OCP-ASSISTEDINSTALL',
        'ROSA',
        'MOA',
      ])
    })

    it('returns empty array for empty or undefined input', () => {
      expect(getAllClusterTypesFromGroups([])).toEqual([])
      expect(getAllClusterTypesFromGroups(undefined as unknown as string[])).toEqual([])
    })

    it('returns empty array for unknown groups', () => {
      expect(getAllClusterTypesFromGroups(['UNKNOWN'])).toEqual([])
    })
  })
})
