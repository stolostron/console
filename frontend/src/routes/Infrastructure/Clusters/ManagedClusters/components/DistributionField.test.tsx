/* Copyright Contributors to the Open Cluster Management project */

import {
    AnsibleJob,
    AnsibleJobApiVersion,
    AnsibleJobKind,
    Cluster,
    ClusterCurator,
    ClusterCuratorApiVersion,
    ClusterCuratorKind,
    ClusterStatus,
    CuratorCondition,
    DistributionInfo,
    ResourceAttributes,
} from '../../../../../resources'
import { render, waitFor } from '@testing-library/react'
import * as nock from 'nock'
import { RecoilRoot } from 'recoil'
import { ansibleJobState } from '../../../../../atoms'
import { nockRBAC } from '../../../../../lib/nock-util'
import { clickByText, waitForCalled, waitForNock, waitForNotText, waitForText } from '../../../../../lib/test-util'
import { DistributionField } from './DistributionField'

const mockDistributionInfo: DistributionInfo = {
    ocp: {
        version: '1.2.3',
        availableUpdates: ['1.2.4', '1.2.5', '1.2.6', '1.2'],
        desiredVersion: '1.2.3',
        upgradeFailed: false,
    },
    upgradeInfo: {
        upgradeFailed: false,
        isUpgrading: false,
        isReadyUpdates: true,
        isReadySelectChannels: false,
        availableUpdates: ['1.2.4', '1.2.5', '1.2.6', '1.2'],
        currentVersion: '1.2.3',
        latestJob: {},
    },
    k8sVersion: '1.11',
    displayVersion: 'openshift',
    isManagedOpenShift: false,
}
const mockDistributionInfoUpgrading: DistributionInfo = {
    ocp: {
        version: '1.2.3',
        availableUpdates: ['1.2.4', '1.2.5'],
        desiredVersion: '1.2.4',
        upgradeFailed: false,
    },
    upgradeInfo: {
        upgradeFailed: false,
        isUpgrading: true,
        isReadyUpdates: false,
        isReadySelectChannels: false,
        availableUpdates: ['1.2.4', '1.2.5'],
        currentVersion: '1.2.3',
        desiredVersion: '1.2.4',
        latestJob: {},
    },
    k8sVersion: '1.11',
    displayVersion: 'openshift',
    isManagedOpenShift: false,
}
const mockDistributionInfoWithoutUpgrades: DistributionInfo = {
    ocp: {
        version: '1.2.3',
        availableUpdates: [],
        desiredVersion: '1.2.3',
        upgradeFailed: false,
    },
    upgradeInfo: {
        upgradeFailed: false,
        isUpgrading: false,
        isReadyUpdates: false,
        isReadySelectChannels: false,
        availableUpdates: [],
        currentVersion: '1.2.3',
        latestJob: {},
    },
    k8sVersion: '1.11',
    displayVersion: 'openshift',
    isManagedOpenShift: false,
}
const mockDistributionInfoFailedUpgrade: DistributionInfo = {
    ocp: {
        version: '1.2.3',
        availableUpdates: ['1.2.4', '1.2.6', '1.2.5'],
        desiredVersion: '1.2.4',
        upgradeFailed: true,
    },
    upgradeInfo: {
        upgradeFailed: true,
        isUpgrading: false,
        isReadyUpdates: false,
        isReadySelectChannels: false,
        availableUpdates: ['1.2.4', '1.2.6', '1.2.5'],
        currentVersion: '1.2.3',
        latestJob: {},
    },
    k8sVersion: '1.11',
    displayVersion: 'openshift',
    isManagedOpenShift: false,
}
const mockDistributionInfoFailedInstall: DistributionInfo = {
    ocp: {
        version: '1.2.3',
        availableUpdates: ['1.2.4', '1.2.5'],
        desiredVersion: '1.2.3',
        upgradeFailed: true,
    },
    upgradeInfo: {
        upgradeFailed: false,
        isUpgrading: false,
        isReadyUpdates: true,
        isReadySelectChannels: false,
        availableUpdates: ['1.2.4', '1.2.6', '1.2.5'],
        currentVersion: '1.2.3',
        latestJob: {},
    },
    k8sVersion: '1.11',
    displayVersion: 'openshift',
    isManagedOpenShift: false,
}
const mockManagedOpenShiftDistributionInfo: DistributionInfo = {
    ocp: {
        version: '1.2.3',
        availableUpdates: ['1.2.4', '1.2.5', '1.2.6', '1.2'],
        desiredVersion: '1.2.3',
        upgradeFailed: false,
    },
    upgradeInfo: {
        upgradeFailed: false,
        isUpgrading: false,
        isReadyUpdates: false,
        isReadySelectChannels: false,
        availableUpdates: ['1.2.4', '1.2.6', '1.2.5'],
        currentVersion: '1.2.3',
        latestJob: {},
    },
    k8sVersion: '1.11',
    displayVersion: 'openshift',
    isManagedOpenShift: true,
}
const mockManagedAnsibleDistributionInfo: DistributionInfo = {
    ocp: {
        version: '1.2.3',
        availableUpdates: ['1.2.4', '1.2.5', '1.2.6', '1.2'],
        desiredVersion: '1.2.3',
        upgradeFailed: false,
    },
    upgradeInfo: {
        upgradeFailed: false,
        isUpgrading: false,
        isReadyUpdates: false,
        availableUpdates: ['1.2.4', '1.2.6', '1.2.5'],
        currentVersion: '1.2.3',
        isUpgradeCuration: true,
        isReadySelectChannels: false,
        hooksInProgress: true,
        hookFailed: false,
        latestJob: {
            conditionMessage: '',
            step: CuratorCondition.upgrade,
        },
        prehooks: {
            failed: false,
            hasHooks: true,
            inProgress: false,
            success: false,
        },
    },
    k8sVersion: '1.11',
    displayVersion: 'openshift',
    isManagedOpenShift: true,
}

