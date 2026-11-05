/* Copyright Contributors to the Open Cluster Management project */
import { renderHook, waitFor } from '@testing-library/react'
import { SortByDirection } from '@patternfly/react-table'
import { useFleetSearch } from '@stolostron/multicluster-sdk/lib/api/useFleetSearch'
import type { SearchInput } from '@stolostron/multicluster-sdk'
import { User } from '../../../../resources/rbac'
import { MulticlusterRoleAssignment } from '../../../../resources/multicluster-role-assignment'
import { useSharedAtoms, useSharedValue } from '../../../../shared-atoms'
import { searchClient } from '../../../Search/search-sdk/search-client'
import { useSearchResultCountQuery } from '../../../Search/search-sdk/search-sdk'
import {
  findIndexedUserName,
  preferSearchBackedUsers,
  useUsersSearch,
  useUserIdentity,
  useHasHubUsers,
  useUsersByNames,
} from './useUsersSearch'

jest.mock('@stolostron/multicluster-sdk/lib/api/useFleetSearch', () => ({
  useFleetSearch: jest.fn(),
}))

jest.mock('../../../Search/search-sdk/search-sdk', () => ({
  useSearchResultCountQuery: jest.fn(),
  SearchResultItemsDocument: 'SearchResultItemsDocument',
}))

jest.mock('../../../Search/search-sdk/search-client', () => ({
  searchClient: { query: jest.fn() },
}))

jest.mock('../../../../hooks/use-local-hub', () => ({
  useLocalHubName: () => 'local-cluster',
}))

