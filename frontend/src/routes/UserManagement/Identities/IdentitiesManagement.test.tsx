/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC } from '../../../lib/nock-util'
import IdentitiesManagement from './IdentitiesManagement'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { User, Group } from '../../../resources/rbac'

jest.mock('../../../shared-recoil', () => ({
  useRecoilValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

jest.mock('../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
}))

const mockUseRecoilValue = useRecoilValue as jest.MockedFunction<typeof useRecoilValue>
const mockUseSharedAtoms = useSharedAtoms as jest.MockedFunction<typeof useSharedAtoms>

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
    mockUseRecoilValue.mockClear()
    mockUseSharedAtoms.mockClear()

    mockUseSharedAtoms.mockReturnValue({
      usersState: {} as any,
      groupsState: {} as any,
      multiclusterRoleAssignmentState: {} as any,
      isDirectAuthenticationEnabledState: {} as any,
    } as any)
  })

  test('should render without errors', () => {
    mockUseRecoilValue.mockReturnValue(false)

    render(
      <RecoilRoot>
        <MemoryRouter initialEntries={['/multicloud/user-management/identities/users']}>
          <IdentitiesManagement />
        </MemoryRouter>
      </RecoilRoot>
    )

    expect(document.body).toBeInTheDocument()
  })

  test('should redirect UserYaml route to UserDetails when isDirectAuthenticationEnabled', async () => {
    mockUseRecoilValue
      .mockReturnValueOnce(true) // IdentitiesManagement: isDirectAuth
      .mockReturnValueOnce([mockUser]) // useMergedUsers: usersState
      .mockReturnValueOnce([]) // useMergedUsers: mraState
      .mockReturnValueOnce([]) // UserPage: groupsState
      .mockReturnValueOnce(true) // UserPage: isDirectAuth

    render(
      <RecoilRoot>
        <MemoryRouter initialEntries={['/users/test-user-uid/yaml']}>
          <IdentitiesManagement />
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Test User' })).toBeInTheDocument()
      expect(screen.queryByRole('tab', { name: 'YAML' })).not.toBeInTheDocument()
    })
  })

  test('should redirect UserGroups route to UserDetails when isDirectAuthenticationEnabled', async () => {
    mockUseRecoilValue
      .mockReturnValueOnce(true) // IdentitiesManagement: isDirectAuth
      .mockReturnValueOnce([mockUser]) // useMergedUsers: usersState
      .mockReturnValueOnce([]) // useMergedUsers: mraState
      .mockReturnValueOnce([]) // UserPage: groupsState
      .mockReturnValueOnce(true) // UserPage: isDirectAuth

    render(
      <RecoilRoot>
        <MemoryRouter initialEntries={['/users/test-user-uid/groups']}>
          <IdentitiesManagement />
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Test User' })).toBeInTheDocument()
      expect(screen.queryByRole('tab', { name: 'Groups' })).not.toBeInTheDocument()
    })
  })

  test('should redirect GroupYaml route to GroupDetails when isDirectAuthenticationEnabled', async () => {
    mockUseRecoilValue
      .mockReturnValueOnce(true) // IdentitiesManagement: isDirectAuth
      .mockReturnValueOnce([mockGroup]) // useMergedGroups: groupsState
      .mockReturnValueOnce([]) // useMergedGroups: mraState
      .mockReturnValueOnce([]) // GroupPage: usersState
      .mockReturnValueOnce(true) // GroupPage: isDirectAuth

    render(
      <RecoilRoot>
        <MemoryRouter initialEntries={['/groups/test-group-uid/yaml']}>
          <IdentitiesManagement />
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'test-group' })).toBeInTheDocument()
      expect(screen.queryByRole('tab', { name: 'YAML' })).not.toBeInTheDocument()
    })
  })

  test('should redirect GroupUsers route to GroupDetails when isDirectAuthenticationEnabled', async () => {
    mockUseRecoilValue
      .mockReturnValueOnce(true) // IdentitiesManagement: isDirectAuth
      .mockReturnValueOnce([mockGroup]) // useMergedGroups: groupsState
      .mockReturnValueOnce([]) // useMergedGroups: mraState
      .mockReturnValueOnce([]) // GroupPage: usersState
      .mockReturnValueOnce(true) // GroupPage: isDirectAuth

    render(
      <RecoilRoot>
        <MemoryRouter initialEntries={['/groups/test-group-uid/users']}>
          <IdentitiesManagement />
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'test-group' })).toBeInTheDocument()
      expect(screen.queryByRole('tab', { name: 'Users' })).not.toBeInTheDocument()
    })
  })
})
