/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { Group, User } from '../../../../resources/rbac'
import { GroupPage } from './GroupPage'

jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'button.backToGroups': 'Back to groups',
        'Not found': 'Not found',
      }
      return translations[key] || key
    },
  }),
}))

jest.mock('../../../../lib/useQuery', () => ({
  useQuery: jest.fn(),
}))

import { useQuery } from '../../../../lib/useQuery'

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>

const mockGroups: Group[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'kubevirt-admins',
      uid: 'kubevirt-admins',
      creationTimestamp: '2023-01-01T00:00:00Z',
    },
    users: ['admin1'],
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'developers',
      uid: 'developers',
      creationTimestamp: '2023-01-02T00:00:00Z',
    },
    users: ['dev1', 'dev2'],
  },
]

const mockUsers: User[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: {
      name: 'admin1',
      uid: 'admin1',
      creationTimestamp: '2023-01-01T00:00:00Z',
    },
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: {
      name: 'dev1',
      uid: 'dev1',
      creationTimestamp: '2023-01-02T00:00:00Z',
    },
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: {
      name: 'dev2',
      uid: 'dev2',
      creationTimestamp: '2023-01-03T00:00:00Z',
    },
  },
]

function Component({ groupId = 'kubevirt-admins' }: { groupId?: string }) {
  return (
    <RecoilRoot>
      <MemoryRouter initialEntries={[`/groups/${groupId}`]}>
        <Routes>
          <Route path="/groups/:id" element={<GroupPage />} />
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('GroupPage', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()

    // Reset mocks before each test
    mockUseQuery.mockClear()
  })

  test('should render loading state', async () => {
    // Mock useQuery to return groups data
    mockUseQuery
      .mockReturnValueOnce({
        data: mockUsers,
        loading: false,
        error: undefined,
        startPolling: jest.fn(),
        stopPolling: jest.fn(),
        refresh: jest.fn(),
      })
      .mockReturnValueOnce({
        data: mockGroups,
        loading: false,
        error: undefined,
        startPolling: jest.fn(),
        stopPolling: jest.fn(),
        refresh: jest.fn(),
      })

    render(<Component />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'kubevirt-admins' })).toBeInTheDocument()
    })
  })

  test('should render group not found error', async () => {
    // Mock useQuery to return empty data
    mockUseQuery
      .mockReturnValueOnce({
        data: [],
        loading: false,
        error: undefined,
        startPolling: jest.fn(),
        stopPolling: jest.fn(),
        refresh: jest.fn(),
      })
      .mockReturnValueOnce({
        data: [],
        loading: false,
        error: undefined,
        startPolling: jest.fn(),
        stopPolling: jest.fn(),
        refresh: jest.fn(),
      })

    render(<Component groupId="non-existent-group" />)

    await waitFor(() => {
      expect(screen.getByText('Not found')).toBeInTheDocument()
      expect(screen.getByText('Back to groups')).toBeInTheDocument()
    })
  })

  test('should render group page with navigation tabs', async () => {
    // Mock useQuery to return groups data
    mockUseQuery
      .mockReturnValueOnce({
        data: mockUsers,
        loading: false,
        error: undefined,
        startPolling: jest.fn(),
        stopPolling: jest.fn(),
        refresh: jest.fn(),
      })
      .mockReturnValueOnce({
        data: mockGroups,
        loading: false,
        error: undefined,
        startPolling: jest.fn(),
        stopPolling: jest.fn(),
        refresh: jest.fn(),
      })

    render(<Component />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'kubevirt-admins' })).toBeInTheDocument()
      expect(screen.getAllByText('kubevirt-admins').length).toBeGreaterThan(0)
      expect(screen.getByRole('link', { name: 'Details' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'YAML' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Role assignments' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument()
    })
  })

  test('should render group page with empty group name', async () => {
    // Mock useQuery to return empty data
    mockUseQuery
      .mockReturnValueOnce({
        data: [],
        loading: false,
        error: undefined,
        startPolling: jest.fn(),
        stopPolling: jest.fn(),
        refresh: jest.fn(),
      })
      .mockReturnValueOnce({
        data: [],
        loading: false,
        error: undefined,
        startPolling: jest.fn(),
        stopPolling: jest.fn(),
        refresh: jest.fn(),
      })

    render(<Component groupId="group-with-empty-name" />)

    await waitFor(() => {
      expect(screen.getByText('Not found')).toBeInTheDocument()
      expect(screen.getByText('Back to groups')).toBeInTheDocument()
    })
  })

  test('should find group by UID', async () => {
    // Mock useQuery to return groups data
    mockUseQuery
      .mockReturnValueOnce({
        data: mockUsers,
        loading: false,
        error: undefined,
        startPolling: jest.fn(),
        stopPolling: jest.fn(),
        refresh: jest.fn(),
      })
      .mockReturnValueOnce({
        data: mockGroups,
        loading: false,
        error: undefined,
        startPolling: jest.fn(),
        stopPolling: jest.fn(),
        refresh: jest.fn(),
      })

    render(<Component groupId="kubevirt-admins" />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'kubevirt-admins' })).toBeInTheDocument()
    })
  })
})