const mockManagedAnsibleFailedDistributionInfo: DistributionInfo = {
    ocp: {
        version: '1.2.3',
        availableUpdates: ['1.2.4', '1.2.5', '1.2.6', '1.2'],
        desiredVersion: '1.2.3',
        upgradeFailed: false,
    },
    upgradeInfo: {
        upgradeFailed: false,
        isUpgrading: false,
        isReadyUpdates: false,
        isReadySelectChannels: false,
        availableUpdates: ['1.2.4', '1.2.6', '1.2.5'],
        currentVersion: '1.2.3',
        isUpgradeCuration: true,
        hooksInProgress: false,
        hookFailed: true,
        latestJob: {
            conditionMessage: '',
            step: CuratorCondition.upgrade,
        },
        prehooks: {
            failed: true,
            hasHooks: true,
            inProgress: false,
            success: false,
        },
    },
    k8sVersion: '1.11',
    displayVersion: 'openshift',
    isManagedOpenShift: true,
}

const clusterCuratorUpgrade: ClusterCurator = {
    apiVersion: ClusterCuratorApiVersion,
    kind: ClusterCuratorKind,
    metadata: {
        name: 'test-curator1',
        namespace: 'default',
    },
    spec: {
        desiredCuration: 'upgrade',
        upgrade: {
            towerAuthSecret: 'ansible-credential-i',
            prehook: [
                {
                    name: 'test-job-i',
                },
            ],
        },
    },
    status: {
        conditions: [
            {
                lastTransitionTime: new Date('2021-01-04T18:23:30Z'),
                message:
                    'curator-job-5snl7 DesiredCuration: upgrade - AnsibleJob rbrunopi-ana-test-004/prehookjob-qqxgr',
                reason: 'Job_has_finished',
                status: 'False',
                type: 'prehook-ansiblejob',
            },
            {
                lastTransitionTime: new Date('2021-01-04T18:23:37Z'),
                message: 'Invalid GCP project ID',
                reason: 'GCPInvalidProjectID',
                status: 'True',
                type: 'ClusterProvisionFailed',
            },
        ],
    },
}

const clusterCuratorUpgradeFailed: ClusterCurator = {
    apiVersion: ClusterCuratorApiVersion,
    kind: ClusterCuratorKind,
    metadata: {
        name: 'test-curator1',
        namespace: 'default',
    },
    spec: {
        desiredCuration: 'upgrade',
        upgrade: {
            towerAuthSecret: 'ansible-credential-i',
            prehook: [
                {
                    name: 'test-job-i',
                },
            ],
        },
    },
    status: {
        conditions: [
            {
                lastTransitionTime: new Date('2021-06-28T19:23:23Z'),
                message:
                    'curator-job-5snl7 DesiredCuration: upgrade Failed - AnsibleJob rbrunopi-ana-test-004/prehookjob-qqxgr',
                reason: 'Job_failed',
                status: 'True',
                type: 'clustercurator-job',
            },
            {
                lastTransitionTime: new Date('2021-06-28T19:23:23Z'),
                message: 'AnsibleJob rbrunopi-ana-test-004/prehookjob-qqxgr exited with an error',
                reason: 'Job_has_finished',
                status: 'False',
                type: 'prehook-ansiblejob',
            },
        ],
    },
}

const ansibleJob: AnsibleJob = {
    apiVersion: AnsibleJobApiVersion,
    kind: AnsibleJobKind,
    metadata: {
        name: 'ansible-job',
        namespace: 'clusterName',
        annotations: {
            jobtype: 'prehook',
        },
    },
    status: {
        ansibleJobResult: {
            changed: true,
            failed: false,
            status: 'pending',
            url: '/ansible/url',
            finished: '2021-06-08T16:43:09.023018Z',
            started: '2021-06-08T16:43:01.853019Z',
        },
    },
}

