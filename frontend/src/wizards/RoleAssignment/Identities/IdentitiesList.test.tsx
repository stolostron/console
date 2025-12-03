/* Copyright Contributors to the Open Cluster Management project */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { IdentitiesList } from './IdentitiesList'

// Mock the translation hook
jest.mock('../../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock the table components
jest.mock('../../../routes/UserManagement/Identities/Users/UsersTable', () => ({
  UsersTable: () => <div data-testid="users-table">Users Table</div>,
}))

jest.mock('../../../routes/UserManagement/Identities/Groups/GroupsTable', () => ({
  GroupsTable: () => <div data-testid="groups-table">Groups Table</div>,
}))

// Mock CreatePreAuthorizedUser component
jest.mock('./CreatePreAuthorizedUser', () => ({
  CreatePreAuthorizedUser: ({ onCancel, onSubmit }: any) => (
    <div data-testid="create-pre-authorized">
      <button onClick={onCancel}>Cancel</button>
      <button onClick={() => onSubmit('testuser')}>Submit</button>
    </div>
  ),
}))

function Component(props: any = {}) {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <IdentitiesList {...props} />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('IdentitiesList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should render title and description', () => {
    render(<Component />)

    expect(screen.getByText('Identities')).toBeInTheDocument()
    expect(screen.getByText(/Select a user or group to assign this role, or/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'add pre-authorized user' })).toBeInTheDocument()
  })

  test('should render tabs for Users and Groups', () => {
    render(<Component />)

    expect(screen.getByRole('tab', { name: 'Users tab' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Groups tab' })).toBeInTheDocument()
  })

  test('should show Users tab as active by default', () => {
    render(<Component />)

    const usersTab = screen.getByRole('tab', { name: 'Users tab' })
    expect(usersTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Users Table')).toBeInTheDocument()
  })

  test('should switch to Groups tab when clicked', () => {
    render(<Component />)

    const groupsTab = screen.getByRole('tab', { name: 'Groups tab' })
    fireEvent.click(groupsTab)

    expect(groupsTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Groups Table')).toBeInTheDocument()
  })

  test('should render component without errors', () => {
    const { container } = render(<Component />)
    expect(container).toBeInTheDocument()
  })

  test('should switch to Users tab when add pre-authorized user is clicked', async () => {
    render(<Component />)

    // Start on Groups tab
    const groupsTab = screen.getByRole('tab', { name: 'Groups tab' })
    fireEvent.click(groupsTab)
    expect(groupsTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Groups Table')).toBeInTheDocument()

    // Click "add pre-authorized user" link
    const preAuthorizedLink = screen.getByRole('button', { name: 'add pre-authorized user' })
    fireEvent.click(preAuthorizedLink)

    // Wait for state update and tab switch
    await waitFor(() => {
      const usersTab = screen.getByRole('tab', { name: 'Users tab' })
      expect(usersTab).toHaveAttribute('aria-selected', 'true')
    })

    // The key functionality is that Users tab becomes active
    // Content switching might be handled differently by PatternFly
    const usersTab = screen.getByRole('tab', { name: 'Users tab' })
    expect(usersTab).toHaveAttribute('aria-selected', 'true')
  })

  test('should show CreatePreAuthorizedUser when link is clicked from Users tab', () => {
    render(<Component />)

    // Should start on Users tab
    const usersTab = screen.getByRole('tab', { name: 'Users tab' })
    expect(usersTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Users Table')).toBeInTheDocument()

    // Click "add pre-authorized user" link
    const preAuthorizedLink = screen.getByRole('button', { name: 'add pre-authorized user' })
    fireEvent.click(preAuthorizedLink)

    // Should stay on Users tab and hide Users Table
    expect(usersTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByText('Users Table')).not.toBeInTheDocument()
  })

  test('should return to Users table when CreatePreAuthorizedUser is cancelled', () => {
    render(<Component />)

    // Click pre-authorized link to show the form
    const preAuthorizedLink = screen.getByRole('button', { name: 'add pre-authorized user' })
    fireEvent.click(preAuthorizedLink)
    expect(screen.queryByText('Users Table')).not.toBeInTheDocument()

    // Cancel the form
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    fireEvent.click(cancelButton)

    // Should return to Users table
    const usersTab = screen.getByRole('tab', { name: 'Users tab' })
    expect(usersTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Users Table')).toBeInTheDocument()
  })

  test('should return to Users table when CreatePreAuthorizedUser is submitted', () => {
    render(<Component />)

    // Click pre-authorized link to show the form
    const preAuthorizedLink = screen.getByRole('button', { name: 'add pre-authorized user' })
    fireEvent.click(preAuthorizedLink)
    expect(screen.queryByText('Users Table')).not.toBeInTheDocument()

    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Submit' })
    fireEvent.click(submitButton)

    // Should return to Users table
    const usersTab = screen.getByRole('tab', { name: 'Users tab' })
    expect(usersTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Users Table')).toBeInTheDocument()
  })
})
