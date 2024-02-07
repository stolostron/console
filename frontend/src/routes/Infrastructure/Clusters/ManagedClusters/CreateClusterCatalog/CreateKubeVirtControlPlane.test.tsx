/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { managedClusterAddonsState, multiClusterEnginesState } from '../../../../../atoms'
import { nockIgnoreApiPaths } from '../../../../../lib/nock-util'
import { clickByTestId, isCardEnabled } from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { CreateKubeVirtControlPlane } from './CreateKubeVirtControlPlane'
import {
  mockManagedClusterAddOn,
  mockMultiClusterEngine,
  mockMultiClusterEngineWithHypershiftDisabled,
} from './sharedMocks'

describe('CreateKubeVirtControlPlane', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
  })
  const Component = ({ enableHypershift = true }: { enableHypershift?: boolean }) => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterAddonsState, [mockManagedClusterAddOn])
          snapshot.set(multiClusterEnginesState, [
            enableHypershift ? mockMultiClusterEngine : mockMultiClusterEngineWithHypershiftDisabled,
          ])
        }}
      >
        <MemoryRouter initialEntries={[NavigationPath.createKubeVirtControlPlane]}>
          <Route path={NavigationPath.createKubeVirtControlPlane}>
            <CreateKubeVirtControlPlane />
          </Route>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  test('Hosted should be enabled when hypershift is enabled', async () => {
    const { getAllByTestId } = render(<Component />)
    expect(isCardEnabled(getAllByTestId('hosted')[1])).toBe(true)
  })

  test('Hosted should be disabled when hypershift is disabled', async () => {
    const { getAllByTestId } = render(<Component enableHypershift={false} />)
    expect(isCardEnabled(getAllByTestId('hosted')[1])).toBe(false)
    await clickByTestId('hosted', 1)
  })
})
