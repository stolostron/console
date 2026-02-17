/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import { waitForText } from '../../../lib/test-util'
import Clusters from './Clusters'
import { NavigationPath } from '../../../NavigationPath'

// Mock KubevirtProviderAlert to avoid complex dependencies
jest.mock('../../../components/KubevirtProviderAlert', () => ({
  KubevirtProviderAlert: () => null,
}))

describe('Cluster Management', () => {
  test('Discovery Feature Flag Enabled', async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    render(
      <RecoilRoot>
        <MemoryRouter initialEntries={[NavigationPath.managedClusters]}>
          <Routes>
            <Route path={`${NavigationPath.clusters}/*`} element={<Clusters />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForText('Cluster list')
    await waitForText('Discovered clusters')
  })
})
