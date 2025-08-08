/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { GroupDetail } from './GroupDetail'

function Component({ groupId = 'test-group' }: { groupId?: string }) {
  return (
    <RecoilRoot>
      <MemoryRouter initialEntries={[`/multicloud/user-management/identities/groups/${groupId}`]}>
        <GroupDetail />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('GroupDetail', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('should render group detail page', () => {
    render(<Component />)

    expect(screen.getByText('Group Details')).toBeInTheDocument()
  })

  test('should render with different group ID', () => {
    render(<Component groupId="different-group" />)

    expect(screen.getByText('Group Details')).toBeInTheDocument()
  })
})
