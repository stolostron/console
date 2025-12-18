/* Copyright Contributors to the Open Cluster Management project */
import { GroupKind, ManagedClusterSetBinding, MulticlusterRoleAssignmentNamespace, UserKind } from '../../../resources'
import { findManagedClusterSetBinding } from '../../../resources/clients/managed-cluster-set-binding-client'
import { addRoleAssignment, findRoleAssignments } from '../../../resources/clients/multicluster-role-assignment-client'
import { FlattenedRoleAssignment } from '../../../resources/clients/model/flattened-role-assignment'
import { RoleAssignmentToSave } from '../../../resources/clients/model/role-assignment-to-save'
import { findPlacements } from '../../../resources/clients/placement-client'
import {
  MulticlusterRoleAssignment,
  MulticlusterRoleAssignmentApiVersion,
  MulticlusterRoleAssignmentKind,
} from '../../../resources/multicluster-role-assignment'
import { Placement } from '../../../resources/placement'
import {
  dataToRoleAssignmentToSave,
  existingRoleAssignmentsBySubjectRole,
  saveRoleAssignment,
  SaveRoleAssignmentCallbacks,
} from './roleAssignmentHelper'

jest.mock('../../../resources/clients/multicluster-role-assignment-client', () => ({
  findRoleAssignments: jest.fn(),
  addRoleAssignment: jest.fn(),
}))

jest.mock('../../../resources/clients/managed-cluster-set-binding-client', () => ({
  findManagedClusterSetBinding: jest.fn(),
}))

jest.mock('../../../resources/clients/placement-client', () => ({
  findPlacements: jest.fn(),
}))

