/* Copyright Contributors to the Open Cluster Management project */

import { AcmIconVariant } from '../AcmIcons/AcmIcons'

export * from './AcmProviderCard/AcmProviderCard'
export * from './AcmInlineProvider/AcmInlineProvider'

// These connect change as they are used in existing resources ass identifiers
export enum Provider {
  redhatcloud = 'rhocm',
  redhatvirtualization = 'redhatvirtualization',
  ansible = 'ans',
  openstack = 'ost',
  aws = 'aws',
  awss3 = 'awss3',
  gcp = 'gcp',
  azure = 'azr',
  vmware = 'vmw',
  ibm = 'ibm',
  ibmpower = 'ibmpower',
  ibmz = 'ibmz',
  baremetal = 'bmc',
  hostinventory = 'hostinventory',
  hybrid = 'hybrid',
  hypershift = 'hypershift',
  alibaba = 'alibaba',
  other = 'other',
  kubevirt = 'kubevirt',
}

export const ProviderShortTextMap = {
  [Provider.redhatcloud]: 'OCM',
  [Provider.redhatvirtualization]: 'RHV',
  [Provider.ansible]: 'ANS',
  [Provider.openstack]: 'OpenStack',
  [Provider.aws]: 'Amazon',
  [Provider.awss3]: 'Amazon S3',
  [Provider.gcp]: 'Google',
  [Provider.azure]: 'Microsoft',
  [Provider.ibm]: 'IBM',
  [Provider.ibmpower]: 'IBM Power',
  [Provider.ibmz]: 'IBM Z',
  [Provider.baremetal]: 'Bare metal',
  [Provider.vmware]: 'VMware',
  [Provider.hybrid]: 'Assisted installation',
  [Provider.hostinventory]: 'Host inventory',
  [Provider.hypershift]: 'Hypershift',
  [Provider.alibaba]: 'Alibaba',
  [Provider.other]: 'Other',
  [Provider.kubevirt]: 'OpenShift Virtualization',
}

export const ProviderLongTextMap = {
  [Provider.redhatcloud]: 'Red Hat OpenShift Cluster Manager',
  [Provider.redhatvirtualization]: 'Red Hat Virtualization',
  [Provider.ansible]: 'Red Hat Ansible Automation Platform',
  [Provider.openstack]: 'Red Hat OpenStack Platform',
  [Provider.aws]: 'Amazon Web Services',
  [Provider.awss3]: 'Amazon Web Services - S3 Bucket',
  [Provider.gcp]: 'Google Cloud Platform',
  [Provider.azure]: 'Microsoft Azure',
  [Provider.ibm]: 'IBM Cloud',
  [Provider.ibmpower]: 'IBM Power',
  [Provider.ibmz]: 'IBM Z',
  [Provider.baremetal]: 'Bare metal',
  [Provider.vmware]: 'VMware vSphere',
  [Provider.hybrid]: 'Assisted installation',
  [Provider.hostinventory]: 'Host inventory',
  [Provider.hypershift]: 'Hypershift',
  [Provider.alibaba]: 'Alibaba Cloud',
  [Provider.other]: 'Other',
  [Provider.kubevirt]: 'Red Hat OpenShift Virtualization',
}

export const ProviderIconMap = {
  [Provider.redhatcloud]: AcmIconVariant.redhat,
  [Provider.redhatvirtualization]: AcmIconVariant.redhat,
  [Provider.ansible]: AcmIconVariant.ansible,
  [Provider.openstack]: AcmIconVariant.redhat,
  [Provider.aws]: AcmIconVariant.aws,
  [Provider.awss3]: AcmIconVariant.awss3,
  [Provider.gcp]: AcmIconVariant.gcp,
  [Provider.azure]: AcmIconVariant.azure,
  [Provider.ibm]: AcmIconVariant.ibm,
  [Provider.ibmpower]: AcmIconVariant.ibmlogo,
  [Provider.ibmz]: AcmIconVariant.ibmlogo,
  [Provider.baremetal]: AcmIconVariant.baremetal,
  [Provider.vmware]: AcmIconVariant.vmware,
  [Provider.hostinventory]: AcmIconVariant.hybrid,
  [Provider.hybrid]: AcmIconVariant.hybrid,
  [Provider.alibaba]: AcmIconVariant.alibaba,
  [Provider.other]: AcmIconVariant.cloud,
  [Provider.hypershift]: AcmIconVariant.cloud,
  [Provider.kubevirt]: AcmIconVariant.kubevirt,
}
