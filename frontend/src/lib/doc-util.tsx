/* Copyright Contributors to the Open Cluster Management project */

import { TextContent } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { AcmButton } from '../ui-components'
import { useTranslation } from './acm-i18next'

export const DOC_VERSION = '2.15'
export const OCP_DOC_VERSION = '4.20'

export const DOC_HOME = `https://docs.redhat.com/en/documentation/red_hat_advanced_cluster_management_for_kubernetes/${DOC_VERSION}`
export const DOC_BASE_PATH = `${DOC_HOME}/html-single`
export const OCP_DOC = 'https://docs.redhat.com/en/documentation/openshift_container_platform'
const OCP_DOC_HOME = `https://docs.redhat.com/en/documentation/openshift_container_platform/${OCP_DOC_VERSION}`
const OCP_DOC_BASE_PATH = `${OCP_DOC_HOME}/html-single`

export const DOC_LINKS = {
  CLUSTERS: `${DOC_BASE_PATH}/clusters/index#cluster-intro`,
  CREATE_CONNECTION: `${DOC_BASE_PATH}/clusters/index#credentials`,
  CREATE_CONNECTION_AWS: `${DOC_BASE_PATH}/clusters/index#creating-a-credential-for-amazon-web-services`,
  CREATE_CONNECTION_AZURE: `${DOC_BASE_PATH}/clusters/index#creating-a-credential-for-microsoft-azure`,
  CREATE_CONNECTION_GCP: `${DOC_BASE_PATH}/clusters/index#creating-a-credential-for-google-cloud-platform`,
  CREATE_CONNECTION_VMWARE: `${DOC_BASE_PATH}/clusters/index#creating-a-credential-for-vmware-vsphere`,
  CREATE_CONNECTION_OPENSTACK: `${DOC_BASE_PATH}/clusters/index#creating-a-credential-for-openstack`,
  CREATE_CONNECTION_ANSIBLE: `${DOC_BASE_PATH}/clusters/index#creating-a-credential-for-ansible`,
  CREATE_CONNECTION_REDHATCLOUD: `${DOC_BASE_PATH}/clusters/index#creating-a-credential-for-openshift-cluster-manager`,
  CREATE_CONNECTION_PROXY: `${DOC_BASE_PATH}/clusters/index#cluster-intro`,
  CREATE_CONNECTION_PROXY_VMWARE: `${DOC_BASE_PATH}/clusters/index#proxy-virtualization`,
  CREATE_CONNECTION_PROXY_AWS: `${DOC_BASE_PATH}/clusters/index#proxy-aws`,
  CREATE_CONNECTION_PROXY_AZURE: `${DOC_BASE_PATH}/clusters/index#proxy-azure`,
  CREATE_CONNECTION_PROXY_GCP: `${DOC_BASE_PATH}/clusters/index#proxy-google`,
  CREATE_CONNECTION_PROXY_OPENSTACK: `${DOC_BASE_PATH}/clusters/index#proxy-openstack`,
  CREATE_CLUSTER: `${DOC_BASE_PATH}/clusters/index#create-intro`,
  CREATE_CLUSTER_PREREQ: `${DOC_BASE_PATH}/clusters/index#create-a-cluster-prereq`,
  IMPORT_CLUSTER: `${DOC_BASE_PATH}/clusters/index#import-intro`,
  CLUSTER_SETS: `${DOC_BASE_PATH}/clusters/index#managedclustersets-intro`,
  GLOBAL_CLUSTER_SET: `${DOC_BASE_PATH}/clusters/index#managedclustersets_global`,
  CLUSTER_POOLS: `${DOC_BASE_PATH}/clusters/index#managing-cluster-pools`,
  CLUSTER_CLAIMS: `${DOC_BASE_PATH}/clusters/index#claiming-clusters-from-cluster-pools`,
  SUBMARINER: `${DOC_BASE_PATH}/networking/index#submariner`,
  CONFIG_DISCONNECTED_INSTALL: `${DOC_BASE_PATH}/clusters/index#cluster-intro`,
  CIM_CONFIG_DISONNECTED: `${DOC_BASE_PATH}/clusters/index#enable-cim`,
  CIM_CONFIG: `${DOC_BASE_PATH}/clusters/index#enable-cim`,
  CIM_CONFIG_AWS: `${DOC_BASE_PATH}/clusters/index#enable-cim-aws`,
  CONFIG_DISCONNECTED_INSTALL_VMWARE: `${DOC_BASE_PATH}/clusters/index#disconnected-vm`,
  CONFIG_DISCONNECTED_INSTALL_OPENSTACK: `${DOC_BASE_PATH}/clusters/index#disconnected-openstack`,
  INFRASTRUCTURE_ENVIRONMENTS: `${DOC_BASE_PATH}/clusters/index#create-host-inventory-console`,
  DISCOVERED_CLUSTERS: `${DOC_BASE_PATH}/clusters/index#discovery-intro`,
  MANAGE_APPLICATIONS: `${DOC_BASE_PATH}/applications/index#managing-applications`,
  ANSIBLE_JOBS: `${DOC_BASE_PATH}/clusters/index#ansible-config-cluster`,
  POLICIES_OVERVIEW: `${DOC_BASE_PATH}/governance/index#hub-policy-framework`,
  GITOPS_CONFIG: `${DOC_BASE_PATH}/gitops/gitops-overview`,
  DEPRECATIONS_ACM: `${DOC_BASE_PATH}/release_notes/release-notes#deprecations_acm`,
  ENABLE_OBSERVABILITY: `${DOC_BASE_PATH}/observability/observing-environments-intro#enabling-observability-service`,
  ACCESSING_CONSOLE: `${DOC_BASE_PATH}/web_console/web-console#accessing-your-console`,
  ROSA_DISCOVERY_AUTOIMPORT_POLICY_EXAMPLE: `${DOC_BASE_PATH}/multicluster_engine_operator_with_red_hat_advanced_cluster_management/mce-acm-integration#import-discover-rosa`,
  // OCP doc links
  HYPERSHIFT_INTRO: `${OCP_DOC_BASE_PATH}/hosted_control_planes/hosted-control-planes-overview#hosted-control-planes-overview_hcp-overview`,
  HYPERSHIFT_DEPLOY_AWS: `${OCP_DOC_BASE_PATH}/hosted_control_planes/hosted-control-planes-overview#deploying-hosted-control-planes-on-aws`,
  HYPERSHIFT_STS_ARN: `${OCP_DOC_BASE_PATH}/hosted_control_planes/hosted-control-planes-overview#hcp-aws-create-role-sts-creds_hcp-deploy-aws`,
  HYPERSHIFT_MANAGE_KUBEVIRT: `${OCP_DOC_BASE_PATH}/hosted_control_planes/hosted-control-planes-overview#deploying-hosted-control-planes-on-openshift-virtualization`,
  HOSTED_ENABLE_FEATURE_AWS: `${OCP_DOC_BASE_PATH}/hosted_control_planes/hosted-control-planes-overview#hcp-enable-manual_hcp-enable-disable`,
  HYPERSHIFT_OIDC: `${OCP_DOC_BASE_PATH}/hosted_control_planes/hosted-control-planes-overview#hcp-aws-prereqs_hcp-deploy-aws`,
  // Virtualization
  VM_SNAPSHOT: `${OCP_DOC_BASE_PATH}/storage/using-container-storage-interface-csi#persistent-storage-csi-snapshots`,
  // AI doc links
  NUTANIX_POST_INSTALL: `https://docs.redhat.com/en/documentation/assisted_installer_for_openshift_container_platform/2024/html/installing_openshift_container_platform_with_the_assisted_installer/assembly_installing-on-nutanix#nutanix-post-installation-configuration_installing-on-nutanix`,
}

export function ViewDocumentationLink(props: { doclink: string }): JSX.Element {
  const { t } = useTranslation()
  return (
    <TextContent>
      <a href={props.doclink} target="_blank" rel="noreferrer">
        <AcmButton
          onClick={(e) => {
            e.stopPropagation()
          }}
          variant="link"
          isInline
          icon={<ExternalLinkAltIcon />}
          iconPosition="right"
          style={{
            display: 'inline-block',
            paddingTop: '15px',
            fontSize: '14px',
          }}
        >
          {t('View documentation')}
        </AcmButton>
      </a>
    </TextContent>
  )
}
