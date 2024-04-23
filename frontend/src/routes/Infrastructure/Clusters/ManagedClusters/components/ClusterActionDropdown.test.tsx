/* Copyright Contributors to the Open Cluster Management project */

import {
  Cluster,
  ClusterCuratorDefinition,
  ClusterDeploymentDefinition,
  ClusterImageSet,
  ClusterStatus,
  KlusterletAddonConfig,
  KlusterletAddonConfigApiVersion,
  KlusterletAddonConfigKind,
  ManagedCluster,
  ManagedClusterApiVersion,
  ManagedClusterDefinition,
  ManagedClusterKind,
  SecretDefinition,
} from '../../../../../resources'
import { render, screen } from '@testing-library/react'
import { Scope } from 'nock/types'
import { RecoilRoot } from 'recoil'
import { MemoryRouter } from 'react-router'
import { nockCreate, nockIgnoreApiPaths, nockIgnoreRBAC, nockPatch, nockRBAC } from '../../../../../lib/nock-util'
import { rbacCreate, rbacDelete, rbacPatch } from '../../../../../lib/rbac-util'
import {
  clickByLabel,
  clickByText,
  waitForNock,
  waitForNocks,
  waitForNotText,
  waitForText,
} from '../../../../../lib/test-util'
import { ClusterActionDropdown } from './ClusterActionDropdown'
import { NavigationPath } from '../../../../../NavigationPath'
import { clusterImageSetsState } from '../../../../../atoms'
import userEvent from '@testing-library/user-event'

const mockCluster: Cluster = {
  name: 'test-cluster',
  displayName: 'test-cluster',
  namespace: 'test-cluster',
  uid: 'test-cluster-uid',
  status: ClusterStatus.ready,
  provider: undefined,
  distribution: {
    k8sVersion: '1.19',
    ocp: {
      version: '4.6',
      availableUpdates: [],
      desiredVersion: '4.6',
      upgradeFailed: false,
    },
    displayVersion: '4.6',
    isManagedOpenShift: false,
  },
  hasAutomationTemplate: true,
  labels: undefined,
  nodes: undefined,
  kubeApiServer: '',
  consoleURL: '',
  hive: {
    isHibernatable: true,
    clusterPool: undefined,
    secrets: {
      installConfig: undefined,
    },
  },
  isHive: true,
  isManaged: true,
  isCurator: true,
  isHostedCluster: false,
  isSNOCluster: false,
  owner: {},
  kubeadmin: undefined,
  kubeconfig: undefined,
  isHypershift: false,
  isRegionalHubCluster: false,
}

