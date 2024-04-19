/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { clickByTestId, isCardEnabled } from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { CreateAWSControlPlane } from './CreateAWSControlPlane'
import { nockIgnoreApiPaths } from '../../../../../lib/nock-util'
import { managedClusterAddonsState, multiClusterEnginesState } from '../../../../../atoms'
import {
  mockManagedClusterAddOn,
  mockMultiClusterEngine,
  mockMultiClusterEngineWithHypershiftDisabled,
} from './sharedMocks'

describe('CreateAWSControlPlane', () => {
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
        <MemoryRouter initialEntries={[NavigationPath.createAWSControlPlane]}>
          <Routes>
            <Route path={NavigationPath.createAWSControlPlane} element={<CreateAWSControlPlane />} />
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

  test('can click standalone', async () => {
    render(<Component />)
    await clickByTestId('standalone')
  })
})
