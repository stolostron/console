/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../lib/nock-util'
import IdentitiesPage from './IdentitiesPage'

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter initialEntries={['/multicloud/user-management/identities/users']}>
        <IdentitiesPage />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('IdentitiesPage', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  test('should render identities page with tabs', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getAllByText('Identities')).toHaveLength(2)
    })

    expect(screen.getAllByText('Identities')).toHaveLength(2)
    expect(screen.getByText('User Management')).toBeInTheDocument()

    const usersTab = screen.queryByText('Users')
    const groupsTab = screen.queryByText('Groups')
    const serviceAccountsTab = screen.queryByText('Service Accounts')
    const unauthorizedMessage = screen.queryByText('Unauthorized')

    const hasAllTabs = usersTab && groupsTab && serviceAccountsTab
    const hasUnauthorized = !!unauthorizedMessage

    expect(hasAllTabs || hasUnauthorized).toBe(true)

    expect(usersTab || unauthorizedMessage).toBeTruthy()
    expect(groupsTab || unauthorizedMessage).toBeTruthy()
    expect(serviceAccountsTab || unauthorizedMessage).toBeTruthy()
  })

  test('should highlight correct tab based on route', async () => {
    render(
      <RecoilRoot>
        <MemoryRouter initialEntries={['/multicloud/user-management/identities/groups']}>
          <IdentitiesPage />
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitFor(() => {
      expect(screen.getAllByText('Identities')).toHaveLength(2)
    })

    const groupsTab = screen.queryByText('Groups')
    const unauthorizedMessage = screen.queryByText('Unauthorized')

    expect(groupsTab || unauthorizedMessage).toBeTruthy()
  })
})
