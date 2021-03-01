/* Copyright Contributors to the Open Cluster Management project */

import { Cluster, ClusterStatus } from '../../../../lib/get-cluster'
import { BatchUpgradeModal } from './BatchUpgradeModal'
import { render, waitFor } from '@testing-library/react'
import { nockUpgrade } from '../../../../lib/nock-util'
import userEvent from '@testing-library/user-event'
import { act } from 'react-dom/test-utils'
const mockClusterNoAvailable: Cluster = {
    name: 'cluster-0-no-available',
    namespace: 'cluster-0-no-available',
    status: ClusterStatus.ready,
    isHive: false,
    distribution: {
        ocp: {
            version: '1.2.3',
            availableUpdates: [],
            desiredVersion: '1.2.3',
            upgradeFailed: false,
        },
        k8sVersion: '1.19',
        displayVersion: 'Openshift 1.2.3',
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
            kubeadmin: '',
            kubeconfig: '',
        },
    },
    isManaged: true,
}
const mockClusterReady1: Cluster = {
    name: 'cluster-1-ready1',
    namespace: 'cluster-1-ready1',
    status: ClusterStatus.ready,
    isHive: false,
    distribution: {
        ocp: {
            version: '1.2.3',
            availableUpdates: ['1.2.4', '1.2.5', '1.2.6', '1.2.9', '1.2'],
            desiredVersion: '1.2.3',
            upgradeFailed: false,
        },
        k8sVersion: '1.19',
        displayVersion: 'Openshift 1.2.3',
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
            kubeadmin: '',
            kubeconfig: '',
        },
    },
    isManaged: true,
}
const mockClusterReady2: Cluster = {
    name: 'cluster-2-ready2',
    namespace: 'cluster-2-ready2',
    status: ClusterStatus.ready,
    isHive: false,
    distribution: {
        ocp: {
            version: '2.2.3',
            availableUpdates: ['2.2.4', '2.2.5', '2.2.6', '2.2'],
            desiredVersion: '2.2.3',
            upgradeFailed: false,
        },
        k8sVersion: '1.19',
        displayVersion: 'Openshift 2.2.3',
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
            kubeadmin: '',
            kubeconfig: '',
        },
    },
    isManaged: true,
}
const mockClusterOffline: Cluster = {
    name: 'cluster-3-offline',
    namespace: 'cluster-3-offline',
    status: ClusterStatus.offline,
    isHive: false,
    distribution: {
        ocp: {
            version: '1.2.3',
            availableUpdates: ['1.2.4', '1.2.5', '1.2.6', '1.2'],
            desiredVersion: '1.2.3',
            upgradeFailed: false,
        },
        k8sVersion: '1.19',
        displayVersion: 'Openshift 1.2.3',
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
            kubeadmin: '',
            kubeconfig: '',
        },
    },
    isManaged: true,
}
const mockClusterFailedUpgrade: Cluster = {
    name: 'cluster-4-failedupgrade',
    namespace: 'cluster-4-failedupgrade',
    status: ClusterStatus.ready,
    isHive: false,
    distribution: {
        ocp: {
            version: '1.2.3',
            availableUpdates: ['1.2.4', '1.2.5', '1.2.6', '1.2'],
            desiredVersion: '1.2.4',
            upgradeFailed: true,
        },
        k8sVersion: '1.19',
        displayVersion: 'Openshift 1.2.3',
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
            kubeadmin: '',
            kubeconfig: '',
        },
    },
    isManaged: true,
}
const allClusters: Array<Cluster> = [
    mockClusterNoAvailable,
    mockClusterReady1,
    mockClusterReady2,
    mockClusterOffline,
    mockClusterFailedUpgrade,
]

