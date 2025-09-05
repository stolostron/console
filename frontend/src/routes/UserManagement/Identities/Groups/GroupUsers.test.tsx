/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { GroupUsers } from './GroupUsers'
import { User, Group } from '../../../../resources/rbac'
import { useGroupDetailsContext } from './GroupPage'
import { getISOStringTimestamp } from '../../../../resources/utils/utils'

jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: () => ({ t: (s: string) => s }),
}))

let lastAcmTableProps: any

jest.mock('../../../../ui-components', () => {
  const actual = jest.requireActual('../../../../ui-components')

  const MockAcmTable = (props: any) => {
    lastAcmTableProps = props
    const { items = [], columns = [], emptyState } = props

    if (!items || items.length === 0) return emptyState ?? <div data-testid="AcmTable" />

    return (
      <table data-testid="AcmTable">
        <thead>
          <tr>
            {columns.map((c: any, i: number) => (
              <th key={i}>{typeof c.header === 'function' ? c.header() : c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((it: any, r: number) => (
            <tr key={r}>
              {columns.map((c: any, i: number) => (
                <td key={i}>{typeof c.cell === 'function' ? c.cell(it) : ''}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return {
    ...actual,
    AcmTable: MockAcmTable,
    AcmLoadingPage: () => <div>Loading</div>,
  }
})

jest.mock('./GroupPage', () => ({
  ...jest.requireActual('./GroupPage'),
  useGroupDetailsContext: jest.fn(),
}))

const mockGroup: Group = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'Group',
  metadata: {
    name: 'test-group',
    uid: 'test-group-uid',
    creationTimestamp: '2025-01-24T17:48:45Z',
  },
  users: ['test-user', 'other-user'],
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
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: {
      name: 'other-user',
      uid: 'other-user-uid',
      creationTimestamp: '2025-01-24T15:00:00Z',
    },
    identities: ['htpasswd:other-user'],
    groups: ['test-group', 'extra'],
    fullName: 'Other User',
  },
]

const mockUseGroupDetailsContext = useGroupDetailsContext as jest.MockedFunction<typeof useGroupDetailsContext>

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <GroupUsers />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('GroupUsers', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    mockUseGroupDetailsContext.mockClear()
    lastAcmTableProps = undefined
  })

  test('should render loading state', () => {
    mockUseGroupDetailsContext.mockReturnValue({
      group: undefined,
      users: undefined,
      loading: true,
      usersLoading: false,
    })

    render(<Component />)
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  test('should render group not found message', () => {
    mockUseGroupDetailsContext.mockReturnValue({
      group: undefined,
      users: undefined,
      loading: false,
      usersLoading: false,
    })

    render(<Component />)
    expect(screen.getByText('Not found')).toBeInTheDocument()
  })

  test('should render empty state when group has no users', () => {
    mockUseGroupDetailsContext.mockReturnValue({
      group: { ...mockGroup, users: [] },
      users: mockUsers,
      loading: false,
      usersLoading: false,
    })

    render(<Component />)
    expect(screen.getByText('No users found')).toBeInTheDocument()
    expect(screen.getByText('No users have been added to this group yet.')).toBeInTheDocument()
  })

  test('should render users table with group users', () => {
    mockUseGroupDetailsContext.mockReturnValue({
      group: mockGroup,
      users: mockUsers,
      loading: false,
      usersLoading: false,
    })

    render(<Component />)
    expect(screen.getByText('test-user')).toBeInTheDocument()
    expect(screen.getByText('other-user')).toBeInTheDocument()
  })

  test('should not show users that are not members of the group', () => {
    const usersWithNonMember: User[] = [
      ...mockUsers,
      {
        apiVersion: 'user.openshift.io/v1',
        kind: 'User',
        metadata: {
          name: 'non-member',
          uid: 'non-member-uid',
          creationTimestamp: '2025-01-24T14:00:00Z',
        },
        identities: ['htpasswd:non-member'],
        groups: ['other-group'],
        fullName: 'Non Member',
      },
    ]

    mockUseGroupDetailsContext.mockReturnValue({
      group: mockGroup,
      users: usersWithNonMember,
      loading: false,
      usersLoading: false,
    })

    render(<Component />)
    expect(screen.getByText('test-user')).toBeInTheDocument()
    expect(screen.getByText('other-user')).toBeInTheDocument()
    expect(screen.queryByText('non-member')).not.toBeInTheDocument()
  })

  test('covers exportContent for Name / Identity provider / Created columns', () => {
    mockUseGroupDetailsContext.mockReturnValue({
      group: mockGroup,
      users: mockUsers,
      loading: false,
      usersLoading: false,
    })

    render(<Component />)

    expect(lastAcmTableProps).toBeTruthy()
    const { columns } = lastAcmTableProps as { columns: any[]; items: User[] }

    const headerToText = (h: any) => (typeof h === 'function' ? h() : h)
    const byHeader = (label: string) => columns.find((c) => headerToText(c.header) === label)!

    const nameCol = byHeader('Name')
    const idpCol = byHeader('Identity provider')
    const createdCol = byHeader('Created')

    const u = mockUsers[0]

    expect(nameCol.exportContent(u)).toBe('test-user')

    expect(idpCol.exportContent(u)).toEqual(['htpasswd:test-user'])

    expect(createdCol.exportContent(u)).toBe(getISOStringTimestamp(u.metadata.creationTimestamp!))

    const noIdp: User = { ...u, identities: undefined }
    const noCreated: User = { ...u, metadata: { ...u.metadata, creationTimestamp: undefined } }

    expect(idpCol.exportContent(noIdp)).toBe('-')
    expect(createdCol.exportContent(noCreated)).toBe('')
  })
})