function getClusterCuratoResourceAttributes(name: string, verb: string) {
    return {
        resource: 'clustercurators',
        verb: verb,
        group: 'cluster.open-cluster-management.io',
        namespace: name,
    } as ResourceAttributes
}

describe('DistributionField', () => {
    const renderDistributionInfoField = async (
        data: DistributionInfo,
        allowUpgrade: boolean,
        hasUpgrade = false,
        clusterCurator?: ClusterCurator
    ) => {
        let nockAction: nock.Scope | undefined = undefined
        let nockAction2: nock.Scope | undefined = undefined
        if (hasUpgrade) {
            nockAction = nockRBAC(getClusterCuratoResourceAttributes('clusterName', 'patch'), allowUpgrade)
            nockAction2 = nockRBAC(getClusterCuratoResourceAttributes('clusterName', 'create'), allowUpgrade)
        }

        const mockCluster: Cluster = {
            name: 'clusterName',
            displayName: 'clusterName',
            namespace: 'clusterName',
            provider: undefined,
            status: ClusterStatus.ready,
            distribution: data,
            labels: { abc: '123' },
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
            isHive: false,
            isManaged: true,
            isCurator: true,
            isHostedCluster: false,
            isSNOCluster: false,
            owner: {},
            kubeadmin: '',
            kubeconfig: '',
            isHypershift: false,
        }

        const retResource = render(
            <RecoilRoot initializeState={(snapshot) => snapshot.set(ansibleJobState, [ansibleJob])}>
                <DistributionField cluster={mockCluster} clusterCurator={clusterCurator} />
            </RecoilRoot>
        )
        if (nockAction) {
            await waitForNock(nockAction)
        }
        if (nockAction2) {
            await waitForNock(nockAction2)
        }
        return retResource
    }

    it('should not show upgrade button when no available upgrades', async () => {
        const { queryAllByText } = await renderDistributionInfoField(mockDistributionInfoWithoutUpgrades, true)
        expect(queryAllByText('Upgrade available').length).toBe(0)
    })

    it('should disable the upgrade button when the user lacks permissions', async () => {
        const { queryByText } = await renderDistributionInfoField(mockDistributionInfo, false, true)
        expect(queryByText('Upgrade available')).toHaveAttribute('aria-disabled', 'true')
    })

    it('should show upgrade button when not upgrading and has available upgrades, and should show modal when click', async () => {
        await renderDistributionInfoField(mockDistributionInfo, true, true)
        await clickByText('Upgrade available', 0)
        await waitForText('Name')
        await clickByText('Cancel', 0)
        await waitForNotText('Name')
    })

    it('should show upgrading with loader when upgrading', async () => {
        const { getAllByText, queryByRole } = await renderDistributionInfoField(mockDistributionInfoUpgrading, true)
        expect(getAllByText('Upgrading to 1.2.4')).toBeTruthy()
        expect(queryByRole('progressbar')).toBeTruthy()
    })

    it('should show failed when failed upgrade', async () => {
        const { getAllByText } = await renderDistributionInfoField(mockDistributionInfoFailedUpgrade, true)
        expect(getAllByText('Upgrade failing')).toBeTruthy()
    })

    it('should not show failed when there is no upgrade running', async () => {
        const { queryAllByText, getAllByText } = await renderDistributionInfoField(
            mockDistributionInfoFailedInstall,
            true,
            true
        )
        await waitFor(() => expect(getAllByText('Upgrade available')).toBeTruthy())
        expect(queryAllByText('Upgrade failing').length).toBe(0)
    })

    it('should not show upgrade button for managed OpenShift', async () => {
        const { queryAllByText } = await renderDistributionInfoField(mockManagedOpenShiftDistributionInfo, true)
        expect(queryAllByText('Upgrade available').length).toBe(0)
    })

    it('should display ansible hook status', async () => {
        await renderDistributionInfoField(mockManagedAnsibleDistributionInfo, false, false, clusterCuratorUpgrade)
        await waitForText('Upgrade prehook')
    })

    it('should display ansible failed hook status', async () => {
        await renderDistributionInfoField(
            mockManagedAnsibleFailedDistributionInfo,
            false,
            false,
            clusterCuratorUpgradeFailed
        )
        await waitForText('Upgrade prehook')
        await clickByText('Upgrade prehook')
        await waitForText('Upgrade prehook jobs have failed:')
    })

    it('should open to ansible logs', async () => {
        await renderDistributionInfoField(mockManagedAnsibleDistributionInfo, false, false, clusterCuratorUpgrade)
        window.open = jest.fn()
        await waitForText('Upgrade prehook')
        await clickByText('Upgrade prehook')
        await clickByText('View logs')
        await waitForCalled(window.open as jest.Mock)
    })
})