const mockHostedCluster: Cluster = {
  name: 'test-hosted-cluster',
  displayName: 'test-hosted-cluster',
  namespace: 'test-hosted-cluster',
  uid: 'test-hosted-cluster-uid',
  status: ClusterStatus.ready,
  provider: undefined,
  distribution: {
    k8sVersion: '1.19',
    ocp: {
      version: '4.13.6',
      availableUpdates: [],
      desiredVersion: '4.13.6',
      upgradeFailed: false,
    },
    displayVersion: '4.13.6',
    isManagedOpenShift: false,
  },
  hasAutomationTemplate: true,
  labels: undefined,
  nodes: undefined,
  kubeApiServer: '',
  consoleURL: '',
  hive: {
    isHibernatable: false,
    clusterPool: undefined,
    secrets: {
      installConfig: undefined,
    },
  },
  isHive: false,
  isManaged: true,
  isCurator: true,
  isHostedCluster: true,
  isSNOCluster: false,
  owner: {},
  kubeadmin: undefined,
  kubeconfig: undefined,
  isHypershift: true,
  isRegionalHubCluster: false,
  hypershift: {
    agent: false,
    nodePools: [
      {
        apiVersion: 'hypershift.openshift.io/v1beta1',
        kind: 'NodePool',
        metadata: {
          annotations: {
            'hypershift.openshift.io/nodePoolCurrentConfig': 'bf1449e8',
            'hypershift.openshift.io/nodePoolCurrentConfigVersion': '49cc0546',
            'hypershift.openshift.io/nodePoolPlatformMachineTemplate': 'feng-hyper-test34-us-east-2a-4584a61d',
          },
          creationTimestamp: '2024-02-15T21:29:16Z',
          finalizers: ['hypershift.openshift.io/finalizer'],
          generation: 1,
          labels: {
            'hypershift.openshift.io/auto-created-for-infra': 'feng-hyper-test34-5l9jf',
          },
          name: 'feng-hyper-test34-us-east-2a',
          namespace: 'clusters',
          ownerReferences: [
            {
              apiVersion: 'hypershift.openshift.io/v1beta1',
              kind: 'HostedCluster',
              name: 'feng-hyper-test34',
              uid: '731868a9-fa3e-47d1-beaf-264c7832c9a3',
            },
          ],
          resourceVersion: '242847',
          uid: 'a0f47066-d752-418e-8638-c4b223b591e0',
        },
        spec: {
          clusterName: 'feng-hyper-test34',
          management: {
            autoRepair: false,
            replace: {
              rollingUpdate: {
                maxSurge: 1,
                maxUnavailable: 0,
              },
              strategy: 'RollingUpdate',
            },
            upgradeType: 'Replace',
          },
          platform: {
            aws: {
              instanceProfile: 'feng-hyper-test34-5l9jf-worker',
              instanceType: 'm5.large',
              rootVolume: {
                size: 120,
                type: 'gp3',
              },
              securityGroups: [
                {
                  id: 'sg-08a8df9d0b14054f9',
                },
              ],
              subnet: {
                id: 'subnet-0fa05ef93202a9e1d',
              },
            },
            type: 'AWS',
          },
          release: {
            image: 'quay.io/openshift-release-dev/ocp-release:4.13.6-multi',
          },
          replicas: 1,
        },
        status: {
          conditions: [
            {
              lastTransitionTime: '2024-02-15T21:32:27Z',
              message: 'Using release image: quay.io/openshift-release-dev/ocp-release:4.13.6-multi',
              observedGeneration: 1,
              reason: 'AsExpected',
              status: 'True',
              type: 'ValidReleaseImage',
            },
            {
              lastTransitionTime: '2024-02-15T21:32:27Z',
              message: 'Bootstrap AMI is "ami-085c2a9af03474b5a"',
              observedGeneration: 1,
              reason: 'AsExpected',
              status: 'True',
              type: 'ValidPlatformImage',
            },
            {
              lastTransitionTime: '2024-02-15T21:32:27Z',
              message: 'NodePool has a security group',
              observedGeneration: 1,
              reason: 'AsExpected',
              status: 'True',
              type: 'AWSSecurityGroupAvailable',
            },
            {
              lastTransitionTime: '2024-02-15T21:33:15Z',
              message: 'Payload generated successfully',
              observedGeneration: 1,
              reason: 'AsExpected',
              status: 'True',
              type: 'ValidGeneratedPayload',
            },
            {
              lastTransitionTime: '2024-02-15T21:32:27Z',
              message: 'Reconciliation active on resource',
              observedGeneration: 1,
              reason: 'ReconciliationActive',
              status: 'True',
              type: 'ReconciliationActive',
            },
            {
              lastTransitionTime: '2024-02-15T21:32:48Z',
              message: 'All is well',
              observedGeneration: 1,
              reason: 'AsExpected',
              status: 'True',
              type: 'AllMachinesReady',
            },
            {
              lastTransitionTime: '2024-02-15T21:38:09Z',
              message: 'All is well',
              observedGeneration: 1,
              reason: 'AsExpected',
              status: 'True',
              type: 'AllNodesHealthy',
            },
          ],
          replicas: 1,
          version: '4.13.6',
        },
      },
    ],
    secretNames: ['feng-hyper-test34-ssh-key', 'feng-hyper-test34-pull-secret'],
    hostingNamespace: 'clusters',
    isUpgrading: false,
    upgradePercentage: '',
  },
}