describe('BattchUpgradeModal', () => {
    it('should only show upgradeable ones, and select latest version as default', () => {
        const { queryByText } = render(<BatchUpgradeModal clusters={allClusters} open={true} close={() => {}} />)
        expect(queryByText('cluster-0-no-available')).toBeFalsy()
        expect(queryByText('cluster-1-ready1')).toBeTruthy()
        expect(queryByText('cluster-2-ready2')).toBeTruthy()
        expect(queryByText('cluster-3-offline')).toBeFalsy()
        expect(queryByText('cluster-4-failedupgrade')).toBeFalsy()
        // check if selecting latest version
        expect(queryByText('1.2.9')).toBeTruthy()
        expect(queryByText('1.2.6')).toBeFalsy()
        expect(queryByText('2.2.6')).toBeTruthy()
        expect(queryByText('2.2')).toBeFalsy()
    })
    it('should close modal when succeed', async () => {
        let isClosed = false
        const { getByText, queryByText } = render(
            <BatchUpgradeModal
                clusters={allClusters}
                open={true}
                close={() => {
                    isClosed = true
                }}
            />
        )
        const mockNockUpgrade1 = nockUpgrade('cluster-1-ready1', '1.2.9', 'ok', 200, 0)
        const mockNockUpgrade2 = nockUpgrade('cluster-2-ready2', '2.2.6', 'ok', 200, 0)
        expect(getByText('upgrade.submit')).toBeTruthy()
        userEvent.click(getByText('upgrade.submit'))
        await act(async () => {
            await waitFor(() => expect(mockNockUpgrade1.isDone()).toBeTruthy())
            await waitFor(() => expect(mockNockUpgrade2.isDone()).toBeTruthy())
            await waitFor(() => expect(queryByText('upgrade.submit.processing')).toBeFalsy())
            await waitFor(() => expect(isClosed).toBe(true))
        })

        expect(isClosed).toBe(true)
    })
    it('should show loading when click upgrade, and upgrade button should be disabled when loading', async () => {
        let isClosed = false
        const { getByText, queryByText } = render(
            <BatchUpgradeModal
                clusters={allClusters}
                open={true}
                close={() => {
                    isClosed = true
                }}
            />
        )
        const mockNockUpgrade1 = nockUpgrade('cluster-1-ready1', '1.2.9', 'ok', 200, 0)
        const mockNockUpgrade2 = nockUpgrade('cluster-2-ready2', '2.2.6', 'ok', 200, 500)
        expect(getByText('upgrade.submit')).toBeTruthy()
        userEvent.click(getByText('upgrade.submit'))
        await act(async () => {
            await waitFor(() => expect(queryByText('upgrade.submit.processing')).toBeTruthy())
            userEvent.click(getByText('upgrade.submit.processing')) // do additional click. make sure not calling upgrade again
            userEvent.click(getByText('upgrade.submit.processing'))
            await waitFor(() => expect(mockNockUpgrade1.isDone()).toBeTruthy())
            await waitFor(() => expect(mockNockUpgrade2.isDone()).toBeTruthy())
            await waitFor(() => expect(queryByText('upgrade.submit.processing')).toBeFalsy(), { timeout: 5000 })
            await waitFor(() => expect(isClosed).toBe(true))
        })
    })

    it('should close modal if click cancel', () => {
        let isClosed = false
        const { getByText } = render(
            <BatchUpgradeModal
                clusters={allClusters}
                open={true}
                close={() => {
                    isClosed = true
                }}
            />
        )
        userEvent.click(getByText('common:cancel'))
        expect(isClosed).toBe(true)
    })
    it('should show alert when failed; keep failed rows in table with error messages', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {})
        const { getByText, queryByText } = render(
            <BatchUpgradeModal clusters={allClusters} open={true} close={() => {}} />
        )
        const mockNockUpgrade1 = nockUpgrade('cluster-1-ready1', '1.2.9', 'ok', 200, 100)
        const mockNockUpgrade2 = nockUpgrade('cluster-2-ready2', '2.2.6', 'failed', 400, 100)
        expect(queryByText('cluster-1-ready1')).toBeTruthy()
        expect(queryByText('cluster-2-ready2')).toBeTruthy()
        expect(getByText('upgrade.submit')).toBeTruthy()
        userEvent.click(getByText('upgrade.submit'))
        await waitFor(() => expect(queryByText('upgrade.submit.processing')).toBeTruthy())
        await waitFor(() => expect(mockNockUpgrade1.isDone()).toBeTruthy())
        await waitFor(() => expect(mockNockUpgrade2.isDone()).toBeTruthy())
        await waitFor(() => expect(queryByText('upgrade.submit.processing')).toBeFalsy())
        await waitFor(() => expect(queryByText('common:there.was.an.error')).toBeTruthy())
        expect(queryByText('cluster-2-ready2')).toBeTruthy()
        expect(queryByText('common:error')).toBeTruthy()
        expect(queryByText('cluster-1-ready1')).toBeFalsy()
    })
})
