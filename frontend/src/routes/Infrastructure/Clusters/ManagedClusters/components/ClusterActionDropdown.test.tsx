/* Copyright Contributors to the Open Cluster Management project */

import {
  Cluster,
  ClusterCuratorDefinition,
  ClusterDeploymentDefinition,
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
import { render } from '@testing-library/react'
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
        applicationManager: { enabled: true, argocdCluster: false },
        policyController: { enabled: true },
        searchCollector: { enabled: true },
        certPolicyController: { enabled: true },
        iamPolicyController: { enabled: true },
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
    ]
    await clickByLabel('Actions')
    await waitForNocks(rbacNocks)
  })
})