describe('roleAssignmentHelper', () => {
  describe('dataToRoleAssignmentToSave', () => {
    it('should create role assignments for a single user with a single role', () => {
      const data: RoleAssignmentFormDataType = {
        subject: {
          kind: UserKind,
          user: ['john.doe'],
        },
        scope: {
          kind: 'specific',
          clusterNames: ['cluster-1'],
          namespaces: ['namespace-1'],
        },
        roles: ['admin'],
      }

      const result = dataToRoleAssignmentToSave(data)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        clusterRole: 'admin',
        clusterNames: ['cluster-1'],
        clusterSetNames: [],
        targetNamespaces: ['namespace-1'],
        subject: {
          name: 'john.doe',
          kind: UserKind,
        },
      })
    })

    it('should create role assignments for multiple users with a single role', () => {
      const data: RoleAssignmentFormDataType = {
        subject: {
          kind: UserKind,
          user: ['user1', 'user2', 'user3'],
        },
        scope: {
          kind: 'specific',
          clusterNames: ['cluster-1'],
          namespaces: ['namespace-1'],
        },
        roles: ['viewer'],
      }

      const result = dataToRoleAssignmentToSave(data)

      expect(result).toHaveLength(3)
      expect(result[0].subject.name).toBe('user1')
      expect(result[1].subject.name).toBe('user2')
      expect(result[2].subject.name).toBe('user3')
      expect(result.every((ra) => ra.clusterRole === 'viewer')).toBe(true)
    })

    it('should create role assignments for a single user with multiple roles', () => {
      const data: RoleAssignmentFormDataType = {
        subject: {
          kind: UserKind,
          user: ['john.doe'],
        },
        scope: {
          kind: 'specific',
          clusterNames: ['cluster-1'],
          namespaces: ['namespace-1'],
        },
        roles: ['admin', 'editor', 'viewer'],
      }

      const result = dataToRoleAssignmentToSave(data)

      expect(result).toHaveLength(3)
      expect(result[0].clusterRole).toBe('admin')
      expect(result[1].clusterRole).toBe('editor')
      expect(result[2].clusterRole).toBe('viewer')
      expect(result.every((ra) => ra.subject.name === 'john.doe')).toBe(true)
    })

    it('should create role assignments for multiple users with multiple roles (cartesian product)', () => {
      const data: RoleAssignmentFormDataType = {
        subject: {
          kind: UserKind,
          user: ['user1', 'user2'],
        },
        scope: {
          kind: 'specific',
          clusterNames: ['cluster-1'],
        },
        roles: ['admin', 'viewer'],
      }

      const result = dataToRoleAssignmentToSave(data)

      // 2 users × 2 roles = 4 role assignments
      expect(result).toHaveLength(4)

      // Verify all combinations exist
      expect(result).toContainEqual(
        expect.objectContaining({ clusterRole: 'admin', subject: { name: 'user1', kind: UserKind } })
      )
      expect(result).toContainEqual(
        expect.objectContaining({ clusterRole: 'admin', subject: { name: 'user2', kind: UserKind } })
      )
      expect(result).toContainEqual(
        expect.objectContaining({ clusterRole: 'viewer', subject: { name: 'user1', kind: UserKind } })
      )
      expect(result).toContainEqual(
        expect.objectContaining({ clusterRole: 'viewer', subject: { name: 'user2', kind: UserKind } })
      )
    })

    it('should handle group subjects correctly', () => {
      const data: RoleAssignmentFormDataType = {
        subject: {
          kind: GroupKind,
          group: ['developers', 'admins'],
        },
        scope: {
          kind: 'all',
          clusterNames: ['cluster-1', 'cluster-2'],
        },
        roles: ['editor'],
      }

      const result = dataToRoleAssignmentToSave(data)

      expect(result).toHaveLength(2)
      expect(result[0].subject.kind).toBe(GroupKind)
      expect(result[0].subject.name).toBe('developers')
      expect(result[1].subject.kind).toBe(GroupKind)
      expect(result[1].subject.name).toBe('admins')
    })

    it('should return empty array when no users are provided', () => {
      const data: RoleAssignmentFormDataType = {
        subject: {
          kind: UserKind,
          user: [],
        },
        scope: {
          kind: 'specific',
          clusterNames: ['cluster-1'],
        },
        roles: ['admin'],
      }

      const result = dataToRoleAssignmentToSave(data)

      expect(result).toHaveLength(0)
    })

    it('should return empty array when no roles are provided', () => {
      const data: RoleAssignmentFormDataType = {
        subject: {
          kind: UserKind,
          user: ['user1'],
        },
        scope: {
          kind: 'specific',
          clusterNames: ['cluster-1'],
        },
        roles: [],
      }

      const result = dataToRoleAssignmentToSave(data)

      expect(result).toHaveLength(0)
    })

    it('should return empty array when user is undefined', () => {
      const data: RoleAssignmentFormDataType = {
        subject: {
          kind: UserKind,
          user: undefined,
        },
        scope: {
          kind: 'specific',
          clusterNames: ['cluster-1'],
        },
        roles: ['admin'],
      }

      const result = dataToRoleAssignmentToSave(data)

      expect(result).toHaveLength(0)
    })

    it('should preserve multiple cluster names in scope', () => {
      const data: RoleAssignmentFormDataType = {
        subject: {
          kind: UserKind,
          user: ['user1'],
        },
        scope: {
          kind: 'all',
          clusterNames: ['cluster-1', 'cluster-2', 'cluster-3'],
        },
        roles: ['admin'],
      }

      const result = dataToRoleAssignmentToSave(data)

      expect(result).toHaveLength(1)
      expect(result[0].clusterNames).toEqual(['cluster-1', 'cluster-2', 'cluster-3'])
    })

    it('should preserve multiple namespaces in scope', () => {
      const data: RoleAssignmentFormDataType = {
        subject: {
          kind: UserKind,
          user: ['user1'],
        },
        scope: {
          kind: 'specific',
          clusterNames: ['cluster-1'],
          namespaces: ['ns-1', 'ns-2', 'ns-3'],
        },
        roles: ['admin'],
      }

      const result = dataToRoleAssignmentToSave(data)

      expect(result).toHaveLength(1)
      expect(result[0].targetNamespaces).toEqual(['ns-1', 'ns-2', 'ns-3'])
    })

    it('should handle undefined namespaces', () => {
      const data: RoleAssignmentFormDataType = {
        subject: {
          kind: UserKind,
          user: ['user1'],
        },
        scope: {
          kind: 'all',
          clusterNames: ['cluster-1'],
          namespaces: undefined,
        },
        roles: ['admin'],
      }

      const result = dataToRoleAssignmentToSave(data)

      expect(result).toHaveLength(1)
      expect(result[0].targetNamespaces).toBeUndefined()
    })

    it('should always set clusterSetNames to empty array', () => {
      const data: RoleAssignmentFormDataType = {
        subject: {
          kind: UserKind,
          user: ['user1', 'user2'],
        },
        scope: {
          kind: 'specific',
          clusterNames: ['cluster-1'],
        },
        roles: ['admin', 'viewer'],
      }

      const result = dataToRoleAssignmentToSave(data)

      expect(result).toHaveLength(4)
      expect(result.every((ra) => ra.clusterSetNames?.length === 0)).toBe(true)
    })

    it('should handle undefined clusterNames in scope', () => {
      const data: RoleAssignmentFormDataType = {
        subject: {
          kind: UserKind,
          user: ['user1'],
        },
        scope: {
          kind: 'all',
          clusterNames: undefined,
        },
        roles: ['admin'],
      }

      const result = dataToRoleAssignmentToSave(data)

      expect(result).toHaveLength(1)
      expect(result[0].clusterNames).toBeUndefined()
    })
  })

  describe('existingRoleAssignmentsBySubjectRole', () => {
    const mockFindRoleAssignments = findRoleAssignments as jest.MockedFunction<typeof findRoleAssignments>

    beforeEach(() => {
      jest.clearAllMocks()
    })

    const createMockMulticlusterRoleAssignment = (
      name: string,
      subjectName: string,
      subjectKind: string
    ): MulticlusterRoleAssignment => ({
      apiVersion: MulticlusterRoleAssignmentApiVersion,
      kind: MulticlusterRoleAssignmentKind,
      metadata: { name, namespace: 'open-cluster-management-global-set' },
      spec: {
        subjects: [{ name: subjectName, kind: subjectKind, apiGroup: 'rbac.authorization.k8s.io' }],
        roleAssignments: [
          {
            name: 'test-role-assignment',
            clusterRole: 'admin',
            clusterSelection: { type: 'placements', placements: [{ name: 'test-placement', namespace: 'test-ns' }] },
          },
        ],
      },
    })

    const createMockFlattenedRoleAssignment = (
      subjectName: string,
      subjectKind: string,
      multiclusterRoleAssignment: MulticlusterRoleAssignment
    ): FlattenedRoleAssignment => ({
      name: 'test-role-assignment',
      clusterRole: 'admin',
      clusterSelection: { type: 'placements', placements: [{ name: 'test-placement', namespace: 'test-ns' }] },
      clusterNames: ['cluster-1'],
      subject: { name: subjectName, kind: subjectKind, apiGroup: 'rbac.authorization.k8s.io' },
      relatedMulticlusterRoleAssignment: multiclusterRoleAssignment,
    })

    it('should return empty map when no existing role assignments are found', () => {
      mockFindRoleAssignments.mockReturnValue([])

      const roleAssignmentsToSave: RoleAssignmentToSave[] = [
        {
          clusterRole: 'admin',
          clusterNames: ['cluster-1'],
          clusterSetNames: [],
          subject: { name: 'user1', kind: UserKind },
        },
      ]
      const multiClusterRoleAssignments: MulticlusterRoleAssignment[] = []
      const clustersForPlacements: Record<string, string[]> = {}

      const result = existingRoleAssignmentsBySubjectRole(
        roleAssignmentsToSave,
        UserKind,
        multiClusterRoleAssignments,
        clustersForPlacements
      )

      expect(result.size).toBe(0)
      expect(mockFindRoleAssignments).toHaveBeenCalledWith(
        { subjectKinds: [UserKind], subjectNames: ['user1'] },
        multiClusterRoleAssignments,
        clustersForPlacements
      )
    })

    it('should return map with existing role assignments keyed by subject', () => {
      const mcra1 = createMockMulticlusterRoleAssignment('mcra-user1', 'user1', UserKind)
      const mcra2 = createMockMulticlusterRoleAssignment('mcra-user2', 'user2', UserKind)
      const flattened1 = createMockFlattenedRoleAssignment('user1', UserKind, mcra1)
      const flattened2 = createMockFlattenedRoleAssignment('user2', UserKind, mcra2)

      mockFindRoleAssignments.mockReturnValue([flattened1, flattened2])

      const roleAssignmentsToSave: RoleAssignmentToSave[] = [
        { clusterRole: 'admin', clusterNames: ['cluster-1'], clusterSetNames: [], subject: { name: 'user1', kind: UserKind } },
        { clusterRole: 'admin', clusterNames: ['cluster-1'], clusterSetNames: [], subject: { name: 'user2', kind: UserKind } },
      ]

      const result = existingRoleAssignmentsBySubjectRole(roleAssignmentsToSave, UserKind, [], {})

      expect(result.size).toBe(2)
      expect(result.get(`${UserKind}|user1`)).toBe(mcra1)
      expect(result.get(`${UserKind}|user2`)).toBe(mcra2)
    })

    it('should handle group subjects', () => {
      const mcra = createMockMulticlusterRoleAssignment('mcra-developers', 'developers', GroupKind)
      const flattened = createMockFlattenedRoleAssignment('developers', GroupKind, mcra)

      mockFindRoleAssignments.mockReturnValue([flattened])

      const roleAssignmentsToSave: RoleAssignmentToSave[] = [
        { clusterRole: 'editor', clusterNames: ['cluster-1'], clusterSetNames: [], subject: { name: 'developers', kind: GroupKind } },
      ]

      const result = existingRoleAssignmentsBySubjectRole(roleAssignmentsToSave, GroupKind, [], {})

      expect(result.size).toBe(1)
      expect(result.get(`${GroupKind}|developers`)).toBe(mcra)
      expect(mockFindRoleAssignments).toHaveBeenCalledWith(
        { subjectKinds: [GroupKind], subjectNames: ['developers'] },
        [],
        {}
      )
    })

    it('should filter out undefined subject names', () => {
      mockFindRoleAssignments.mockReturnValue([])

      const roleAssignmentsToSave: RoleAssignmentToSave[] = [
        { clusterRole: 'admin', clusterNames: ['cluster-1'], clusterSetNames: [], subject: { name: 'user1', kind: UserKind } },
        { clusterRole: 'admin', clusterNames: ['cluster-1'], clusterSetNames: [], subject: { name: undefined, kind: UserKind } },
        { clusterRole: 'admin', clusterNames: ['cluster-1'], clusterSetNames: [], subject: { name: 'user2', kind: UserKind } },
      ]

      existingRoleAssignmentsBySubjectRole(roleAssignmentsToSave, UserKind, [], {})

      expect(mockFindRoleAssignments).toHaveBeenCalledWith(
        { subjectKinds: [UserKind], subjectNames: ['user1', 'user2'] },
        [],
        {}
      )
    })

    it('should pass clustersForPlacements to findRoleAssignments', () => {
      mockFindRoleAssignments.mockReturnValue([])

      const roleAssignmentsToSave: RoleAssignmentToSave[] = [
        { clusterRole: 'admin', clusterNames: ['cluster-1'], clusterSetNames: [], subject: { name: 'user1', kind: UserKind } },
      ]
      const clustersForPlacements = {
        'placement-1': ['cluster-a', 'cluster-b'],
        'placement-2': ['cluster-c'],
      }

      existingRoleAssignmentsBySubjectRole(roleAssignmentsToSave, UserKind, [], clustersForPlacements)

      expect(mockFindRoleAssignments).toHaveBeenCalledWith(
        { subjectKinds: [UserKind], subjectNames: ['user1'] },
        [],
        clustersForPlacements
      )
    })

    it('should overwrite earlier entries when same subject appears multiple times', () => {
      const mcra1 = createMockMulticlusterRoleAssignment('mcra-user1-first', 'user1', UserKind)
      const mcra2 = createMockMulticlusterRoleAssignment('mcra-user1-second', 'user1', UserKind)
      const flattened1 = createMockFlattenedRoleAssignment('user1', UserKind, mcra1)
      const flattened2 = createMockFlattenedRoleAssignment('user1', UserKind, mcra2)

      mockFindRoleAssignments.mockReturnValue([flattened1, flattened2])

      const roleAssignmentsToSave: RoleAssignmentToSave[] = [
        { clusterRole: 'admin', clusterNames: ['cluster-1'], clusterSetNames: [], subject: { name: 'user1', kind: UserKind } },
      ]

      const result = existingRoleAssignmentsBySubjectRole(roleAssignmentsToSave, UserKind, [], {})

      // The last one wins
      expect(result.size).toBe(1)
      expect(result.get(`${UserKind}|user1`)).toBe(mcra2)
    })

    it('should handle mixed user and group lookups with correct subject kind', () => {
      const mcraUser = createMockMulticlusterRoleAssignment('mcra-user1', 'user1', UserKind)
      const flattenedUser = createMockFlattenedRoleAssignment('user1', UserKind, mcraUser)

      mockFindRoleAssignments.mockReturnValue([flattenedUser])

      const roleAssignmentsToSave: RoleAssignmentToSave[] = [
        { clusterRole: 'admin', clusterNames: ['cluster-1'], clusterSetNames: [], subject: { name: 'user1', kind: UserKind } },
      ]

      const result = existingRoleAssignmentsBySubjectRole(roleAssignmentsToSave, UserKind, [], {})

      expect(result.get(`${UserKind}|user1`)).toBe(mcraUser)
      // Verify that a group with the same name would have a different key
      expect(result.get(`${GroupKind}|user1`)).toBeUndefined()
    })
  })

  describe('saveRoleAssignment', () => {
    const mockAddRoleAssignment = addRoleAssignment as jest.MockedFunction<typeof addRoleAssignment>
    const mockFindManagedClusterSetBinding = findManagedClusterSetBinding as jest.MockedFunction<
      typeof findManagedClusterSetBinding
    >
    const mockFindPlacements = findPlacements as jest.MockedFunction<typeof findPlacements>

    beforeEach(() => {
      jest.clearAllMocks()
    })

    const createMockMulticlusterRoleAssignment = (name: string): MulticlusterRoleAssignment => ({
      apiVersion: MulticlusterRoleAssignmentApiVersion,
      kind: MulticlusterRoleAssignmentKind,
      metadata: { name, namespace: MulticlusterRoleAssignmentNamespace },
      spec: {
        subjects: [{ name: 'user1', kind: UserKind, apiGroup: 'rbac.authorization.k8s.io' }],
        roleAssignments: [
          {
            name: 'test-role-assignment',
            clusterRole: 'admin',
            clusterSelection: { type: 'placements', placements: [{ name: 'test-placement', namespace: 'test-ns' }] },
          },
        ],
      },
    })

    const createMockPlacement = (name: string): Placement => ({
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: { name, namespace: MulticlusterRoleAssignmentNamespace },
      spec: { clusterSets: ['default'] },
    })

    const createMockManagedClusterSetBinding = (name: string): ManagedClusterSetBinding => ({
      apiVersion: 'cluster.open-cluster-management.io/v1beta2',
      kind: 'ManagedClusterSetBinding',
      metadata: { name, namespace: MulticlusterRoleAssignmentNamespace },
      spec: { clusterSet: name },
    })

    it('should call addRoleAssignment with correct parameters and invoke onSuccess callback', async () => {
      const existingMcra = createMockMulticlusterRoleAssignment('existing-mcra')
      const existingBySubjectRole = new Map<string, MulticlusterRoleAssignment>()
      existingBySubjectRole.set(`${UserKind}|user1`, existingMcra)

      const mockMcsb = createMockManagedClusterSetBinding('cluster-set-1')
      const mockPlacement = createMockPlacement('placement-1')

      mockFindManagedClusterSetBinding.mockReturnValue([mockMcsb])
      mockFindPlacements.mockReturnValue([mockPlacement])
      mockAddRoleAssignment.mockResolvedValue({} as never)

      const roleAssignment: RoleAssignmentToSave = {
        clusterRole: 'admin',
        clusterNames: ['cluster-1'],
        clusterSetNames: ['cluster-set-1'],
        subject: { name: 'user1', kind: UserKind },
      }

      const callbacks: SaveRoleAssignmentCallbacks = {
        onSuccess: jest.fn(),
        onError: jest.fn(),
      }

      const managedClusterSetBindings = [mockMcsb]
      const placements = [mockPlacement]

      await saveRoleAssignment(roleAssignment, existingBySubjectRole, managedClusterSetBindings, placements, callbacks)

      expect(mockFindManagedClusterSetBinding).toHaveBeenCalledWith(managedClusterSetBindings, {
        clusterSets: ['cluster-set-1'],
        namespaces: [MulticlusterRoleAssignmentNamespace],
      })
      expect(mockFindPlacements).toHaveBeenCalledWith(placements, {
        clusterNames: ['cluster-1'],
        clusterSetNames: ['cluster-set-1'],
        logicalOperator: 'or',
      })
      expect(mockAddRoleAssignment).toHaveBeenCalledWith(roleAssignment, {
        existingMulticlusterRoleAssignment: existingMcra,
        existingManagedClusterSetBindings: [mockMcsb],
        existingPlacement: mockPlacement,
      })
      expect(callbacks.onSuccess).toHaveBeenCalledWith('admin')
      expect(callbacks.onError).not.toHaveBeenCalled()
    })

    it('should invoke onError callback when addRoleAssignment fails', async () => {
      mockFindManagedClusterSetBinding.mockReturnValue([])
      mockFindPlacements.mockReturnValue([])
      mockAddRoleAssignment.mockRejectedValue(new Error('Network error'))

      const roleAssignment: RoleAssignmentToSave = {
        clusterRole: 'viewer',
        clusterNames: ['cluster-1'],
        clusterSetNames: [],
        subject: { name: 'user1', kind: UserKind },
      }

      const callbacks: SaveRoleAssignmentCallbacks = {
        onSuccess: jest.fn(),
        onError: jest.fn(),
      }

      await saveRoleAssignment(roleAssignment, new Map(), [], [], callbacks)

      expect(callbacks.onSuccess).not.toHaveBeenCalled()
      expect(callbacks.onError).toHaveBeenCalledWith('viewer', expect.any(Error), false)
    })

    it('should detect duplicate error and pass isDuplicateError=true to onError', async () => {
      mockFindManagedClusterSetBinding.mockReturnValue([])
      mockFindPlacements.mockReturnValue([])
      mockAddRoleAssignment.mockRejectedValue(new Error('Duplicate role assignment detected for this subject'))

      const roleAssignment: RoleAssignmentToSave = {
        clusterRole: 'editor',
        clusterNames: ['cluster-1'],
        clusterSetNames: [],
        subject: { name: 'user1', kind: UserKind },
      }

      const callbacks: SaveRoleAssignmentCallbacks = {
        onSuccess: jest.fn(),
        onError: jest.fn(),
      }

      await saveRoleAssignment(roleAssignment, new Map(), [], [], callbacks)

      expect(callbacks.onError).toHaveBeenCalledWith('editor', expect.any(Error), true)
    })

    it('should pass undefined for existingMulticlusterRoleAssignment when not found in map', async () => {
      mockFindManagedClusterSetBinding.mockReturnValue([])
      mockFindPlacements.mockReturnValue([])
      mockAddRoleAssignment.mockResolvedValue({} as never)

      const roleAssignment: RoleAssignmentToSave = {
        clusterRole: 'admin',
        clusterNames: ['cluster-1'],
        clusterSetNames: [],
        subject: { name: 'newuser', kind: UserKind },
      }

      const callbacks: SaveRoleAssignmentCallbacks = {
        onSuccess: jest.fn(),
        onError: jest.fn(),
      }

      await saveRoleAssignment(roleAssignment, new Map(), [], [], callbacks)

      expect(mockAddRoleAssignment).toHaveBeenCalledWith(roleAssignment, {
        existingMulticlusterRoleAssignment: undefined,
        existingManagedClusterSetBindings: [],
        existingPlacement: undefined,
      })
    })

    it('should pass first placement when multiple placements are found', async () => {
      const placement1 = createMockPlacement('placement-1')
      const placement2 = createMockPlacement('placement-2')

      mockFindManagedClusterSetBinding.mockReturnValue([])
      mockFindPlacements.mockReturnValue([placement1, placement2])
      mockAddRoleAssignment.mockResolvedValue({} as never)

      const roleAssignment: RoleAssignmentToSave = {
        clusterRole: 'admin',
        clusterNames: ['cluster-1'],
        clusterSetNames: [],
        subject: { name: 'user1', kind: UserKind },
      }

      const callbacks: SaveRoleAssignmentCallbacks = {
        onSuccess: jest.fn(),
        onError: jest.fn(),
      }

      await saveRoleAssignment(roleAssignment, new Map(), [], [placement1, placement2], callbacks)

      expect(mockAddRoleAssignment).toHaveBeenCalledWith(
        roleAssignment,
        expect.objectContaining({
          existingPlacement: placement1,
        })
      )
    })

    it('should handle group subjects correctly', async () => {
      const existingMcra = createMockMulticlusterRoleAssignment('group-mcra')
      const existingBySubjectRole = new Map<string, MulticlusterRoleAssignment>()
      existingBySubjectRole.set(`${GroupKind}|developers`, existingMcra)

      mockFindManagedClusterSetBinding.mockReturnValue([])
      mockFindPlacements.mockReturnValue([])
      mockAddRoleAssignment.mockResolvedValue({} as never)

      const roleAssignment: RoleAssignmentToSave = {
        clusterRole: 'admin',
        clusterNames: ['cluster-1'],
        clusterSetNames: [],
        subject: { name: 'developers', kind: GroupKind },
      }

      const callbacks: SaveRoleAssignmentCallbacks = {
        onSuccess: jest.fn(),
        onError: jest.fn(),
      }

      await saveRoleAssignment(roleAssignment, existingBySubjectRole, [], [], callbacks)

      expect(mockAddRoleAssignment).toHaveBeenCalledWith(
        roleAssignment,
        expect.objectContaining({
          existingMulticlusterRoleAssignment: existingMcra,
        })
      )
      expect(callbacks.onSuccess).toHaveBeenCalledWith('admin')
    })
  })
})