jest.mock('../../../../shared-atoms', () => ({
  useSharedValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

const mockUseFleetSearch = useFleetSearch as jest.MockedFunction<typeof useFleetSearch>
const mockUseSearchResultCountQuery = useSearchResultCountQuery as jest.Mock
const mockUseSharedValue = useSharedValue as jest.Mock
const mockUseSharedAtoms = useSharedAtoms as jest.Mock
const mockSearchQuery = searchClient.query as jest.Mock

const mraAtom = Symbol('multiclusterRoleAssignmentState')

const alice: User = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'User',
  metadata: { name: 'alice', uid: 'alice-uid', creationTimestamp: '2023-01-02T00:00:00Z' },
}

const charlieMra: MulticlusterRoleAssignment = {
  apiVersion: 'rbac.open-cluster-management.io/v1beta1',
  kind: 'MulticlusterRoleAssignment',
  metadata: { name: 'mra-charlie', creationTimestamp: '2023-02-01T00:00:00Z' },
  spec: { subject: { kind: 'User', name: 'charlie' }, roleAssignments: [] },
}

const aliceMra: MulticlusterRoleAssignment = {
  apiVersion: 'rbac.open-cluster-management.io/v1beta1',
  kind: 'MulticlusterRoleAssignment',
  metadata: { name: 'mra-alice', creationTimestamp: '2023-02-02T00:00:00Z' },
  spec: { subject: { kind: 'User', name: 'alice' }, roleAssignments: [] },
}

const columns = [
  { sort: 'metadata.name', isHidden: false },
  { sort: 'identities', isHidden: false },
  { sort: 'metadata.creationTimestamp', isHidden: false },
]

function isComparator(input: SearchInput): boolean {
  return (
    input.filters?.some((filter) => {
      const value = filter?.values?.[0]
      return typeof value === 'string' && (value.startsWith('<') || value.startsWith('>'))
    }) ?? false
  )
}

const refetchPage = jest.fn()
const refetchLookup = jest.fn()

function mockSearch(pageUsers: User[], indexed: User[] = pageUsers, ranks: number[] = []) {
  mockUseFleetSearch.mockImplementation((input, subscriptionEnabled) => {
    if (!input) return [undefined, true, undefined, jest.fn()]
    if (input.orderBy) return [pageUsers, true, undefined, refetchPage]
    if (subscriptionEnabled) return [pageUsers, true, undefined, refetchPage]
    const names = new Set(input.filters?.find((filter) => filter?.property === 'name')?.values ?? [])
    return [indexed.filter((user) => names.has(user.metadata.name ?? '')), true, undefined, refetchLookup]
  })

  mockUseSearchResultCountQuery.mockImplementation(
    (options?: { skip?: boolean; variables?: { input?: SearchInput[] } }) => {
      if (options?.skip) return { data: undefined, loading: false, error: undefined, refetch: jest.fn() }
      const inputs = options?.variables?.input ?? []
      if (inputs.some(isComparator)) {
        return {
          data: { searchResult: ranks.map((count) => ({ count })) },
          loading: false,
          error: undefined,
          refetch: jest.fn(),
        }
      }
      return {
        data: { searchResult: [{ count: pageUsers.length }] },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      }
    }
  )
  return { refetchPage, refetchLookup }
}

function setupAtoms(mras: MulticlusterRoleAssignment[] = []) {
  mockUseSharedAtoms.mockReturnValue({
    multiclusterRoleAssignmentState: mraAtom,
  } as any)
  mockUseSharedValue.mockImplementation((atom: unknown) => {
    if (atom === mraAtom) return mras
    return []
  })
}

describe('useUsersSearch', () => {
  beforeEach(() => {
    refetchPage.mockClear()
    refetchLookup.mockClear()
    setupAtoms()
    mockSearch([alice])
  })

  test('maps page, sort and keywords onto the subscribed Search query', () => {
    const { result } = renderHook(() =>
      useUsersSearch({
        columns,
        request: {
          page: 2,
          perPage: 5,
          search: 'Alice User',
          sortBy: { index: 2, direction: SortByDirection.desc },
          filters: {},
        },
      })
    )

    expect(mockUseFleetSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: 'created desc',
        keywords: ['Alice', 'User'],
        offset: 5,
        limit: 5,
        filters: expect.arrayContaining([
          { property: 'kind', values: ['User'] },
          { property: 'apigroup', values: ['user.openshift.io'] },
          { property: '_hubClusterResource', values: ['*'] },
        ]),
      }),
      true
    )
    expect(result.current.users.map((user) => user.metadata.name)).toEqual(['alice'])
    expect(result.current.processedItemCount).toBe(1)
  })

  test('includes an MRA user that Search has not indexed and skips one that it has', () => {
    setupAtoms([charlieMra, aliceMra])
    mockSearch([alice], [alice], [0])

    const { result } = renderHook(() =>
      useUsersSearch({
        columns,
        request: { page: 1, perPage: 10, sortBy: { index: 0, direction: SortByDirection.asc }, filters: {} },
      })
    )

    expect(result.current.users.map((user) => user.metadata.name)).toEqual(['charlie', 'alice'])
    expect(result.current.processedItemCount).toBe(2)
  })

  test('refetches lookup when Search deletes an indexed MRA candidate from the page', async () => {
    // Alice is Search-backed and also an MRA subject. After DELETE, the page drops alice
    // while lookup is still stale (indexed) — refresh lookup so the MRA stub can return.
    setupAtoms([aliceMra])
    const { refetchLookup } = mockSearch([alice], [alice], [])

    const { rerender, result } = renderHook(() =>
      useUsersSearch({
        columns,
        request: { page: 1, perPage: 10, sortBy: { index: 0, direction: SortByDirection.asc }, filters: {} },
      })
    )

    expect(result.current.users.map((user) => user.metadata.name)).toEqual(['alice'])
    expect(refetchLookup).not.toHaveBeenCalled()

    // Simulate subscription DELETE: page empty, lookup still returns alice.
    mockSearch([], [alice], [0])
    rerender()

    await waitFor(() => {
      expect(refetchLookup).toHaveBeenCalled()
    })

    // After lookup catches up, alice is MRA-only again.
    mockSearch([], [], [0])
    rerender()

    await waitFor(() => {
      expect(result.current.users.map((user) => user.metadata.name)).toEqual(['alice'])
      expect(result.current.users[0]?.metadata.uid).toBe('alice')
    })
  })

  test('holds the page and count while an MRA extra overlaps a Search row pending lookup', () => {
    const e2eFromSearch: User = {
      apiVersion: 'user.openshift.io/v1',
      kind: 'User',
      metadata: {
        name: 'e2e-user',
        uid: 'c2064147-9207-4dba-bfeb-3f18fdae53de',
        creationTimestamp: '2026-10-21T09:11:00Z',
      },
    }
    const e2eMra: MulticlusterRoleAssignment = {
      apiVersion: 'rbac.open-cluster-management.io/v1beta1',
      kind: 'MulticlusterRoleAssignment',
      metadata: { name: 'mra-e2e', creationTimestamp: '2026-10-21T09:10:00Z' },
      spec: { subject: { kind: 'User', name: 'e2e-user' }, roleAssignments: [] },
    }
    setupAtoms([e2eMra])
    mockSearch([e2eFromSearch, alice], [], [0])

    const { result } = renderHook(() =>
      useUsersSearch({
        columns,
        request: { page: 1, perPage: 10, sortBy: { index: 0, direction: SortByDirection.asc }, filters: {} },
      })
    )

    expect(result.current.loading).toBe(true)
    expect(result.current.users).toEqual([])
    expect(result.current.processedItemCount).toBe(0)
  })

  test('stops loading when the rank query errors so the table can show emptyState', () => {
    setupAtoms([charlieMra])
    mockSearch([], [], [])
    mockUseSearchResultCountQuery.mockImplementation(
      (options?: { skip?: boolean; variables?: { input?: SearchInput[] } }) => {
        if (options?.skip) return { data: undefined, loading: false, error: undefined, refetch: jest.fn() }
        const inputs = options?.variables?.input ?? []
        if (inputs.some(isComparator)) {
          return {
            data: undefined,
            loading: false,
            error: new Error('rank failed'),
            refetch: jest.fn(),
          }
        }
        return {
          data: { searchResult: [{ count: 0 }] },
          loading: false,
          error: undefined,
          refetch: jest.fn(),
        }
      }
    )

    const { result } = renderHook(() =>
      useUsersSearch({
        columns,
        request: { page: 1, perPage: 10, sortBy: { index: 0, direction: SortByDirection.asc }, filters: {} },
      })
    )

    expect(result.current.loading).toBe(false)
    expect(result.current.error?.message).toBe('rank failed')
  })

  test('preferSearchBackedUsers keeps the indexed User over an MRA stub', () => {
    const stub: User = {
      apiVersion: 'user.openshift.io/v1',
      kind: 'User',
      metadata: { name: 'e2e-user', uid: 'e2e-user' },
    }
    const indexed: User = {
      apiVersion: 'user.openshift.io/v1',
      kind: 'User',
      metadata: { name: 'e2e-user', uid: 'real-uid' },
    }
    expect(preferSearchBackedUsers([stub, indexed])).toEqual([indexed])
    expect(preferSearchBackedUsers([indexed, stub])).toEqual([indexed])
  })

  test('refetches after additionalUsers changes so a created user fills the index gap', async () => {
    const { refetchPage } = mockSearch([], [], [0])
    const created: User = {
      apiVersion: 'user.openshift.io/v1',
      kind: 'User',
      metadata: { name: 'created-user', uid: 'created-user' },
    }

    const { rerender, result } = renderHook(
      ({ additionalUsers }: { additionalUsers?: User[] }) =>
        useUsersSearch({
          columns,
          additionalUsers,
          request: { page: 1, perPage: 10, sortBy: { index: 0, direction: SortByDirection.asc }, filters: {} },
        }),
      { initialProps: { additionalUsers: undefined as User[] | undefined } }
    )

    expect(refetchPage).not.toHaveBeenCalled()
    rerender({ additionalUsers: [created] })

    await waitFor(() => {
      expect(refetchPage).toHaveBeenCalled()
    })
    expect(result.current.users.map((user) => user.metadata.name)).toContain('created-user')
  })

  test('exports every hub user plus MRA-only users', async () => {
    setupAtoms([charlieMra])
    mockSearch([alice], [], [0])
    mockSearchQuery.mockResolvedValue({
      data: { searchResult: [{ items: [{ name: 'alice', created: '2023-01-02T00:00:00Z' }] }] },
    })

    const { result } = renderHook(() =>
      useUsersSearch({
        columns,
        request: { page: 1, perPage: 10, sortBy: { index: 0, direction: SortByDirection.asc }, filters: {} },
      })
    )

    const exported = await result.current.fetchExport({
      page: 1,
      perPage: -1,
      sortBy: undefined,
      filters: {},
    })

    expect(exported?.items.map((item) => item.metadata?.name)).toEqual(['alice', 'charlie'])
  })
})

