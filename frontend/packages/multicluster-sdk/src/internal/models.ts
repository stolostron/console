/* Copyright Contributors to the Open Cluster Management project */
import { K8sModel } from '@openshift-console/dynamic-plugin-sdk'

export const ManagedClusterModel: K8sModel = {
  abbr: 'MC',
  apiGroup: 'clusterview.open-cluster-management.io',
  apiVersion: 'v1',
  crd: true,
  kind: 'ManagedCluster',
  label: 'ManagedCluster',
  labelPlural: 'ManagedClusters',
  namespaced: false,
  plural: 'managedclusters',
}

export const MultiClusterObservabilityKind = {
  group: 'observability.open-cluster-management.io',
  version: 'v1beta2',
  kind: 'MultiClusterObservability',
}

export const ManagedClusterListGroupVersionKind = {
  group: 'clusterview.open-cluster-management.io',
  version: 'v1',
  kind: 'ManagedCluster',
}

export const SelfSubjectAccessReviewModel: K8sModel = {
  abbr: 'SSAR',
  kind: 'SelfSubjectAccessReview',
  label: 'SelfSubjectAccessReview',
  labelPlural: 'SelfSubjectAccessReviews',
  plural: 'selfsubjectaccessreviews',
  apiVersion: 'v1',
  apiGroup: 'authorization.k8s.io',
}
