/* Copyright Contributors to the Open Cluster Management project */

import { Text, TextVariants } from '@patternfly/react-core'
import { TFunction } from 'i18next'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'

export const DOC_VERSION = '2.7'

export const DOC_HOME = `https://access.redhat.com/documentation/en-us/red_hat_advanced_cluster_management_for_kubernetes/${DOC_VERSION}`
export const DOC_BASE_PATH = `${DOC_HOME}/html-single`
export const OCP_DOC_BASE_PATH = 'https://docs.openshift.com/container-platform'

export const DOC_LINKS = {
    CLUSTERS: `${DOC_BASE_PATH}/multicluster_engine/index#cluster-overview`,
    CREATE_CONNECTION: `${DOC_BASE_PATH}/multicluster_engine/index#credentials`,
    CREATE_CONNECTION_AWS: `${DOC_BASE_PATH}/multicluster_engine/index#creating-a-credential-for-amazon-web-services`,
    CREATE_CONNECTION_AZURE: `${DOC_BASE_PATH}/multicluster_engine/index#creating-a-credential-for-microsoft-azure`,
    CREATE_CONNECTION_GCP: `${DOC_BASE_PATH}/multicluster_engine/index#creating-a-credential-for-google-cloud-platform`,
    CREATE_CONNECTION_VMWARE: `${DOC_BASE_PATH}/multicluster_engine/index#creating-a-credential-for-vmware-vsphere`,
    CREATE_CONNECTION_OPENSTACK: `${DOC_BASE_PATH}/multicluster_engine/index#creating-a-credential-for-openstack`,
    CREATE_CONNECTION_VIRTUALIZATION: `${DOC_BASE_PATH}/multicluster_engine/index#creating-a-credential-for-virtualization`,
    CREATE_CONNECTION_ANSIBLE: `${DOC_BASE_PATH}/multicluster_engine/index#creating-a-credential-for-ansible`,
    CREATE_CONNECTION_REDHATCLOUD: `${DOC_BASE_PATH}/multicluster_engine/index#creating-a-credential-for-openshift-cluster-manager`,
    CREATE_CONNECTION_PROXY: `${DOC_BASE_PATH}/multicluster_engine/index#cluster-overview`,
    CREATE_CONNECTION_PROXY_VMWARE: `${DOC_BASE_PATH}/multicluster_engine/index#proxy-vm`,
    CREATE_CONNECTION_PROXY_AWS: `${DOC_BASE_PATH}/multicluster_engine/index#proxy-aws`,
    CREATE_CONNECTION_PROXY_AZURE: `${DOC_BASE_PATH}/multicluster_engine/index#proxy-azure`,
    CREATE_CONNECTION_PROXY_GCP: `${DOC_BASE_PATH}/multicluster_engine/index#proxy-google`,
    CREATE_CONNECTION_PROXY_OPENSTACK: `${DOC_BASE_PATH}/multicluster_engine/index#proxy-openstack`,
    CREATE_CONNECTION_PROXY_VIRTUALIZATION: `${DOC_BASE_PATH}/multicluster_engine/index#proxy-virtualization`,
    CREATE_CLUSTER: `${DOC_BASE_PATH}/multicluster_engine/index#creating-a-cluster`,
    CREATE_CLUSTER_ON_PREMISE: `${DOC_BASE_PATH}/multicluster_engine/index#creating-a-cluster-on-premises`,
    CREATE_CLUSTER_PREREQ: `${DOC_BASE_PATH}/multicluster_engine/index#create-a-cluster-prereq`,
    IMPORT_CLUSTER: `${DOC_BASE_PATH}/multicluster_engine/index#importing-a-target-managed-cluster-to-the-hub-cluster`,
    CLUSTER_SETS: `${DOC_BASE_PATH}/multicluster_engine/index#managedclustersets-intro`,
    GLOBAL_CLUSTER_SET: `${DOC_BASE_PATH}/multicluster_engine/index#managedclustersets_global`,
    CLUSTER_POOLS: `${DOC_BASE_PATH}/multicluster_engine/index#managing-cluster-pools`,
    CLUSTER_CLAIMS: `${DOC_BASE_PATH}/multicluster_engine/index#claiming-clusters-from-cluster-pools`,
    SUBMARINER: `${DOC_BASE_PATH}/add-ons/index#submariner`,
    CONFIG_DISCONNECTED_INSTALL: `${DOC_BASE_PATH}/multicluster_engine/index#cluster-overview`,
    CONFIG_DISCONNECTED_INSTALL_VMWARE: `${DOC_BASE_PATH}/multicluster_engine/index#disconnected-vm`,
    CONFIG_DISCONNECTED_INSTALL_OPENSTACK: `${DOC_BASE_PATH}/multicluster_engine/index#disconnected-openstack`,
    HOSTED_CONTROL_PLANES: `${DOC_BASE_PATH}/multicluster_engine/multicluster_engine_overview#hosted-control-planes-configure`,
    INFRASTRUCTURE_EVIRONMENTS: `${DOC_BASE_PATH}/multicluster_engine/index#creating-an-infrastructure-environment`,
    DISCOVERED_CLUSTERS: `${DOC_BASE_PATH}/multicluster_engine/index#discovery-intro`,
    MACHINE_POOLS: `${DOC_BASE_PATH}/multicluster_engine/index#scaling-managed`,
    MANAGE_APPLICATIONS: `${DOC_BASE_PATH}/applications/index#managing-applications`,
    ANSIBLE_JOBS: `${DOC_BASE_PATH}/multicluster_engine/index#ansible-config-cluster`,
    POLICIES: `${DOC_BASE_PATH}/governance/index#policy-overview`,
    POLICY_SETS: `${DOC_BASE_PATH}/governance/index#policy-overview`,
    HYPERSHIFT_INTRO: `${DOC_BASE_PATH}/multicluster_engine/index#hosted-control-planes-intro`,
    GITOPS_CONFIG: `${DOC_BASE_PATH}/applications/index#gitops-config`,
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
