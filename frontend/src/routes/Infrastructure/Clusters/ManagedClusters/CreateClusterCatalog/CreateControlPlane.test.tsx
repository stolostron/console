/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { clickByTestId, isCardEnabled } from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { CreateControlPlane } from './CreateControlPlane'
import {
  agentsState,
  infraEnvironmentsState,
  managedClusterAddonsState,
  multiClusterEnginesState,
} from '../../../../../atoms'
import { AgentK8sResource, InfraEnvK8sResource } from '@openshift-assisted/ui-lib/cim'
import { mockInfraEnv1, mockAgents } from '../components/cim/EditAICluster.sharedmocks'
import {
  mockManagedClusterAddOn,
  mockMultiClusterEngine,
  mockMultiClusterEngineWithHypershiftDisabled,
} from './sharedMocks'

describe('CreateControlPlane', () => {
  const Component = ({
    infraEnvsMock,
    agentsMock,
    enableHypershift = true,
  }: {
    infraEnvsMock?: InfraEnvK8sResource[]
    agentsMock?: AgentK8sResource[]
    enableHypershift?: boolean
  }) => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(infraEnvironmentsState, infraEnvsMock || [])
          snapshot.set(agentsState, agentsMock || [])
          snapshot.set(managedClusterAddonsState, [mockManagedClusterAddOn])
          snapshot.set(multiClusterEnginesState, [
            enableHypershift ? mockMultiClusterEngine : mockMultiClusterEngineWithHypershiftDisabled,
          ])
        }}
      >
        <MemoryRouter initialEntries={[NavigationPath.createBMControlPlane]}>
          <Route path={NavigationPath.createBMControlPlane}>
            <CreateControlPlane />
          </Route>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  test('Hosted control plane card should be disabled when hypershift is disabled', async () => {
    const { getByTestId } = render(<Component enableHypershift={false} />)
    const card = getByTestId('hosted')
    expect(isCardEnabled(card)).toBe(false)
    expect(card).toHaveTextContent('Hosted control plane operator must be enabled')
  })

  test('Hosted control plane card should be disabled when there are no infrastructure environments', async () => {
    const { getByTestId } = render(<Component />)
    const card = getByTestId('hosted')
    expect(isCardEnabled(card)).toBe(false)
    expect(card).toHaveTextContent('No infrastructure environments found')
    expect(card).toHaveTextContent(
      'To use hosted control plane, create an infrastructure environment and add hosts in the Host inventory'
    )
  })

  test('Hosted control plane card should be disabled when there are no hosts', async () => {
    const { getByTestId } = render(<Component infraEnvsMock={[mockInfraEnv1]} />)
    const card = getByTestId('hosted')
    expect(isCardEnabled(card)).toBe(false)
    expect(card).toHaveTextContent('No available hosts found')
    expect(card).toHaveTextContent('To use hosted control plane, go to Host inventory and add hosts')
  })

  test('Hosted control plane card should be enabled when hypershift is enabled and there are available hosts', async () => {
    const { getByTestId } = render(<Component infraEnvsMock={[mockInfraEnv1]} agentsMock={mockAgents} />)
    const card = getByTestId('hosted')
    expect(isCardEnabled(card)).toBe(true)
    await clickByTestId('hosted')
  })

  test('can click standalone', async () => {
    render(<Component infraEnvsMock={[mockInfraEnv1]} agentsMock={mockAgents} />)
    await clickByTestId('standalone')
  })
})
