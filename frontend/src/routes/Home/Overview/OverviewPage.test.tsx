/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { MockedProvider } from '@apollo/client/testing'
import { render, screen, waitFor } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import { createBrowserHistory } from 'history'
import { Router } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
  applicationSetsState,
  applicationsState,
  argoApplicationsState,
  clusterManagementAddonsState,
  managedClusterAddonsState,
  managedClusterInfosState,
  managedClustersState,
  policiesState,
  policyreportState,
} from '../../../atoms'
import { nockCreate, nockGet, nockIgnoreApiPaths, nockSearch } from '../../../lib/nock-util'
import { clickByText, wait, waitForNocks } from '../../../lib/test-util'
import {
  ClusterManagementAddOn,
  ManagedCluster,
  ManagedClusterAddOn,
  ManagedClusterApiVersion,
  ManagedClusterInfo,
  ManagedClusterKind,
  Policy,
  PolicyReport,
  SelfSubjectAccessReview,
} from '../../../resources'
import {
  mockApplications,
  mockApplicationSets,
  mockArgoApplications,
  mockSearchQueryArgoApps,
  mockSearchQueryOCPApplications,
  mockSearchResponseArgoApps,
  mockSearchResponseOCPApplications,
} from '../../Applications/Application.sharedmocks'
import { SearchResultCountDocument } from '../Search/search-sdk/search-sdk'
import OverviewPage from './OverviewPage'

