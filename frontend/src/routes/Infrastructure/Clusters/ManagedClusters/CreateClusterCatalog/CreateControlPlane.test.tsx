/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { clickByTestId, isCardEnabled, waitForNocks } from '../../../../../lib/test-util'
import { nockHypershiftStatus } from '../../../../../lib/nock-hypershift-status'
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
import userEvent from '@testing-library/user-event'

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
          snapshot.set(managedClusterAddonsState, mockManagedClusterAddOn)
          snapshot.set(multiClusterEnginesState, [
            enableHypershift ? mockMultiClusterEngine : mockMultiClusterEngineWithHypershiftDisabled,
          ])
        }}
      >
        <MemoryRouter initialEntries={[NavigationPath.createBMControlPlane]}>
          <Routes>
            <Route path={NavigationPath.createBMControlPlane} element={<CreateControlPlane />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  test('Hosted control plane card should be disabled when hypershift is disabled', async () => {
    const hypershiftStatusNock = nockHypershiftStatus(false)

    const { getByTestId } = render(<Component enableHypershift={false} />)
    await waitForNocks([hypershiftStatusNock])

    const card = getByTestId('hosted')
    expect(isCardEnabled(card)).toBe(false)
    expect(card).toHaveTextContent('Hosted control plane operator must be enabled')
  })

  test('Hosted control plane card should be disabled when there are no infrastructure environments', async () => {
    const hypershiftStatusNock = nockHypershiftStatus(true)

    const { getByTestId } = render(<Component enableHypershift={true} />)
    await waitForNocks([hypershiftStatusNock])

    const card = getByTestId('hosted')
    expect(isCardEnabled(card)).toBe(false)
    expect(card).toHaveTextContent('No infrastructure environments found')
    expect(card).toHaveTextContent(
      'To use hosted control plane, create an infrastructure environment in the Host inventory'
    )
  })

  test('Hosted control plane card should be disabled when there are no hosts', async () => {
    const hypershiftStatusNock = nockHypershiftStatus(true)

    const { getByTestId } = render(<Component enableHypershift={true} infraEnvsMock={[mockInfraEnv1]} />)
    await waitForNocks([hypershiftStatusNock])

    const card = getByTestId('hosted')
    expect(isCardEnabled(card)).toBe(true)
  })

  test('Hosted control plane card should be enabled when hypershift is enabled and there are available hosts', async () => {
    const hypershiftStatusNock = nockHypershiftStatus(true)

    const { getByTestId } = render(
      <Component enableHypershift={true} infraEnvsMock={[mockInfraEnv1]} agentsMock={mockAgents} />
    )
    await waitForNocks([hypershiftStatusNock])

    const card = getByTestId('hosted')
    expect(isCardEnabled(card)).toBe(true)
    await clickByTestId('hosted')
  })

  test('can click standalone', async () => {
    const hypershiftStatusNock = nockHypershiftStatus(true)

    render(<Component enableHypershift={true} infraEnvsMock={[mockInfraEnv1]} agentsMock={mockAgents} />)
    await waitForNocks([hypershiftStatusNock])

    await clickByTestId('standalone')
  })

  test('can click compare diagram', async () => {
    const hypershiftStatusNock = nockHypershiftStatus(true)

    const { getByText } = render(
      <Component enableHypershift={true} infraEnvsMock={[mockInfraEnv1]} agentsMock={mockAgents} />
    )
    await waitForNocks([hypershiftStatusNock])

    userEvent.click(getByText('Learn more about control plane types'))
    expect(getByText('Compare control plane types')).toBeTruthy()
    userEvent.click(getByText('Compare control plane types'))
  })
})
