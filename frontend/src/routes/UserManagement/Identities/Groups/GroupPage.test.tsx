/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import { Group, User } from '../../../../resources/rbac'
import { GroupPage } from './GroupPage'
import { useCurrentGroup } from './useCurrentGroup'
import { useUsersByNames } from '../Users/useUsersSearch'
import { useSharedValue, useSharedAtoms } from '../../../../shared-atoms'

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

jest.mock('../../../../shared-atoms', () => ({
  useSharedValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

jest.mock('./useCurrentGroup', () => ({
  useCurrentGroup: jest.fn(),
}))

jest.mock('../Users/useUsersSearch', () => ({
  useUsersByNames: jest.fn(),
}))

const mockUseSharedValue = useSharedValue as jest.MockedFunction<typeof useSharedValue>
const mockUseSharedAtoms = useSharedAtoms as jest.MockedFunction<typeof useSharedAtoms>
const mockUseCurrentGroup = useCurrentGroup as jest.MockedFunction<typeof useCurrentGroup>
const mockUseUsersByNames = useUsersByNames as jest.MockedFunction<typeof useUsersByNames>

const authAtom = Symbol('isDirectAuthenticationEnabledState')

const mockGroup: Group = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'Group',
  metadata: {
    name: 'kubevirt-admins',
    uid: 'kubevirt-admins-uid',
    creationTimestamp: '2023-01-01T00:00:00Z',
  },
  users: ['admin1'],
}

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
]

function Component({ groupId = 'kubevirt-admins-uid' }: { groupId?: string }) {
  return (
    <StateProvider>
      <MemoryRouter initialEntries={[`/groups/${groupId}`]}>
        <Routes>
          <Route path="/groups/:id" element={<GroupPage />} />
        </Routes>
      </MemoryRouter>
    </StateProvider>
  )
}

describe('GroupPage', () => {
  beforeEach(() => {
    mockUseSharedAtoms.mockReturnValue({
      isDirectAuthenticationEnabledState: authAtom,
    } as any)

    mockUseSharedValue.mockImplementation((atom: unknown) => {
      if (atom === authAtom) return false
      return undefined
    })

    mockUseCurrentGroup.mockReturnValue({ group: mockGroup, loaded: true })
    mockUseUsersByNames.mockReturnValue({ users: mockUsers, loaded: true })
  })

  test('should render group page with data', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'kubevirt-admins' })).toBeInTheDocument()
    })
  })

  test('should render group not found error', async () => {
    mockUseCurrentGroup.mockReturnValue({ group: undefined, loaded: true })
    render(<Component groupId="non-existent-uid" />)

    await waitFor(() => {
      expect(screen.getByText('Not found')).toBeInTheDocument()
      expect(screen.getByText('Back to groups')).toBeInTheDocument()
    })
  })

  test('should render group page with navigation tabs', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'kubevirt-admins' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Details' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'YAML' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Role assignments' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Users' })).toBeInTheDocument()
    })
  })

  test('should hide YAML and Users tabs when isDirectAuthenticationEnabled', async () => {
    mockUseSharedValue.mockImplementation((atom: unknown) => {
      if (atom === authAtom) return true
      return undefined
    })

    render(<Component />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'kubevirt-admins' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Details' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Role assignments' })).toBeInTheDocument()
      expect(screen.queryByRole('tab', { name: 'YAML' })).not.toBeInTheDocument()
      expect(screen.queryByRole('tab', { name: 'Users' })).not.toBeInTheDocument()
    })
  })

  test('should load group members via Search by name', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'kubevirt-admins' })).toBeInTheDocument()
    })
    expect(mockUseUsersByNames).toHaveBeenCalledWith(['admin1'])
  })
})
