/* Copyright Contributors to the Open Cluster Management project */

import { ClusterCurator } from '../../../../../resources'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RemoveAutomationModal } from './RemoveAutomationModal'
import { RecoilRoot } from 'recoil'
import { MemoryRouter } from 'react-router-dom'
import { clusterCuratorsState } from '../../../../../atoms'
import { nockDelete, nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../../lib/nock-util'
//import { clickByText, waitForNocks, waitForNotText, waitForText } from '../../../../../lib/test-util'

const mockClose = jest.fn()

describe('RemoveAutomationModal', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    jest.clearAllMocks()
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  const Component = (props: any) => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(clusterCuratorsState, mockClusterCurators)
        }}
      >
        <MemoryRouter>
          <RemoveAutomationModal {...props} />
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  test('should render update automation modal with alert', async () => {
    const { rerender } = render(<Component {...props} />)

    nockDelete(deleteClustercurators1.req, deleteClustercurators1.res) // delete 'clustercurators' in 'local-cluster' namespace
    nockDelete(deleteSecrets1.req, deleteSecrets1.res) // delete 'secrets' in 'local-cluster' namespace
    nockDelete(deleteSecrets2.req, deleteSecrets2.res) // delete 'secrets' in 'local-cluster' namespace

    // click remove
    userEvent.click(
      screen.getByRole('button', {
        name: /remove/i,
      })
    )
    // won't close unless success
    await waitFor(() => expect(mockClose).toHaveBeenCalled())

    // reopen and make sure remove button is disabled
    props.open = true
    props.clusters = []
    rerender(<Component {...props} />)
  })
})

const mockClusterCurators: ClusterCurator[] = [
  {
    apiVersion: 'cluster.open-cluster-management.io/v1beta1',
    kind: 'ClusterCurator',
    metadata: {
      name: 'ds',
      namespace: 'default',
    },
    spec: {
      install: {
        jobMonitorTimeout: 5,
        posthook: [],
        prehook: [
          {
            extra_vars: {},
            name: 'Service now App Update',
            type: 'Job',
          },
        ],
        towerAuthSecret: 'tower',
      },
      upgrade: {
        monitorTimeout: 120,
        posthook: [],
        prehook: [],
        towerAuthSecret: 'tower',
      },
    },
  },
  {
    apiVersion: 'cluster.open-cluster-management.io/v1beta1',
    kind: 'ClusterCurator',
    metadata: {
      name: 'test',
      namespace: 'default',
    },
    spec: {
      install: {
        jobMonitorTimeout: 5,
        posthook: [],
        prehook: [
          {
            extra_vars: {},
            name: 'acmsre-arm',
            type: 'Job',
          },
        ],
        towerAuthSecret: 'tower',
      },
      inventory: 'Demo Inventory',
      upgrade: {
        monitorTimeout: 120,
        posthook: [],
        prehook: [],
        towerAuthSecret: 'tower',
      },
    },
  },
  {
    apiVersion: 'cluster.open-cluster-management.io/v1beta1',
    kind: 'ClusterCurator',
    metadata: {
      name: 'test2',
      namespace: 'default',
    },
    spec: {
      install: {
        jobMonitorTimeout: 5,
        posthook: [],
        prehook: [
          {
            extra_vars: {},
            name: 'cahl dump all',
            type: 'Job',
          },
        ],
        towerAuthSecret: 'tower',
      },
      inventory: 'test',
      upgrade: {
        monitorTimeout: 120,
        posthook: [],
        prehook: [],
        towerAuthSecret: 'tower',
      },
    },
  },
  {
    apiVersion: 'cluster.open-cluster-management.io/v1beta1',
    kind: 'ClusterCurator',
    metadata: {
      name: 'kevin-test',
      namespace: 'kevin-creds',
    },
    spec: {
      install: {
        jobMonitorTimeout: 5,
        posthook: [],
        prehook: [
          {
            extra_vars: {
              foo: 'bar',
            },
            name: 'Ansible Tags Multiple Tags Job Template 1',
            type: 'Job',
          },
        ],
        towerAuthSecret: 'acmqe',
      },
      inventory: 'Ansible Tags Inventory',
      upgrade: {
        monitorTimeout: 120,
        posthook: [],
        prehook: [],
        towerAuthSecret: 'acmqe',
      },
    },
  },
  {
    apiVersion: 'cluster.open-cluster-management.io/v1beta1',
    kind: 'ClusterCurator',
    metadata: {
      labels: {
        'open-cluster-management': 'curator',
      },
      name: 'local-cluster',
      namespace: 'local-cluster',
    },
    spec: {
      install: {
        jobMonitorTimeout: 5,
        posthook: [],
        prehook: [
          {
            extra_vars: {},
            name: 'acmsre-arm',
            type: 'Job',
          },
        ],
        towerAuthSecret: 'toweraccess-install',
      },
      inventory: 'Demo Inventory',
      upgrade: {
        monitorTimeout: 120,
        posthook: [],
        prehook: [],
        towerAuthSecret: 'toweraccess-upgrade',
      },
    },
  },
]

