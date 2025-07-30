/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC } from '../../lib/nock-util'
import RolesManagement from './RolesManagement'

describe('RolesManagement Router', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
  })

  test('should render without errors', () => {
    render(
      <RecoilRoot>
        <MemoryRouter initialEntries={['/multicloud/roles']}>
          <RolesManagement />
        </MemoryRouter>
      </RecoilRoot>
    )

    expect(document.body).toBeInTheDocument()
  })

  test('should render role detail route', () => {
    render(
      <RecoilRoot>
        <MemoryRouter initialEntries={['/multicloud/roles/test-role']}>
          <RolesManagement />
        </MemoryRouter>
      </RecoilRoot>
    )

    expect(document.body).toBeInTheDocument()
  })
})
