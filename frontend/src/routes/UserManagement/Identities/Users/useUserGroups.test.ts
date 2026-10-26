/* Copyright Contributors to the Open Cluster Management project */
import { renderHook, waitFor } from '@testing-library/react'
import { useFleetSearch } from '@stolostron/multicluster-sdk/lib/api/useFleetSearch'
import { useFleetSearchSubscription } from '@stolostron/multicluster-sdk/lib/api/useFleetSearchSubscription'
import { Group, User } from '../../../../resources/rbac'
import { groupEventAffectsUser, useUserGroups } from './useUserGroups'
import { useUserDetailsContext } from './UserPage'

jest.mock('@stolostron/multicluster-sdk/lib/api/useFleetSearch', () => ({
  useFleetSearch: jest.fn(),
}))

jest.mock('@stolostron/multicluster-sdk/lib/api/useFleetSearchSubscription', () => ({
  useFleetSearchSubscription: jest.fn(),
}))

jest.mock('../../../../hooks/use-local-hub', () => ({
  useLocalHubName: () => 'local-cluster',
}))

jest.mock('./UserPage', () => ({
  useUserDetailsContext: jest.fn(),
}))

const mockUseFleetSearch = useFleetSearch as jest.MockedFunction<typeof useFleetSearch>
const mockUseFleetSearchSubscription = useFleetSearchSubscription as jest.Mock
const mockUseUserDetailsContext = useUserDetailsContext as jest.MockedFunction<typeof useUserDetailsContext>

const mockUser: User = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'User',
  metadata: { name: 'test-user', uid: 'test-user-uid' },
  identities: [],
  groups: [],
}

const mockGroups: Group[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: { name: 'e2e-cluster-group', uid: 'group-uid' },
    users: ['test-user'],
  },
]

describe('groupEventAffectsUser', () => {
  const listed = new Set(['group-uid'])

  it('matches when oldData groupUsers includes the user (removal)', () => {
    expect(
      groupEventAffectsUser(
        { uid: 'group-uid', oldData: { groupUsers: ['test-user'] }, newData: { groupUsers: [] } },
        'test-user',
        listed
      )
    ).toBe(true)
  })

  it('matches when newData groupUsers includes the user (addition)', () => {
    expect(
      groupEventAffectsUser(
        { uid: 'other-uid', oldData: { groupUsers: [] }, newData: { groupUsers: ['test-user'] } },
        'test-user',
        listed
      )
    ).toBe(true)
  })

  it('matches listed uid when groupUsers is absent (sparse DELETE)', () => {
    expect(
      groupEventAffectsUser({ uid: 'local-cluster/group-uid', oldData: {}, newData: null }, 'test-user', listed)
    ).toBe(true)
  })

  it('ignores unrelated group updates', () => {
    expect(
      groupEventAffectsUser(
        { uid: 'other-uid', oldData: { groupUsers: ['other'] }, newData: { groupUsers: ['other'] } },
        'test-user',
        listed
      )
    ).toBe(false)
  })
})

describe('useUserGroups', () => {
  const refetch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseUserDetailsContext.mockReturnValue({ user: mockUser })
    mockUseFleetSearch.mockReturnValue([mockGroups, true, undefined, refetch])
    mockUseFleetSearchSubscription.mockReturnValue([undefined, false, undefined])
  })

  it('queries by groupUsers and watches all hub Groups without groupUsers', () => {
    renderHook(() => useUserGroups())

    expect(mockUseFleetSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.arrayContaining([{ property: 'groupUsers', values: ['test-user'] }]),
      }),
      false
    )
    expect(mockUseFleetSearchSubscription).toHaveBeenCalledWith({
      filters: expect.arrayContaining([
        { property: 'kind', values: ['Group'] },
        { property: '_hubClusterResource', values: ['*'] },
      ]),
    })
    const watchFilters = mockUseFleetSearchSubscription.mock.calls[0][0].filters
    expect(watchFilters.some((f: { property: string }) => f.property === 'groupUsers')).toBe(false)
  })

  it('refetches the membership query when a watch event removes the user', async () => {
    mockUseFleetSearchSubscription.mockReturnValue([
      {
        uid: 'group-uid',
        operation: 'UPDATE',
        oldData: { groupUsers: ['test-user'] },
        newData: { groupUsers: [] },
      },
      false,
      undefined,
    ])

    renderHook(() => useUserGroups())

    await waitFor(() => expect(refetch).toHaveBeenCalled())
  })

  it('does not refetch for unrelated group events', async () => {
    mockUseFleetSearchSubscription.mockReturnValue([
      {
        uid: 'other-uid',
        operation: 'UPDATE',
        oldData: { groupUsers: ['other'] },
        newData: { groupUsers: ['other', 'someone'] },
      },
      false,
      undefined,
    ])

    renderHook(() => useUserGroups())

    await waitFor(() => expect(mockUseFleetSearchSubscription).toHaveBeenCalled())
    expect(refetch).not.toHaveBeenCalled()
  })
})
