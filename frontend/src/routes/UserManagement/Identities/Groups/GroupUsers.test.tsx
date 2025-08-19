/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { GroupUsers } from './GroupUsers'

function Component({ groupId = 'test-group' }: { groupId?: string }) {
  return (
    <RecoilRoot>
      <MemoryRouter initialEntries={[`/multicloud/user-management/identities/groups/${groupId}/users`]}>
        <GroupUsers />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('GroupUsers', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('should render group users page', () => {
    render(<Component />)

    expect(screen.getByText('Group Users')).toBeInTheDocument()
  })

  test('should render with different group ID', () => {
    render(<Component groupId="different-group" />)

    expect(screen.getByText('Group Users')).toBeInTheDocument()
  })
})
