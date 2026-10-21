/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react'
import { useFleetSearch } from '@stolostron/multicluster-sdk'
import { MulticlusterRoleAssignment } from '../../../../resources/multicluster-role-assignment'
import { Group } from '../../../../resources/rbac'
import { useSharedAtoms, useSharedValue } from '~/shared-atoms'
import { searchClient } from '../../../Search/search-sdk/search-client'
import { SearchResultItemsDocument, useSearchResultCountQuery } from '../../../Search/search-sdk/search-sdk'
import { findIndexedGroupName, useGroupIdentity, useHasHubGroups } from './useGroupsSearch'

jest.mock('../../../Search/search-sdk/search-client', () => ({
  searchClient: { query: jest.fn() },
}))

jest.mock('../../../Search/search-sdk/search-sdk', () => ({
  ...jest.requireActual('../../../Search/search-sdk/search-sdk'),
  useSearchResultCountQuery: jest.fn(),
}))

jest.mock('@stolostron/multicluster-sdk', () => ({
  useFleetSearch: jest.fn(),
}))

jest.mock('~/shared-atoms', () => ({
  useSharedValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

jest.mock('~/hooks/use-local-hub', () => ({
  useLocalHubName: () => 'local-cluster',
}))

const mockSearchQuery = searchClient.query as jest.Mock
const mockUseSearchResultCountQuery = useSearchResultCountQuery as jest.MockedFunction<typeof useSearchResultCountQuery>
const mockUseFleetSearch = useFleetSearch as jest.MockedFunction<typeof useFleetSearch>
const mockUseSharedValue = useSharedValue as jest.MockedFunction<typeof useSharedValue>
const mockUseSharedAtoms = useSharedAtoms as jest.MockedFunction<typeof useSharedAtoms>

const mraAtom = Symbol('multiclusterRoleAssignmentState')

const opsMra: MulticlusterRoleAssignment = {
  apiVersion: 'rbac.open-cluster-management.io/v1beta1',
  kind: 'MulticlusterRoleAssignment',
  metadata: { name: 'mra-ops', creationTimestamp: '2023-02-01T00:00:00Z' },
  spec: {
    subject: { kind: 'Group', name: 'ops-team' },
    roleAssignments: [],
  },
}

const indexedGroup: Group = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'Group',
  metadata: {
    name: 'kubevirt-admins',
    uid: 'kubevirt-admins-uid',
    creationTimestamp: '2023-01-01T00:00:00Z',
  },
  users: ['admin1'],
}

function mockSearchItems(items: Array<Record<string, unknown> | null | undefined>) {
  mockSearchQuery.mockResolvedValue({
    data: {
      searchResult: [{ items }],
    },
  })
}

function setupSharedAtoms(mras: MulticlusterRoleAssignment[] = []) {
  mockUseSharedAtoms.mockReturnValue({
    multiclusterRoleAssignmentState: mraAtom,
  } as ReturnType<typeof useSharedAtoms>)
  mockUseSharedValue.mockImplementation((atom: unknown) => {
    if (atom === mraAtom) return mras
    return undefined
  })
}

describe('findIndexedGroupName', () => {
  beforeEach(() => {
    mockSearchQuery.mockReset()
    mockSearchQuery.mockResolvedValue({ data: { searchResult: [{ items: [] }] } })
  })

  test('queries Search for hub Groups with the uid lookup limit', async () => {
    await findIndexedGroupName('any-id', 'local-cluster')

    expect(mockSearchQuery).toHaveBeenCalledTimes(1)
    expect(mockSearchQuery).toHaveBeenCalledWith({
      query: SearchResultItemsDocument,
      variables: {
        input: [
          {
            filters: [
              { property: 'kind', values: ['Group'] },
              { property: 'apigroup', values: ['user.openshift.io'] },
              { property: 'cluster', values: ['local-cluster'] },
            ],
            limit: 10000,
          },
        ],
      },
    })
  })

  test('returns the group name when the route id matches item name', async () => {
    mockSearchItems([{ name: 'kubevirt-admins', _uid: 'local-cluster/other-uid' }])

    await expect(findIndexedGroupName('kubevirt-admins', 'local-cluster')).resolves.toBe('kubevirt-admins')
  })

  test('returns the group name when the route id matches item _uid exactly', async () => {
    mockSearchItems([{ name: 'kubevirt-admins', _uid: 'kubevirt-admins-uid' }])

    await expect(findIndexedGroupName('kubevirt-admins-uid', 'local-cluster')).resolves.toBe('kubevirt-admins')
  })

  test('returns the group name when the route id matches hub-prefixed _uid', async () => {
    mockSearchItems([{ name: 'kubevirt-admins', _uid: 'local-cluster/kubevirt-admins-uid' }])

    await expect(findIndexedGroupName('kubevirt-admins-uid', 'local-cluster')).resolves.toBe('kubevirt-admins')
  })

  test('returns the group name when item _uid ends with /id', async () => {
    mockSearchItems([{ name: 'ops-team', _uid: 'remote-hub/ops-team-uid' }])

    await expect(findIndexedGroupName('ops-team-uid', 'local-cluster')).resolves.toBe('ops-team')
  })

  test('skips items without a string name', async () => {
    mockSearchItems([
      { name: 123, _uid: 'local-cluster/bad-name' },
      { _uid: 'local-cluster/missing-name' },
      null,
      { name: 'good-group', _uid: 'local-cluster/good-uid' },
    ])

    await expect(findIndexedGroupName('good-uid', 'local-cluster')).resolves.toBe('good-group')
  })

  test('returns undefined when Search finds no matching group', async () => {
    mockSearchItems([{ name: 'other-group', _uid: 'local-cluster/other-uid' }])

    await expect(findIndexedGroupName('missing-uid', 'local-cluster')).resolves.toBeUndefined()
  })

  test('returns undefined when Search returns no items', async () => {
    mockSearchQuery.mockResolvedValue({ data: { searchResult: [] } })

    await expect(findIndexedGroupName('any-id', 'local-cluster')).resolves.toBeUndefined()
  })

  test('returns undefined when Search result data is missing', async () => {
    mockSearchQuery.mockResolvedValue({ data: undefined })

    await expect(findIndexedGroupName('any-id', 'local-cluster')).resolves.toBeUndefined()
  })
})

describe('useHasHubGroups', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupSharedAtoms()
    mockUseSearchResultCountQuery.mockReturnValue({
      data: { searchResult: [{ count: 0 }] },
      loading: false,
      error: undefined,
    } as ReturnType<typeof useSearchResultCountQuery>)
  })

  test('queries Search count for hub Groups', () => {
    renderHook(() => useHasHubGroups())

    expect(mockUseSearchResultCountQuery).toHaveBeenCalledWith({
      client: undefined,
      variables: {
        input: [
          {
            filters: [
              { property: 'kind', values: ['Group'] },
              { property: 'apigroup', values: ['user.openshift.io'] },
              { property: 'cluster', values: ['local-cluster'] },
            ],
          },
        ],
      },
    })
  })

  test('returns hasGroups true when Search count is greater than zero', () => {
    mockUseSearchResultCountQuery.mockReturnValue({
      data: { searchResult: [{ count: 2 }] },
      loading: false,
      error: undefined,
    } as ReturnType<typeof useSearchResultCountQuery>)

    const { result } = renderHook(() => useHasHubGroups())

    expect(result.current).toEqual({ hasGroups: true, loaded: true })
  })

  test('returns hasGroups true when Search count is zero but MRA groups exist', () => {
    setupSharedAtoms([opsMra])

    const { result } = renderHook(() => useHasHubGroups())

    expect(result.current).toEqual({ hasGroups: true, loaded: true })
  })

  test('returns hasGroups false when Search count is zero and no MRA groups', () => {
    const { result } = renderHook(() => useHasHubGroups())

    expect(result.current).toEqual({ hasGroups: false, loaded: true })
  })

  test('returns hasGroups false when Search data is missing and no MRA groups', () => {
    mockUseSearchResultCountQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    } as ReturnType<typeof useSearchResultCountQuery>)

    const { result } = renderHook(() => useHasHubGroups())

    expect(result.current).toEqual({ hasGroups: false, loaded: true })
  })

  test('returns loaded false while Search count is loading', () => {
    mockUseSearchResultCountQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    } as ReturnType<typeof useSearchResultCountQuery>)

    const { result } = renderHook(() => useHasHubGroups())

    expect(result.current.loaded).toBe(false)
  })
})