const props = {
  clusters: [
    {
      name: 'local-cluster',
      displayName: 'local-cluster',
      namespace: 'local-cluster',
      distribution: {
        k8sVersion: 'v1.24.6+5658434',
        ocp: {
          availableUpdates: [
            '4.11.25',
            '4.11.26',
            '4.11.27',
            '4.11.28',
            '4.11.29',
            '4.11.30',
            '4.11.31',
            '4.11.32',
            '4.11.33',
            '4.11.34',
          ],
          channel: 'stable-4.11',
          desired: {
            channels: [
              'candidate-4.11',
              'candidate-4.12',
              'eus-4.12',
              'fast-4.11',
              'fast-4.12',
              'stable-4.11',
              'stable-4.12',
            ],
            image:
              'quay.io/openshift-release-dev/ocp-release@sha256:36ee0fd41073248dc566350db67bd52d2bed6e1691ab11879379b462d740e721',
            url: 'https://access.redhat.com/errata/RHSA-2023:0069',
            version: '4.11.24',
          },
          desiredVersion: '4.11.24',
          version: '4.11.24',
          versionAvailableUpdates: [
            {
              channels: [
                'candidate-4.11',
                'candidate-4.12',
                'eus-4.12',
                'fast-4.11',
                'fast-4.12',
                'stable-4.11',
                'stable-4.12',
              ],
              image:
                'quay.io/openshift-release-dev/ocp-release@sha256:2adcf72e10e67ace02ade32467ff7e75680ec1c71545a038196e569dc3149ad0',
              url: 'https://access.redhat.com/errata/RHSA-2023:0245',
              version: '4.11.25',
            },
            {
              channels: [
                'candidate-4.11',
                'candidate-4.12',
                'eus-4.12',
                'fast-4.11',
                'fast-4.12',
                'stable-4.11',
                'stable-4.12',
              ],
              image:
                'quay.io/openshift-release-dev/ocp-release@sha256:1c3913a65b0a10b4a0650f54e545fe928360a94767acea64c0bd10faa52c945a',
              url: 'https://access.redhat.com/errata/RHSA-2023:0565',
              version: '4.11.26',
            },
            {
              channels: [
                'candidate-4.11',
                'candidate-4.12',
                'eus-4.12',
                'fast-4.11',
                'fast-4.12',
                'stable-4.11',
                'stable-4.12',
              ],
              image:
                'quay.io/openshift-release-dev/ocp-release@sha256:65e71a774a18c1c191f28655ce245abeecd653e8215b75f87eb23ceadacd530d',
              url: 'https://access.redhat.com/errata/RHSA-2023:0651',
              version: '4.11.27',
            },
            {
              channels: [
                'candidate-4.11',
                'candidate-4.12',
                'eus-4.12',
                'fast-4.11',
                'fast-4.12',
                'stable-4.11',
                'stable-4.12',
              ],
              image:
                'quay.io/openshift-release-dev/ocp-release@sha256:85238bc3eddb88e958535597dbe8ec6f2aa88aa1713c2e1ee7faf88d1fefdac0',
              url: 'https://access.redhat.com/errata/RHSA-2023:0774',
              version: '4.11.28',
            },
            {
              channels: [
                'candidate-4.11',
                'candidate-4.12',
                'eus-4.12',
                'fast-4.11',
                'fast-4.12',
                'stable-4.11',
                'stable-4.12',
              ],
              image:
                'quay.io/openshift-release-dev/ocp-release@sha256:1105aa27f627a99a2b3a8b6257a12697b2033a44f1fa2af41491a8e66cd279ac',
              url: 'https://access.redhat.com/errata/RHSA-2023:0895',
              version: '4.11.29',
            },
            {
              channels: [
                'candidate-4.11',
                'candidate-4.12',
                'eus-4.12',
                'fast-4.11',
                'fast-4.12',
                'stable-4.11',
                'stable-4.12',
              ],
              image:
                'quay.io/openshift-release-dev/ocp-release@sha256:8230ca19fea80ef02f255a9f92688aa2639f68739a2b69114bf9af06080f9edc',
              url: 'https://access.redhat.com/errata/RHSA-2023:1030',
              version: '4.11.30',
            },
            {
              channels: [
                'candidate-4.11',
                'candidate-4.12',
                'eus-4.12',
                'fast-4.11',
                'fast-4.12',
                'stable-4.11',
                'stable-4.12',
              ],
              image:
                'quay.io/openshift-release-dev/ocp-release@sha256:5fbe52f0f89d72e4d28b2a40dc69174fe10cce0a99dc5caa6fcfbf4226e08919',
              url: 'https://access.redhat.com/errata/RHSA-2023:1158',
              version: '4.11.31',
            },
            {
              channels: [
                'candidate-4.11',
                'candidate-4.12',
                'eus-4.12',
                'fast-4.11',
                'fast-4.12',
                'stable-4.11',
                'stable-4.12',
              ],
              image:
                'quay.io/openshift-release-dev/ocp-release@sha256:339bd66521b65b4bca329e8444661a0fbde8affe2f358ddc4ef938f2e3f55f4c',
              url: 'https://access.redhat.com/errata/RHBA-2023:1296',
              version: '4.11.32',
            },
            {
              channels: [
                'candidate-4.11',
                'candidate-4.12',
                'eus-4.12',
                'fast-4.11',
                'fast-4.12',
                'stable-4.11',
                'stable-4.12',
              ],
              image:
                'quay.io/openshift-release-dev/ocp-release@sha256:225062eb681c09fc3e2856e04db95b76217b6a4bf3ac712033d1f04f7706dbf8',
              url: 'https://access.redhat.com/errata/RHBA-2023:1396',
              version: '4.11.33',
            },
            {
              channels: [
                'candidate-4.11',
                'candidate-4.12',
                'eus-4.12',
                'fast-4.11',
                'fast-4.12',
                'stable-4.11',
                'stable-4.12',
              ],
              image:
                'quay.io/openshift-release-dev/ocp-release@sha256:dbfa0881b5814ca79c1cd991fc890b666561b4ca58b3f673d79a31c900a0efbb',
              url: 'https://access.redhat.com/errata/RHSA-2023:1504',
              version: '4.11.34',
            },
          ],
          versionHistory: [
            {
              image:
                'quay.io/openshift-release-dev/ocp-release@sha256:36ee0fd41073248dc566350db67bd52d2bed6e1691ab11879379b462d740e721',
              state: 'Completed',
              verified: false,
              version: '4.11.24',
            },
          ],
        },
        displayVersion: 'OpenShift 4.11.24',
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
            step: 'prehook-ansiblejob',
          },
          currentVersion: '4.11.24',
          desiredVersion: '4.11.24',
          isReadySelectChannels: true,
          isSelectingChannel: false,
          isUpgradeCuration: false,
          currentChannel: 'stable-4.11',
          desiredChannel: 'stable-4.11',
          availableUpdates: [
            '4.11.34',
            '4.11.33',
            '4.11.32',
            '4.11.31',
            '4.11.30',
            '4.11.29',
            '4.11.28',
            '4.11.27',
            '4.11.26',
            '4.11.25',
          ],
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
      addons: {
        addonList: [
          {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            kind: 'ManagedClusterAddOn',
            metadata: {
              name: 'application-manager',
              namespace: 'local-cluster',
              ownerReferences: [
                {
                  apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                  blockOwnerDeletion: true,
                  controller: true,
                  kind: 'ClusterManagementAddOn',
                  name: 'application-manager',
                },
              ],
            },
            spec: {
              installNamespace: 'open-cluster-management-agent-addon',
            },
          },
          {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            kind: 'ManagedClusterAddOn',
            metadata: {
              name: 'cert-policy-controller',
              namespace: 'local-cluster',
              ownerReferences: [
                {
                  apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                  blockOwnerDeletion: true,
                  controller: true,
                  kind: 'ClusterManagementAddOn',
                  name: 'cert-policy-controller',
                },
              ],
            },
            spec: {
              installNamespace: 'open-cluster-management-agent-addon',
            },
          },
          {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            kind: 'ManagedClusterAddOn',
            metadata: {
              name: 'cluster-proxy',
              namespace: 'local-cluster',
              ownerReferences: [
                {
                  apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                  blockOwnerDeletion: true,
                  controller: true,
                  kind: 'ClusterManagementAddOn',
                  name: 'cluster-proxy',
                },
              ],
            },
            spec: {
              installNamespace: 'open-cluster-management-agent-addon',
            },
          },
          {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            kind: 'ManagedClusterAddOn',
            metadata: {
              name: 'config-policy-controller',
              namespace: 'local-cluster',
              ownerReferences: [
                {
                  apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                  blockOwnerDeletion: true,
                  controller: true,
                  kind: 'ClusterManagementAddOn',
                  name: 'config-policy-controller',
                },
              ],
            },
            spec: {
              installNamespace: 'open-cluster-management-agent-addon',
            },
          },
          {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            kind: 'ManagedClusterAddOn',
            metadata: {
              name: 'governance-policy-framework',
              namespace: 'local-cluster',
              ownerReferences: [
                {
                  apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                  blockOwnerDeletion: true,
                  controller: true,
                  kind: 'ClusterManagementAddOn',
                  name: 'governance-policy-framework',
                },
              ],
            },
            spec: {
              installNamespace: 'open-cluster-management-agent-addon',
            },
          },
          {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            kind: 'ManagedClusterAddOn',
            metadata: {
              name: 'iam-policy-controller',
              namespace: 'local-cluster',
              ownerReferences: [
                {
                  apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                  blockOwnerDeletion: true,
                  controller: true,
                  kind: 'ClusterManagementAddOn',
                  name: 'iam-policy-controller',
                },
              ],
            },
            spec: {
              installNamespace: 'open-cluster-management-agent-addon',
            },
          },
          {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            kind: 'ManagedClusterAddOn',
            metadata: {
              name: 'work-manager',
              namespace: 'local-cluster',
              ownerReferences: [
                {
                  apiVersion: 'addon.open-cluster-management.io/v1alpha1',
                  blockOwnerDeletion: true,
                  controller: true,
                  kind: 'ClusterManagementAddOn',
                  name: 'work-manager',
                },
              ],
            },
            spec: {
              installNamespace: 'open-cluster-management-agent-addon',
            },
          },
        ],
        available: 7,
        progressing: 0,
        degraded: 0,
        unknown: 0,
      },
      labels: {
        cloud: 'Amazon',
        'cluster.open-cluster-management.io/clusterset': 'default',
        clusterID: 'ee9d4cb4-4e49-4b73-a1a1-5ab82aac0884',
        'feature.open-cluster-management.io/addon-application-manager': 'available',
        'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
        'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
        'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
        'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
        'feature.open-cluster-management.io/addon-iam-policy-controller': 'available',
        'feature.open-cluster-management.io/addon-work-manager': 'available',
        'local-cluster': 'true',
        name: 'local-cluster',
        openshiftVersion: '4.11.24',
        'openshiftVersion-major': '4',
        'openshiftVersion-major-minor': '4.11',
        'velero.io/exclude-from-backup': 'true',
        vendor: 'OpenShift',
      },
      nodes: {
        nodeList: [
          {
            capacity: {
              cpu: '8',
              memory: '32211464Ki',
            },
            conditions: [
              {
                status: 'True',
                type: 'Ready',
              },
            ],
            labels: {
              'beta.kubernetes.io/instance-type': 'm6a.2xlarge',
              'failure-domain.beta.kubernetes.io/region': 'us-east-1',
              'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
              'node-role.kubernetes.io/master': '',
              'node-role.kubernetes.io/worker': '',
              'node.kubernetes.io/instance-type': 'm6a.2xlarge',
            },
            name: 'ip-10-0-147-0.ec2.internal',
          },
          {
            capacity: {
              cpu: '8',
              memory: '32211464Ki',
            },
            conditions: [
              {
                status: 'True',
                type: 'Ready',
              },
            ],
            labels: {
              'beta.kubernetes.io/instance-type': 'm6a.2xlarge',
              'failure-domain.beta.kubernetes.io/region': 'us-east-1',
              'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
              'node-role.kubernetes.io/master': '',
              'node-role.kubernetes.io/worker': '',
              'node.kubernetes.io/instance-type': 'm6a.2xlarge',
            },
            name: 'ip-10-0-186-222.ec2.internal',
          },
          {
            capacity: {
              cpu: '8',
              memory: '32211464Ki',
            },
            conditions: [
              {
                status: 'True',
                type: 'Ready',
              },
            ],
            labels: {
              'beta.kubernetes.io/instance-type': 'm6a.2xlarge',
              'failure-domain.beta.kubernetes.io/region': 'us-east-1',
              'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
              'node-role.kubernetes.io/master': '',
              'node-role.kubernetes.io/worker': '',
              'node.kubernetes.io/instance-type': 'm6a.2xlarge',
            },
            name: 'ip-10-0-223-166.ec2.internal',
          },
        ],
        ready: 3,
        unhealthy: 0,
        unknown: 0,
      },
      kubeApiServer: 'https://api.cs-aws-411-r6jp5.dev02.red-chesterfield.com:6443',
      consoleURL: 'https://console-openshift-console.apps.cs-aws-411-r6jp5.dev02.red-chesterfield.com',
      isHive: false,
      isHypershift: false,
      isManaged: true,
      isCurator: true,
      isHostedCluster: false,
      isSNOCluster: false,
      isRegionalHubCluster: false,
      hive: {
        isHibernatable: false,
        secrets: {},
      },
      clusterSet: 'default',
      owner: {},
    },
  ],
  open: true,
  close: mockClose,
}

