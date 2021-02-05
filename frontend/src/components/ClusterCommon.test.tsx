import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { nockUpgrade, nockcreateSelfSubjectAccesssRequest } from '../lib/nock-util'
import { DistributionInfo, ClusterStatus } from '../lib/get-cluster'
import { DistributionField, UpgradeModal } from './ClusterCommon'
import userEvent from '@testing-library/user-event'
import { ResourceAttributes } from '../resources/self-subject-access-review'
import * as nock from 'nock'

const mockDistributionInfo: DistributionInfo = {
    ocp: {
        version: '1.2.3',
        availableUpdates: ['1.2.4', '1.2.5', '1.2.6', '1.2'],
        desiredVersion: '1.2.3',
        upgradeFailed: false,
    },
    k8sVersion: '1.11',
    displayVersion: 'openshift',
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
        let nockAction: nock.Scope
        if (hasUpgrade) {
            nockAction = nockcreateSelfSubjectAccesssRequest(
                getClusterActionsResourceAttributes('clusterName'),
                allowUpgrade
            )
        }

        const retResource = render(
            <DistributionField clusterName="clusterName" data={data} clusterStatus={ClusterStatus.ready} />
        )
        if (hasUpgrade) {
            await waitFor(() => expect(nockAction.isDone()).toBeTruthy())
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
        const { getAllByText, queryAllByText } = await renderDistributionInfoField(mockDistributionInfo, true, true)
        await waitFor(() => expect(getAllByText('upgrade.available')).toBeTruthy())
        userEvent.click(getAllByText('upgrade.available')[0])
        expect(getAllByText('upgrade.title clusterName').length).toBeGreaterThan(0)
        expect(getAllByText('upgrade.cancel')).toBeTruthy()
        userEvent.click(getAllByText('upgrade.cancel')[0])
        expect(queryAllByText('upgrade.title clusterName').length).toBe(0)
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
})

describe('UpgradeModal', () => {
    it('should show all available versions in descending order', () => {
        const { getAllByRole, getByText } = render(
            <UpgradeModal close={() => {}} open={true} clusterName="clusterName" data={mockDistributionInfo} />
        )
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
                clusterName="clusterName"
                data={mockDistributionInfo}
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
                clusterName="clusterName"
                data={mockDistributionInfo}
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
        const { getAllByRole, getByText, queryByText } = render(
            <UpgradeModal
                close={() => {
                    isClosed = true
                }}
                open={true}
                clusterName="clusterName"
                data={mockDistributionInfo}
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
        await waitFor(() => expect(queryByText('upgrade.submit.processing')).toBeFalsy())

        // wait for modal to show alert
        expect(isClosed).toBe(false)
        expect(getByText('upgrade.upgradefailed')).toBeTruthy()
        expect(getByText('Request failed with status code 405')).toBeTruthy()
        await waitFor(() => expect(mockUpgrade.isDone()).toBeTruthy())
    })
})
