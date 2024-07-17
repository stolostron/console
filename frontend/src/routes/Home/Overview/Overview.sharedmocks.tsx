/* Copyright Contributors to the Open Cluster Management project */
import { SelfSubjectAccessReview } from '../../../resources'

export const getAddonRequest = {
  apiVersion: 'view.open-cluster-management.io/v1beta1',
  kind: 'ManagedClusterView',
  metadata: {
    name: '46de65eb9b4a488e6744a0b264a076cc107fd55e',
    namespace: 'local-cluster',
    labels: {
      viewName: '46de65eb9b4a488e6744a0b264a076cc107fd55e',
    },
  },
  spec: {
    scope: {
      name: 'observability-controller',
      resource: 'clustermanagementaddon.v1alpha1.addon.open-cluster-management.io',
    },
  },
}

export const getAddonResponse = {
  apiVersion: 'view.open-cluster-management.io/v1beta1',
  kind: 'ManagedClusterView',
  metadata: {
    name: '46de65eb9b4a488e6744a0b264a076cc107fd55e',
    namespace: 'local-cluster',
    labels: {
      viewName: '46de65eb9b4a488e6744a0b264a076cc107fd55e',
    },
  },
  spec: {
    scope: {
      name: 'observability-controller',
      resource: 'clustermanagementaddon.v1alpha1.addon.open-cluster-management.io',
    },
  },
  status: {
    conditions: [
      {
        message: 'Watching resources successfully',
        reason: 'GetResourceProcessing',
        status: 'True',
        type: 'Processing',
      },
    ],
  },
}

export const mockGetSelfSubjectAccessRequest: SelfSubjectAccessReview = {
  apiVersion: 'authorization.k8s.io/v1',
  kind: 'SelfSubjectAccessReview',
  metadata: {},
  spec: {
    resourceAttributes: {
      resource: 'managedclusters',
      verb: 'create',
      group: 'cluster.open-cluster-management.io',
    },
  },
}

export const mockGetSelfSubjectAccessResponse: SelfSubjectAccessReview = {
  apiVersion: 'authorization.k8s.io/v1',
  kind: 'SelfSubjectAccessReview',
  metadata: {},
  spec: {
    resourceAttributes: {
      resource: 'managedclusters',
      verb: 'create',
      group: 'cluster.open-cluster-management.io',
    },
  },
  status: {
    allowed: true,
  },
}