const getAddonRequest = {
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

const getAddonResponse = {
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

const mockGetSelfSubjectAccessRequest: SelfSubjectAccessReview = {
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

const mockGetSelfSubjectAccessResponse: SelfSubjectAccessReview = {
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

const managedClusterInfos: ManagedClusterInfo[] = [
  {
    apiVersion: 'internal.open-cluster-management.io/v1beta1',
    kind: 'ManagedClusterInfo',
    metadata: {
      creationTimestamp: '2022-06-27T13:03:37Z',
      labels: {
        openshiftVersion: '4.10.5',
        vendor: 'OpenShift',
        name: 'local-cluster',
        'installer.name': 'multiclusterhub',
        clusterID: '5b56530b-a1cd-407b-9a90-1a35ffa0d184',
        cloud: 'Amazon',
        'local-cluster': 'true',
      },
      name: 'local-cluster',
      namespace: 'local-cluster',
      resourceVersion: '4236111',
      uid: 'e98d2bac-4a21-4a9c-8f52-bcaae1d0fc90',
    },
    spec: {
      loggingCA:
        'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURKVENDQWcyZ0F3SUJBZ0lJWEpsc0xPUWRWeEF3RFFZSktvWklodmNOQVFFTEJRQXdJREVlTUJ3R0ExVUUKQXhNVmIyTnRMV3RzZFhOMFpYSnNaWFF0Ykc5bloyVnlNQjRYRFRJeU1EWXlOekV6TURFeU9Gb1hEVEl6TURZeQpOekV6TURFeU9Wb3dJREVlTUJ3R0ExVUVBeE1WYjJOdExXdHNkWE4wWlhKc1pYUXRiRzluWjJWeU1JSUJJakFOCkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXFnc2gzaS9ZWVRvNDdZeHFTelZaRkczQk1Wbk4KdlRITXlidy9UK0p2aFdUd1VrY3Npdk9hWmJrYWppdnkwUGIxKys3c1BPWFZrL0NVYzY3c2daaTQ3WGx2TEJHQwphOEorM2dvQzZUM3gzbUdZOFBkd2JpRExwVlN6RlJteTl6aExWaGVpMkNDdnpqWDgxbUhVaGs3RkVGNDczVFhBCkpMU0pHM3FlbEsvUUt3aStJeWZsb0ZUWUl2TkZkSm9jbjI0RTh6MTRNUzI1d3NlRzVrR1EvZHJ0K21ISUdSK3UKUm5CdTJPYW5ybW9iaUpPcWErZEJidC9nTXVvbTNlcVgrWUdNVmtTSDIrTEVDN2VEMVQwQUpWVWZLWXNYOG1kTApNTWwvaWZORVd2T2t5WHEzVVpjK2FORFlNSDRJTkNvUHdQaTJXSHVoQjZNamRrdEdTMHEwRCtVK2VRSURBUUFCCm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVUKNjVlWk4rVGVqTEtEZU9Sc0M5NjljZXNLa3U0d0h3WURWUjBqQkJnd0ZvQVU2NWVaTitUZWpMS0RlT1JzQzk2OQpjZXNLa3U0d0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFIZ1BMTTdVc2NZaWdwUDZud1I0UWFKMnhmTUNHR3QvCjZoREtSSmJjYTlNcUZYSk1KVjd6c3hNeC8zbUJlNkEwQ3lReS9yMWx4RWpJWW9TUTFieUw3MnJFR296MWs4UWoKWUhjRVFuTFFMUmhTWGpWUDdBTTN5MHU5VDBOVWhRclUwa2ROV2orc2lVMk9XdlJvSnd6alIwVHlMcGpJUytxYgovV0lZQWJHZ2dKL3hPdk40YUdZMWJURnlWbjdPbmkweFBQQ3VOR2RFRFlNUHVvbmZTSG5YS2paTnRCNi9ZRndoCm9QWGgyTWgzRTdMYjFIOHFzSG1mYUxMOE50bSt4VCtjVThJU0w3TVlndGFlY2ViM3RmbkRjTTRFU1NEYmJwZTEKWVYxT1NnbEpDcHBvdWZKM0RPYmdPMHR4R1ZLYTdPTGZnaTdnNi95ZVpmUEEwZ1ltMUpoQnVxYz0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=',
      masterEndpoint: 'https://api.sno-410-2xlarge-2zrhh.dev07.red-chesterfield.com:6443',
    },
    status: {
      loggingPort: {
        name: 'https',
        port: 443,
        protocol: 'TCP',
      },
      loggingEndpoint: {
        hostname: 'klusterlet-addon-workmgr.open-cluster-management-agent-addon.svc',
        ip: '',
      },
      kubeVendor: 'OpenShift',
      consoleURL: 'https://console-openshift-console.apps.sno-410-2xlarge-2zrhh.dev07.red-chesterfield.com',
      version: 'v1.23.3+e419edf',
      cloudVendor: 'Amazon',
      nodeList: [{}, {}, {}, {}, {}, {}],
    },
  },
]

const managedClusters: ManagedCluster[] = [
  {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
      labels: {
        cloud: 'Amazon',
        name: 'local-cluster',
        vendor: 'OpenShift',
      },
      name: 'local-cluster',
    },
    spec: {
      hubAcceptsClient: true,
    },
    status: {
      allocatable: {
        cpu: '42',
        memory: '179120384Ki',
      },
      capacity: {
        memory: '192932096Ki',
        cpu: '48',
      },
      clusterClaims: [
        {
          name: 'id.k8s.io',
          value: 'local-cluster',
        },
      ],
      conditions: [
        {
          message: 'Accepted by hub cluster admin',
          reason: 'HubClusterAdminAccepted',
          status: 'True',
          type: 'HubAcceptedManagedCluster',
        },
        {
          message: 'Managed cluster is available',
          reason: 'ManagedClusterAvailable',
          status: 'True',
          type: 'ManagedClusterConditionAvailable',
        },
      ],
      version: {
        kubernetes: 'v1.20.0+bbbc079',
      },
    },
  },
  {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
      labels: {
        cloud: 'Azure',
        region: 'us-east-1',
        name: 'managed-cluster',
        vendor: 'OpenShift',
      },
      name: 'managed-cluster',
    },
    spec: {
      hubAcceptsClient: true,
    },
    status: {
      allocatable: {
        cpu: '42',
        memory: '179120384Ki',
      },
      capacity: {
        memory: '192932096Ki',
        cpu: '48',
      },
      clusterClaims: [
        {
          name: 'id.k8s.io',
          value: 'managed-cluster',
        },
        {
          name: 'platform.open-cluster-management.io',
          value: 'AKS',
        },
      ],
      conditions: [
        {
          message: 'Accepted by hub cluster admin',
          reason: 'HubClusterAdminAccepted',
          status: 'True',
          type: 'HubAcceptedManagedCluster',
        },
        {
          message: 'Managed cluster is available',
          reason: 'ManagedClusterAvailable',
          status: 'True',
          type: 'ManagedClusterConditionAvailable',
        },
      ],
      version: {
        kubernetes: 'v1.20.0+bbbc079',
      },
    },
  },
]

const mockPolices: Policy[] = [
  {
    apiVersion: 'policy.open-cluster-management.io/v1',
    kind: 'Policy',
    metadata: {
      name: 'policy-compliant',
      creationTimestamp: '2021-10-28T00:31:36Z',
    },
    spec: {
      disabled: false,
      remediationAction: 'enforce',
    },
    status: {
      compliant: 'Compliant',
      placement: [
        {
          placementBinding: 'binding-policy-pod',
          placementRule: 'placement-policy-pod',
        },
      ],
      status: [
        {
          clustername: 'local-cluster',
          clusternamespace: 'local-cluster',
          compliant: 'Compliant',
        },
      ],
    },
  },
  {
    apiVersion: 'policy.open-cluster-management.io/v1',
    kind: 'Policy',
    metadata: {
      name: 'policy-noncompliant',
      creationTimestamp: '2021-10-28T00:31:36Z',
    },
    spec: {
      disabled: false,
      remediationAction: 'enforce',
    },
    status: {
      compliant: 'NonCompliant',
      placement: [
        {
          placementBinding: 'binding-policy-pod',
          placementRule: 'placement-policy-pod',
        },
      ],
      status: [
        {
          clustername: 'managed-cluster',
          clusternamespace: 'managed-cluster',
          compliant: 'NonCompliant',
        },
      ],
    },
  },
]

const mockPolicyReports: PolicyReport[] = [
  {
    apiVersion: 'wgpolicyk8s.io/v1alpha2',
    kind: 'PolicyReport',
    metadata: {
      name: 'local-cluster-policyreport',
      namespace: 'local-cluster',
      uid: 'uid.report.risk.1',
    },
    scope: {
      kind: 'cluster',
      name: 'local-cluster',
      namespace: 'local-cluster',
    },
    results: [
      {
        category: 'category,category1,category2',
        scored: false,
        source: 'insights',
        properties: {
          created_at: '2021-03-02T21:26:04Z',
          total_risk: '4',
          component: 'rule.id.0',
        },
        message: 'policyreport testing risk 0',
        policy: 'policyreport testing risk 0 policy',
        result: 'policyreport testing risk 0 result',
      },
      {
        category: 'category,category1,category2',
        scored: false,
        source: 'insights',
        properties: {
          created_at: '2021-03-02T21:26:04Z',
          total_risk: '3',
          component: 'rule.id.1',
        },
        message: 'policyreport testing risk 1',
        policy: 'policyreport testing risk 1 policy',
        result: 'policyreport testing risk 1 result',
      },
    ],
  },
  {
    apiVersion: 'wgpolicyk8s.io/v1alpha2',
    kind: 'PolicyReport',
    metadata: {
      name: 'managed-cluster-policyreport',
      namespace: 'managed-cluster',
      uid: 'uid.report.risk.1',
    },
    scope: {
      kind: 'cluster',
      name: 'managed-cluster',
      namespace: 'managed-cluster',
    },
    results: [
      {
        category: 'category,category1,category2',
        scored: false,
        source: 'insights',
        properties: {
          created_at: '2021-03-02T21:26:04Z',
          total_risk: '4',
          component: 'rule.id.0',
        },
        message: 'policyreport testing risk 0',
        policy: 'policyreport testing risk 0 policy',
        result: 'policyreport testing risk 0 result',
      },
      {
        category: 'category,category1,category2',
        scored: false,
        source: 'grc',
        properties: {
          created_at: '2021-03-02T21:26:04Z',
          total_risk: '2',
          component: 'rule.id.0',
        },
        message: 'policyreport testing risk 2 and grc filtering',
        policy: 'policyreport testing risk 2 and grc filtering - policy',
        result: 'policyreport testing risk 2 and grc filtering - result',
      },
    ],
  },
  {
    apiVersion: 'wgpolicyk8s.io/v1alpha2',
    kind: 'PolicyReport',
    metadata: {
      name: 'managed-cluster-policyreport',
      namespace: 'managed-cluster',
      uid: 'uid.report.risk.1',
    },
    scope: {
      kind: 'cluster',
      name: 'managed-cluster',
      namespace: 'managed-cluster',
    },
    results: [
      {
        category: 'category,category1,category2',
        scored: false,
        source: 'insights',
        properties: {
          created_at: '2021-03-02T21:26:04Z',
          total_risk: '2',
          component: 'rule.id.0',
        },
        message: 'policyreport testing risk 0',
        policy: 'policyreport testing risk 0 policy',
        result: 'policyreport testing risk 0 result',
      },
      {
        category: 'category,category1,category2',
        scored: false,
        source: 'grc',
        properties: {
          created_at: '2021-03-02T21:26:04Z',
          total_risk: '2',
          component: 'rule.id.0',
        },
        message: 'policyreport testing risk 2 and grc filtering',
        policy: 'policyreport testing risk 2 and grc filtering - policy',
        result: 'policyreport testing risk 2 and grc filtering - result',
      },
    ],
  },
  {
    apiVersion: 'wgpolicyk8s.io/v1alpha2',
    kind: 'PolicyReport',
    metadata: {
      name: 'managed-cluster-policyreport',
      namespace: 'managed-cluster',
      uid: 'uid.report.risk.1',
    },
    scope: {
      kind: 'cluster',
      name: 'managed-cluster',
      namespace: 'managed-cluster',
    },
    results: [
      {
        category: 'category,category1,category2',
        scored: false,
        source: 'insights',
        properties: {
          created_at: '2021-03-02T21:26:04Z',
          total_risk: '1',
          component: 'rule.id.0',
        },
        message: 'policyreport testing risk 0',
        policy: 'policyreport testing risk 0 policy',
        result: 'policyreport testing risk 0 result',
      },
      {
        category: 'category,category1,category2',
        scored: false,
        source: 'grc',
        properties: {
          created_at: '2021-03-02T21:26:04Z',
          total_risk: '1',
          component: 'rule.id.0',
        },
        message: 'policyreport testing risk 2 and grc filtering',
        policy: 'policyreport testing risk 2 and grc filtering - policy',
        result: 'policyreport testing risk 2 and grc filtering - result',
      },
    ],
  },
]

const mockManagedClusterAddons: ManagedClusterAddOn[] = [
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ManagedClusterAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:59:17Z',
      name: 'application-manager',
      namespace: 'local-cluster',
      ownerReferences: [
        {
          apiVersion: 'addon.open-cluster-management.io/v1alpha1',
          blockOwnerDeletion: true,
          controller: true,
          kind: 'ClusterManagementAddOn',
          name: 'application-manager',
          uid: 'fe141d28-3335-43be-b725-2d4505e91f01',
        },
      ],
      resourceVersion: '1734162',
      uid: 'f8cf8487-1ac2-49b2-82cf-4f9343ae8782',
    },
    spec: {
      installNamespace: 'open-cluster-management-agent-addon',
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ManagedClusterAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:59:17Z',
      name: 'cert-policy-controller',
      namespace: 'local-cluster',
      ownerReferences: [
        {
          apiVersion: 'addon.open-cluster-management.io/v1alpha1',
          blockOwnerDeletion: true,
          controller: true,
          kind: 'ClusterManagementAddOn',
          name: 'cert-policy-controller',
          uid: '205ac0e8-20db-4a1f-af81-d24027634a14',
        },
      ],
      resourceVersion: '1739654',
      uid: '963d1d78-5745-4e20-8b9a-96f8b762bdec',
    },
    spec: {
      installNamespace: 'open-cluster-management-agent-addon',
    },
    status: {
      addOnConfiguration: { crdName: '', crName: '' },
      addOnMeta: { displayName: '', description: '' },
      conditions: [
        {
          message: 'manifests of addon are applied successfully',
          reason: 'AddonManifestApplied',
          status: 'True',
          type: 'ManifestApplied',
        },
        {
          message: 'Registration of the addon agent is configured',
          reason: 'RegistrationConfigured',
          status: 'True',
          type: 'RegistrationApplied',
        },
        {
          message:
            'client certificate rotated starting from 2023-02-09 13:08:09 +0000 UTC to 2023-03-11 09:35:45 +0000 UTC',
          reason: 'ClientCertificateUpdated',
          status: 'True',
          type: 'ClusterCertificateRotated',
        },
        {
          message: 'cert-policy-controller add-on is available.',
          reason: 'ManagedClusterAddOnLeaseUpdated',
          status: 'True',
          type: 'Degraded',
        },
      ],
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ManagedClusterAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:58:32Z',
      name: 'cluster-proxy',
      namespace: 'local-cluster',
      ownerReferences: [
        {
          apiVersion: 'addon.open-cluster-management.io/v1alpha1',
          blockOwnerDeletion: true,
          controller: true,
          kind: 'ClusterManagementAddOn',
          name: 'cluster-proxy',
          uid: 'a1b690ce-c81d-4a87-af0a-8cc214d4f9e4',
        },
      ],
      resourceVersion: '1725616',
      uid: '3f5e11a9-52a5-46b9-9e8f-c108c3fd4e4d',
    },
    spec: {
      installNamespace: 'open-cluster-management-agent-addon',
    },
    status: {
      addOnConfiguration: { crdName: '', crName: '' },
      addOnMeta: { displayName: '', description: '' },
      conditions: [
        {
          message: 'manifests of addon are applied successfully',
          reason: 'AddonManifestApplied',
          status: 'True',
          type: 'ManifestApplied',
        },
        {
          message: 'Registration of the addon agent is configured',
          reason: 'RegistrationConfigured',
          status: 'True',
          type: 'RegistrationApplied',
        },
        {
          message:
            'client certificate rotated starting from 2023-02-09 12:58:08 +0000 UTC to 2023-03-11 09:35:45 +0000 UTC',
          reason: 'ClientCertificateUpdated',
          status: 'True',
          type: 'ClusterCertificateRotated',
        },
        {
          message: 'cluster-proxy add-on is available.',
          reason: 'ManagedClusterAddOnLeaseUpdated',
          status: 'True',
          type: 'Progressing',
        },
      ],
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ManagedClusterAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:59:17Z',
      name: 'config-policy-controller',
      namespace: 'local-cluster',
      ownerReferences: [
        {
          apiVersion: 'addon.open-cluster-management.io/v1alpha1',
          blockOwnerDeletion: true,
          controller: true,
          kind: 'ClusterManagementAddOn',
          name: 'config-policy-controller',
          uid: 'f45d726e-11c9-41e6-aaf8-a744d8613636',
        },
      ],
      resourceVersion: '1734118',
      uid: '9fb54c01-8b73-45ce-804f-b726e06b733a',
    },
    spec: {
      installNamespace: 'open-cluster-management-agent-addon',
    },
    status: {
      addOnConfiguration: { crdName: '', crName: '' },
      addOnMeta: { displayName: '', description: '' },
      conditions: [
        {
          message: 'manifests of addon are applied successfully',
          reason: 'AddonManifestApplied',
          status: 'True',
          type: 'ManifestApplied',
        },
        {
          message: 'Registration of the addon agent is configured',
          reason: 'RegistrationConfigured',
          status: 'True',
          type: 'RegistrationApplied',
        },
        {
          message:
            'client certificate rotated starting from 2023-02-09 13:04:08 +0000 UTC to 2023-03-11 09:35:45 +0000 UTC',
          reason: 'ClientCertificateUpdated',
          status: 'True',
          type: 'ClusterCertificateRotated',
        },
        {
          message: 'config-policy-controller add-on is available.',
          reason: 'ManagedClusterAddOnLeaseUpdated',
          status: 'True',
          type: 'Disabled',
        },
      ],
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ManagedClusterAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:59:17Z',
      name: 'governance-policy-framework',
      namespace: 'local-cluster',
      ownerReferences: [
        {
          apiVersion: 'addon.open-cluster-management.io/v1alpha1',
          blockOwnerDeletion: true,
          controller: true,
          kind: 'ClusterManagementAddOn',
          name: 'governance-policy-framework',
          uid: '02f62b75-49cd-4d35-85be-25bc5b959701',
        },
      ],
      resourceVersion: '1739647',
      uid: 'e4de7012-c4da-495e-bf2d-914cbea49ba2',
    },
    spec: {
      installNamespace: 'open-cluster-management-agent-addon',
    },
    status: {
      addOnConfiguration: { crdName: '', crName: '' },
      addOnMeta: { displayName: '', description: '' },
      conditions: [
        {
          message: 'manifests of addon are applied successfully',
          reason: 'AddonManifestApplied',
          status: 'True',
          type: 'ManifestApplied',
        },
        {
          message: 'Registration of the addon agent is configured',
          reason: 'RegistrationConfigured',
          status: 'True',
          type: 'RegistrationApplied',
        },
        {
          message:
            'client certificate rotated starting from 2023-02-09 13:08:09 +0000 UTC to 2023-03-11 09:35:45 +0000 UTC',
          reason: 'ClientCertificateUpdated',
          status: 'True',
          type: 'ClusterCertificateRotated',
        },
        {
          message: 'governance-policy-framework add-on is available.',
          reason: 'ManagedClusterAddOnLeaseUpdated',
          status: 'True',
          type: 'Cool',
        },
      ],
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ManagedClusterAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:59:17Z',
      name: 'iam-policy-controller',
      namespace: 'local-cluster',
      ownerReferences: [
        {
          apiVersion: 'addon.open-cluster-management.io/v1alpha1',
          blockOwnerDeletion: true,
          controller: true,
          kind: 'ClusterManagementAddOn',
          name: 'iam-policy-controller',
          uid: '0dd13de6-fad1-4f7d-a6b4-fefe88d91277',
        },
      ],
      resourceVersion: '1725602',
      uid: 'cb662f2f-e2ab-4ed4-9652-59c950575d0d',
    },
    spec: {
      installNamespace: 'open-cluster-management-agent-addon',
    },
    status: {
      addOnConfiguration: { crdName: '', crName: '' },
      addOnMeta: { displayName: '', description: '' },
      conditions: [
        {
          message: 'manifests of addon are applied successfully',
          reason: 'AddonManifestApplied',
          status: 'True',
          type: 'ManifestApplied',
        },
        {
          message: 'Registration of the addon agent is configured',
          reason: 'RegistrationConfigured',
          status: 'True',
          type: 'RegistrationApplied',
        },
        {
          message:
            'client certificate rotated starting from 2023-02-09 12:58:08 +0000 UTC to 2023-03-11 09:35:45 +0000 UTC',
          reason: 'ClientCertificateUpdated',
          status: 'True',
          type: 'ClusterCertificateRotated',
        },
        {
          message: 'iam-policy-controller add-on is available.',
          reason: 'ManagedClusterAddOnLeaseUpdated',
          status: 'True',
          type: 'Available',
        },
      ],
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ManagedClusterAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:58:32Z',
      name: 'work-manager',
      namespace: 'local-cluster',
      ownerReferences: [
        {
          apiVersion: 'addon.open-cluster-management.io/v1alpha1',
          blockOwnerDeletion: true,
          controller: true,
          kind: 'ClusterManagementAddOn',
          name: 'work-manager',
          uid: '3b80aede-f99c-4f53-9f75-a115e736e647',
        },
      ],
      resourceVersion: '1734156',
      uid: 'b753d5a2-f93d-49b1-a921-c54a586c7da0',
    },
    spec: {
      installNamespace: 'open-cluster-management-agent-addon',
    },
    status: {
      addOnConfiguration: { crdName: '', crName: '' },
      addOnMeta: { displayName: '', description: '' },
      conditions: [
        {
          message: 'Registration of the addon agent is configured',
          reason: 'RegistrationConfigured',
          status: 'True',
          type: 'RegistrationApplied',
        },
        {
          message: 'manifests of addon are applied successfully',
          reason: 'AddonManifestApplied',
          status: 'True',
          type: 'ManifestApplied',
        },
        {
          message:
            'client certificate rotated starting from 2023-02-09 13:04:08 +0000 UTC to 2023-03-11 09:35:45 +0000 UTC',
          reason: 'ClientCertificateUpdated',
          status: 'True',
          type: 'ClusterCertificateRotated',
        },
        {
          message: 'work-manager add-on is available.',
          reason: 'ManagedClusterAddOnLeaseUpdated',
          status: 'True',
          type: 'Available',
        },
      ],
    },
  },
]

