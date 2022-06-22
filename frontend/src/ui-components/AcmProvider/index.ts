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
    gcp = 'gcp',
    azure = 'azr',
    vmware = 'vmw',
    ibm = 'ibm',
    ibmpower = 'ibmpower',
    ibmz = 'ibmz',
    baremetal = 'bmc',
    hybrid = 'hybrid',
    hypershift = 'hypershift',
    alibaba = 'alibaba',
    other = 'other',
}

export const ProviderShortTextMap = {
    [Provider.redhatcloud]: 'OCM',
    [Provider.redhatvirtualization]: 'RHV',
    [Provider.ansible]: 'ANS',
    [Provider.openstack]: 'OpenStack',
    [Provider.aws]: 'Amazon',
    [Provider.gcp]: 'Google',
    [Provider.azure]: 'Microsoft',
    [Provider.ibm]: 'IBM',
    [Provider.ibmpower]: 'IBM Power',
    [Provider.ibmz]: 'IBM Z',
    [Provider.baremetal]: 'Bare metal',
    [Provider.vmware]: 'VMware',
    [Provider.hybrid]: 'On Premise',
    [Provider.hypershift]: 'Hypershift',
    [Provider.alibaba]: 'Alibaba',
    [Provider.other]: 'Other',
}

export const ProviderLongTextMap = {
    [Provider.redhatcloud]: 'Red Hat OpenShift Cluster Manager',
    [Provider.redhatvirtualization]: 'Red Hat Virtualization',
    [Provider.ansible]: 'Red Hat Ansible Automation Platform',
    [Provider.openstack]: 'Red Hat OpenStack Platform',
    [Provider.aws]: 'Amazon Web Services',
    [Provider.gcp]: 'Google Cloud Platform',
    [Provider.azure]: 'Microsoft Azure',
    [Provider.ibm]: 'IBM Cloud',
    [Provider.ibmpower]: 'IBM Power',
    [Provider.ibmz]: 'IBM Z',
    [Provider.baremetal]: 'Bare metal',
    [Provider.vmware]: 'VMware vSphere',
    [Provider.hybrid]: 'On Premise',
    [Provider.hypershift]: 'Hypershift',
    [Provider.alibaba]: 'Alibaba Cloud',
    [Provider.other]: 'Other',
}

export const ProviderIconMap = {
    [Provider.redhatcloud]: AcmIconVariant.redhat,
    [Provider.redhatvirtualization]: AcmIconVariant.redhat,
    [Provider.ansible]: AcmIconVariant.ansible,
    [Provider.openstack]: AcmIconVariant.redhat,
    [Provider.aws]: AcmIconVariant.aws,
    [Provider.gcp]: AcmIconVariant.gcp,
    [Provider.azure]: AcmIconVariant.azure,
    [Provider.ibm]: AcmIconVariant.ibm,
    [Provider.ibmpower]: AcmIconVariant.ibmlogo,
    [Provider.ibmz]: AcmIconVariant.ibmlogo,
    [Provider.baremetal]: AcmIconVariant.baremetal,
    [Provider.vmware]: AcmIconVariant.vmware,
    [Provider.hybrid]: AcmIconVariant.hybrid,
    [Provider.hypershift]: AcmIconVariant.hypershift,
    [Provider.alibaba]: AcmIconVariant.alibaba,
    [Provider.other]: AcmIconVariant.cloud,
}
