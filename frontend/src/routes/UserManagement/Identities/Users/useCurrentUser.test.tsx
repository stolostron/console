/* Copyright Contributors to the Open Cluster Management project */
import { renderHook, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'
import { generatePath, MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { useFleetSearchSubscription } from '@stolostron/multicluster-sdk/lib/api/useFleetSearchSubscription'
import { NavigationPath } from '../../../../NavigationPath'
import { MulticlusterRoleAssignment } from '../../../../resources/multicluster-role-assignment'
import { User } from '../../../../resources/rbac'
import { getResource, ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { AcmToastContext } from '../../../../ui-components'
import { searchClient } from '../../../Search/search-sdk/search-client'
import { useSharedAtoms, useSharedValue } from '../../../../shared-atoms'
import { useCurrentUser } from './useCurrentUser'

jest.mock('@stolostron/multicluster-sdk/lib/api/useFleetSearchSubscription', () => ({
  useFleetSearchSubscription: jest.fn(),
}))

jest.mock('../../../../shared-atoms', () => ({
  useSharedValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

jest.mock('../../../../hooks/use-local-hub', () => ({
  useLocalHubName: () => 'local-cluster',
}))

jest.mock('../../../../resources/utils', () => {
  const actual = jest.requireActual('../../../../resources/utils')
  return {
    ...actual,
    getResource: jest.fn(),
  }
})

jest.mock('../../../Search/search-sdk/search-client', () => ({
  searchClient: { query: jest.fn() },
}))

const mockUseSharedValue = useSharedValue as jest.MockedFunction<typeof useSharedValue>
const mockUseSharedAtoms = useSharedAtoms as jest.MockedFunction<typeof useSharedAtoms>
const mockGetResource = getResource as jest.Mock
const mockSearchQuery = searchClient.query as jest.Mock
const mockUseFleetSearchSubscription = useFleetSearchSubscription as jest.Mock
const addAlert = jest.fn()
const pathnameRef = { current: '' }

function LocationProbe() {
  pathnameRef.current = useLocation().pathname
  return null
}

const mraAtom = Symbol('multiclusterRoleAssignmentState')

const testUser: User = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'User',
  metadata: {
    name: 'test-user',
    uid: 'test-user-uid',
    creationTimestamp: '2023-01-01T00:00:00Z',
  },
  identities: ['htpasswd:test-user'],
  groups: ['developers'],
  fullName: 'Test User',
}

const charlieMra: MulticlusterRoleAssignment = {
  apiVersion: 'rbac.open-cluster-management.io/v1beta1',
  kind: 'MulticlusterRoleAssignment',
  metadata: { name: 'mra-charlie', creationTimestamp: '2023-02-01T00:00:00Z' },
  spec: {
    subject: { kind: 'User', name: 'charlie' },
    roleAssignments: [],
  },
}

function wrapper(userId: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AcmToastContext.Provider value={{ addAlert } as never}>
        <MemoryRouter initialEntries={[generatePath(NavigationPath.identitiesUsersDetails, { id: userId })]}>
          <LocationProbe />
          <Routes>
            <Route path={NavigationPath.identitiesUsersDetails} element={children} />
          </Routes>
        </MemoryRouter>
      </AcmToastContext.Provider>
    )
  }
}

function searchEvent(operation: 'INSERT' | 'UPDATE' | 'DELETE', name: string, uid = 'local-cluster/test-user-uid') {
  return {
    operation,
    uid,
    timestamp: `${operation}-${name}`,
    newData: operation === 'DELETE' ? null : { name },
    oldData: { name },
  }
}

function notFound() {
  return Promise.reject(new ResourceError(ResourceErrorCode.NotFound))
}

function mockSearchWithTestUser() {
  mockSearchQuery.mockResolvedValue({
    data: {
      searchResult: [{ items: [{ name: 'test-user', _uid: 'local-cluster/test-user-uid' }] }],
    },
  })
}

describe('useCurrentUser', () => {
  beforeEach(() => {
    mockUseSharedAtoms.mockReturnValue({
      multiclusterRoleAssignmentState: mraAtom,
    } as any)
    mockUseSharedValue.mockImplementation((atom: unknown) => {
      if (atom === mraAtom) return []
      return undefined
    })
    mockGetResource.mockImplementation((resource: User) => {
      if (resource.metadata.name === 'test-user') {
        return { promise: Promise.resolve(testUser) }
      }
      return { promise: notFound() }
    })
    mockSearchQuery.mockResolvedValue({ data: { searchResult: [{ items: [] }] } })
    mockUseFleetSearchSubscription.mockReturnValue([undefined, false, undefined])
    addAlert.mockClear()
  })

  test('resolves uid via Search then loads the User CR', async () => {
    mockSearchWithTestUser()
    const { result } = renderHook(() => useCurrentUser(), { wrapper: wrapper('test-user-uid') })

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
      expect(result.current.user?.metadata.name).toBe('test-user')
      expect(result.current.user?.fullName).toBe('Test User')
    })
    expect(mockSearchQuery).toHaveBeenCalledTimes(1)
    expect(mockGetResource).toHaveBeenCalledTimes(1)
  })

  test('returns loaded with no user when Search and getResource find nothing', async () => {
    const { result } = renderHook(() => useCurrentUser(), { wrapper: wrapper('missing-uid') })

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
    })
    expect(result.current.user).toBeUndefined()
    expect(mockGetResource).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: expect.objectContaining({ name: 'missing-uid' }) })
    )
  })

  test('loads the User CR by route id when Search has not indexed it yet', async () => {
    const { result } = renderHook(() => useCurrentUser(), { wrapper: wrapper('test-user') })

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
      expect(result.current.user?.metadata.name).toBe('test-user')
      expect(result.current.user?.fullName).toBe('Test User')
    })
    expect(mockGetResource).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: expect.objectContaining({ name: 'test-user' }) })
    )
  })

  test('falls back to an MRA-only user when Search and getResource find nothing', async () => {
    mockUseSharedValue.mockImplementation((atom: unknown) => {
      if (atom === mraAtom) return [charlieMra]
      return undefined
    })

    const { result } = renderHook(() => useCurrentUser(), { wrapper: wrapper('charlie') })

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
      expect(result.current.user?.metadata.name).toBe('charlie')
    })
    expect(mockGetResource).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: expect.objectContaining({ name: 'charlie' }) })
    )
    expect(mockUseFleetSearchSubscription).toHaveBeenLastCalledWith({
      filters: [
        { property: 'kind', values: ['User'] },
        { property: 'apigroup', values: ['user.openshift.io'] },
        { property: '_hubClusterResource', values: ['*'] },
        { property: 'name', values: ['charlie'] },
      ],
    })
  })

  test('falls back to an MRA-only user when getResource returns Forbidden for the route id', async () => {
    mockUseSharedValue.mockImplementation((atom: unknown) => {
      if (atom === mraAtom) return [charlieMra]
      return undefined
    })
    mockGetResource.mockImplementation(() => ({
      promise: Promise.reject(new ResourceError(ResourceErrorCode.Forbidden)),
    }))

    const { result } = renderHook(() => useCurrentUser(), { wrapper: wrapper('charlie') })

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
      expect(result.current.user?.metadata.name).toBe('charlie')
      expect(result.current.error).toBeUndefined()
    })
  })

  test('surfaces Forbidden for an unresolved route id when no matching MRA exists', async () => {
    mockGetResource.mockImplementation(() => ({
      promise: Promise.reject(new ResourceError(ResourceErrorCode.Forbidden)),
    }))

    const { result } = renderHook(() => useCurrentUser(), { wrapper: wrapper('charlie') })

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
      expect(result.current.user).toBeUndefined()
      expect((result.current.error as ResourceError).code).toBe(ResourceErrorCode.Forbidden)
    })
  })

  test('retries after Forbidden when a matching MRA arrives later', async () => {
    mockGetResource.mockImplementation(() => ({
      promise: Promise.reject(new ResourceError(ResourceErrorCode.Forbidden)),
    }))

    const { result, rerender } = renderHook(() => useCurrentUser(), { wrapper: wrapper('charlie') })

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
      expect((result.current.error as ResourceError).code).toBe(ResourceErrorCode.Forbidden)
    })

    mockUseSharedValue.mockImplementation((atom: unknown) => {
      if (atom === mraAtom) return [charlieMra]
      return undefined
    })
    rerender()

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
      expect(result.current.user?.metadata.name).toBe('charlie')
      expect(result.current.error).toBeUndefined()
    })
  })

  test('surfaces Forbidden when Search resolved a name', async () => {
    mockSearchWithTestUser()
    mockGetResource.mockImplementation(() => ({
      promise: Promise.reject(new ResourceError(ResourceErrorCode.Forbidden)),
    }))

    const { result } = renderHook(() => useCurrentUser(), { wrapper: wrapper('test-user-uid') })

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
      expect(result.current.user).toBeUndefined()
      expect(result.current.error).toBeInstanceOf(ResourceError)
      expect((result.current.error as ResourceError).code).toBe(ResourceErrorCode.Forbidden)
    })
  })

  test('refetches the User CR on a Search UPDATE without unloading the page', async () => {
    mockSearchWithTestUser()
    mockGetResource.mockImplementation(() => {
      const fullName = mockGetResource.mock.calls.length > 1 ? 'Updated User' : 'Test User'
      return { promise: Promise.resolve({ ...testUser, fullName }) }
    })

    const { result, rerender } = renderHook(() => useCurrentUser(), { wrapper: wrapper('test-user-uid') })

    await waitFor(() => {
      expect(result.current.user?.fullName).toBe('Test User')
    })

    mockUseFleetSearchSubscription.mockReturnValue([searchEvent('UPDATE', 'test-user'), false, undefined])
    rerender()

    expect(result.current.loaded).toBe(true)
    await waitFor(() => {
      expect(result.current.user?.fullName).toBe('Updated User')
    })
  })

  test('navigates to the role-assignment identity when the User CR is deleted', async () => {
    mockSearchWithTestUser()
    mockUseSharedValue.mockImplementation((atom: unknown) => {
      if (atom === mraAtom) {
        return [
          {
            ...charlieMra,
            spec: { subject: { kind: 'User', name: 'test-user' }, roleAssignments: [] },
          },
        ]
      }
      return undefined
    })

    const { result, rerender } = renderHook(() => useCurrentUser(), { wrapper: wrapper('test-user-uid') })
    await waitFor(() => {
      expect(result.current.user?.metadata.uid).toBe('test-user-uid')
    })

    mockUseFleetSearchSubscription.mockReturnValue([searchEvent('DELETE', 'test-user'), false, undefined])
    rerender()

    await waitFor(() => {
      expect(pathnameRef.current).toBe(generatePath(NavigationPath.identitiesUsersDetails, { id: 'test-user' }))
    })
    expect(String(addAlert.mock.calls[0][0].title)).toMatch(/role assignment/i)
  })

  test('returns to the user list when a deleted User has no role assignment', async () => {
    mockSearchWithTestUser()
    const { result, rerender } = renderHook(() => useCurrentUser(), { wrapper: wrapper('test-user-uid') })
    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
    })

    mockUseFleetSearchSubscription.mockReturnValue([searchEvent('DELETE', 'test-user'), false, undefined])
    rerender()

    await waitFor(() => {
      expect(pathnameRef.current).toBe(NavigationPath.identitiesUsers)
    })
  })
})
