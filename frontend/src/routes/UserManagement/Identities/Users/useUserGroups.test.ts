/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react'
import { useFleetSearch } from '@stolostron/multicluster-sdk/lib/api/useFleetSearch'
import { Group, User } from '../../../../resources/rbac'
import { useUserGroups } from './useUserGroups'
import { useUserDetailsContext } from './UserPage'

jest.mock('@stolostron/multicluster-sdk/lib/api/useFleetSearch', () => ({
  useFleetSearch: jest.fn(),
}))

jest.mock('../../../../hooks/use-local-hub', () => ({
  useLocalHubName: () => 'local-cluster',
}))

jest.mock('./UserPage', () => ({
  useUserDetailsContext: jest.fn(),
}))

const mockUseFleetSearch = useFleetSearch as jest.MockedFunction<typeof useFleetSearch>
const mockUseUserDetailsContext = useUserDetailsContext as jest.MockedFunction<typeof useUserDetailsContext>

const mockUser: User = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'User',
  metadata: { name: 'test-user', uid: 'test-user-uid' },
  identities: [],
  groups: ['e2e-cluster-group', 'developers'],
}

const mockGroups: Group[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: { name: 'e2e-cluster-group', uid: 'group-uid', creationTimestamp: '2025-01-01T00:00:00Z' },
    users: ['test-user'],
  },
]

describe('useUserGroups', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseUserDetailsContext.mockReturnValue({ user: mockUser })
    mockUseFleetSearch.mockReturnValue([mockGroups, true, undefined, jest.fn()])
  })

  it('loads Groups by name from the User CR groups field with a narrow subscription', () => {
    const { result } = renderHook(() => useUserGroups())

    expect(mockUseFleetSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.arrayContaining([
          { property: 'kind', values: ['Group'] },
          { property: 'apigroup', values: ['user.openshift.io'] },
          { property: '_hubClusterResource', values: ['*'] },
          { property: 'name', values: ['e2e-cluster-group', 'developers'] },
        ]),
        limit: 2,
      }),
      true
    )
    expect(result.current.userGroups.map((group) => group.metadata.name)).toEqual([
      'e2e-cluster-group',
      'developers',
    ])
    // Prefer Search-backed metadata when present; stub missing names from the CR list.
    expect(result.current.userGroups[0]?.metadata.uid).toBe('group-uid')
    expect(result.current.userGroups[1]?.metadata.uid).toBe('developers')
    expect(result.current.loading).toBe(false)
  })

  it('skips Search when the User has no groups', () => {
    mockUseUserDetailsContext.mockReturnValue({
      user: { ...mockUser, groups: null as unknown as string[] },
    })

    const { result } = renderHook(() => useUserGroups())

    expect(mockUseFleetSearch).toHaveBeenCalledWith(undefined, true)
    expect(result.current.userGroups).toEqual([])
    expect(result.current.loading).toBe(false)
  })

  it('updates the Search name filter when User CR groups change (YAML/User watch path)', () => {
    const { rerender } = renderHook(() => useUserGroups())

    mockUseUserDetailsContext.mockReturnValue({
      user: { ...mockUser, groups: ['only-group'] },
    })
    rerender()

    expect(mockUseFleetSearch).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filters: expect.arrayContaining([{ property: 'name', values: ['only-group'] }]),
        limit: 1,
      }),
      true
    )
  })
})
