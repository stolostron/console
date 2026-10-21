/* Copyright Contributors to the Open Cluster Management project */
import { renderHook, waitFor } from '@testing-library/react'
import { SortByDirection } from '@patternfly/react-table'
import { useFleetSearch } from '@stolostron/multicluster-sdk/lib/api/useFleetSearch'
import type { SearchInput } from '@stolostron/multicluster-sdk'
import { Group } from '../../../../resources/rbac'
import { MulticlusterRoleAssignment } from '../../../../resources/multicluster-role-assignment'
import { useSharedAtoms, useSharedValue } from '../../../../shared-atoms'
import { searchClient } from '../../../Search/search-sdk/search-client'
import { useSearchResultCountQuery } from '../../../Search/search-sdk/search-sdk'
import {
  findIndexedGroupName,
  preferSearchBackedGroups,
  useGroupsSearch,
  useGroupIdentity,
  useHasHubGroups,
} from './useGroupsSearch'

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

const groupsAtom = Symbol('groupsState')
const mraAtom = Symbol('multiclusterRoleAssignmentState')

const developers: Group = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'Group',
  metadata: { name: 'developers', uid: 'developers', creationTimestamp: '2023-01-02T00:00:00Z' },
  users: ['dev1', 'dev2'],
  userCount: 2,
}

const opsMra: MulticlusterRoleAssignment = {
  apiVersion: 'rbac.open-cluster-management.io/v1beta1',
  kind: 'MulticlusterRoleAssignment',
  metadata: { name: 'mra-ops', creationTimestamp: '2023-02-01T00:00:00Z' },
  spec: { subject: { kind: 'Group', name: 'ops-team' }, roleAssignments: [] },
}

const developersMra: MulticlusterRoleAssignment = {
  apiVersion: 'rbac.open-cluster-management.io/v1beta1',
  kind: 'MulticlusterRoleAssignment',
  metadata: { name: 'mra-devs', creationTimestamp: '2023-02-02T00:00:00Z' },
  spec: { subject: { kind: 'Group', name: 'developers' }, roleAssignments: [] },
}

const columns = [
  { sort: 'metadata.name', isHidden: false },
  { sort: 'users.length', isHidden: false },
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

function mockSearch(pageGroups: Group[], indexed: Group[] = pageGroups, ranks: number[] = []) {
  const refetchPage = jest.fn()
  mockUseFleetSearch.mockImplementation((input, subscriptionEnabled) => {
    if (!input) return [undefined, true, undefined, jest.fn()]
    if (input.orderBy) return [pageGroups, true, undefined, refetchPage]
    if (subscriptionEnabled) return [pageGroups, true, undefined, refetchPage]
    const names = new Set(input.filters?.find((filter) => filter?.property === 'name')?.values ?? [])
    return [indexed.filter((group) => names.has(group.metadata.name ?? '')), true, undefined, jest.fn()]
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
        data: { searchResult: [{ count: pageGroups.length }] },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      }
    }
  )
  return { refetchPage }
}

function setupAtoms(mras: MulticlusterRoleAssignment[] = []) {
  mockUseSharedAtoms.mockReturnValue({
    groupsState: groupsAtom,
    multiclusterRoleAssignmentState: mraAtom,
  })
  mockUseSharedValue.mockImplementation((atom: unknown) => {
    if (atom === groupsAtom) throw new Error('groupsState should not be read')
    if (atom === mraAtom) return mras
    return []
  })
}

