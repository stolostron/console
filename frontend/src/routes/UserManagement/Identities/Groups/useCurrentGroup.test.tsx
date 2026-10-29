/* Copyright Contributors to the Open Cluster Management project */
import { renderHook, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'
import { generatePath, MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { useFleetSearchSubscription } from '@stolostron/multicluster-sdk/lib/api/useFleetSearchSubscription'
import { NavigationPath } from '../../../../NavigationPath'
import { MulticlusterRoleAssignment } from '../../../../resources/multicluster-role-assignment'
import { Group } from '../../../../resources/rbac'
import { getResource, ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { AcmToastContext } from '../../../../ui-components'
import { searchClient } from '../../../Search/search-sdk/search-client'
import { useSharedAtoms, useSharedValue } from '../../../../shared-atoms'
import { useCurrentGroup } from './useCurrentGroup'

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

const kubevirtAdmins: Group = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'Group',
  metadata: {
    name: 'kubevirt-admins',
    uid: 'kubevirt-admins-uid',
    creationTimestamp: '2023-01-01T00:00:00Z',
  },
  users: ['admin1'],
}

const opsMra: MulticlusterRoleAssignment = {
  apiVersion: 'rbac.open-cluster-management.io/v1beta1',
  kind: 'MulticlusterRoleAssignment',
  metadata: { name: 'mra-ops', creationTimestamp: '2023-02-01T00:00:00Z' },
  spec: {
    subject: { kind: 'Group', name: 'ops-team' },
    roleAssignments: [],
  },
}

function wrapper(groupId: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AcmToastContext.Provider value={{ addAlert } as never}>
        <MemoryRouter initialEntries={[generatePath(NavigationPath.identitiesGroupsDetails, { id: groupId })]}>
          <LocationProbe />
          <Routes>
            <Route path={NavigationPath.identitiesGroupsDetails} element={children} />
          </Routes>
        </MemoryRouter>
      </AcmToastContext.Provider>
    )
  }
}

