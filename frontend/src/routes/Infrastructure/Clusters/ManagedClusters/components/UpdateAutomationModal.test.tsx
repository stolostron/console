/* Copyright Contributors to the Open Cluster Management project */

import {
    Cluster,
    ClusterCurator,
    ClusterCuratorApiVersion,
    ClusterCuratorDefinition,
    ClusterCuratorKind,
    ClusterStatus,
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
    Secret,
} from '../../../../../resources'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UpdateAutomationModal } from './UpdateAutomationModal'
import { RecoilRoot } from 'recoil'
import { MemoryRouter } from 'react-router-dom'
import { clusterCuratorsState, secretsState } from '../../../../../atoms'
import { nockIgnoreRBAC, /*nockCreate,*/ nockPatch } from '../../../../../lib/nock-util'
import { clickByText, waitForNocks, waitForNotText, waitForText } from '../../../../../lib/test-util'

const mockClusterNoAvailable: Cluster = {
    name: 'cluster-0-no-available',
    displayName: 'cluster-0-no-available',
    namespace: 'cluster-0-no-available',
    uid: 'cluster-0-no-available-uid',
    status: ClusterStatus.ready,
    isHive: false,
    distribution: {
        k8sVersion: '1.19',
        displayVersion: 'Openshift 1.2.3',
        isManagedOpenShift: false,
        upgradeInfo: {
            upgradeFailed: false,
            isUpgrading: false,
            isReadyUpdates: false,
            isReadySelectChannels: false,
            availableUpdates: [],
            currentVersion: '1.2.3',
            desiredVersion: '1.2.3',
            latestJob: {},
        },
    },
    labels: undefined,
    nodes: undefined,
    kubeApiServer: '',
    consoleURL: '',
    hive: {
        isHibernatable: true,
        clusterPool: undefined,
        secrets: {
            installConfig: '',
        },
    },
    isManaged: true,
    isCurator: false,
    isHostedCluster: false,
    isSNOCluster: false,
    owner: {},
    kubeadmin: '',
    kubeconfig: '',
    isHypershift: false,
}

const mockClusterReady1: Cluster = {
    name: 'cluster-1-ready',
    displayName: 'cluster-1-ready',
    namespace: 'cluster-1-ready',
    uid: 'cluster-1-ready-uid',
    status: ClusterStatus.ready,
    isHive: false,
    distribution: {
        k8sVersion: '1.19',
        ocp: {
            availableUpdates: [],
            desiredVersion: '',
            upgradeFailed: false,
            version: '1.2.3',
        },
        displayVersion: 'Openshift 1.2.3',
        isManagedOpenShift: false,
        upgradeInfo: {
            upgradeFailed: false,
            isUpgrading: false,
            isReadyUpdates: true,
            isReadySelectChannels: false,
            availableUpdates: ['1.2.4', '1.2.5', '1.2.6', '1.2.9', '1.2'],
            currentVersion: '1.2.3',
            desiredVersion: '1.2.3',
            latestJob: {},
        },
    },
    labels: undefined,
    nodes: undefined,
    kubeApiServer: '',
    consoleURL: '',
    hive: {
        isHibernatable: true,
        clusterPool: undefined,
        secrets: {
            installConfig: '',
        },
    },
    isManaged: true,
    isCurator: false,
    isHostedCluster: false,
    isSNOCluster: false,
    owner: {},
    kubeadmin: '',
    kubeconfig: '',
    isHypershift: false,
}

const mockClusterNonOCP: Cluster = {
    name: 'cluster-2-NonOCP',
    displayName: 'cluster-2-NonOCP',
    namespace: 'cluster-2-NonOCP',
    uid: 'cluster-2-NonOCP-uid',
    status: ClusterStatus.ready,
    isHive: false,
    distribution: {
        k8sVersion: '1.19',
        ocp: undefined,
        displayVersion: 'Openshift 1.2.3',
        isManagedOpenShift: false,
        upgradeInfo: {
            upgradeFailed: false,
            isUpgrading: false,
            isReadyUpdates: true,
            isReadySelectChannels: false,
            availableUpdates: ['1.2.4', '1.2.5', '1.2.6', '1.2.9', '1.2'],
            currentVersion: '1.2.3',
            desiredVersion: '1.2.3',
            latestJob: {},
        },
    },
    labels: undefined,
    nodes: undefined,
    kubeApiServer: '',
    consoleURL: '',
    hive: {
        isHibernatable: true,
        clusterPool: undefined,
        secrets: {
            installConfig: '',
        },
    },
    isManaged: true,
    isCurator: false,
    isHostedCluster: false,
    isSNOCluster: false,
    owner: {},
    kubeadmin: '',
    kubeconfig: '',
    isHypershift: false,
}

