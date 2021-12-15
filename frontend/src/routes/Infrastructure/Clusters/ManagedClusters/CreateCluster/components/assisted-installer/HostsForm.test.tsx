/* Copyright Contributors to the Open Cluster Management project */

import { RecoilRoot } from 'recoil'
import { render } from '@testing-library/react'

import {
    agentClusterInstallsState,
    agentsState,
    clusterDeploymentsState,
    configMapsState,
} from '../../../../../../../atoms'
import {
    mockAgentClusterInstall,
    mockAgents,
    mockClusterDeploymentAI,
    mockConfigMapAI,
} from '../../CreateCluster.sharedmocks'
import CIMHostsForm from './CIMHostsForm'
import {
    clickBySelector,
    clickByTestId,
    waitForNoSelector,
    waitForNotText,
    waitForSelector,
    waitForText,
    waitForValueBySelector,
} from '../../../../../../../lib/test-util'
import { FormControl } from './types'

const Component = () => {
    const mockControl: FormControl = {
        agentClusterInstall: mockAgentClusterInstall,
        resourceJSON: { createResources: [mockClusterDeploymentAI, mockAgentClusterInstall] },
    }

    // agentsState
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(agentsState, mockAgents)
                snapshot.set(clusterDeploymentsState, [mockClusterDeploymentAI])
                snapshot.set(agentClusterInstallsState, [mockAgentClusterInstall])
                snapshot.set(configMapsState, [mockConfigMapAI])
            }}
        >
            <CIMHostsForm control={mockControl} handleChange={jest.fn()} />
        </RecoilRoot>
    )
}

describe('Hosts selection step for AI', () => {
    const hostCountSelector = '#form-numberinput-hostCount-hostcount-field input.pf-c-form-control'
    const plusButtonSelector = '#form-numberinput-hostCount-hostcount-field [aria-label="Plus"]'
    const minusButtonSelector = '#form-numberinput-hostCount-hostcount-field [aria-label="Minus"]'

    test('can render', async () => {
        const { container } = render(<Component />)

        waitForText('Number of hosts')

        // Automatic selection
        waitForValueBySelector(container, hostCountSelector, 3)
        clickBySelector(container, plusButtonSelector)
        waitForValueBySelector(container, hostCountSelector, 5) // the value jumped from 3 to 5

        clickBySelector(container, plusButtonSelector) // to 6
        waitForText('Only 5 hosts are selected.')
        clickBySelector(container, minusButtonSelector) // to 5
        waitForNotText('Only 5 hosts are selected.')

        // Manual selection
        waitForNoSelector(container, '.agents-table')
        waitForNotText('Labels matching hosts')

        clickByTestId('form-input-autoSelectHosts-field')
        waitForText('Labels matching hosts')
        waitForSelector(container, '.agents-table')

        waitForText('5 hosts selected out of 5 matching.')
        clickBySelector(container, minusButtonSelector) // to 3

        // await new Promise((resolve) => setTimeout(resolve, 500))
        // screen.debug(undefined, -1)
    })
})
