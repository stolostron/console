/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { GroupRoleAssignments } from './GroupRoleAssignments'

function Component({ groupId = 'test-group' }: { groupId?: string }) {
  return (
    <RecoilRoot>
      <MemoryRouter initialEntries={[`/multicloud/user-management/identities/groups/${groupId}/role-assignments`]}>
        <GroupRoleAssignments />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('GroupRoleAssignments', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('should render group role assignments page', () => {
    render(<Component />)

    expect(screen.getByText('Group Role Assignments')).toBeInTheDocument()
  })

  test('should render with different group ID', () => {
    render(<Component groupId="different-group" />)

    expect(screen.getByText('Group Role Assignments')).toBeInTheDocument()
  })
})
