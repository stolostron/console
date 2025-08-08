/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC } from '../../../lib/nock-util'
import { RoleAssignments } from './RoleAssignments'

function Component({ roleId = 'test-role' }: { roleId?: string }) {
  return (
    <RecoilRoot>
      <MemoryRouter initialEntries={[`/multicloud/user-management/roles/${roleId}/role-assignments`]}>
        <RoleAssignments />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('RoleAssignments Page', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
  })

  test('should render role assignments page', () => {
    render(<Component />)

    expect(screen.getByText('Role Assignments')).toBeInTheDocument()
  })
})
