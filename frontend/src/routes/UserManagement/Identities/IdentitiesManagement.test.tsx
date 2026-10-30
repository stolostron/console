/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import { nockIgnoreRBAC } from '../../../lib/nock-util'
import IdentitiesManagement from './IdentitiesManagement'
import { useSharedValue, useSharedAtoms } from '../../../shared-atoms'
import { User, Group } from '../../../resources/rbac'
import { useCurrentGroup } from './Groups/useCurrentGroup'
import { useCurrentUser } from './Users/useCurrentUser'
import { useUsersByNames } from './Users/useUsersSearch'

jest.mock('../../../shared-atoms', () => ({
  useSharedValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

jest.mock('./Groups/useCurrentGroup', () => ({
  useCurrentGroup: jest.fn(),
}))

jest.mock('./Users/useCurrentUser', () => ({
  useCurrentUser: jest.fn(),
}))

jest.mock('./Users/useUsersSearch', () => ({
  useUsersByNames: jest.fn(),
}))

jest.mock('../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
}))

const mockUseSharedValue = useSharedValue as jest.MockedFunction<typeof useSharedValue>
const mockUseSharedAtoms = useSharedAtoms as jest.MockedFunction<typeof useSharedAtoms>
const mockUseCurrentGroup = useCurrentGroup as jest.MockedFunction<typeof useCurrentGroup>
const mockUseCurrentUser = useCurrentUser as jest.MockedFunction<typeof useCurrentUser>
const mockUseUsersByNames = useUsersByNames as jest.MockedFunction<typeof useUsersByNames>

const mockUser: User = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'User',
  metadata: {
    name: 'test-user',
    uid: 'test-user-uid',
    creationTimestamp: '2025-01-24T17:48:45Z',
  },
  fullName: 'Test User',
}

const mockGroup: Group = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'Group',
  metadata: {
    name: 'test-group',
    uid: 'test-group-uid',
    creationTimestamp: '2025-01-24T17:48:45Z',
  },
  users: ['test-user'],
}

describe('IdentitiesManagement Router', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    mockUseSharedValue.mockClear()
    mockUseSharedAtoms.mockClear()
    mockUseCurrentGroup.mockClear()
    mockUseCurrentUser.mockClear()
    mockUseUsersByNames.mockClear()

    mockUseSharedAtoms.mockReturnValue({
      isDirectAuthenticationEnabledState: {} as any,
    } as any)
    mockUseCurrentGroup.mockReturnValue({ group: mockGroup, loaded: true })
    mockUseCurrentUser.mockReturnValue({ user: mockUser, loaded: true })
    mockUseUsersByNames.mockReturnValue({ users: [], loaded: true })
  })

  test('should render without errors', () => {
    mockUseSharedValue.mockReturnValue(false)

    render(
      <StateProvider>
        <MemoryRouter initialEntries={['/multicloud/user-management/identities/users']}>
          <IdentitiesManagement />
        </MemoryRouter>
      </StateProvider>
    )

    expect(document.body).toBeInTheDocument()
  })

  test('should redirect UserYaml route to UserDetails when isDirectAuthenticationEnabled', async () => {
    mockUseSharedValue.mockReturnValue(true)

    render(
      <StateProvider>
        <MemoryRouter initialEntries={['/users/test-user-uid/yaml']}>
          <IdentitiesManagement />
        </MemoryRouter>
      </StateProvider>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Test User' })).toBeInTheDocument()
      expect(screen.queryByRole('tab', { name: 'YAML' })).not.toBeInTheDocument()
    })
  })

  test('should redirect UserGroups route to UserDetails when isDirectAuthenticationEnabled', async () => {
    mockUseSharedValue.mockReturnValue(true)

    render(
      <StateProvider>
        <MemoryRouter initialEntries={['/users/test-user-uid/groups']}>
          <IdentitiesManagement />
        </MemoryRouter>
      </StateProvider>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Test User' })).toBeInTheDocument()
      expect(screen.queryByRole('tab', { name: 'Groups' })).not.toBeInTheDocument()
    })
  })

  test('should redirect GroupYaml route to GroupDetails when isDirectAuthenticationEnabled', async () => {
    mockUseSharedValue.mockReturnValue(true)

    render(
      <StateProvider>
        <MemoryRouter initialEntries={['/groups/test-group-uid/yaml']}>
          <IdentitiesManagement />
        </MemoryRouter>
      </StateProvider>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'test-group' })).toBeInTheDocument()
      expect(screen.queryByRole('tab', { name: 'YAML' })).not.toBeInTheDocument()
    })
  })

  test('should redirect GroupUsers route to GroupDetails when isDirectAuthenticationEnabled', async () => {
    mockUseSharedValue.mockReturnValue(true)

    render(
      <StateProvider>
        <MemoryRouter initialEntries={['/groups/test-group-uid/users']}>
          <IdentitiesManagement />
        </MemoryRouter>
      </StateProvider>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'test-group' })).toBeInTheDocument()
      expect(screen.queryByRole('tab', { name: 'Users' })).not.toBeInTheDocument()
    })
  })
})