describe('useGroupsSearch', () => {
  beforeEach(() => {
    setupAtoms()
    mockSearch([developers])
  })

  test('maps page, sort and keywords onto the subscribed Search query', () => {
    const { result } = renderHook(() =>
      useGroupsSearch({
        columns,
        request: {
          page: 2,
          perPage: 5,
          search: 'Ops Team',
          sortBy: { index: 1, direction: SortByDirection.desc },
          filters: {},
        },
      })
    )

    expect(mockUseFleetSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: 'userCount desc',
        keywords: ['Ops', 'Team'],
        offset: 5,
        limit: 5,
        filters: expect.arrayContaining([
          { property: 'kind', values: ['Group'] },
          { property: 'apigroup', values: ['user.openshift.io'] },
          { property: 'cluster', values: ['local-cluster'] },
        ]),
      }),
      true,
      {
        watchInput: {
          filters: [
            { property: 'kind', values: ['Group'] },
            { property: 'apigroup', values: ['user.openshift.io'] },
            { property: '_hubClusterResource', values: ['true'] },
          ],
          keywords: ['Ops', 'Team'],
        },
      }
    )
    expect(result.current.groups.map((group) => group.metadata.name)).toEqual(['developers'])
    expect(result.current.processedItemCount).toBe(1)
  })

  test('includes an MRA group that Search has not indexed and skips one that it has', () => {
    setupAtoms([opsMra, developersMra])
    mockSearch([developers], [developers], [0])

    const { result } = renderHook(() =>
      useGroupsSearch({
        columns,
        request: { page: 1, perPage: 10, sortBy: { index: 0, direction: SortByDirection.asc }, filters: {} },
      })
    )

    expect(result.current.groups.map((group) => group.metadata.name)).toEqual(['ops-team', 'developers'])
    expect(result.current.processedItemCount).toBe(2)
  })

  test('holds the page and count while an MRA extra overlaps a Search row pending lookup', () => {
    const e2eFromSearch: Group = {
      apiVersion: 'user.openshift.io/v1',
      kind: 'Group',
      metadata: {
        name: 'e2e-cluster-group',
        uid: 'c2064147-9207-4dba-bfeb-3f18fdae53de',
        creationTimestamp: '2026-10-21T09:11:00Z',
      },
      users: [],
      userCount: 1,
    }
    const e2eMra: MulticlusterRoleAssignment = {
      apiVersion: 'rbac.open-cluster-management.io/v1beta1',
      kind: 'MulticlusterRoleAssignment',
      metadata: { name: 'mra-e2e', creationTimestamp: '2026-10-21T09:10:00Z' },
      spec: { subject: { kind: 'Group', name: 'e2e-cluster-group' }, roleAssignments: [] },
    }
    // Lookup still empty (stale): MRA remains an extra that overlaps the live Search row.
    setupAtoms([e2eMra])
    mockSearch([e2eFromSearch, developers], [], [0])

    const { result } = renderHook(() =>
      useGroupsSearch({
        columns,
        request: { page: 1, perPage: 10, sortBy: { index: 0, direction: SortByDirection.asc }, filters: {} },
      })
    )

    expect(result.current.loading).toBe(true)
    expect(result.current.groups).toEqual([])
    expect(result.current.processedItemCount).toBe(0)
  })

  test('shows the Search-backed Group once lookup reconciles the overlapping MRA extra', () => {
    const e2eFromSearch: Group = {
      apiVersion: 'user.openshift.io/v1',
      kind: 'Group',
      metadata: {
        name: 'e2e-cluster-group',
        uid: 'c2064147-9207-4dba-bfeb-3f18fdae53de',
        creationTimestamp: '2026-10-21T09:11:00Z',
      },
      users: [],
      userCount: 1,
    }
    const e2eMra: MulticlusterRoleAssignment = {
      apiVersion: 'rbac.open-cluster-management.io/v1beta1',
      kind: 'MulticlusterRoleAssignment',
      metadata: { name: 'mra-e2e', creationTimestamp: '2026-10-21T09:10:00Z' },
      spec: { subject: { kind: 'Group', name: 'e2e-cluster-group' }, roleAssignments: [] },
    }
    setupAtoms([e2eMra])
    mockSearch([e2eFromSearch, developers], [e2eFromSearch], [])

    const { result } = renderHook(() =>
      useGroupsSearch({
        columns,
        request: { page: 1, perPage: 10, sortBy: { index: 0, direction: SortByDirection.asc }, filters: {} },
      })
    )

    expect(result.current.loading).toBe(false)
    expect(result.current.groups.map((group) => group.metadata.name)).toEqual(['e2e-cluster-group', 'developers'])
    expect(result.current.groups.find((group) => group.metadata.name === 'e2e-cluster-group')?.userCount).toBe(1)
    expect(result.current.processedItemCount).toBe(2)
  })

  test('preferSearchBackedGroups keeps the indexed Group over an MRA stub', () => {
    const stub: Group = {
      apiVersion: 'user.openshift.io/v1',
      kind: 'Group',
      metadata: { name: 'e2e-cluster-group', uid: 'e2e-cluster-group' },
      users: [],
    }
    const indexed: Group = {
      apiVersion: 'user.openshift.io/v1',
      kind: 'Group',
      metadata: { name: 'e2e-cluster-group', uid: 'real-uid' },
      users: [],
      userCount: 1,
    }
    expect(preferSearchBackedGroups([stub, indexed])).toEqual([indexed])
    expect(preferSearchBackedGroups([indexed, stub])).toEqual([indexed])
  })

  test('drops an MRA group that does not match the toolbar keywords', () => {
    setupAtoms([opsMra])
    mockSearch([developers], [developers], [])

    const { result } = renderHook(() =>
      useGroupsSearch({
        columns,
        request: {
          page: 1,
          perPage: 10,
          search: 'dev',
          sortBy: { index: 0, direction: SortByDirection.asc },
          filters: {},
        },
      })
    )

    expect(result.current.groups.map((group) => group.metadata.name)).toEqual(['developers'])
    expect(mockUseFleetSearch).toHaveBeenCalledWith(
      expect.objectContaining({ keywords: ['dev'] }),
      true,
      expect.objectContaining({
        watchInput: expect.objectContaining({
          keywords: ['dev'],
          filters: expect.arrayContaining([{ property: '_hubClusterResource', values: ['true'] }]),
        }),
      })
    )
  })

  test('refetches after additionalGroups changes so a created group fills the index gap', async () => {
    const { refetchPage } = mockSearch([], [], [0])
    const created: Group = {
      apiVersion: 'user.openshift.io/v1',
      kind: 'Group',
      metadata: { name: 'created-group', uid: 'created-group' },
      users: [],
    }

    const { rerender, result } = renderHook(
      ({ additionalGroups }: { additionalGroups?: Group[] }) =>
        useGroupsSearch({
          columns,
          additionalGroups,
          request: { page: 1, perPage: 10, sortBy: { index: 0, direction: SortByDirection.asc }, filters: {} },
        }),
      { initialProps: { additionalGroups: undefined as Group[] | undefined } }
    )

    expect(refetchPage).not.toHaveBeenCalled()
    rerender({ additionalGroups: [created] })

    await waitFor(() => {
      expect(refetchPage).toHaveBeenCalled()
    })
    expect(result.current.groups.map((group) => group.metadata.name)).toContain('created-group')
  })

  test('exports every hub group plus MRA-only groups', async () => {
    setupAtoms([opsMra])
    mockSearch([developers], [], [0])
    mockSearchQuery.mockResolvedValue({
      data: { searchResult: [{ items: [{ name: 'developers', userCount: '2', created: '2023-01-02T00:00:00Z' }] }] },
    })

    const { result } = renderHook(() =>
      useGroupsSearch({
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

    expect(mockSearchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: [
            expect.objectContaining({
              limit: -1,
              orderBy: 'name asc',
              filters: expect.arrayContaining([{ property: 'cluster', values: ['local-cluster'] }]),
            }),
          ],
        },
      })
    )
    expect(exported?.items.map((item) => item.metadata?.name)).toEqual(['developers', 'ops-team'])
  })
})