const mockClusterManagementAddons: ClusterManagementAddOn[] = [
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:58:05Z',
      labels: {
        'installer.name': 'multiclusterhub',
        'installer.namespace': 'open-cluster-management',
      },
      name: 'application-manager',
      resourceVersion: '31309',
      uid: 'fe141d28-3335-43be-b725-2d4505e91f01',
    },
    spec: {
      addOnMeta: {
        description: 'Synchronizes application on the managed clusters from the hub',
        displayName: 'Application Manager',
      },
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:59:02Z',
      labels: {
        'installer.name': 'multiclusterhub',
        'installer.namespace': 'open-cluster-management',
      },
      name: 'cert-policy-controller',
      resourceVersion: '33514',
      uid: '205ac0e8-20db-4a1f-af81-d24027634a14',
    },
    spec: {
      addOnMeta: {
        description: 'Monitors certificate expiration based on distributed policies.',
        displayName: 'Certificate Policy Addon',
      },
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:58:17Z',
      labels: {
        'backplaneconfig.name': 'multiclusterengine',
      },
      name: 'cluster-proxy',
      ownerReferences: [
        {
          apiVersion: 'multicluster.openshift.io/v1',
          blockOwnerDeletion: true,
          controller: true,
          kind: 'MultiClusterEngine',
          name: 'multiclusterengine',
          uid: 'b54f89c9-87b2-4c69-952d-027509e76214',
        },
      ],
      resourceVersion: '31364',
      uid: 'a1b690ce-c81d-4a87-af0a-8cc214d4f9e4',
    },
    spec: {
      addOnMeta: {
        description: 'cluster-proxy',
        displayName: 'cluster-proxy',
      },
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:59:02Z',
      labels: {
        'installer.name': 'multiclusterhub',
        'installer.namespace': 'open-cluster-management',
      },
      name: 'config-policy-controller',
      resourceVersion: '33502',
      uid: 'f45d726e-11c9-41e6-aaf8-a744d8613636',
    },
    spec: {
      addOnMeta: {
        description: 'Audits k8s resources and remediates violation based on configuration policies.',
        displayName: 'Config Policy Addon',
      },
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:59:02Z',
      labels: {
        'installer.name': 'multiclusterhub',
        'installer.namespace': 'open-cluster-management',
      },
      name: 'governance-policy-framework',
      resourceVersion: '33487',
      uid: '02f62b75-49cd-4d35-85be-25bc5b959701',
    },
    spec: {
      addOnMeta: {
        description: 'Distributes policies and collects policy evaluation results.',
        displayName: 'Governance Policy Framework Addon',
      },
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:59:02Z',
      labels: {
        'installer.name': 'multiclusterhub',
        'installer.namespace': 'open-cluster-management',
      },
      name: 'iam-policy-controller',
      resourceVersion: '33490',
      uid: '0dd13de6-fad1-4f7d-a6b4-fefe88d91277',
    },
    spec: {
      addOnMeta: {
        description: 'Monitors identity controls based on distributed policies.',
        displayName: 'IAM Policy Addon',
      },
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:59:16Z',
      name: 'search-collector',
      ownerReferences: [
        {
          apiVersion: 'search.open-cluster-management.io/v1alpha1',
          blockOwnerDeletion: true,
          controller: true,
          kind: 'Search',
          name: 'search-v2-operator',
          uid: '9d07a60a-0de1-41c8-8699-2bd9fb039c33',
        },
      ],
      resourceVersion: '34346',
      uid: 'a72e8123-9cf3-4c1e-ad2a-83d9db5f4825',
    },
    spec: {
      addOnMeta: {
        description: 'Collects cluster data to be indexed by search components on the hub cluster.',
        displayName: 'Search Collector',
      },
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:59:02Z',
      labels: {
        'installer.name': 'multiclusterhub',
        'installer.namespace': 'open-cluster-management',
      },
      name: 'volsync',
      resourceVersion: '33630',
      uid: '9d767376-e5b0-4f19-ab76-79347e2e789e',
    },
    spec: {
      addOnMeta: {
        description: 'VolSync',
        displayName: 'VolSync',
      },
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      creationTimestamp: '2023-02-08T14:58:15Z',
      name: 'work-manager',
      ownerReferences: [
        {
          apiVersion: 'multicluster.openshift.io/v1',
          blockOwnerDeletion: true,
          controller: true,
          kind: 'MultiClusterEngine',
          name: 'multiclusterengine',
          uid: 'b54f89c9-87b2-4c69-952d-027509e76214',
        },
      ],
      resourceVersion: '71018',
      uid: '3b80aede-f99c-4f53-9f75-a115e736e647',
    },
    spec: {
      addOnMeta: {
        description: 'work-manager provides action, view and rbac settings',
        displayName: 'work-manager',
      },
    },
  },
]

