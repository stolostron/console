/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { nockIgnoreApiPaths } from '../../../../../lib/nock-util'
import { clickByTestId } from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { CreateControlPlane } from './CreateControlPlane'
import { managedClusterAddonsState, multiClusterEnginesState } from '../../../../../atoms'
import { mockManagedClusterAddOn, mockMultiClusterEngine } from './sharedMocks'

describe('CreateControlPlane', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
  })
  const Component = () => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterAddonsState, [mockManagedClusterAddOn])
          snapshot.set(multiClusterEnginesState, [mockMultiClusterEngine])
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

  test('can click hosted', async () => {
    render(<Component />)
    await clickByTestId('hosted')
  })

  test('can click standalone', async () => {
    render(<Component />)
    await clickByTestId('standalone')
  })
})
