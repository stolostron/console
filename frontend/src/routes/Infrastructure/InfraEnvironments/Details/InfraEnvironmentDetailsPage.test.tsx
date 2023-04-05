/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { cloneDeep } from 'lodash'
import set from 'lodash/set'
import { CIM } from 'openshift-assisted-ui-lib'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { infraEnvironmentsState, nmStateConfigsState } from '../../../../atoms'
import { nockGet, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { clickByText, clickHostAction, waitForNocks, waitForNotText, waitForText } from '../../../../lib/test-util'
import { NavigationPath } from '../../../../NavigationPath'
import { IResource } from '../../../../resources/resource'
import { mockNMStateConfig } from '../../Clusters/ManagedClusters/components/cim/EditAICluster.sharedmocks'
import { infraEnvName, mockInfraEnv1, mockPullSecret } from '../InfraEnvironmentsPage.test'
import InfraEnvironmentDetailsPage from './InfraEnvironmentDetailsPage'

const mockInfraEnvironments: CIM.InfraEnvK8sResource[] = [mockInfraEnv1]

// This will be changed after MGMT-7255
const mockInfraEnvRegeneratedISO = cloneDeep(mockInfraEnv1)
set(mockInfraEnvRegeneratedISO, 'status.createdTime', '2021-11-10T14:03:16Z')

const mockNMStateConfigInfraEnv = cloneDeep(mockNMStateConfig)
mockNMStateConfigInfraEnv.metadata.name = infraEnvName
mockNMStateConfigInfraEnv.metadata.namespace = infraEnvName

const Component = () => {
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(infraEnvironmentsState, mockInfraEnvironments)
        snapshot.set(nmStateConfigsState, [mockNMStateConfigInfraEnv])
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
        />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('Infrastructure Environment Details page', () => {
  beforeEach(() => nockIgnoreApiPaths())
  test('can render', async () => {
    const initialNocks = [nockGet(mockPullSecret as IResource)]
    render(<Component />)
    await waitForText('ai:Environment details')
    await waitForNocks(initialNocks)

    // The Overview tab
    await waitForText('ai:Infrastructure Environment name')

    // Open discovery ISO dialog
    await clickHostAction('ai:With Discovery ISO')

    // Discovery ISO config dialog
    await clickByText('ai:Generate Discovery ISO')

    // Discovery ISO download state
    await waitForText('ai:Discovery ISO is ready to be downloaded')
    await waitForText('ai:Download Discovery ISO')

    // note: the input-element ID is auto-generated
    // await waitForTestId('text-input-1')
    // await waitFor(() => expect(getByTestId('text-input-1')).toHaveValue(mockInfraEnv1.status.isoDownloadURL))

    await clickByText('ai:Close')
    await waitForNotText('ai:Download Discovery ISO')

    // The Hosts tab
    await clickByText('Hosts')
    await waitForText('ai:Hosts may take a few minutes to appear here after booting.')
  })
})
