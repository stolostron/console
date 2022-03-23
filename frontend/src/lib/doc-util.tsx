/* Copyright Contributors to the Open Cluster Management project */

import { Text, TextVariants } from '@patternfly/react-core'
import { TFunction } from 'i18next'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'

export const DOC_VERSION = '2.5'

export const DOC_HOME = `https://access.redhat.com/documentation/en-us/red_hat_advanced_cluster_management_for_kubernetes/${DOC_VERSION}`
export const DOC_BASE_PATH = `${DOC_HOME}/html`
export const OCP_DOC_BASE_PATH = 'https://docs.openshift.com/container-platform'

export const DOC_LINKS = {
    CLUSTERS: `${DOC_BASE_PATH}/clusters/managing-your-clusters`,
    BARE_METAL_ASSETS: `${DOC_BASE_PATH}/clusters/managing-your-clusters#creating-and-modifying-bare-metal-assets`,
    CREATE_CONNECTION: `${DOC_BASE_PATH}/credentials/credentials`,
    CREATE_CONNECTION_AWS: `${DOC_BASE_PATH}/credentials/credentials#creating-a-credential-for-amazon-web-services`,
    CREATE_CONNECTION_AZURE: `${DOC_BASE_PATH}/credentials/credentials#creating-a-credential-for-microsoft-azure`,
    CREATE_CONNECTION_GCP: `${DOC_BASE_PATH}/credentials/credentials#creating-a-credential-for-google-cloud-platform`,
    CREATE_CONNECTION_VMWARE: `${DOC_BASE_PATH}/credentials/credentials#creating-a-credential-for-vmware-vsphere`,
    CREATE_CONNECTION_OPENSTACK: `${DOC_BASE_PATH}/credentials/credentials#creating-a-credential-for-openstack`,
    CREATE_CONNECTION_BAREMETAL: `${DOC_BASE_PATH}/credentials/credentials#creating-a-credential-for-bare-metal`,
    CREATE_CONNECTION_ANSIBLE: `${DOC_BASE_PATH}/credentials/credentials#creating-a-credential-for-ansible`,
    CREATE_CONNECTION_REDHATCLOUD: `${DOC_BASE_PATH}/credentials/credentials#creating-a-credential-for-openshift-cluster-manager`,
    CREATE_CONNECTION_PROXY: `${DOC_BASE_PATH}/credentials/credentials#proxy`,
    CREATE_CLUSTER: `${DOC_BASE_PATH}/clusters/managing-your-clusters#creating-a-cluster`,
    IMPORT_CLUSTER: `${DOC_BASE_PATH}/clusters/managing-your-clusters#importing-a-target-managed-cluster-to-the-hub-cluster`,
    CLUSTER_SETS: `${DOC_BASE_PATH}/clusters/managing-your-clusters#managedclustersets`,
    CLUSTER_POOLS: `${DOC_BASE_PATH}/clusters/managing-your-clusters#managing-cluster-pools`,
    CLUSTER_CLAIMS: `${DOC_BASE_PATH}/clusters/managing-your-clusters#claiming-clusters-from-cluster-pools`,
    SUBMARINER: `${DOC_BASE_PATH}/services/submariner/services-overview#submariner`,
    CONFIG_DISCONNECTED_INSTALL: `${DOC_BASE_PATH}/credentials/credentials#disconnected`,
    INFRASTRUCTURE_EVIRONMENTS: `${DOC_BASE_PATH}/clusters/managing-your-clusters#creating-an-infrastructure-environment`,
    DISCOVERED_CLUSTERS: `${DOC_BASE_PATH}/clusters/managing-your-clusters#discovery-intro`,
    MACHINE_POOLS: `${DOC_BASE_PATH}/clusters/managing-your-clusters#resizing-a-cluster`,
    MANAGE_APPLICATIONS: `${DOC_BASE_PATH}/applications/managing-applications`,
    ANSIBLE_JOBS: `${DOC_BASE_PATH}/clusters/managing-your-clusters#ansible-config-cluster`,
    POLICIES: `${DOC_BASE_PATH}/governance/governance#policy-overview`,
    POLICY_SETS: `${DOC_BASE_PATH}/governance/governance#policy-overview`,
    WEB_CONSOLE: `${DOC_BASE_PATH}/web_console/web-console`,
    MCE_INTRO: `${DOC_BASE_PATH}/multicluster_engine/mce_intro`,
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