describe('useGroupIdentity', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupSharedAtoms()
    mockUseFleetSearch.mockReturnValue([[], true] as ReturnType<typeof useFleetSearch>)
  })

  test('returns undefined when name is undefined', () => {
    const { result } = renderHook(() => useGroupIdentity(undefined))

    expect(result.current).toBeUndefined()
    expect(mockUseFleetSearch).toHaveBeenCalledWith(undefined, false)
  })

  test('searches for the named hub Group with limit 1', () => {
    renderHook(() => useGroupIdentity('kubevirt-admins'))

    expect(mockUseFleetSearch).toHaveBeenCalledWith(
      {
        filters: [
          { property: 'kind', values: ['Group'] },
          { property: 'apigroup', values: ['user.openshift.io'] },
          { property: 'cluster', values: ['local-cluster'] },
          { property: 'name', values: ['kubevirt-admins'] },
        ],
        limit: 1,
      },
      false
    )
  })

  test('returns the indexed Group when Search finds it', () => {
    mockUseFleetSearch.mockReturnValue([[indexedGroup], true] as ReturnType<typeof useFleetSearch>)

    const { result } = renderHook(() => useGroupIdentity('kubevirt-admins'))

    expect(result.current).toEqual(indexedGroup)
  })

  test('normalizes missing apiVersion, kind, and users on indexed Groups', () => {
    mockUseFleetSearch.mockReturnValue([
      [{ metadata: { name: 'kubevirt-admins' } }],
      true,
    ] as ReturnType<typeof useFleetSearch>)

    const { result } = renderHook(() => useGroupIdentity('kubevirt-admins'))

    expect(result.current).toEqual({
      apiVersion: 'user.openshift.io/v1',
      kind: 'Group',
      metadata: { name: 'kubevirt-admins' },
      users: [],
    })
  })

  test('returns undefined while Search is still loading and nothing is found', () => {
    mockUseFleetSearch.mockReturnValue([[], false] as ReturnType<typeof useFleetSearch>)

    const { result } = renderHook(() => useGroupIdentity('ops-team'))

    expect(result.current).toBeUndefined()
  })

  test('falls back to an MRA group after Search loads with no match', () => {
    setupSharedAtoms([opsMra])
    mockUseFleetSearch.mockReturnValue([[], true] as ReturnType<typeof useFleetSearch>)

    const { result } = renderHook(() => useGroupIdentity('ops-team'))

    expect(result.current).toEqual({
      apiVersion: 'user.openshift.io/v1',
      kind: 'Group',
      metadata: {
        name: 'ops-team',
        uid: 'ops-team',
        creationTimestamp: '2023-02-01T00:00:00Z',
      },
      users: [],
    })
  })

  test('returns undefined when Search and MRA both miss the group', () => {
    setupSharedAtoms([opsMra])
    mockUseFleetSearch.mockReturnValue([[], true] as ReturnType<typeof useFleetSearch>)

    const { result } = renderHook(() => useGroupIdentity('missing-group'))

    expect(result.current).toBeUndefined()
  })

  test('prefers the indexed Group over an MRA group with the same name', () => {
    setupSharedAtoms([
      {
        ...opsMra,
        spec: { subject: { kind: 'Group', name: 'kubevirt-admins' }, roleAssignments: [] },
      },
    ])
    mockUseFleetSearch.mockReturnValue([[indexedGroup], true] as ReturnType<typeof useFleetSearch>)

    const { result } = renderHook(() => useGroupIdentity('kubevirt-admins'))

    expect(result.current).toEqual(indexedGroup)
    expect(result.current?.users).toEqual(['admin1'])
  })
})
