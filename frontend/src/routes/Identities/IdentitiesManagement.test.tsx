/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC } from '../../lib/nock-util'
import IdentitiesManagement from './IdentitiesManagement'

describe('IdentitiesManagement Router', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
  })

  test('should render without errors', () => {
    render(
      <RecoilRoot>
        <MemoryRouter initialEntries={['/multicloud/identities/users']}>
          <IdentitiesManagement />
        </MemoryRouter>
      </RecoilRoot>
    )

    expect(document.body).toBeInTheDocument()
  })
})
