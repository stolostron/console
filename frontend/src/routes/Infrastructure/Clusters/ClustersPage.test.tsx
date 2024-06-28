/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreApiPaths, nockIgnoreRBAC, nockPostRequest } from '../../../lib/nock-util'
import { waitForText } from '../../../lib/test-util'
import Clusters from './Clusters'
import { NavigationPath } from '../../../NavigationPath'

describe('Cluster Management', () => {
  test('Discovery Feature Flag Enabled', async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockPostRequest('/metrics?clusters', {})
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
