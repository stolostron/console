/* Copyright Contributors to the Open Cluster Management project */

import i18next from 'i18next'
import {
  ApplicationSetApiVersionType,
  ApplicationSetKindType,
  ArgoApplication,
  ArgoApplicationApiVersion,
  ArgoApplicationDefinition,
  ArgoApplicationKind,
} from '../../../resources'
import { mockPlacementRules } from '../../Governance/governance.sharedMocks'
import {
  mockApplication0,
  mockApplications,
  mockApplicationSet0,
  mockChannels,
  mockSubscriptions,
} from '../Application.sharedmocks'
import {
  getAppChildResources,
  getAppSetRelatedResources,
  getArgoClusterList,
  getClusterCount,
  getClusterCountSearchLink,
  getClusterCountString,
  getEditLink,
  getResourceLabel,
  getResourceTimestamp,
  getResourceType,
  getSearchLink,
  groupByRepoType,
  isArgoPullModel,
  normalizeRepoType,
} from './resource-helper'
import { Cluster, ClusterStatus } from '../../../resources/utils/get-cluster'
import { render } from '@testing-library/react'
import React from 'react'

const t = i18next.t.bind(i18next)

describe('normalizeRepoType', () => {
  it('should work with github', () => {
    expect(normalizeRepoType('github')).toEqual('git')
  })

  it('should work with helm', () => {
    expect(normalizeRepoType('helm')).toEqual('helm')
  })
})

describe('groupByRepoType', () => {
  it('should return repos', () => {
    const repos = [
      {
        gitPath: 'sadaf',
        pathName: 'https://13.com',
        targetRevision: 'sd',
        type: 'git',
      },
      {
        chart: 'testchart',
        gitPath: 'sadaf',
        pathName: 'https://13.com',
        targetRevision: 'sd',
        type: 'helmrepo',
      },
    ]
    const result = {
      git: [
        {
          gitPath: 'sadaf',
          pathName: 'https://13.com',
          targetRevision: 'sd',
          type: 'git',
        },
      ],
      helmrepo: [
        {
          chart: 'testchart',
          gitPath: 'sadaf',
          pathName: 'https://13.com',
          targetRevision: 'sd',
          type: 'helmrepo',
        },
      ],
    }
    expect(groupByRepoType(repos)).toEqual(result)
  })
})

describe('getClusterCountString', () => {
  it('should return None', () => {
    expect(getClusterCountString(t, { remoteCount: 0, localPlacement: false })).toEqual('None')
  })

  it('should return Local', () => {
    expect(getClusterCountString(t, { remoteCount: 0, localPlacement: true })).toEqual('Local')
  })

  it('should return Remote', () => {
    expect(getClusterCountString(t, { remoteCount: 2, localPlacement: false })).toEqual('2 Remote')
  })

  it('should return Remote with Local', () => {
    expect(getClusterCountString(t, { remoteCount: 2, localPlacement: true })).toEqual('2 Remote, 1 Local')
  })

  it('should return cluster name for Argo', () => {
    expect(
      getClusterCountString(
        t,
        { remoteCount: 2, localPlacement: true },
        ['managed-cluster', 'other'],
        ArgoApplicationDefinition
      )
    ).toEqual('managed-cluster')
  })

  it('should return None for Argo', () => {
    expect(getClusterCountString(t, { remoteCount: 2, localPlacement: true }, [], ArgoApplicationDefinition)).toEqual(
      'None'
    )
  })
})

describe('getResourceType', () => {
  it('should work with git', () => {
    expect(getResourceType('git', t)).toEqual('Git')
  })

  it('should work with helmrepo', () => {
    expect(getResourceType('helmrepo', t)).toEqual('Helm')
  })

  it('should work with namespace', () => {
    expect(getResourceType('namespace', t)).toEqual('Namespace')
  })

  it('should work with objectbucket', () => {
    expect(getResourceType('objectbucket', t)).toEqual('Object storage')
  })

  it('should work with undefined', () => {
    expect(getResourceType('', t)).toEqual('-')
  })
})

describe('getResourceLabel', () => {
  it('should work with git', () => {
    expect(getResourceLabel('git', 2, (t) => t)).toEqual('Git (2)')
  })

  it('should work with helmrepo', () => {
    expect(getResourceLabel('helmrepo', 2, (t) => t)).toEqual('Helm (2)')
  })

  it('should work with namespace', () => {
    expect(getResourceLabel('namespace', 2, (t) => t)).toEqual('Namespace (2)')
  })

  it('should work with objectbucket', () => {
    expect(getResourceLabel('objectbucket', 2, (t) => t)).toEqual('Object storage (2)')
  })

  it('should work with undefined', () => {
    expect(getResourceLabel('', 2, (t) => t)).toEqual('- (2)')
  })
})