it('should render overview page in empty state', async () => {
  const apiPathNock = nockIgnoreApiPaths()
  const getAddonNock = nockGet(getAddonRequest, getAddonResponse)
  const getManageedClusterAccessRequeset = nockCreate(mockGetSelfSubjectAccessRequest, mockGetSelfSubjectAccessResponse)
  nockSearch(mockSearchQueryArgoApps, mockSearchResponseArgoApps)
  nockSearch(mockSearchQueryOCPApplications, mockSearchResponseOCPApplications)

  render(
    <RecoilRoot>
      <Router history={createBrowserHistory()}>
        <MockedProvider mocks={[]}>
          <OverviewPage />
        </MockedProvider>
      </Router>
    </RecoilRoot>
  )

  // Test the loading state while apollo query finishes
  await waitFor(() => expect(screen.getByText(`You don't have any clusters`)).toBeInTheDocument())

  // Wait for delete resource requests to finish
  await waitForNocks([getAddonNock, getManageedClusterAccessRequeset, apiPathNock])
})

it('should render overview page in error state', async () => {
  nockSearch(mockSearchQueryArgoApps, mockSearchResponseArgoApps)
  nockSearch(mockSearchQueryOCPApplications, mockSearchResponseOCPApplications)
  const getAddonNock = nockGet(getAddonRequest, getAddonResponse)
  const getManageedClusterAccessRequeset = nockCreate(mockGetSelfSubjectAccessRequest, mockGetSelfSubjectAccessResponse)
  const mocks = [
    {
      request: {
        query: SearchResultCountDocument,
      },
      result: {
        errors: [new GraphQLError('Error getting overview data')],
      },
    },
  ]

  render(
    <RecoilRoot>
      <Router history={createBrowserHistory()}>
        <MockedProvider mocks={mocks}>
          <OverviewPage />
        </MockedProvider>
      </Router>
    </RecoilRoot>
  )

  // This wait pauses till apollo query is returning data
  await wait()

  // Wait for delete resource requests to finish
  await waitForNocks([getAddonNock, getManageedClusterAccessRequeset])

  // Test that the component has rendered correctly with an error
  await waitFor(() => expect(screen.queryByText('An unexpected error occurred.')).toBeTruthy())
})

