/* Copyright Contributors to the Open Cluster Management project */

import { RecoilRoot } from 'recoil'
import { render } from '@testing-library/react'

import { agentClusterInstallsState, agentsState, clusterDeploymentsState } from '../../../../../../../atoms'
import { mockAgentClusterInstall, mockAgents, mockClusterDeploymentAI } from '../../CreateCluster.sharedmocks'
import { waitForSelector, waitForText, waitForTestId } from '../../../../../../../lib/test-util'
import NetworkForm from './NetworkForm'

const Component = () => {
    const mockControl = {
        agentClusterInstall: mockAgentClusterInstall,
        resourceJSON: { createResources: [mockClusterDeploymentAI, mockAgentClusterInstall] },
    }

    const mockHandleChange = jest.fn()

    // agentsState
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(agentsState, mockAgents)
                snapshot.set(clusterDeploymentsState, [mockClusterDeploymentAI])
                snapshot.set(agentClusterInstallsState, [mockAgentClusterInstall])
                // snapshot.set(configMapsState, [mockConfigMapAI])
            }}
        >
            <NetworkForm control={mockControl} handleChange={mockHandleChange} />
        </RecoilRoot>
    )
}

describe('Cluster network step for AI', () => {
    test('can render', async () => {
        const { container } = render(<Component />)

        await waitForText('Host inventory')
        await waitForSelector(container, '[aria-label="Hosts table"]')
        await waitForText('host-1 *')
        await waitForText('0f093a00-5df8-40d7-840f-bca562164710')
        await waitForText('Available subnets')
        await waitForText('No subnets are currently available')
        await waitForTestId('useAdvancedNetworking')

        // screen.debug(undefined, -1)
    })
})
