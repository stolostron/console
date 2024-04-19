/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'

import { NavigationPath } from '../../../../../NavigationPath'
import { CreateDiscoverHost } from './CreateDiscoverHost'
import { agentsState, infraEnvironmentsState } from '../../../../../atoms'
import { AgentK8sResource, InfraEnvK8sResource } from '@openshift-assisted/ui-lib/cim'
import { mockInfraEnv1, mockAgents } from '../components/cim/EditAICluster.sharedmocks'
import { clickByTestId, isCardEnabled } from '../../../../../lib/test-util'

describe('CreateDiscoverHost', () => {
  const Component = ({
    infraEnvsMock,
    agentsMock,
  }: {
    infraEnvsMock?: InfraEnvK8sResource[]
    agentsMock?: AgentK8sResource[]
  }) => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(infraEnvironmentsState, infraEnvsMock || [])
          snapshot.set(agentsState, agentsMock || [])
        }}
      >
        <MemoryRouter initialEntries={[NavigationPath.createDiscoverHost]}>
          <Routes>
            <Route path={NavigationPath.createDiscoverHost} element={<CreateDiscoverHost />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  test('Use existing card should be disabled when there are no infrastructure environments', async () => {
    const { getByTestId } = render(<Component />)
    const card = getByTestId('existinghost')
    expect(isCardEnabled(card)).toBe(false)
    expect(card).toHaveTextContent('No infrastructure environments found')
    expect(card).toHaveTextContent(
      'To use existing hosts, create an infrastructure environment and add hosts in the Host inventory.'
    )
  })

  test('Use existing card should be disabled when there are no available hosts', async () => {
    const { getByTestId } = render(<Component infraEnvsMock={[mockInfraEnv1]} />)
    const card = getByTestId('existinghost')
    expect(isCardEnabled(card)).toBe(false)
    expect(card).toHaveTextContent('No available hosts found')
    expect(card).toHaveTextContent('To use existing hosts, go to Host inventory and add hosts')
  })

  test('Use existing card should be enabled when there are available hosts', async () => {
    const { getByTestId } = render(<Component infraEnvsMock={[mockInfraEnv1]} agentsMock={mockAgents} />)
    const card = getByTestId('existinghost')
    expect(isCardEnabled(card)).toBe(true)
    await clickByTestId('existinghost')
  })

  test('can click discover', async () => {
    const { getByTestId } = render(<Component />)
    expect(isCardEnabled(getByTestId('discover'))).toBe(true)
    await clickByTestId('discover')
  })
})