describe('getResourceTimestamp', () => {
  it('should get a valid time', () => {
    const resource = {
      apiVersion: 'v1',
      kind: 'Test',
      metadata: {
        creationTimestamp: '2024-02-11T12:00:00Z',
      },
    }

    const result = getResourceTimestamp(resource as any, 'metadata.creationTimestamp')
    const { container } = render(React.createElement('div', null, result))

    expect(container).toBeInTheDocument()
  })

  it('should handle missing timestamp', () => {
    const resource = {
      apiVersion: 'v1',
      kind: 'Test',
      metadata: {},
    }

    const result = getResourceTimestamp(resource as any, 'metadata.creationTimestamp')
    const { container } = render(React.createElement('div', null, result))

    expect(container).toHaveTextContent('-')
  })

  it('should handle invalid timestamp path', () => {
    const resource = {
      apiVersion: 'v1',
      kind: 'Test',
      metadata: {
        creationTimestamp: '2024-02-11T12:00:00Z',
      },
    }

    const result = getResourceTimestamp(resource as any, 'unknown')
    const { container } = render(React.createElement('div', null, result))

    expect(container).toHaveTextContent('-')
  })
})

describe('getSearchLink', () => {
  it('should work with no props', () => {
    expect(getSearchLink({})).toEqual('/multicloud/search')
  })

  it('should work with multiple props', () => {
    expect(getSearchLink({ properties: { name: 'testing', kind: 'resource' } })).toEqual(
      '/multicloud/search?filters=%7B%22textsearch%22%3A%22name%3Atesting%20kind%3Aresource%22%7D'
    )
  })

  it('should include related resources', () => {
    expect(
      getSearchLink({
        properties: { name: 'testing' },
        showRelated: 'subscriptions',
      })
    ).toEqual('/multicloud/search?filters=%7B%22textsearch%22%3A%22name%3Atesting%22%7D&showrelated=subscriptions')
  })

  it('should work with array properties', () => {
    expect(
      getSearchLink({
        properties: {
          name: ['helloworld-local', 'helloworld-remote'],
          namespace: ['argocd', 'openshift-gitops'],
          kind: 'application',
          apigroup: 'argoproj.io',
        },
        showRelated: 'cluster',
      })
    ).toEqual(
      '/multicloud/search?filters=%7B%22textsearch%22%3A%22name%3Ahelloworld-local%2Chelloworld-remote%20namespace%3Aargocd%2Copenshift-gitops%20kind%3Aapplication%20apigroup%3Aargoproj.io%22%7D&showrelated=cluster'
    )
  })
})

describe('getEditLink', () => {
  it('returns a url endpoint', () => {
    expect(
      getEditLink({
        properties: {
          name: 'test-1',
          namespace: 'test-1-ns',
          kind: 'Application',
          cluster: 'magchen-test',
          apiversion: 'v1',
        },
      })
    ).toEqual(
      '/multicloud/search/resources/yaml?apiversion=v1&cluster=magchen-test&kind=Application&name=test-1&namespace=test-1-ns'
    )
  })
})

describe('getAppChildResources', () => {
  it('should get the child resources', () => {
    expect(
      getAppChildResources(
        mockApplication0,
        mockApplications,
        mockSubscriptions,
        mockPlacementRules,
        [],
        mockChannels,
        'local-cluster'
      )
    ).toEqual([
      [
        {
          apiVersion: 'apps.open-cluster-management.io/v1',
          id: 'subscriptions-namespace-0-subscription-0',
          kind: 'Subscription',
          label: 'subscription-0 [Subscription]',
          name: 'subscription-0',
          namespace: 'namespace-0',
          subChildResources: [],
        },
      ],
      [],
    ])
  })
})

describe('getAppSetRelatedResources', () => {
  it('should get the related placement info', () => {
    expect(getAppSetRelatedResources(mockApplicationSet0, [mockApplicationSet0])).toEqual(['fengappset2-placement', []])
  })
})

