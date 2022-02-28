/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { MemoryRouter, Route } from 'react-router-dom'

import { NavigationPath } from '../../../../../../NavigationPath'

import {
    agentClusterInstallsState,
    agentsState,
    clusterDeploymentsState,
    clusterImageSetsState,
    configMapsState,
    infraEnvironmentsState,
} from '../../../../../../atoms'
import { clickByText, waitForTestId, waitForText, waitForNocks } from '../../../../../../lib/test-util'
import { nockList, nockPatch } from '../../../../../../lib/nock-util'

import EditAICluster from './EditAICluster'
import {
    clusterName,
    mockAgentClusterInstall,
    mockAgents,
    mockClusterDeploymentAI,
    mockClusterImageSet,
    mockConfigMapAI,
    mockInfraEnv1,
    mockNMStateConfig,
} from './EditAICluster.sharedmocks'

const Component = () => {
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(clusterImageSetsState, [mockClusterImageSet])
                snapshot.set(agentsState, mockAgents)
                snapshot.set(configMapsState, [mockConfigMapAI])
                snapshot.set(clusterDeploymentsState, [mockClusterDeploymentAI])
                snapshot.set(agentClusterInstallsState, [mockAgentClusterInstall])
                snapshot.set(infraEnvironmentsState, [mockInfraEnv1])
            }}
        >
            <MemoryRouter initialEntries={[NavigationPath.editCluster]}>
                <Route
                    component={(props: any) => {
                        const newProps = { ...props }
                        newProps.match = props.match || { params: {} }
                        newProps.match.params.name = clusterName
                        newProps.match.params.namespace = clusterName
                        return <EditAICluster {...newProps} />
                    }}
                />
            </MemoryRouter>
        </RecoilRoot>
    )
}

describe('Edit AI Cluster', () => {
    test('can be rendered', async () => {
        const nocks = [
            nockList(mockNMStateConfig, mockNMStateConfig, ['agent-install.openshift.io/bmh']),
            nockPatch(mockAgentClusterInstall, [
                { op: 'replace', path: '/spec/imageSetRef/name', value: 'ocp-release48' },
            ]),
        ]
        render(<Component />)
        await new Promise((resolve) => setTimeout(resolve, 500))

        await waitForText('Installation type')
        await waitForText('Cluster details', true)
        await waitForText('Cluster hosts')
        await waitForText('Cluster network')

        await waitForTestId('form-static-openshiftVersion-field')
        await waitForText('OpenShift ocp-release48')

        await clickByText('Next')
        await waitForNocks(nocks)

        await waitForTestId('form-input-autoSelectHosts-field')

        /* TODO(mlibra): Subsequent steps should be covered by AI UI Lib tests. So far we can be sure that the AI UI component has been integrated into the ACM.

        const hostsNocks = [
          nockPatch(mockClusterDeploymentAI, [{"op":"replace","path":"/metadata/annotations","value":{}}]),
          nockPatch(mockAgent, mockAgent)]
        await clickByText('Next')
        await waitForNocks(hostsNocks)
        
        await waitForText('Host inventory')

        await waitForText('Save and install')
        */
        // screen.debug(undefined, -1)
    })
})
