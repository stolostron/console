/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
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

    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Groups')).toBeInTheDocument()
  })

  test.each([
    {
      route: '/multicloud/user-management/identities/users',
      activeTab: 'Users',
      inactiveTab: 'Groups',
    },
    {
      route: '/multicloud/user-management/identities/groups',
      activeTab: 'Groups',
      inactiveTab: 'Users',
    },
  ])('should highlight $activeTab tab when route is $route', async ({ route, activeTab, inactiveTab }) => {
    render(
      <RecoilRoot>
        <MemoryRouter initialEntries={[route]}>
          <IdentitiesPage />
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitFor(() => {
      expect(screen.getAllByText('Identities')).toHaveLength(2)
    })

    const activeLink = screen.getByRole('link', { name: activeTab })
    const inactiveLink = screen.getByRole('link', { name: inactiveTab })

    expect(activeLink).toBeInTheDocument()
    expect(inactiveLink).toBeInTheDocument()

    expect(activeLink.parentElement).toHaveClass('pf-m-current')
    expect(inactiveLink).not.toHaveAttribute('aria-current')
  })
})
