/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { MulticlusterRoleAssignment } from '../../../resources/multicluster-role-assignment'
import { Group, User } from '../../../resources/rbac'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import {
  groupsFromMulticlusterRoleAssignments,
  useMergedGroups,
  useMergedUsers,
  usersFromMulticlusterRoleAssignments,
} from './useMergedIdentities'

jest.mock('../../../shared-recoil', () => ({
  useRecoilValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

const mockUseRecoilValue = useRecoilValue as jest.MockedFunction<typeof useRecoilValue>
const mockUseSharedAtoms = useSharedAtoms as jest.MockedFunction<typeof useSharedAtoms>

const usersAtom = Symbol('usersState')
const groupsAtom = Symbol('groupsState')
const mraAtom = Symbol('multiclusterRoleAssignmentState')

const mockUsers: User[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: { name: 'bob', uid: 'bob-uid', creationTimestamp: '2025-01-01T00:00:00Z' },
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: { name: 'alice', uid: 'alice-uid', creationTimestamp: '2025-01-02T00:00:00Z' },
  },
]

const mockGroups: Group[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: { name: 'devs', uid: 'devs-uid', creationTimestamp: '2025-01-01T00:00:00Z' },
    users: ['bob'],
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: { name: 'admins', uid: 'admins-uid', creationTimestamp: '2025-01-02T00:00:00Z' },
    users: ['alice'],
  },
]

const mockMras: MulticlusterRoleAssignment[] = [
  {
    apiVersion: 'rbac.open-cluster-management.io/v1beta1',
    kind: 'MulticlusterRoleAssignment',
    metadata: { name: 'mra-charlie', creationTimestamp: '2025-02-01T00:00:00Z' },
    spec: { subject: { kind: 'User', name: 'charlie' }, roleAssignments: [] },
  },
  {
    apiVersion: 'rbac.open-cluster-management.io/v1beta1',
    kind: 'MulticlusterRoleAssignment',
    metadata: { name: 'mra-bob-dup', creationTimestamp: '2025-02-02T00:00:00Z' },
    spec: { subject: { kind: 'User', name: 'bob' }, roleAssignments: [] },
  },
  {
    apiVersion: 'rbac.open-cluster-management.io/v1beta1',
    kind: 'MulticlusterRoleAssignment',
    metadata: { name: 'mra-ops', creationTimestamp: '2025-02-01T00:00:00Z' },
    spec: { subject: { kind: 'Group', name: 'ops' }, roleAssignments: [] },
  },
  {
    apiVersion: 'rbac.open-cluster-management.io/v1beta1',
    kind: 'MulticlusterRoleAssignment',
    metadata: { name: 'mra-devs-dup', creationTimestamp: '2025-02-02T00:00:00Z' },
    spec: { subject: { kind: 'Group', name: 'devs' }, roleAssignments: [] },
  },
]

describe('useMergedIdentities', () => {
  describe('usersFromMulticlusterRoleAssignments', () => {
    const baseMra: MulticlusterRoleAssignment = {
      apiVersion: 'rbac.open-cluster-management.io/v1beta1',
      kind: 'MulticlusterRoleAssignment',
      metadata: { name: 'mra-1', creationTimestamp: '2025-03-01T10:00:00Z' },
      spec: { subject: { kind: 'User', name: 'mra-user-a' }, roleAssignments: [] },
    }

    it('should compose User objects from MRAs with subject.kind=User', () => {
      const result = usersFromMulticlusterRoleAssignments([baseMra], new Set())
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        apiVersion: 'user.openshift.io/v1',
        kind: 'User',
        metadata: { name: 'mra-user-a', uid: 'mra-user-a', creationTimestamp: '2025-03-01T10:00:00Z' },
      })
    })

    it('should exclude users already in existingNames', () => {
      const result = usersFromMulticlusterRoleAssignments([baseMra], new Set(['mra-user-a']))
      expect(result).toHaveLength(0)
    })

    it('should deduplicate by subject name (first MRA wins)', () => {
      const mra2: MulticlusterRoleAssignment = {
        ...baseMra,
        metadata: { name: 'mra-2', creationTimestamp: '2025-04-01T10:00:00Z' },
        spec: { ...baseMra.spec, subject: { kind: 'User', name: 'mra-user-a' } },
      }
      const result = usersFromMulticlusterRoleAssignments([baseMra, mra2], new Set())
      expect(result).toHaveLength(1)
      expect(result[0].metadata.creationTimestamp).toBe('2025-03-01T10:00:00Z')
    })

    it('should ignore MRAs with subject.kind=Group', () => {
      const groupMra: MulticlusterRoleAssignment = {
        ...baseMra,
        spec: { ...baseMra.spec, subject: { kind: 'Group', name: 'some-group' } },
      }
      const result = usersFromMulticlusterRoleAssignments([groupMra], new Set())
      expect(result).toHaveLength(0)
    })

    it('should return empty array for empty input', () => {
      expect(usersFromMulticlusterRoleAssignments([], new Set())).toEqual([])
    })

    it('should skip MRAs with empty subject name', () => {
      const emptyNameMra: MulticlusterRoleAssignment = {
        ...baseMra,
        spec: { ...baseMra.spec, subject: { kind: 'User', name: '' } },
      }
      const result = usersFromMulticlusterRoleAssignments([emptyNameMra], new Set())
      expect(result).toHaveLength(0)
    })
  })

  describe('groupsFromMulticlusterRoleAssignments', () => {
    const baseMra: MulticlusterRoleAssignment = {
      apiVersion: 'rbac.open-cluster-management.io/v1beta1',
      kind: 'MulticlusterRoleAssignment',
      metadata: { name: 'mra-1', creationTimestamp: '2025-03-01T10:00:00Z' },
      spec: { subject: { kind: 'Group', name: 'mra-group-a' }, roleAssignments: [] },
    }

    it('should compose Group objects from MRAs with subject.kind=Group', () => {
      const result = groupsFromMulticlusterRoleAssignments([baseMra], new Set())
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        apiVersion: 'user.openshift.io/v1',
        kind: 'Group',
        metadata: { name: 'mra-group-a', uid: 'mra-group-a', creationTimestamp: '2025-03-01T10:00:00Z' },
        users: [],
      })
    })

    it('should exclude groups already in existingNames', () => {
      const result = groupsFromMulticlusterRoleAssignments([baseMra], new Set(['mra-group-a']))
      expect(result).toHaveLength(0)
    })

    it('should deduplicate by subject name (first MRA wins)', () => {
      const mra2: MulticlusterRoleAssignment = {
        ...baseMra,
        metadata: { name: 'mra-2', creationTimestamp: '2025-04-01T10:00:00Z' },
        spec: { ...baseMra.spec, subject: { kind: 'Group', name: 'mra-group-a' } },
      }
      const result = groupsFromMulticlusterRoleAssignments([baseMra, mra2], new Set())
      expect(result).toHaveLength(1)
      expect(result[0].metadata.creationTimestamp).toBe('2025-03-01T10:00:00Z')
    })

    it('should ignore MRAs with subject.kind=User', () => {
      const userMra: MulticlusterRoleAssignment = {
        ...baseMra,
        spec: { ...baseMra.spec, subject: { kind: 'User', name: 'some-user' } },
      }
      const result = groupsFromMulticlusterRoleAssignments([userMra], new Set())
      expect(result).toHaveLength(0)
    })

    it('should return empty array for empty input', () => {
      expect(groupsFromMulticlusterRoleAssignments([], new Set())).toEqual([])
    })

    it('should skip MRAs with empty subject name', () => {
      const emptyNameMra: MulticlusterRoleAssignment = {
        ...baseMra,
        spec: { ...baseMra.spec, subject: { kind: 'Group', name: '' } },
      }
      const result = groupsFromMulticlusterRoleAssignments([emptyNameMra], new Set())
      expect(result).toHaveLength(0)
    })
  })

  describe('useMergedUsers', () => {
    beforeEach(() => {
      mockUseSharedAtoms.mockReturnValue({
        usersState: usersAtom,
        multiclusterRoleAssignmentState: mraAtom,
      } as any)
    })

    afterEach(() => jest.clearAllMocks())

    it('should return RBAC users merged with MRA-derived users sorted by name', () => {
      mockUseRecoilValue.mockImplementation((atom: any) => {
        if (atom === usersAtom) return mockUsers
        if (atom === mraAtom) return mockMras
        return []
      })

      const { result } = renderHook(() => useMergedUsers())
      const names = result.current.map((u) => u.metadata.name)
      expect(names).toEqual(['alice', 'bob', 'charlie'])
    })

    it('should not duplicate users that exist in both RBAC and MRA', () => {
      mockUseRecoilValue.mockImplementation((atom: any) => {
        if (atom === usersAtom) return mockUsers
        if (atom === mraAtom) return mockMras
        return []
      })

      const { result } = renderHook(() => useMergedUsers())
      const bobEntries = result.current.filter((u) => u.metadata.name === 'bob')
      expect(bobEntries).toHaveLength(1)
    })

    it('should return only RBAC users when no MRAs exist', () => {
      mockUseRecoilValue.mockImplementation((atom: any) => {
        if (atom === usersAtom) return mockUsers
        if (atom === mraAtom) return []
        return []
      })

      const { result } = renderHook(() => useMergedUsers())
      expect(result.current).toHaveLength(2)
      expect(result.current.map((u) => u.metadata.name)).toEqual(['alice', 'bob'])
    })

    it('should return only MRA-derived users when no RBAC users exist', () => {
      mockUseRecoilValue.mockImplementation((atom: any) => {
        if (atom === usersAtom) return []
        if (atom === mraAtom) return mockMras
        return []
      })

      const { result } = renderHook(() => useMergedUsers())
      const names = result.current.map((u) => u.metadata.name)
      expect(names).toEqual(['bob', 'charlie'])
    })

    it('should return empty array when both sources are empty', () => {
      mockUseRecoilValue.mockImplementation(() => [])

      const { result } = renderHook(() => useMergedUsers())
      expect(result.current).toEqual([])
    })

    it('should exclude Group MRAs from users list', () => {
      mockUseRecoilValue.mockImplementation((atom: any) => {
        if (atom === usersAtom) return []
        if (atom === mraAtom) return mockMras
        return []
      })

      const { result } = renderHook(() => useMergedUsers())
      expect(result.current.every((u) => u.kind === 'User')).toBe(true)
    })
  })

  describe('useMergedGroups', () => {
    beforeEach(() => {
      mockUseSharedAtoms.mockReturnValue({
        groupsState: groupsAtom,
        multiclusterRoleAssignmentState: mraAtom,
      } as any)
    })

    afterEach(() => jest.clearAllMocks())

    it('should return RBAC groups merged with MRA-derived groups sorted by name', () => {
      mockUseRecoilValue.mockImplementation((atom: any) => {
        if (atom === groupsAtom) return mockGroups
        if (atom === mraAtom) return mockMras
        return []
      })

      const { result } = renderHook(() => useMergedGroups())
      const names = result.current.map((g) => g.metadata.name)
      expect(names).toEqual(['admins', 'devs', 'ops'])
    })

    it('should not duplicate groups that exist in both RBAC and MRA', () => {
      mockUseRecoilValue.mockImplementation((atom: any) => {
        if (atom === groupsAtom) return mockGroups
        if (atom === mraAtom) return mockMras
        return []
      })

      const { result } = renderHook(() => useMergedGroups())
      const devsEntries = result.current.filter((g) => g.metadata.name === 'devs')
      expect(devsEntries).toHaveLength(1)
    })

    it('should return only RBAC groups when no MRAs exist', () => {
      mockUseRecoilValue.mockImplementation((atom: any) => {
        if (atom === groupsAtom) return mockGroups
        if (atom === mraAtom) return []
        return []
      })

      const { result } = renderHook(() => useMergedGroups())
      expect(result.current).toHaveLength(2)
      expect(result.current.map((g) => g.metadata.name)).toEqual(['admins', 'devs'])
    })

    it('should return only MRA-derived groups when no RBAC groups exist', () => {
      mockUseRecoilValue.mockImplementation((atom: any) => {
        if (atom === groupsAtom) return []
        if (atom === mraAtom) return mockMras
        return []
      })

      const { result } = renderHook(() => useMergedGroups())
      const names = result.current.map((g) => g.metadata.name)
      expect(names).toEqual(['devs', 'ops'])
    })

    it('should return empty array when both sources are empty', () => {
      mockUseRecoilValue.mockImplementation(() => [])

      const { result } = renderHook(() => useMergedGroups())
      expect(result.current).toEqual([])
    })

    it('should exclude User MRAs from groups list', () => {
      mockUseRecoilValue.mockImplementation((atom: any) => {
        if (atom === groupsAtom) return []
        if (atom === mraAtom) return mockMras
        return []
      })

      const { result } = renderHook(() => useMergedGroups())
      expect(result.current.every((g) => g.kind === 'Group')).toBe(true)
    })
  })
})
