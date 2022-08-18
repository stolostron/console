/* Copyright Contributors to the Open Cluster Management project */

import { Text, TextVariants } from '@patternfly/react-core'
import { TFunction } from 'i18next'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'

export const DOC_VERSION = '2.6'

export const DOC_HOME = `https://access.redhat.com/documentation/en-us/red_hat_advanced_cluster_management_for_kubernetes/${DOC_VERSION}`
export const DOC_BASE_PATH = `${DOC_HOME}/html-single`
export const OCP_DOC_BASE_PATH = 'https://docs.openshift.com/container-platform'

export const DOC_LINKS = {
    CLUSTERS: `${DOC_BASE_PATH}/clusters/managing-your-clusters`,
    BARE_METAL_ASSETS: `${DOC_BASE_PATH}/clusters/managing-your-clusters#creating-and-modifying-bare-metal-assets`,
    CREATE_CONNECTION: `${DOC_BASE_PATH}/multicluster_engine/credentials/credentials`,
    CREATE_CONNECTION_AWS: `${DOC_BASE_PATH}/multicluster_engine/credentials/credentials#creating-a-credential-for-amazon-web-services`,
    CREATE_CONNECTION_AZURE: `${DOC_BASE_PATH}/multicluster_engine/credentials/credentials#creating-a-credential-for-microsoft-azure`,
    CREATE_CONNECTION_GCP: `${DOC_BASE_PATH}/multicluster_engine/credentials/credentials#creating-a-credential-for-google-cloud-platform`,
    CREATE_CONNECTION_VMWARE: `${DOC_BASE_PATH}/multicluster_engine/credentials/credentials#creating-a-credential-for-vmware-vsphere`,
    CREATE_CONNECTION_OPENSTACK: `${DOC_BASE_PATH}/multicluster_engine/credentials/credentials#creating-a-credential-for-openstack`,
    CREATE_CONNECTION_VIRTUALIZATION: `${DOC_BASE_PATH}/multicluster_engine/credentials/credentials#creating-a-credential-for-virtualization`,
    CREATE_CONNECTION_BAREMETAL: `${DOC_BASE_PATH}/multicluster_engine/credentials/credentials#creating-a-credential-for-bare-metal`,
    CREATE_CONNECTION_ANSIBLE: `${DOC_BASE_PATH}/multicluster_engine/credentials/credentials#creating-a-credential-for-ansible`,
    CREATE_CONNECTION_REDHATCLOUD: `${DOC_BASE_PATH}/multicluster_engine/credentials/credentials#creating-a-credential-for-openshift-cluster-manager`,
    CREATE_CONNECTION_PROXY: `${DOC_BASE_PATH}/multicluster_engine/credentials/credentials#proxy`,
    CREATE_CONNECTION_PROXY_VMWARE: `${DOC_BASE_PATH}/multicluster_engine/credentials/credentials#proxy-vm`,
    CREATE_CONNECTION_PROXY_AWS: `${DOC_BASE_PATH}/multicluster_engine/credentials/credentials#proxy-aws`,
    CREATE_CONNECTION_PROXY_AZURE: `${DOC_BASE_PATH}/multicluster_engine/credentials/credentials#proxy-azure`,
    CREATE_CONNECTION_PROXY_BAREMETAL: `${DOC_BASE_PATH}/multicluster_engine/credentials/credentials#proxy-bare`,
    CREATE_CONNECTION_PROXY_GCP: `${DOC_BASE_PATH}/multicluster_engine/credentials/credentials#proxy-google`,
    CREATE_CONNECTION_PROXY_OPENSTACK: `${DOC_BASE_PATH}/multicluster_engine/credentials/credentials#proxy-openstack`,
    CREATE_CONNECTION_PROXY_VIRTUALIZATION: `${DOC_BASE_PATH}/multicluster_engine/credentials/credentials#proxy-virtualization`,
    CREATE_CLUSTER: `${DOC_BASE_PATH}/clusters/managing-your-clusters#creating-a-cluster`,
    CREATE_CLUSTER_ON_PREMISE: `${DOC_BASE_PATH}/clusters/managing-your-clusters#creating-a-cluster-on-premises`,
    IMPORT_CLUSTER: `${DOC_BASE_PATH}/clusters/managing-your-clusters#importing-a-target-managed-cluster-to-the-hub-cluster`,
    CLUSTER_SETS: `${DOC_BASE_PATH}/clusters/managing-your-clusters#managedclustersets`,
    GLOBAL_CLUSTER_SET: `${DOC_BASE_PATH}/clusters/managing-your-clusters#managedclustersets`,
    CLUSTER_POOLS: `${DOC_BASE_PATH}/clusters/managing-your-clusters#managing-cluster-pools`,
    CLUSTER_CLAIMS: `${DOC_BASE_PATH}/clusters/managing-your-clusters#claiming-clusters-from-cluster-pools`,
    SUBMARINER: `${DOC_BASE_PATH}/add-ons/index#submariner`,
    CONFIG_DISCONNECTED_INSTALL: `${DOC_BASE_PATH}/multicluster_engine/credentials/credentials#disconnected`,
    CONFIG_DISCONNECTED_INSTALL_VMWARE: `${DOC_BASE_PATH}/multicluster_engine/credentials/credentials#disconnected-vm`,
    CONFIG_DISCONNECTED_INSTALL_OPENSTACK: `${DOC_BASE_PATH}/multicluster_engine/credentials/credentials#disconnected-openstack`,
    INFRASTRUCTURE_EVIRONMENTS: `${DOC_BASE_PATH}/clusters/managing-your-clusters#creating-an-infrastructure-environment`,
    DISCOVERED_CLUSTERS: `${DOC_BASE_PATH}/clusters/managing-your-clusters#discovery-intro`,
    MACHINE_POOLS: `${DOC_BASE_PATH}/clusters/managing-your-clusters#resizing-a-cluster`,
    MANAGE_APPLICATIONS: `${DOC_BASE_PATH}/applications/managing-applications`,
    ANSIBLE_JOBS: `${DOC_BASE_PATH}/clusters/managing-your-clusters#ansible-config-cluster`,
    POLICIES: `${DOC_BASE_PATH}/governance/governance#policy-overview`,
    POLICY_SETS: `${DOC_BASE_PATH}/governance/governance#policy-overview`,
    HYPERSHIFT_INTRO: `${DOC_BASE_PATH}/clusters/managing-your-clusters#hosted-control-plane-intro`,
}

export function viewDocumentation(doclink: string, t: TFunction) {
    return (
        <Text
            component={TextVariants.a}
            isVisitedLink
            href={doclink}
            target="_blank"
            style={{
                cursor: 'pointer',
                display: 'inline-block',
                padding: '15px 10px',
                fontSize: '14px',
            }}
        >
            {t('View documentation')} <ExternalLinkAltIcon />
        </Text>
    )
}
