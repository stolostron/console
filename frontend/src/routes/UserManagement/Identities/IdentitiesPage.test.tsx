/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import IdentitiesPage from './IdentitiesPage'

function Component() {
  return (
    <StateProvider>
      <MemoryRouter initialEntries={['/multicloud/user-management/identities/users']}>
        <IdentitiesPage />
      </MemoryRouter>
    </StateProvider>
  )
}

describe('IdentitiesPage', () => {
  afterEach(() => {
    jest.clearAllTimers()
  })

  test('should render identities page with tabs', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText('Identities')).toBeInTheDocument()
    })

    expect(screen.getByText('Identities')).toBeInTheDocument()

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
      <StateProvider>
        <MemoryRouter initialEntries={[route]}>
          <IdentitiesPage />
        </MemoryRouter>
      </StateProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Identities')).toBeInTheDocument()
    })

    const activeLink = screen.getByRole('tab', { name: activeTab })
    const inactiveLink = screen.getByRole('tab', { name: inactiveTab })

    expect(activeLink).toBeInTheDocument()
    expect(inactiveLink).toBeInTheDocument()

    expect(activeLink.parentElement).toHaveClass('pf-m-current')
    expect(inactiveLink).not.toHaveAttribute('aria-current')
  })
})