describe('getClusterCountSearchLink', () => {
  const resource = {
    apiVersion: 'apps/v1',
    kind: 'StatefulSet',
    label:
      'app.kubernetes.io/component=application-controller; app.kubernetes.io/managed-by=openshift-gitops; app.kubernetes.io/name=openshift-gitops-application-controller; app.kubernetes.io/part-of=argocd',
    metadata: {
      name: 'argocd',
      namespace: 'openshift-gitops',
      creationTimestamp: '2023-03-06T20:40:14Z',
    },
    status: {
      cluster: 'local-cluster',
      resourceName: 'openshift-gitops-application-controller',
    },
    transformed: {
      clusterCount: 'local-cluster',
      resourceText: '',
      createdText: 'a day ago',
      timeWindow: '',
      namespace: 'openshift-gitops',
    },
  }

  const clusterCount = {
    localPlacement: true,
    remoteCount: 0,
  }

  const clusterList = ['local-cluster']

  it('should generate link', () => {
    expect(getClusterCountSearchLink(resource, clusterCount, clusterList)).toEqual(
      '/multicloud/infrastructure/clusters/details/local-cluster/local-cluster'
    )
  })
})

describe('isArgoPullModel true', () => {
  const res1 = {
    apiVersion: 'argoproj.io/v1alpha1' as ApplicationSetApiVersionType,
    kind: 'ApplicationSet' as ApplicationSetKindType,
    metadata: {},
    spec: {
      template: {
        metadata: {
          annotations: {
            'apps.open-cluster-management.io/ocm-managed-cluster': '{{name}}',
          },
        },
      },
    },
  }
  it('should return true', () => {
    expect(isArgoPullModel(res1)).toEqual(true)
  })
})

describe('isArgoPullModel false', () => {
  const res1 = {
    apiVersion: 'argoproj.io/v1alpha1' as ApplicationSetApiVersionType,
    kind: 'ApplicationSet' as ApplicationSetKindType,
    metadata: {},
    spec: {
      template: {
        metadata: {
          annotations: {
            foo: 'bar',
          },
        },
      },
    },
  }
  it('should return false', () => {
    expect(isArgoPullModel(res1)).toEqual(false)
  })
})

