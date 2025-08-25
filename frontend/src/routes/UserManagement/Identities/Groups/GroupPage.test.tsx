/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { GroupDetail } from './GroupPage'
import { User, Group } from '../../../../resources/rbac'

jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
}))

jest.mock('../../../../lib/useQuery', () => ({
  useQuery: jest.fn(),
}))

import { useQuery } from '../../../../lib/useQuery'

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>

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

const mockUsers: User[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: {
      name: 'test-user',
      uid: 'test-user-uid',
      creationTimestamp: '2025-01-24T16:00:00Z',
    },
    identities: ['htpasswd:test-user'],
    groups: ['test-group'],
    fullName: 'Test User',
  },
]

function Component({ groupId = 'test-group' }: { groupId?: string }) {
  return (
    <RecoilRoot>
      <MemoryRouter initialEntries={[`/groups/${groupId}`]}>
        <Routes>
          <Route path="/groups/:id" element={<GroupDetail />} />
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('GroupPage', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    mockUseQuery.mockClear()
  })

  test('should render loading state', () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: undefined,
        loading: true,
        error: undefined,
        startPolling: jest.fn(),
        stopPolling: jest.fn(),
        refresh: jest.fn(),
      })
      .mockReturnValueOnce({
        data: undefined,
        loading: true,
        error: undefined,
        startPolling: jest.fn(),
        stopPolling: jest.fn(),
        refresh: jest.fn(),
      })

    render(<Component />)

    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  test('should render group not found error', () => {
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

    expect(screen.getByText('Not found')).toBeInTheDocument()
    expect(screen.getByText('button.backToGroups')).toBeInTheDocument()
  })

  test('should render group page with navigation tabs', () => {
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
        data: [mockGroup],
        loading: false,
        error: undefined,
        startPolling: jest.fn(),
        stopPolling: jest.fn(),
        refresh: jest.fn(),
      })

    render(<Component />)

    expect(screen.getByRole('heading', { level: 1, name: 'test-group' })).toBeInTheDocument()
    expect(screen.getAllByText('test-group').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Details' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'YAML' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Role assignments' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument()
  })

  test('should render group page with empty group name', () => {
    const groupWithEmptyName = {
      ...mockGroup,
      metadata: {
        ...mockGroup.metadata,
        name: '',
      },
    }
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
        data: [groupWithEmptyName],
        loading: false,
        error: undefined,
        startPolling: jest.fn(),
        stopPolling: jest.fn(),
        refresh: jest.fn(),
      })

    render(<Component />)

    expect(screen.getByText('Not found')).toBeInTheDocument()
    expect(screen.getByText('button.backToGroups')).toBeInTheDocument()
  })

  test('should find group by UID', () => {
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
        data: [mockGroup],
        loading: false,
        error: undefined,
        startPolling: jest.fn(),
        stopPolling: jest.fn(),
        refresh: jest.fn(),
      })

    render(<Component groupId="test-group-uid" />)

    expect(screen.getByRole('heading', { level: 1, name: 'test-group' })).toBeInTheDocument()
  })
})
