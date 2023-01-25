/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import { waitForText } from '../../../lib/test-util'
import { ClustersPage } from './ClustersPage'

describe('Cluster Management', () => {
  test('Discovery Feature Flag Enabled', async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
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
