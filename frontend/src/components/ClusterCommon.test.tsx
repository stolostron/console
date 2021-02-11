import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { nockUpgrade, nockCreateSelfSubjectAccessReview } from '../lib/nock-util'
import { Cluster, DistributionInfo, ClusterStatus } from '../lib/get-cluster'
import { DistributionField, UpgradeModal } from './ClusterCommon'
import userEvent from '@testing-library/user-event'
import { ResourceAttributes } from '../resources/self-subject-access-review'
import * as nock from 'nock'
import { clickByText, waitForNock, waitForNotText, waitForText } from '../lib/test-util'

const mockDistributionInfo: DistributionInfo = {
    ocp: {
        version: '1.2.3',
        availableUpdates: ['1.2.4', '1.2.5', '1.2.6', '1.2'],
        desiredVersion: '1.2.3',
        upgradeFailed: false,
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
    k8sVersion: '1.11',
    displayVersion: 'openshift',
    isManagedOpenShift: true,
}

function getClusterActionsResourceAttributes(name: string) {
    return {
        resource: 'managedclusteractions',
        verb: 'create',
        group: 'action.open-cluster-management.io',
        namespace: name,
    } as ResourceAttributes
}

describe('DistributionField', () => {
    const renderDistributionInfoField = async (
        data: DistributionInfo,
        allowUpgrade: boolean,
        hasUpgrade: boolean = false
    ) => {
        let nockAction: nock.Scope | undefined = undefined
        if (hasUpgrade) {
            nockAction = nockCreateSelfSubjectAccessReview(
                getClusterActionsResourceAttributes('clusterName'),
                allowUpgrade
            )
        }

        const mockCluster: Cluster = {
            name: 'clusterName',
            namespace: 'clusterName',
            provider: undefined,
            status: ClusterStatus.ready,
            distribution: data,
            labels: { abc: '123' },
            nodes: undefined,
            kubeApiServer: '',
            consoleURL: '',
            hiveSecrets: undefined,
            isHive: false,
            isManaged: true,
        }

        const retResource = render(<DistributionField cluster={mockCluster} />)
        if (nockAction) {
            await waitForNock(nockAction)
        }
        return retResource
    }

    it('should not show upgrade button when no available upgrades', async () => {
        const { queryAllByText } = await renderDistributionInfoField(mockDistributionInfoWithoutUpgrades, true)
        expect(queryAllByText('upgrade.available').length).toBe(0)
    })

    it('should disable the upgrade button when the user lacks permissions', async () => {
        const { queryByText } = await renderDistributionInfoField(mockDistributionInfo, false, true)
        expect(queryByText('upgrade.available')).toHaveAttribute('aria-disabled', 'true')
    })

    it('should show upgrade button when not upgrading and has available upgrades, and should show modal when click', async () => {
        await renderDistributionInfoField(mockDistributionInfo, true, true)
        await clickByText('upgrade.available', 0)
        await waitForText('upgrade.title')
        await clickByText('upgrade.cancel', 0)
        await waitForNotText('upgrade.title')
    })

    it('should show upgrading with loader when upgrading', async () => {
        const { getAllByText, queryByRole } = await renderDistributionInfoField(mockDistributionInfoUpgrading, true)
        expect(getAllByText('upgrade.upgrading.version')).toBeTruthy()
        expect(queryByRole('progressbar')).toBeTruthy()
    })

    it('should show failed when failed upgrade', async () => {
        const { getAllByText } = await renderDistributionInfoField(mockDistributionInfoFailedUpgrade, true)
        expect(getAllByText('upgrade.upgradefailed')).toBeTruthy()
    })

    it('should not show failed when there is no upgrade running', async () => {
        const { queryAllByText, getAllByText } = await renderDistributionInfoField(
            mockDistributionInfoFailedInstall,
            true,
            true
        )
        await waitFor(() => expect(getAllByText('upgrade.available')).toBeTruthy())
        expect(queryAllByText('upgrade.upgradefailed').length).toBe(0)
    })

    it('should not show upgrade button for managed OpenShift', async () => {
        const { queryAllByText } = await renderDistributionInfoField(mockManagedOpenShiftDistributionInfo, true)
        expect(queryAllByText('upgrade.available').length).toBe(0)
    })
})

describe('UpgradeModal', () => {
    const mockCluster: Cluster = {
        name: 'clusterName',
        namespace: 'clusterName',
        provider: undefined,
        status: ClusterStatus.ready,
        distribution: mockDistributionInfo,
        labels: { abc: '123' },
        nodes: undefined,
        kubeApiServer: '',
        consoleURL: '',
        hiveSecrets: undefined,
        isHive: false,
        isManaged: true,
    }

    it('should show all available versions in descending order', () => {
        const { getAllByRole, getByText } = render(<UpgradeModal close={() => {}} open={true} cluster={mockCluster} />)
        const button = getByText('upgrade.select.placeholder')
        expect(button).toBeTruthy()
        if (button) {
            userEvent.click(button)
            expect(
                getAllByRole('option').map((elem) => {
                    return elem.textContent
                })
            ).toStrictEqual(['1.2.6', '1.2.5', '1.2.4', '1.2'])
        }
    })

    it('should close when click cancel', () => {
        let isClosed = false
        const { getByText } = render(
            <UpgradeModal
                close={() => {
                    isClosed = true
                }}
                open={true}
                cluster={mockCluster}
            />
        )

        // click cancel
        isClosed = false
        expect(getByText('upgrade.cancel')).toBeTruthy()
        const buttonCancel = getByText('upgrade.cancel')
        if (buttonCancel) {
            userEvent.click(buttonCancel)
            expect(isClosed).toBeTruthy()
        }
    })

    it('should do upgrade request when click submit and show loading', async () => {
        const mockUpgrade = nockUpgrade('clusterName', '1.2.6', 'ok', 200, 500)
        let isClosed = false
        const { getAllByRole, getByText, queryByText } = render(
            <UpgradeModal
                close={() => {
                    isClosed = true
                }}
                open={true}
                cluster={mockCluster}
            />
        )
        const button = getByText('upgrade.select.placeholder')
        expect(button).toBeTruthy()
        userEvent.click(button)
        // select a version
        expect(getAllByRole('option').length).toBeGreaterThan(0)
        const versionButton = getAllByRole('option')[0]
        expect(versionButton).toBeTruthy()
        userEvent.click(versionButton)
        // click submit and wait for loader to show
        const submitButton = getByText('upgrade.submit')
        expect(submitButton).toBeTruthy()
        userEvent.click(submitButton)
        await waitFor(() => expect(queryByText('upgrade.submit.processing')).toBeTruthy())
        // wait for modal to be closed
        await waitFor(() => expect(isClosed).toBeTruthy())
        await waitFor(() => expect(mockUpgrade.isDone()).toBeTruthy())
    })

    it('should show error message when failed upgrading', async () => {
        const mockUpgrade = nockUpgrade('clusterName', '1.2.6', '', 405, 100)
        let isClosed = false
        const { getAllByRole, getByText } = render(
            <UpgradeModal
                close={() => {
                    isClosed = true
                }}
                open={true}
                cluster={mockCluster}
            />
        )
        const button = getByText('upgrade.select.placeholder')
        expect(button).toBeTruthy()
        userEvent.click(button)
        // select a version
        expect(getAllByRole('option').length).toBeGreaterThan(0)
        const versionButton = getAllByRole('option')[0]
        expect(versionButton).toBeTruthy()
        userEvent.click(versionButton)
        // click submit and wait for loader to show
        const submitButton = getByText('upgrade.submit')
        expect(submitButton).toBeTruthy()
        userEvent.click(submitButton)
        await waitForText('upgrade.submit.processing')
        await waitForNotText('upgrade.submit.processing')

        // wait for modal to show alert
        expect(isClosed).toBe(false)
        expect(getByText('upgrade.upgradefailed')).toBeTruthy()
        expect(getByText('Request failed with status code 405')).toBeTruthy()
        await waitForNock(mockUpgrade)
    })
})