const clusterImageSets: ClusterImageSet[] = [
  {
    apiVersion: 'hive.openshift.io/v1',
    kind: 'ClusterImageSet',
    metadata: {
      name: 'img4.13.8-multi-appsub',
    },
    spec: {
      releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.13.8-multi',
    },
  },
  {
    apiVersion: 'hive.openshift.io/v1',
    kind: 'ClusterImageSet',
    metadata: {
      name: 'img4.13.9-multi-appsub',
    },
    spec: {
      releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.13.9-multi',
    },
  },
  {
    apiVersion: 'hive.openshift.io/v1',
    kind: 'ClusterImageSet',
    metadata: {
      name: 'img4.13.10-multi-appsub',
    },
    spec: {
      releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.13.10-multi',
    },
  },
]
function rbacPatchManagedCluster() {
  return rbacPatch(ManagedClusterDefinition, undefined, mockCluster.name)
}

function rbacPatchClusterDeployment() {
  return rbacPatch(ClusterDeploymentDefinition, mockCluster.namespace, mockCluster.name)
}

function rbacDeleteManagedCluster() {
  return rbacDelete(ManagedClusterDefinition, undefined, mockCluster.name)
}

function rbacDeleteClusterDeployment() {
  return rbacDelete(ClusterDeploymentDefinition, mockCluster.namespace, mockCluster.name)
}

function rbacPatchClusterCurator() {
  return rbacPatch(ClusterCuratorDefinition, mockCluster.namespace)
}

function rbacCreateClusterCurator() {
  return rbacCreate(ClusterCuratorDefinition, mockCluster.namespace)
}

function rbacPatchSecret() {
  return rbacPatch(SecretDefinition, mockCluster.namespace)
}

function rbacCreateSecret() {
  return rbacCreate(SecretDefinition, mockCluster.namespace)
}

function rbacDeleteClusterCurator() {
  return rbacDelete(ClusterCuratorDefinition, mockCluster.namespace)
}

function rbacDeleteSecret() {
  return rbacDelete(SecretDefinition, mockCluster.namespace)
}

function nockPatchClusterDeployment(op: 'replace' | 'add' | 'remove', path: string, value?: string) {
  const patch: { op: 'replace' | 'add' | 'remove'; path: string; value?: string } = { op, path }
  if (value) {
    patch.value = value
  }
  return nockPatch(
    {
      apiVersion: ClusterDeploymentDefinition.apiVersion,
      kind: ClusterDeploymentDefinition.kind,
      metadata: {
        name: mockCluster.name,
        namespace: mockCluster.namespace,
      },
    },
    [patch]
  )
}

const Component = (props: { cluster: Cluster }) => (
  <RecoilRoot>
    <MemoryRouter initialEntries={[NavigationPath.clusterDetails]}>
      <ClusterActionDropdown cluster={props.cluster} isKebab={true} />
    </MemoryRouter>
  </RecoilRoot>
)

