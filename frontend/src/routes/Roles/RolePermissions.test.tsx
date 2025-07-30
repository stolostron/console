/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC } from '../../lib/nock-util'
import { RolePermissions } from './RolePermissions'

function Component({ roleId = 'test-role' }: { roleId?: string }) {
  return (
    <RecoilRoot>
      <MemoryRouter initialEntries={[`/multicloud/roles/${roleId}/permissions`]}>
        <RolePermissions />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('RolePermissions Page', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
  })

  test('should render role permissions page', () => {
    render(<Component />)

    expect(screen.getByText('Role Permissions')).toBeInTheDocument()
  })
})