//---delete 'clustercurators' in 'local-cluster' namespace---
const deleteClustercurators1 = {
  req: {
    apiVersion: 'cluster.open-cluster-management.io/v1beta1',
    kind: 'clustercurators',
    metadata: {
      namespace: 'local-cluster',
      name: 'local-cluster',
    },
  },
  res: {
    kind: 'Status',
    apiVersion: 'v1',
    metadata: {},
    status: 'Success',
    details: {
      name: 'local-cluster',
      group: 'cluster.open-cluster-management.io',
      kind: 'clustercurators',
    },
  },
}

//---delete 'secrets' in 'local-cluster' namespace---
const deleteSecrets1 = {
  req: {
    apiVersion: 'v1',
    kind: 'secrets',
    metadata: {
      namespace: 'local-cluster',
      name: 'toweraccess-upgrade',
    },
  },
  res: {
    kind: 'Status',
    apiVersion: 'v1',
    metadata: {},
    status: 'Success',
    details: {
      name: 'toweraccess-upgrade',
      kind: 'secrets',
    },
  },
}

//---delete 'secrets' in 'local-cluster' namespace---
const deleteSecrets2 = {
  req: {
    apiVersion: 'v1',
    kind: 'secrets',
    metadata: {
      namespace: 'local-cluster',
      name: 'toweraccess-install',
    },
  },
  res: {
    kind: 'Status',
    apiVersion: 'v1',
    metadata: {},
    status: 'Success',
    details: {
      name: 'toweraccess-install',
      kind: 'secrets',
    },
  },
}
