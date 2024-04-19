/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreApiPaths, nockIgnoreRBAC, nockPostRequest } from '../../../lib/nock-util'
import { waitForText } from '../../../lib/test-util'
import { ClustersPage } from './ClustersPage'

describe('Cluster Management', () => {
  test('Discovery Feature Flag Enabled', async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockPostRequest('/metrics?clusters', {})
    render(
      <RecoilRoot>
        <MemoryRouter>
          <ClustersPage />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForText('Cluster list')
    await waitForText('Discovered clusters')
  })
})
