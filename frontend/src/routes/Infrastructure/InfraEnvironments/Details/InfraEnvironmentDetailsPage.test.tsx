/* Copyright Contributors to the Open Cluster Management project */
import { render, waitFor } from '@testing-library/react'
import { CIM } from 'openshift-assisted-ui-lib'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { infraEnvironmentsState } from '../../../../atoms'
import { clickByText, waitForNotText, waitForTestId, waitForText } from '../../../../lib/test-util'
import { NavigationPath } from '../../../../NavigationPath'
import { infraEnvName, mockInfraEnv1 } from '../InfraEnvironmentsPage.test'
import InfraEnvironmentDetailsPage from './InfraEnvironmentDetailsPage'

const mockInfraEnvironments: CIM.InfraEnvK8sResource[] = [mockInfraEnv1]

const Component = () => {
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(infraEnvironmentsState, mockInfraEnvironments)
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
        const { getByTestId } = render(<Component />)

        await waitForText('Environment details', true)

        // The Overview tab
        await waitForText('Infrastructure Environment name')

        await clickByText('Add host')
        await waitForText('Discovery ISO is ready to download')
        await waitForText('Download Discovery ISO')

        // note: the input-element ID is auto-generated
        await waitForTestId('text-input-1')
        await waitFor(() => expect(getByTestId('text-input-1')).toHaveValue(mockInfraEnv1.status.isoDownloadURL))

        await clickByText('Close')
        await waitForNotText('Download Discovery ISO')

        // The Hosts tab
        await clickByText('Hosts')
        await waitForText('Hosts may take a few minutes to appear here after booting.')

        // screen.debug(undefined, -1)
    })
})
