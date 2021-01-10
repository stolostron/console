import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { nockUpgrade } from '../lib/nock-util'
import { DistributionInfo } from '../lib/get-cluster'
import { DistributionField, UpgradeModal } from './ClusterCommon'
import userEvent from '@testing-library/user-event'

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

describe('DistributionField', () => {
    it('should not show upgrade button when no available upgrades', () => {
        const { queryAllByText } = render(
            <DistributionField clusterName="clusterName" data={mockDistributionInfoWithoutUpgrades} />
        )
        expect(queryAllByText('upgrade.available').length).toBe(0)
    })
    it('should show upgrade button when not upgrading and has available upgrades, and should show modal when click', () => {
        const { getAllByText, queryAllByText } = render(
            <DistributionField clusterName="clusterName" data={mockDistributionInfo} />
        )
        expect(getAllByText('upgrade.available')).toBeTruthy()
        userEvent.click(getAllByText('upgrade.available')[0])
        expect(getAllByText('upgrade.title clusterName').length).toBeGreaterThan(0)
        expect(getAllByText('cancel')).toBeTruthy()
        userEvent.click(getAllByText('cancel')[0])
        expect(queryAllByText('upgrade.title clusterName').length).toBe(0)
    })
    it('should show upgrading with loader when upgrading', () => {
        const { getAllByText, queryByRole } = render(
            <DistributionField clusterName="cluster" data={mockDistributionInfoUpgrading} />
        )
        expect(getAllByText('upgrade.upgrading ' + mockDistributionInfoUpgrading.ocp?.desiredVersion)).toBeTruthy()
        expect(queryByRole('progressbar')).toBeTruthy()
    })

    it('should show failed when failed upgrade', () => {
        const { getAllByText } = render(
            <DistributionField clusterName="clusterName" data={mockDistributionInfoFailedUpgrade} />
        )
        expect(getAllByText('upgrade.upgradefailed')).toBeTruthy()
    })
    it('should not show failed when there is no upgrade running', () => {
        const { queryAllByText, getAllByText } = render(
            <DistributionField clusterName="clusterName" data={mockDistributionInfoFailedInstall} />
        )
        expect(queryAllByText('upgrade.upgradefailed').length).toBe(0)
        expect(getAllByText('upgrade.available')).toBeTruthy()
    })
})

describe('UpgradeModal', () => {
    it('should show all available versions in descending order', () => {
        const { getAllByRole, getByTestId } = render(
            <UpgradeModal close={() => {}} open={true} clusterName="clusterName" data={mockDistributionInfo} />
        )
        const button = getByTestId('pf-select-toggle-id-3')
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
        expect(getByText('cancel')).toBeTruthy()
        const buttonCancel = getByText('cancel')
        if (buttonCancel) {
            userEvent.click(buttonCancel)
            expect(isClosed).toBeTruthy()
        }
    })
    it('should do upgrade request when click submit and show loading', async () => {
        nockUpgrade('clusterName', '1.2.6', 'ok', 200, 500)
        let isClosed = false
        const { getAllByRole, getByTestId, getByText, queryByText } = render(
            <UpgradeModal
                close={() => {
                    isClosed = true
                }}
                open={true}
                clusterName="clusterName"
                data={mockDistributionInfo}
            />
        )
        const button = getByTestId('pf-select-toggle-id-10')
        expect(button).toBeTruthy()
        userEvent.click(button)
        // select a version
        expect(getAllByRole('option').length).toBeGreaterThan(0)
        const versionButton = getAllByRole('option')[0]
        expect(versionButton).toBeTruthy()
        userEvent.click(versionButton)
        // click submit and wait for loader to show
        const submitButton = getByText('submit')
        expect(submitButton).toBeTruthy()
        userEvent.click(submitButton)
        await waitFor(() => expect(queryByText('Loading')).toBeTruthy())
        // wait for modal to be closed
        await waitFor(() => expect(isClosed).toBeTruthy())
    })

    it('should show error message when failed upgrading', async () => {
        nockUpgrade('clusterName', '1.2.6', '', 405, 100)
        let isClosed = false
        const { getAllByRole, getByTestId, getByText, queryByText } = render(
            <UpgradeModal
                close={() => {
                    isClosed = true
                }}
                open={true}
                clusterName="clusterName"
                data={mockDistributionInfo}
            />
        )
        const button = getByTestId('pf-select-toggle-id-19')
        expect(button).toBeTruthy()
        userEvent.click(button)
        // select a version
        expect(getAllByRole('option').length).toBeGreaterThan(0)
        const versionButton = getAllByRole('option')[0]
        expect(versionButton).toBeTruthy()
        userEvent.click(versionButton)
        // click submit and wait for loader to show
        const submitButton = getByText('submit')
        expect(submitButton).toBeTruthy()
        userEvent.click(submitButton)
        await waitFor(() => expect(queryByText('Loading')).toBeTruthy())
        await waitFor(() => expect(queryByText('Loading')).toBeFalsy())

        // wait for modal to show alert
        expect(isClosed).toBe(false)
        expect(getByText('upgrade.upgradefailed')).toBeTruthy()
        expect(getByText('Request failed with status code 405')).toBeTruthy()
    })
})
