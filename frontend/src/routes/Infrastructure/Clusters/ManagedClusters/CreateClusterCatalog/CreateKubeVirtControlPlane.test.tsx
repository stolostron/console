/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
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
          snapshot.set(managedClusterAddonsState, mockManagedClusterAddOn)
          snapshot.set(multiClusterEnginesState, [
            enableHypershift ? mockMultiClusterEngine : mockMultiClusterEngineWithHypershiftDisabled,
          ])
        }}
      >
        <MemoryRouter initialEntries={[NavigationPath.createKubeVirtControlPlane]}>
          <Routes>
            <Route path={NavigationPath.createKubeVirtControlPlane} element={<CreateKubeVirtControlPlane />} />
          </Routes>
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
