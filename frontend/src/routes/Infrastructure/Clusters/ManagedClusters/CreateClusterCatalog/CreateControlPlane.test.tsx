/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { clickByTestId } from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { CreateControlPlane } from './CreateControlPlane'

describe('CreateControlPlane', () => {
  const Component = () => {
    return (
      <RecoilRoot>
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