describe('findIndexedUserName', () => {
  beforeEach(() => {
    mockSearchQuery.mockReset()
  })

  test('resolves a uid match before a colliding name match', async () => {
    mockSearchQuery.mockResolvedValue({
      data: {
        searchResult: [
          {
            items: [
              { name: 'c2064147-9207-4dba-bfeb-3f18fdae53de', _uid: 'local-cluster/other-uid' },
              { name: 'alice', _uid: 'local-cluster/c2064147-9207-4dba-bfeb-3f18fdae53de' },
            ],
          },
        ],
      },
    })

    await expect(findIndexedUserName('c2064147-9207-4dba-bfeb-3f18fdae53de', 'local-cluster')).resolves.toBe('alice')
  })

  test('falls back to an exact name match when no uid matches', async () => {
    mockSearchQuery.mockResolvedValue({
      data: {
        searchResult: [{ items: [{ name: 'alice', _uid: 'local-cluster/other-uid' }] }],
      },
    })

    await expect(findIndexedUserName('alice', 'local-cluster')).resolves.toBe('alice')
  })
})

describe('useHasHubUsers, useUserIdentity, and useUsersByNames', () => {
  beforeEach(() => {
    setupAtoms([charlieMra])
    mockSearch([], [], [])
  })

  test('reports hub users from the count or an MRA subject', () => {
    mockUseSearchResultCountQuery.mockReturnValue({
      data: { searchResult: [{ count: 0 }] },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    })

    const { result } = renderHook(() => useHasHubUsers())
    expect(result.current).toEqual({ hasUsers: true, loaded: true })
  })

  test('resolves a missing Search user from an MRA subject', () => {
    mockUseFleetSearch.mockReturnValue([undefined, true, undefined, jest.fn()])

    const { result } = renderHook(() => useUserIdentity('charlie'))
    expect(result.current?.metadata.name).toBe('charlie')
  })

  test('loads users by member names for Group Users tab', () => {
    mockUseFleetSearch.mockReturnValue([[alice], true, undefined, jest.fn()])

    const { result } = renderHook(() => useUsersByNames(['alice', 'missing']))
    expect(result.current.loaded).toBe(true)
    expect(result.current.users.map((user) => user.metadata.name)).toEqual(['alice', 'missing'])
    expect(result.current.users[1]).toEqual(expect.objectContaining({ metadata: { name: 'missing', uid: 'missing' } }))
    expect(mockUseFleetSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.arrayContaining([
          { property: 'kind', values: ['User'] },
          { property: 'name', values: ['alice', 'missing'] },
        ]),
      }),
      true
    )
  })
})
