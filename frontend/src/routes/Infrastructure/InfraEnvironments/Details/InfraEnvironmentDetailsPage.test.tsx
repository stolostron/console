/* Copyright Contributors to the Open Cluster Management project */
import { cloneDeep } from 'lodash'
import { render, waitFor } from '@testing-library/react'
import { CIM } from 'openshift-assisted-ui-lib'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'

import { infraEnvironmentsState } from '../../../../atoms'
import { nockGet, nockList } from '../../../../lib/nock-util'
import { clickByText, waitForNocks, waitForNotText, waitForTestId, waitForText } from '../../../../lib/test-util'
import { NavigationPath } from '../../../../NavigationPath'
import { infraEnvName, mockInfraEnv1, mockPullSecret } from '../InfraEnvironmentsPage.test'

import InfraEnvironmentDetailsPage from './InfraEnvironmentDetailsPage'
import { mockNMStateConfig } from '../../Clusters/ManagedClusters/components/cim/EditAICluster.sharedmocks'

const mockInfraEnvironments: CIM.InfraEnvK8sResource[] = [mockInfraEnv1]

// This will be changed after MGMT-7255
const mockInfraEnvRegeneratedISO = cloneDeep(mockInfraEnv1)
mockInfraEnvRegeneratedISO.status.createdTime = '2021-11-10T14:03:16Z'

const mockNMStateConfigInfraEnv = cloneDeep(mockNMStateConfig)
mockNMStateConfigInfraEnv.metadata.name = infraEnvName
mockNMStateConfigInfraEnv.metadata.namespace = infraEnvName

const Component = () => {
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(infraEnvironmentsState, mockInfraEnvironments)
                // snapshot.set(nmStateConfigState, [mockNMStateConfigInfraEnv])
            }}
        >
            <MemoryRouter initialEntries={[NavigationPath.infraEnvironmentDetails]}>
                <Route
                    component={(props: any) => {
                        const newProps = { ...props }
                        newProps.match = props.match || { params: {} }
                        newProps.match.params.name = infraEnvName
                        newProps.match.params.namespace = infraEnvName
                        return <InfraEnvironmentDetailsPage {...newProps} />
                    }}
                />{' '}
            </MemoryRouter>
        </RecoilRoot>
    )
}

describe('Infrastructure Environment Details page', () => {
    test('can render', async () => {
        const initialNocks = [nockGet(mockPullSecret)]
        const { getByTestId } = render(<Component />)
        await waitForText('Environment details', true)
        await waitForNocks(initialNocks)

        // The Overview tab
        await waitForText('Infrastructure Environment name')

        await clickByText('Add host')

        // Discovery ISO config dialog
        await waitForText('Generate Discovery ISO')
        await clickByText('Generate Discovery ISO')

        // Discovery ISO download state
        await waitForText('Discovery ISO is ready to download')
        await waitForText('Download Discovery ISO')

        // note: the input-element ID is auto-generated
        await waitForTestId('text-input-1')
        await waitFor(() => expect(getByTestId('text-input-1')).toHaveValue(mockInfraEnv1.status.isoDownloadURL))

        await clickByText('Close')
        await waitForNotText('Download Discovery ISO')

        // The Hosts tab
        const nocks = [
            nockList(mockNMStateConfigInfraEnv, mockNMStateConfigInfraEnv, ['agent-install.openshift.io/bmh']),
        ]
        await clickByText('Hosts')
        await waitForText('Hosts may take a few minutes to appear here after booting.')

        await waitForNocks(nocks)
    })
})
