/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { clickByTestId, isCardEnabled } from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { CreateKubeVirtControlPlane } from './CreateKubeVirtControlPlane'
import { nockIgnoreApiPaths } from '../../../../../lib/nock-util'
import { managedClusterAddonsState, multiClusterEnginesState } from '../../../../../atoms'
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
    const { getByTestId } = render(<Component />)
    expect(isCardEnabled(getByTestId('hosted'))).toBe(true)
  })

  test('Hosted should be disabled when hypershift is disabled', async () => {
    const { getByTestId } = render(<Component enableHypershift={false} />)
    expect(isCardEnabled(getByTestId('hosted'))).toBe(false)
    await clickByTestId('hosted')
  })
})