describe('getArgoClusterList', () => {
  const resources: ArgoApplication[] = [
    {
      apiVersion: ArgoApplicationApiVersion,
      kind: ArgoApplicationKind,
      metadata: {
        name: 'argo-test',
        namespace: 'argo-test',
      },
      spec: {
        destination: {
          name: 'local-cluster',
          namespace: 'app1-ns',
        },
        project: 'default',
        source: {
          path: 'managedClusters/namctigtd28d',
          repoURL: 'https://github.com/test/app-samples',
          targetRevision: 'HEAD',
        },
        syncPolicy: {
          automated: {
            prune: true,
            selfHeal: true,
          },
          syncOptions: ['CreateNamespace=true'],
        },
      },
    },
  ]

  const localCluster: Cluster = {
    name: 'local-cluster',
    displayName: 'local-cluster',
    namespace: 'local-cluster',
    uid: '773bc5f7-0ef8-4cd1-97e4-aaa2e5fa99e7',
    status: ClusterStatus.ready,
    distribution: {
      k8sVersion: 'v1.29.9+5865c5b',
      displayVersion: 'OpenShift 4.16.20',
      isManagedOpenShift: false,
      upgradeInfo: {
        isUpgrading: false,
        isReadyUpdates: true,
        upgradePercentage: '',
        upgradeFailed: false,
        hooksInProgress: false,
        hookFailed: false,
        latestJob: {
          conditionMessage: '',
        },
        currentVersion: '4.16.20',
        desiredVersion: '4.16.20',
        isReadySelectChannels: true,
        isSelectingChannel: false,
        isUpgradeCuration: false,
        currentChannel: 'candidate-4.17',
        desiredChannel: 'candidate-4.17',
        availableUpdates: ['4.16.21', '4.16.23', '4.17.4', '4.17.5'],
        availableChannels: ['candidate-4.16', 'candidate-4.17', 'eus-4.16', 'fast-4.16', 'fast-4.17', 'stable-4.16'],
        prehooks: {
          hasHooks: false,
          inProgress: false,
          success: false,
          failed: false,
        },
        posthooks: {
          hasHooks: false,
          inProgress: false,
          success: false,
          failed: false,
        },
        posthookDidNotRun: false,
      },
    },
    acmDistribution: {},
    microshiftDistribution: {},
    addons: {
      addonList: [
        {
          apiVersion: 'addon.open-cluster-management.io/v1alpha1',
          kind: 'ManagedClusterAddOn',
          metadata: {
            creationTimestamp: '2024-11-14T18:39:17Z',
            name: 'application-manager',
            namespace: 'local-cluster',
            ownerReferences: [
              {
                apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                blockOwnerDeletion: true,
                controller: true,
                kind: 'ClusterManagementAddOn',
                name: 'application-manager',
                uid: 'fe5f16fd-2cc3-4ea0-8fc5-4987436d1511',
              },
            ],
            resourceVersion: '19701591',
            uid: '0f7f0d1b-cf75-4e5d-b9f7-d2344efb8bc4',
          },
          spec: {
            installNamespace: 'open-cluster-management-agent-addon',
          },
        },
        {
          apiVersion: 'addon.open-cluster-management.io/v1alpha1',
          kind: 'ManagedClusterAddOn',
          metadata: {
            creationTimestamp: '2024-11-14T18:39:17Z',
            name: 'cert-policy-controller',
            namespace: 'local-cluster',
            ownerReferences: [
              {
                apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                blockOwnerDeletion: true,
                controller: true,
                kind: 'ClusterManagementAddOn',
                name: 'cert-policy-controller',
                uid: 'b7e3733b-804c-4b15-9913-e64f1e98a1d3',
              },
            ],
            resourceVersion: '19700264',
            uid: 'bfc8f32c-b47d-485f-b9d7-b689f6c831c9',
          },
          spec: {
            installNamespace: 'open-cluster-management-agent-addon',
          },
        },
        {
          apiVersion: 'addon.open-cluster-management.io/v1alpha1',
          kind: 'ManagedClusterAddOn',
          metadata: {
            creationTimestamp: '2024-11-14T18:42:39Z',
            name: 'cluster-proxy',
            namespace: 'local-cluster',
            ownerReferences: [
              {
                apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                blockOwnerDeletion: true,
                controller: true,
                kind: 'ClusterManagementAddOn',
                name: 'cluster-proxy',
                uid: '17e25283-e396-446c-80f5-7aef1a73a9ca',
              },
            ],
            resourceVersion: '19704171',
            uid: 'e0b63a56-e66c-4ce8-8a7d-bec185c43bc1',
          },
          spec: {
            installNamespace: 'open-cluster-management-agent-addon',
          },
        },
        {
          apiVersion: 'addon.open-cluster-management.io/v1alpha1',
          kind: 'ManagedClusterAddOn',
          metadata: {
            creationTimestamp: '2024-11-14T18:39:17Z',
            finalizers: ['addon.open-cluster-management.io/addon-pre-delete'],
            name: 'config-policy-controller',
            namespace: 'local-cluster',
            ownerReferences: [
              {
                apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                blockOwnerDeletion: true,
                controller: true,
                kind: 'ClusterManagementAddOn',
                name: 'config-policy-controller',
                uid: 'faf30964-83cb-4129-8f03-4a78c9e8bd8d',
              },
            ],
            resourceVersion: '19700273',
            uid: 'a751b14d-1d1d-4be2-b04c-81a1e0723f19',
          },
          spec: {
            installNamespace: 'open-cluster-management-agent-addon',
          },
        },
        {
          apiVersion: 'addon.open-cluster-management.io/v1alpha1',
          kind: 'ManagedClusterAddOn',
          metadata: {
            creationTimestamp: '2024-11-14T18:39:17Z',
            name: 'governance-policy-framework',
            namespace: 'local-cluster',
            ownerReferences: [
              {
                apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                blockOwnerDeletion: true,
                controller: true,
                kind: 'ClusterManagementAddOn',
                name: 'governance-policy-framework',
                uid: '714f85c8-3779-4b3a-a04f-5b4211f802d2',
              },
            ],
            resourceVersion: '19700266',
            uid: '5f26848c-4d31-41f0-81f1-41d73c75a1d9',
          },
          spec: {
            installNamespace: 'open-cluster-management-agent-addon',
          },
        },
        {
          apiVersion: 'addon.open-cluster-management.io/v1alpha1',
          kind: 'ManagedClusterAddOn',
          metadata: {
            creationTimestamp: '2024-11-14T18:42:39Z',
            name: 'managed-serviceaccount',
            namespace: 'local-cluster',
            ownerReferences: [
              {
                apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                blockOwnerDeletion: true,
                controller: true,
                kind: 'ClusterManagementAddOn',
                name: 'managed-serviceaccount',
                uid: '98a8a151-d72d-41d6-9f74-66d2c9898440',
              },
            ],
            resourceVersion: '19961871',
            uid: 'b828352f-6636-4053-9b2d-1349c3c0e2c5',
          },
          spec: {
            installNamespace: 'open-cluster-management-agent-addon',
          },
        },
        {
          apiVersion: 'addon.open-cluster-management.io/v1alpha1',
          kind: 'ManagedClusterAddOn',
          metadata: {
            creationTimestamp: '2024-11-14T18:42:39Z',
            name: 'work-manager',
            namespace: 'local-cluster',
            ownerReferences: [
              {
                apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                blockOwnerDeletion: true,
                controller: true,
                kind: 'ClusterManagementAddOn',
                name: 'work-manager',
                uid: '22f73361-bad2-417c-abe9-953da3fccaaa',
              },
            ],
            resourceVersion: '19704173',
            uid: '2a5f0036-8fb7-4244-8eb2-54cf191451a3',
          },
          spec: {
            installNamespace: 'open-cluster-management-agent-addon',
          },
        },
        {
          apiVersion: 'addon.open-cluster-management.io/v1alpha1',
          kind: 'ManagedClusterAddOn',
          metadata: {
            annotations: {
              'installer.multicluster.openshift.io/release-version': '2.8.0',
            },
            creationTimestamp: '2024-11-14T18:38:16Z',
            finalizers: ['addon.open-cluster-management.io/addon-pre-delete'],
            labels: {
              'backplaneconfig.name': 'multiclusterengine',
            },
            name: 'hypershift-addon',
            namespace: 'local-cluster',
            ownerReferences: [
              {
                apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                blockOwnerDeletion: true,
                controller: true,
                kind: 'ClusterManagementAddOn',
                name: 'hypershift-addon',
                uid: '637e9059-7f02-4265-a9a8-f68f3005978c',
              },
            ],
            resourceVersion: '20001981',
            uid: '653398d7-3d49-433d-996d-e46f467e79dc',
          },
          spec: {
            installNamespace: 'open-cluster-management-agent-addon',
          },
        },
      ],
      available: 7,
      progressing: 0,
      degraded: 1,
      unknown: 0,
    },
    labels: {
      cloud: 'Amazon',
      'cluster.open-cluster-management.io/clusterset': 'default',
      clusterID: '352d46c7-8d43-418a-8e9b-505437a1a330',
      'feature.open-cluster-management.io/addon-application-manager': 'available',
      'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
      'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
      'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
      'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
      'feature.open-cluster-management.io/addon-hypershift-addon': 'available',
      'feature.open-cluster-management.io/addon-managed-serviceaccount': 'available',
      'feature.open-cluster-management.io/addon-work-manager': 'available',
      'local-cluster': 'true',
      name: 'local-cluster',
      openshiftVersion: '4.16.20',
      'openshiftVersion-major': '4',
      'openshiftVersion-major-minor': '4.16',
      'velero.io/exclude-from-backup': 'true',
      vendor: 'OpenShift',
    },
    nodes: {
      nodeList: [
        {
          capacity: {
            cpu: '4',
            memory: '15901872Ki',
          },
          conditions: [
            {
              status: 'True',
              type: 'Ready',
            },
          ],
          labels: {
            'beta.kubernetes.io/instance-type': 'm5.xlarge',
            'failure-domain.beta.kubernetes.io/region': 'us-east-2',
            'failure-domain.beta.kubernetes.io/zone': 'us-east-2b',
            'node-role.kubernetes.io/control-plane': '',
            'node-role.kubernetes.io/master': '',
            'node.kubernetes.io/instance-type': 'm5.xlarge',
            'topology.kubernetes.io/region': 'us-east-2',
            'topology.kubernetes.io/zone': 'us-east-2b',
          },
          name: 'ip-10-0-34-43.us-east-2.compute.internal',
        },
        {
          capacity: {
            cpu: '4',
            memory: '15901872Ki',
          },
          conditions: [
            {
              status: 'True',
              type: 'Ready',
            },
          ],
          labels: {
            'beta.kubernetes.io/instance-type': 'm5.xlarge',
            'failure-domain.beta.kubernetes.io/region': 'us-east-2',
            'failure-domain.beta.kubernetes.io/zone': 'us-east-2a',
            'node-role.kubernetes.io/control-plane': '',
            'node-role.kubernetes.io/master': '',
            'node.kubernetes.io/instance-type': 'm5.xlarge',
            'topology.kubernetes.io/region': 'us-east-2',
            'topology.kubernetes.io/zone': 'us-east-2a',
          },
          name: 'ip-10-0-4-156.us-east-2.compute.internal',
        },
        {
          capacity: {
            cpu: '4',
            memory: '16073892Ki',
          },
          conditions: [
            {
              status: 'True',
              type: 'Ready',
            },
          ],
          labels: {
            'beta.kubernetes.io/instance-type': 'm5.xlarge',
            'failure-domain.beta.kubernetes.io/region': 'us-east-2',
            'failure-domain.beta.kubernetes.io/zone': 'us-east-2b',
            'node-role.kubernetes.io/worker': '',
            'node.kubernetes.io/instance-type': 'm5.xlarge',
            'topology.kubernetes.io/region': 'us-east-2',
            'topology.kubernetes.io/zone': 'us-east-2b',
          },
          name: 'ip-10-0-60-179.us-east-2.compute.internal',
        },
        {
          capacity: {
            cpu: '4',
            memory: '16073908Ki',
          },
          conditions: [
            {
              status: 'True',
              type: 'Ready',
            },
          ],
          labels: {
            'beta.kubernetes.io/instance-type': 'm5.xlarge',
            'failure-domain.beta.kubernetes.io/region': 'us-east-2',
            'failure-domain.beta.kubernetes.io/zone': 'us-east-2a',
            'node-role.kubernetes.io/worker': '',
            'node.kubernetes.io/instance-type': 'm5.xlarge',
            'topology.kubernetes.io/region': 'us-east-2',
            'topology.kubernetes.io/zone': 'us-east-2a',
          },
          name: 'ip-10-0-9-190.us-east-2.compute.internal',
        },
        {
          capacity: {
            cpu: '4',
            memory: '16073904Ki',
          },
          conditions: [
            {
              status: 'True',
              type: 'Ready',
            },
          ],
          labels: {
            'beta.kubernetes.io/instance-type': 'm5.xlarge',
            'failure-domain.beta.kubernetes.io/region': 'us-east-2',
            'failure-domain.beta.kubernetes.io/zone': 'us-east-2c',
            'node-role.kubernetes.io/control-plane': '',
            'node-role.kubernetes.io/master': '',
            'node.kubernetes.io/instance-type': 'm5.xlarge',
            'topology.kubernetes.io/region': 'us-east-2',
            'topology.kubernetes.io/zone': 'us-east-2c',
          },
          name: 'ip-10-0-94-201.us-east-2.compute.internal',
        },
        {
          capacity: {
            cpu: '4',
            memory: '16073908Ki',
          },
          conditions: [
            {
              status: 'True',
              type: 'Ready',
            },
          ],
          labels: {
            'beta.kubernetes.io/instance-type': 'm5.xlarge',
            'failure-domain.beta.kubernetes.io/region': 'us-east-2',
            'failure-domain.beta.kubernetes.io/zone': 'us-east-2c',
            'node-role.kubernetes.io/worker': '',
            'node.kubernetes.io/instance-type': 'm5.xlarge',
            'topology.kubernetes.io/region': 'us-east-2',
            'topology.kubernetes.io/zone': 'us-east-2c',
          },
          name: 'ip-10-0-94-60.us-east-2.compute.internal',
        },
      ],
      ready: 6,
      unhealthy: 0,
      unknown: 0,
    },
    kubeApiServer: 'https://api.app-aws-east2-415-hub-r5vbw.dev11.red-chesterfield.com:6443',
    consoleURL: 'https://console-openshift-console.apps.app-aws-east2-415-hub-r5vbw.dev11.red-chesterfield.com',
    isHive: false,
    isHypershift: false,
    isManaged: true,
    isCurator: false,
    hasAutomationTemplate: false,
    isHostedCluster: false,
    isSNOCluster: false,
    isRegionalHubCluster: false,
    hive: {
      isHibernatable: false,
      secrets: {},
    },
    clusterSet: 'default',
    owner: {},
    creationTimestamp: '2024-11-14T18:38:14Z',
  }

  it('should return Argo cluster list local', () => {
    expect(getArgoClusterList(resources, localCluster, [localCluster]).length).toEqual(1)
  })

  it('should return Argo cluster list remote', () => {
    resources[0].status = {
      cluster: 'cluster1',
      resourceName: 'resource1',
    }
    expect(getArgoClusterList(resources, localCluster, [localCluster]).length).toEqual(1)
  })
})

describe('getClusterCount', () => {
  it('should get the cluster count', () => {
    const cc = getClusterCount(['local-cluster', 'cluster1'], 'local-cluster')
    expect(cc.localPlacement).toEqual(true)
    expect(cc.remoteCount).toEqual(1)
  })
})
