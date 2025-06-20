/* Copyright Contributors to the Open Cluster Management project */
import { K8sModel } from '@openshift-console/dynamic-plugin-sdk'

export const BASE_K8S_API_PATH = '/api/kubernetes'
export const BASE_FLEET_SEARCH_PATH = '/multicloud/search/resources'

export const MANAGED_CLUSTER_API_PATH = 'managedclusterproxy'

export const ManagedClusterModel: K8sModel = {
  abbr: 'MC',
  apiGroup: 'clusterview.open-cluster-management.io',
  apiVersion: 'v1',
  crd: true,
  kind: 'ManagedCluster',
  label: 'ManagedCluster',
  labelPlural: 'ManagedClusters',
  namespaced: false,
  plural: 'managedClusters',
}