const mockClusterPending: Cluster = {
    name: 'cluster-3-pending',
    displayName: 'cluster-3-pending',
    namespace: 'cluster-3-pending',
    uid: 'cluster-3-pending-uid',
    status: ClusterStatus.pending,
    isHive: false,
    distribution: {
        k8sVersion: '1.19',
        displayVersion: 'Openshift 1.2.3',
        isManagedOpenShift: false,
        upgradeInfo: {
            upgradeFailed: false,
            isUpgrading: false,
            isReadyUpdates: true,
            isReadySelectChannels: false,
            availableUpdates: ['1.2.4', '1.2.5', '1.2.6', '1.2'],
            currentVersion: '1.2.3',
            desiredVersion: '1.2.3',
            latestJob: {},
        },
    },
    labels: undefined,
    nodes: undefined,
    kubeApiServer: '',
    consoleURL: '',
    hive: {
        isHibernatable: true,
        clusterPool: undefined,
        secrets: {
            installConfig: '',
        },
    },
    isManaged: true,
    isCurator: false,
    isHostedCluster: false,
    isSNOCluster: false,
    owner: {},
    kubeadmin: '',
    kubeconfig: '',
    isHypershift: false,
}

const providerConnectionAnsible: ProviderConnection = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    metadata: {
        name: 'ansible-connection',
        namespace: 'test-ii',
        labels: {
            'cluster.open-cluster-management.io/type': 'ans',
        },
    },
    stringData: {
        host: 'test',
        token: 'test',
    },
    type: 'Opaque',
}

const clusterCurator: ClusterCurator = {
    apiVersion: ClusterCuratorApiVersion,
    kind: ClusterCuratorKind,
    metadata: {
        name: 'test-curator',
        namespace: 'test-ii',
        labels: {
            'open-cluster-management': 'curator',
        },
        uid: 'clusterCurator-uid',
    },
    spec: {
        desiredCuration: undefined,
        install: {
            prehook: [
                {
                    name: 'test-prehook-install',
                    extra_vars: {},
                },
            ],
            towerAuthSecret: 'ansible-connection',
        },
    },
}

const mockSecret = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    metadata: {
        namespace: 'cluster-1-ready',
        name: 'toweraccess-install',
    },
}

const secretPatch = {
    metadata: {
        labels: {
            'cluster.open-cluster-management.io/type': 'ans',
            'cluster.open-cluster-management.io/copiedFromSecretName': providerConnectionAnsible.metadata.name!,
            'cluster.open-cluster-management.io/copiedFromNamespace': providerConnectionAnsible.metadata.namespace!,
            'cluster.open-cluster-management.io/backup': 'cluster',
        },
    },
    stringData: providerConnectionAnsible.stringData,
}

const clusterCuratorReady1 = {
    apiVersion: ClusterCuratorDefinition.apiVersion,
    kind: ClusterCuratorDefinition.kind,
    metadata: {
        name: 'cluster-1-ready',
        namespace: 'cluster-1-ready',
    },
}

const clusterCuratorPatch = {
    spec: {
        install: {
            prehook: [
                {
                    name: 'test-prehook-install',
                    extra_vars: {},
                },
            ],
            towerAuthSecret: mockSecret.metadata.name,
        },
    },
}

// TODO - const mockCreate

const mockClusters: Array<Cluster> = [mockClusterNoAvailable, mockClusterReady1, mockClusterNonOCP, mockClusterPending]

describe('UpdateAutomationModal', () => {
    beforeEach(() => {
        window.sessionStorage.clear()
        nockIgnoreRBAC()
    })

    const Component = () => {
        return (
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(clusterCuratorsState, [clusterCurator])
                    snapshot.set(secretsState, [providerConnectionAnsible as Secret])
                }}
            >
                <MemoryRouter>
                    <UpdateAutomationModal clusters={mockClusters} open={true} close={() => {}} />
                </MemoryRouter>
            </RecoilRoot>
        )
    }

    test('should render update automation modal with alert', async () => {
        render(<Component />)

        // Show alert with automation support message
        await waitForText('3 cluster cannot be edited') /* TODO - Pluralize not working - robdolares to fix*/
        await waitFor(() =>
            expect(screen.getByTestId('view-selected').getAttribute('aria-disabled')).not.toEqual('false')
        )
        await waitFor(() => expect(screen.getByTestId('confirm').getAttribute('aria-disabled')).not.toEqual('false'))

        await waitForText('Select a template', false)
        await clickByText('Select a template', 0)
        await waitForText(clusterCurator.metadata.name!)
        await clickByText(clusterCurator.metadata.name!)
        await waitFor(() =>
            expect(screen.getByTestId('view-selected').getAttribute('aria-disabled')).not.toEqual('true')
        )
        await waitFor(() => expect(screen.getByTestId('confirm').getAttribute('aria-disabled')).not.toEqual('true'))
    })

    test('should only show updatable clusters', async () => {
        render(<Component />)
        await waitForNotText('cluster-0-no-available')
        await waitForText('cluster-1-ready')
        await waitForNotText('cluster-2-NonOCP')
        await waitForNotText('cluster-3-pending')
    })

    test('should select curator and patch', async () => {
        const mockSecretUpdate = nockPatch(mockSecret, secretPatch)
        const mockCuratorUpdate = nockPatch(clusterCuratorReady1, clusterCuratorPatch)
        render(<Component />)
        // select dropdown
        await waitForText('Select a template', false)
        await clickByText('Select a template', 0)
        await waitForText(clusterCurator.metadata.name!)
        await clickByText(clusterCurator.metadata.name!)

        const submitButton = screen.getByText('Save')
        expect(submitButton).toBeTruthy()
        userEvent.click(submitButton)

        await waitForNocks([mockCuratorUpdate, mockSecretUpdate])
    })
})