it('should render overview page with expected data', async () => {
  nockSearch(mockSearchQueryArgoApps, mockSearchResponseArgoApps)
  nockSearch(mockSearchQueryOCPApplications, mockSearchResponseOCPApplications)
  nockIgnoreApiPaths()
  const getAddonNock = nockGet(getAddonRequest, getAddonResponse)
  const mocks = [
    {
      request: {
        query: SearchResultCountDocument,
        variables: {
          input: [
            {
              keywords: [],
              filters: [
                {
                  property: 'kind',
                  values: ['node'],
                },
              ],
            },
            {
              keywords: [],
              filters: [
                {
                  property: 'kind',
                  values: ['Pod'],
                },
                {
                  property: 'status',
                  values: ['Running', 'Completed'],
                },
              ],
            },
            {
              keywords: [],
              filters: [
                {
                  property: 'kind',
                  values: ['Pod'],
                },
                {
                  property: 'status',
                  values: ['Pending', 'ContainerCreating', 'Waiting', 'Terminating'],
                },
              ],
            },
            {
              keywords: [],
              filters: [
                {
                  property: 'kind',
                  values: ['Pod'],
                },
                {
                  property: 'status',
                  values: ['Failed', 'CrashLoopBackOff', 'ImagePullBackOff', 'Terminated', 'OOMKilled', 'Unknown'],
                },
              ],
            },
          ],
        },
      },
      result: {
        data: {
          searchResult: [
            {
              count: 6,
              __typename: 'SearchResult',
            },
            {
              count: 335,
              __typename: 'SearchResult',
            },
            {
              count: 0,
              __typename: 'SearchResult',
            },
            {
              count: 0,
              __typename: 'SearchResult',
            },
          ],
        },
      },
    },
  ]

  const { container, getAllByText, getByText } = render(
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(applicationsState, mockApplications)
        snapshot.set(applicationSetsState, mockApplicationSets)
        snapshot.set(argoApplicationsState, mockArgoApplications)
        snapshot.set(managedClustersState, managedClusters)
        snapshot.set(managedClusterInfosState, managedClusterInfos)
        snapshot.set(policiesState, mockPolices)
        snapshot.set(policyreportState, mockPolicyReports)
        snapshot.set(managedClusterAddonsState, mockManagedClusterAddons)
        snapshot.set(clusterManagementAddonsState, mockClusterManagementAddons)
      }}
    >
      <Router history={createBrowserHistory()}>
        <MockedProvider mocks={mocks}>
          <OverviewPage />
        </MockedProvider>
      </Router>
    </RecoilRoot>
  )

  // Wait for delete resource requests to finish
  await waitForNocks([getAddonNock])

  // This wait pauses till apollo query is returning data
  await wait()

  // Test that the component has rendered correctly
  await waitFor(() => expect(getAllByText('Amazon')).toHaveLength(1))
  await waitFor(() => expect(getAllByText('Microsoft')).toHaveLength(1))

  // Check Cluster compliance chart rendered
  await waitFor(() => expect(getAllByText('Cluster violations')).toHaveLength(2))
  await waitFor(() => expect(getByText('1 Without violations')).toBeTruthy())
  await waitFor(() => expect(getByText('1 With violations')).toBeTruthy())

  // Check PolicyReport chart
  await waitFor(() => expect(getByText('2 Critical')).toBeTruthy())
  await waitFor(() => expect(getByText('1 Important')).toBeTruthy())
  await waitFor(() => expect(getByText('1 Moderate')).toBeTruthy())
  await waitFor(() => expect(getByText('1 Low')).toBeTruthy())

  // Check that Summary card totals are correct
  await waitFor(() => expect(container.querySelector('#applications-summary')).toHaveTextContent('4Applications'))
  await waitFor(() => expect(container.querySelector('#clusters-summary')).toHaveTextContent('2Clusters'))
  await waitFor(() => expect(container.querySelector('#kubernetes-type-summary')).toHaveTextContent('1Kubernetes type'))
  await waitFor(() => expect(container.querySelector('#region-summary')).toHaveTextContent('2Region'))
  await waitFor(() => expect(container.querySelector('#nodes-summary')).toHaveTextContent('6Nodes'))
  await clickByText('Microsoft')
  await waitFor(() => expect(container.querySelector('#clusters-summary')).toHaveTextContent('1Clusters'))
  await waitFor(() => expect(container.querySelector('#region-summary')).toHaveTextContent('1Region'))
  await waitFor(() => expect(container.querySelector('#nodes-summary')).toHaveTextContent('0Nodes'))
})
