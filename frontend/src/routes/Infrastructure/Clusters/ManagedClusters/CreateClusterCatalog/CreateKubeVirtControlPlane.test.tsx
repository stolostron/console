/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { clickByTestId } from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { CreateKubeVirtControlPlane } from './CreateKubeVirtControlPlane'

describe('CreateKubeVirtControlPlane', () => {
  const Component = () => {
    return (
      <RecoilRoot>
        <MemoryRouter initialEntries={[NavigationPath.createKubeVirtControlPlane]}>
          <Route path={NavigationPath.createKubeVirtControlPlane}>
            <CreateKubeVirtControlPlane />
          </Route>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  test('can click hosted', async () => {
    render(<Component />)
    await clickByTestId('hosted')
  })
})