describe('ClusterActionDropdown', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('can import detached clusters', async () => {
    const mockDetachedCluster: Cluster = JSON.parse(JSON.stringify(mockCluster))
    mockDetachedCluster.status = ClusterStatus.detached
    const mockCreateManagedCluster: ManagedCluster = {
      apiVersion: ManagedClusterApiVersion,
      kind: ManagedClusterKind,
      metadata: {
        name: mockDetachedCluster.name!,
        labels: {
          cloud: 'auto-detect',
          vendor: 'auto-detect',
          name: mockDetachedCluster.name!,
        },
      },
      spec: { hubAcceptsClient: true },
    }
    const mockCreateKlusterletAddonConfig: KlusterletAddonConfig = {
      apiVersion: KlusterletAddonConfigApiVersion,
      kind: KlusterletAddonConfigKind,
      metadata: {
        name: mockDetachedCluster.name!,
        namespace: mockDetachedCluster.name!,
      },
      spec: {
        clusterName: mockDetachedCluster.name!,
        clusterNamespace: mockDetachedCluster.name!,
        clusterLabels: {
          cloud: 'auto-detect',
          vendor: 'auto-detect',
          name: mockDetachedCluster.name!,
        },
        applicationManager: { enabled: true },
        policyController: { enabled: true },
        searchCollector: { enabled: true },
        certPolicyController: { enabled: true },
      },
    }
    const createMcNock = nockCreate(mockCreateManagedCluster, mockCreateManagedCluster)
    const createKacNock = nockCreate(mockCreateKlusterletAddonConfig, mockCreateKlusterletAddonConfig)
    render(<Component cluster={mockDetachedCluster} />)

    await clickByLabel('Actions')
    await clickByText('Import cluster')
    await waitForText('Import clusters')
    await clickByText('Import')
    await waitForNocks([createMcNock, createKacNock])
  })

  test('hibernate action should patch cluster deployment', async () => {
    const nockPatch = nockPatchClusterDeployment('replace', '/spec/powerState', 'Hibernating')
    const cluster = JSON.parse(JSON.stringify(mockCluster))
    render(<Component cluster={cluster} />)
    await clickByLabel('Actions')
    await clickByText('Hibernate cluster')
    await clickByText('Hibernate')
    await waitForNock(nockPatch)
  })

  test('resume action should patch cluster deployment', async () => {
    const nockPatch = nockPatchClusterDeployment('replace', '/spec/powerState', 'Running')
    const cluster = JSON.parse(JSON.stringify(mockCluster))
    cluster.status = ClusterStatus.hibernating
    render(<Component cluster={cluster} />)
    await clickByLabel('Actions')
    await clickByText('Resume cluster')
    await clickByText('Resume')
    await waitForNock(nockPatch)
  })

  test('update automation template should not be shown for hosted cluster', async () => {
    const cluster = JSON.parse(JSON.stringify(mockCluster))
    cluster.isHostedCluster = true
    render(<Component cluster={cluster} />)
    await clickByLabel('Actions')
    await waitForText('Detach cluster')
    await waitForNotText('Update automation template')
  })
})

describe('ClusterActionDropdown', () => {
  test("disables menu items based on the user's permissions for ready cluster", async () => {
    const cluster = JSON.parse(JSON.stringify(mockCluster))
    render(<Component cluster={cluster} />)
    const rbacNocks: Scope[] = [
      nockRBAC(await rbacPatchManagedCluster()),
      nockRBAC(await rbacPatchClusterDeployment()), // hibernate
      nockRBAC(await rbacDeleteManagedCluster()), // destroy
      nockRBAC(await rbacDeleteClusterDeployment()),
      nockRBAC(await rbacDeleteManagedCluster()), //detach
      // update automation template
      nockRBAC(await rbacPatchClusterCurator()),
      nockRBAC(await rbacCreateClusterCurator()),
      nockRBAC(await rbacPatchSecret()),
      nockRBAC(await rbacCreateSecret()),
      //delete automation template
      nockRBAC(await rbacDeleteClusterCurator()),
      nockRBAC(await rbacDeleteSecret()),
    ]
    await clickByLabel('Actions')
    await waitForNocks(rbacNocks)
  })

  test("disables menu items based on the user's permissions for hibernating cluster", async () => {
    const cluster = JSON.parse(JSON.stringify(mockCluster))
    cluster.status = ClusterStatus.hibernating
    render(<Component cluster={cluster} />)
    const rbacNocks: Scope[] = [
      nockRBAC(await rbacPatchManagedCluster()),
      nockRBAC(await rbacPatchClusterDeployment()), // resume
      nockRBAC(await rbacDeleteManagedCluster()),
      nockRBAC(await rbacDeleteClusterDeployment()),
      //delete automation template
      nockRBAC(await rbacDeleteClusterCurator()),
      nockRBAC(await rbacDeleteSecret()),
    ]
    await clickByLabel('Actions')
    await waitForNocks(rbacNocks)
  })
})

describe('ClusterActionDropdown hostedcluster', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(clusterImageSetsState, clusterImageSets)
        }}
      >
        <MemoryRouter initialEntries={[NavigationPath.clusterDetails]}>
          <ClusterActionDropdown cluster={mockHostedCluster} isKebab={false} />
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForText('Actions', true)
  })
  test('render with hostedcluster', async () => {
    expect(screen.getByRole('button')).toBeTruthy()
    userEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Upgrade cluster')).toBeTruthy()
  })
})
