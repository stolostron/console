/* Copyright Contributors to the Open Cluster Management project */
import { MulticlusterRoleAssignment } from '../../../resources/multicluster-role-assignment'
import { groupsFromMulticlusterRoleAssignments, usersFromMulticlusterRoleAssignments } from './useMergedIdentities'

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
})