describe('findIndexedGroupName', () => {
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
              { name: 'developers', _uid: 'local-cluster/c2064147-9207-4dba-bfeb-3f18fdae53de' },
            ],
          },
        ],
      },
    })

    await expect(findIndexedGroupName('c2064147-9207-4dba-bfeb-3f18fdae53de', 'local-cluster')).resolves.toBe(
      'developers'
    )
  })

  test('falls back to an exact name match when no uid matches', async () => {
    mockSearchQuery.mockResolvedValue({
      data: {
        searchResult: [
          {
            items: [{ name: 'developers', _uid: 'local-cluster/other-uid' }],
          },
        ],
      },
    })

    await expect(findIndexedGroupName('developers', 'local-cluster')).resolves.toBe('developers')
  })
})

describe('useHasHubGroups and useGroupIdentity', () => {
  beforeEach(() => {
    setupAtoms([opsMra])
    mockSearch([], [], [])
  })

  test('reports hub groups from the count or an MRA subject', () => {
    mockUseSearchResultCountQuery.mockReturnValue({
      data: { searchResult: [{ count: 0 }] },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    })

    const { result } = renderHook(() => useHasHubGroups())
    expect(result.current).toEqual({ hasGroups: true, loaded: true })
  })

  test('resolves a missing Search group from an MRA subject', () => {
    mockUseFleetSearch.mockReturnValue([undefined, true, undefined, jest.fn()])

    const { result } = renderHook(() => useGroupIdentity('ops-team'))
    expect(result.current?.metadata.name).toBe('ops-team')
    expect(result.current?.users).toEqual([])
  })
})
