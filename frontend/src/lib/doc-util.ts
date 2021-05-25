/* Copyright Contributors to the Open Cluster Management project */

export const DOC_VERSION = '2.2'

export const DOC_BASE_PATH = `https://access.redhat.com/documentation/en-us/red_hat_advanced_cluster_management_for_kubernetes/${DOC_VERSION}/html`
export const OCP_DOC_BASE_PATH = 'https://docs.openshift.com/container-platform'

export const DOC_LINKS = {
    CLUSTERS: `${DOC_BASE_PATH}/manage_cluster/managing-your-clusters`,
    BARE_METAL_ASSETS: `${DOC_BASE_PATH}/manage_cluster/creating-and-modifying-bare-metal-assets`,
    CREATE_CONNECTION: `${DOC_BASE_PATH}/manage_cluster/creating-a-provider-connection`,
    CREATE_CLUSTER: `${DOC_BASE_PATH}/manage_cluster/creating-a-cluster`,
    IMPORT_CLUSTER: `${DOC_BASE_PATH}/manage_cluster/importing-a-target-managed-cluster-to-the-hub-cluster`,
    CLUSTER_SETS: `${DOC_BASE_PATH}/manage_cluster/managedclustersets`,
    CLUSTER_POOLS: `${DOC_BASE_PATH}`,
    SUBMARINER: `${DOC_BASE_PATH}/manage_cluster/submariner`,
    DISCOVERED_CLUSTERS: `${DOC_BASE_PATH}`,
    MACHINE_POOLS: `${DOC_BASE_PATH}`,
}

export const OCM_LINKS = {
    RETRIEVE_TOKEN: `https://cloud.redhat.com/openshift/token`,
}