function searchEvent(
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  name: string,
  uid = 'local-cluster/kubevirt-admins-uid'
) {
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

function mockSearchWithKubevirtAdmins() {
  mockSearchQuery.mockResolvedValue({
    data: {
      searchResult: [{ items: [{ name: 'kubevirt-admins', _uid: 'local-cluster/kubevirt-admins-uid' }] }],
    },
  })
}

describe('useCurrentGroup', () => {
  beforeEach(() => {
    mockUseSharedAtoms.mockReturnValue({
      multiclusterRoleAssignmentState: mraAtom,
    } as any)
    mockUseSharedValue.mockImplementation((atom: unknown) => {
      if (atom === mraAtom) return []
      return undefined
    })
    mockGetResource.mockImplementation((resource: Group) => {
      if (resource.metadata.name === 'kubevirt-admins') {
        return { promise: Promise.resolve(kubevirtAdmins) }
      }
      return { promise: notFound() }
    })
    mockSearchQuery.mockResolvedValue({ data: { searchResult: [{ items: [] }] } })
    mockUseFleetSearchSubscription.mockReturnValue([undefined, false, undefined])
    addAlert.mockClear()
  })

  test('resolves uid via Search then loads the Group CR', async () => {
    mockSearchWithKubevirtAdmins()
    const { result } = renderHook(() => useCurrentGroup(), { wrapper: wrapper('kubevirt-admins-uid') })

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
      expect(result.current.group?.metadata.name).toBe('kubevirt-admins')
      expect(result.current.group?.users).toEqual(['admin1'])
    })
    expect(mockSearchQuery).toHaveBeenCalledTimes(1)
    expect(mockGetResource).toHaveBeenCalledTimes(1)
    expect(mockGetResource).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: expect.objectContaining({ name: 'kubevirt-admins' }) })
    )
  })

  test('resolves name via Search then loads the Group CR (same flow as uid)', async () => {
    mockSearchWithKubevirtAdmins()
    const { result } = renderHook(() => useCurrentGroup(), { wrapper: wrapper('kubevirt-admins') })

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
      expect(result.current.group?.metadata.name).toBe('kubevirt-admins')
    })
    expect(mockSearchQuery).toHaveBeenCalledTimes(1)
    expect(mockGetResource).toHaveBeenCalledTimes(1)
  })

  test('returns loaded with no group when Search finds nothing', async () => {
    const { result } = renderHook(() => useCurrentGroup(), { wrapper: wrapper('missing-uid') })

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
    })
    expect(result.current.group).toBeUndefined()
    expect(result.current.error).toBeUndefined()
    expect(mockGetResource).not.toHaveBeenCalled()
  })

  test('falls back to an MRA-only group when Search finds nothing', async () => {
    mockUseSharedValue.mockImplementation((atom: unknown) => {
      if (atom === mraAtom) return [opsMra]
      return undefined
    })

    const { result } = renderHook(() => useCurrentGroup(), { wrapper: wrapper('ops-team') })

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
      expect(result.current.group?.metadata.name).toBe('ops-team')
    })
    expect(mockGetResource).not.toHaveBeenCalled()
    // Still watch by name so a later Group CR INSERT upgrades the page.
    expect(mockUseFleetSearchSubscription).toHaveBeenLastCalledWith({
      filters: [
        { property: 'kind', values: ['Group'] },
        { property: 'apigroup', values: ['user.openshift.io'] },
        { property: '_hubClusterResource', values: ['*'] },
        { property: 'name', values: ['ops-team'] },
      ],
    })
  })

  test('falls back to an MRA-only group when Search fails', async () => {
    mockUseSharedValue.mockImplementation((atom: unknown) => {
      if (atom === mraAtom) return [opsMra]
      return undefined
    })
    mockSearchQuery.mockRejectedValue(new Error('search unavailable'))

    const { result } = renderHook(() => useCurrentGroup(), { wrapper: wrapper('ops-team') })

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
      expect(result.current.group?.metadata.name).toBe('ops-team')
    })
    expect(mockUseFleetSearchSubscription).toHaveBeenLastCalledWith({
      filters: expect.arrayContaining([{ property: 'name', values: ['ops-team'] }]),
    })
  })

  test('loads the Group CR when Search INSERTs while viewing an MRA-only identity', async () => {
    mockUseSharedValue.mockImplementation((atom: unknown) => {
      if (atom === mraAtom) return [opsMra]
      return undefined
    })
    const created: Group = {
      apiVersion: 'user.openshift.io/v1',
      kind: 'Group',
      metadata: { name: 'ops-team', uid: 'ops-team-uid', creationTimestamp: '2026-10-21T10:00:00Z' },
      users: ['ops-user'],
    }
    mockGetResource.mockImplementation((resource: Group) => {
      if (resource.metadata.name === 'ops-team') {
        return { promise: Promise.resolve(created) }
      }
      return { promise: notFound() }
    })

    const { result, rerender } = renderHook(() => useCurrentGroup(), { wrapper: wrapper('ops-team') })
    await waitFor(() => {
      expect(result.current.group?.metadata.uid).toBe('ops-team')
      expect(result.current.group?.users).toEqual([])
    })

    mockUseFleetSearchSubscription.mockReturnValue([
      searchEvent('INSERT', 'ops-team', 'weekly/ops-team-uid'),
      false,
      undefined,
    ])
    rerender()

    await waitFor(() => {
      expect(result.current.group?.metadata.uid).toBe('ops-team-uid')
      expect(result.current.group?.users).toEqual(['ops-user'])
    })
    expect(result.current.loaded).toBe(true)
    expect(mockGetResource).toHaveBeenCalled()
  })

  test('refetches the Group CR on a Search UPDATE without unloading the page', async () => {
    mockSearchWithKubevirtAdmins()
    mockGetResource.mockImplementation(() => {
      const users = mockGetResource.mock.calls.length > 1 ? ['admin1', 'admin2'] : ['admin1']
      return { promise: Promise.resolve({ ...kubevirtAdmins, users }) }
    })

    const { result, rerender } = renderHook(() => useCurrentGroup(), { wrapper: wrapper('kubevirt-admins-uid') })

    await waitFor(() => {
      expect(result.current.group?.users).toEqual(['admin1'])
    })
    expect(mockUseFleetSearchSubscription).toHaveBeenLastCalledWith({
      filters: [
        { property: 'kind', values: ['Group'] },
        { property: 'apigroup', values: ['user.openshift.io'] },
        { property: '_hubClusterResource', values: ['*'] },
        { property: 'name', values: ['kubevirt-admins'] },
      ],
    })

    mockUseFleetSearchSubscription.mockReturnValue([searchEvent('UPDATE', 'kubevirt-admins'), false, undefined])
    rerender()

    expect(result.current.loaded).toBe(true)
    await waitFor(() => {
      expect(result.current.group?.users).toEqual(['admin1', 'admin2'])
    })
    expect(result.current.loaded).toBe(true)
    expect(mockGetResource).toHaveBeenCalledTimes(2)
  })

  test('navigates to the role-assignment identity when the Group CR is deleted', async () => {
    mockSearchWithKubevirtAdmins()
    mockUseSharedValue.mockImplementation((atom: unknown) => {
      if (atom === mraAtom) {
        return [
          {
            ...opsMra,
            spec: { subject: { kind: 'Group', name: 'kubevirt-admins' }, roleAssignments: [] },
          },
        ]
      }
      return undefined
    })

    const { result, rerender } = renderHook(() => useCurrentGroup(), { wrapper: wrapper('kubevirt-admins-uid') })
    await waitFor(() => {
      expect(result.current.group?.metadata.uid).toBe('kubevirt-admins-uid')
    })

    mockUseFleetSearchSubscription.mockReturnValue([searchEvent('DELETE', 'kubevirt-admins'), false, undefined])
    rerender()

    await waitFor(() => {
      expect(pathnameRef.current).toBe(generatePath(NavigationPath.identitiesGroupsDetails, { id: 'kubevirt-admins' }))
    })
    expect(addAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'warning',
        title: expect.stringContaining('kubevirt-admins'),
      })
    )
    expect(String(addAlert.mock.calls[0][0].title)).toMatch(/role assignment/i)
  })

  test('returns to the group list when a deleted Group has no role assignment', async () => {
    mockSearchWithKubevirtAdmins()
    const { result, rerender } = renderHook(() => useCurrentGroup(), { wrapper: wrapper('kubevirt-admins-uid') })
    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
    })

    mockUseFleetSearchSubscription.mockReturnValue([searchEvent('DELETE', 'kubevirt-admins'), false, undefined])
    rerender()

    await waitFor(() => {
      expect(pathnameRef.current).toBe(NavigationPath.identitiesGroups)
    })
    expect(addAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'warning',
        title: expect.stringContaining('kubevirt-admins'),
      })
    )
  })
})
