/* Copyright Contributors to the Open Cluster Management project */
import { GroupKind, ManagedClusterSetBinding, MulticlusterRoleAssignmentNamespace, UserKind } from '../../../resources'
import { findManagedClusterSetBinding } from '../../../resources/clients/managed-cluster-set-binding-client'
import { FlattenedRoleAssignment } from '../../../resources/clients/model/flattened-role-assignment'
import { PlacementClusters } from '../../../resources/clients/model/placement-clusters'
import { RoleAssignmentToSave } from '../../../resources/clients/model/role-assignment-to-save'
import {
  addRoleAssignment,
  findRoleAssignments,
  getPlacementsForRoleAssignment,
} from '../../../resources/clients/multicluster-role-assignment-client'
import { Subject } from '../../../resources/kubernetes-client'
import {
  MulticlusterRoleAssignment,
  MulticlusterRoleAssignmentApiVersion,
  MulticlusterRoleAssignmentKind,
} from '../../../resources/multicluster-role-assignment'
import { GlobalPlacementName, Placement } from '../../../resources/placement'
import {
  existingRoleAssignmentsBySubjectRole,
  saveAllRoleAssignments,
  saveRoleAssignment,
} from './roleAssignmentModalHelper'

import { RoleAssignment } from '../../../resources/multicluster-role-assignment'

type SaveRoleAssignmentCallbacks = {
  onSuccess: (roleAssignment: RoleAssignment) => void
  onError: (role: string, error: unknown, isDuplicateError: boolean) => void
}

jest.mock('../../../resources/clients/multicluster-role-assignment-client', () => ({
  findRoleAssignments: jest.fn(),
  addRoleAssignment: jest.fn(),
  getPlacementsForRoleAssignment: jest.fn(() => []),
}))

jest.mock('../../../resources/clients/managed-cluster-set-binding-client', () => ({
  findManagedClusterSetBinding: jest.fn(),
}))

const createMockPlacement = (name: string): Placement => ({
  apiVersion: 'cluster.open-cluster-management.io/v1beta1',
  kind: 'Placement',
  metadata: { name, namespace: MulticlusterRoleAssignmentNamespace },
  spec: { clusterSets: ['default'] },
})

describe('roleAssignmentHelper', () => {
  describe('existingRoleAssignmentsBySubjectRole', () => {
    const mockFindRoleAssignments = findRoleAssignments as jest.MockedFunction<typeof findRoleAssignments>

    beforeEach(() => {
      jest.clearAllMocks()
    })

    const createMockMulticlusterRoleAssignment = (
      name: string,
      subjectName: string,
      subjectKind: Subject['kind']
    ): MulticlusterRoleAssignment => ({
      apiVersion: MulticlusterRoleAssignmentApiVersion,
      kind: MulticlusterRoleAssignmentKind,
      metadata: { name, namespace: 'open-cluster-management-global-set' },
      spec: {
        subject: { name: subjectName, kind: subjectKind, apiGroup: 'rbac.authorization.k8s.io' },
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
      subjectKind: Subject['kind'],
      multiclusterRoleAssignment: MulticlusterRoleAssignment
    ): FlattenedRoleAssignment => ({
      name: 'test-role-assignment',
      clusterRole: 'admin',
      clusterSelection: { type: 'placements', placements: [{ name: 'test-placement', namespace: 'test-ns' }] },
      clusterNames: ['cluster-1'],
      clusterSetNames: [],
      subject: { name: subjectName, kind: subjectKind },
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
          isGlobalScope: false,
        },
      ]
      const multiClusterRoleAssignments: MulticlusterRoleAssignment[] = []
      const placementClusters: PlacementClusters[] = []

      const result = existingRoleAssignmentsBySubjectRole(
        roleAssignmentsToSave,
        UserKind,
        multiClusterRoleAssignments,
        placementClusters
      )

      expect(result.size).toBe(0)
      expect(mockFindRoleAssignments).toHaveBeenCalledWith(
        { subjectKinds: [UserKind], subjectNames: ['user1'] },
        multiClusterRoleAssignments,
        placementClusters
      )
    })

    it('should return map with existing role assignments keyed by subject', () => {
      const mcra1 = createMockMulticlusterRoleAssignment('mcra-user1', 'user1', UserKind)
      const mcra2 = createMockMulticlusterRoleAssignment('mcra-user2', 'user2', UserKind)
      const flattened1 = createMockFlattenedRoleAssignment('user1', UserKind, mcra1)
      const flattened2 = createMockFlattenedRoleAssignment('user2', UserKind, mcra2)

      mockFindRoleAssignments.mockReturnValue([flattened1, flattened2])

      const roleAssignmentsToSave: RoleAssignmentToSave[] = [
        {
          clusterRole: 'admin',
          clusterNames: ['cluster-1'],
          clusterSetNames: [],
          subject: { name: 'user1', kind: UserKind },
          isGlobalScope: false,
        },
        {
          clusterRole: 'admin',
          clusterNames: ['cluster-1'],
          clusterSetNames: [],
          subject: { name: 'user2', kind: UserKind },
          isGlobalScope: false,
        },
      ]

      const result = existingRoleAssignmentsBySubjectRole(roleAssignmentsToSave, UserKind, [], [])

      expect(result.size).toBe(2)
      expect(result.get(`${UserKind}|user1`)).toEqual([mcra1])
      expect(result.get(`${UserKind}|user2`)).toEqual([mcra2])
    })

    it('should handle group subjects', () => {
      const mcra = createMockMulticlusterRoleAssignment('mcra-developers', 'developers', GroupKind)
      const flattened = createMockFlattenedRoleAssignment('developers', GroupKind, mcra)

      mockFindRoleAssignments.mockReturnValue([flattened])

      const roleAssignmentsToSave: RoleAssignmentToSave[] = [
        {
          clusterRole: 'editor',
          clusterNames: ['cluster-1'],
          clusterSetNames: [],
          subject: { name: 'developers', kind: GroupKind },
          isGlobalScope: false,
        },
      ]

      const result = existingRoleAssignmentsBySubjectRole(roleAssignmentsToSave, GroupKind, [], [])

      expect(result.size).toBe(1)
      expect(result.get(`${GroupKind}|developers`)).toEqual([mcra])
      expect(mockFindRoleAssignments).toHaveBeenCalledWith(
        { subjectKinds: [GroupKind], subjectNames: ['developers'] },
        [],
        []
      )
    })

    it('should filter out undefined subject names', () => {
      mockFindRoleAssignments.mockReturnValue([])

      const roleAssignmentsToSave: RoleAssignmentToSave[] = [
        {
          clusterRole: 'admin',
          clusterNames: ['cluster-1'],
          clusterSetNames: [],
          subject: { name: 'user1', kind: UserKind },
          isGlobalScope: false,
        },
        {
          clusterRole: 'admin',
          clusterNames: ['cluster-1'],
          clusterSetNames: [],
          subject: { name: undefined as unknown as string, kind: UserKind },
          isGlobalScope: false,
        },
        {
          clusterRole: 'admin',
          clusterNames: ['cluster-1'],
          clusterSetNames: [],
          subject: { name: 'user2', kind: UserKind },
          isGlobalScope: false,
        },
      ]

      existingRoleAssignmentsBySubjectRole(roleAssignmentsToSave, UserKind, [], [])

      expect(mockFindRoleAssignments).toHaveBeenCalledWith(
        { subjectKinds: [UserKind], subjectNames: ['user1', 'user2'] },
        [],
        []
      )
    })

    it('should pass placementClusters to findRoleAssignments', () => {
      mockFindRoleAssignments.mockReturnValue([])

      const roleAssignmentsToSave: RoleAssignmentToSave[] = [
        {
          clusterRole: 'admin',
          clusterNames: ['cluster-1'],
          clusterSetNames: [],
          subject: { name: 'user1', kind: UserKind },
          isGlobalScope: false,
        },
      ]
      const createMockPlacement = (name: string): Placement => ({
        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
        kind: 'Placement',
        metadata: { name, namespace: MulticlusterRoleAssignmentNamespace },
        spec: { clusterSets: ['default'] },
      })
      const placementClusters: PlacementClusters[] = [
        {
          placement: createMockPlacement('placement-1'),
          clusters: ['cluster-a', 'cluster-b'],
          clusterSetNames: ['default'],
        },
        { placement: createMockPlacement('placement-2'), clusters: ['cluster-c'], clusterSetNames: ['default'] },
      ]

      existingRoleAssignmentsBySubjectRole(roleAssignmentsToSave, UserKind, [], placementClusters)

      expect(mockFindRoleAssignments).toHaveBeenCalledWith(
        { subjectKinds: [UserKind], subjectNames: ['user1'] },
        [],
        placementClusters
      )
    })

    it('should overwrite earlier entries when same subject appears multiple times', () => {
      const mcra1 = createMockMulticlusterRoleAssignment('mcra-user1-first', 'user1', UserKind)
      const mcra2 = createMockMulticlusterRoleAssignment('mcra-user1-second', 'user1', UserKind)
      const flattened1 = createMockFlattenedRoleAssignment('user1', UserKind, mcra1)
      const flattened2 = createMockFlattenedRoleAssignment('user1', UserKind, mcra2)

      mockFindRoleAssignments.mockReturnValue([flattened1, flattened2])

      const roleAssignmentsToSave: RoleAssignmentToSave[] = [
        {
          clusterRole: 'admin',
          clusterNames: ['cluster-1'],
          clusterSetNames: [],
          subject: { name: 'user1', kind: UserKind },
          isGlobalScope: false,
        },
      ]

      const result = existingRoleAssignmentsBySubjectRole(roleAssignmentsToSave, UserKind, [], [])

      // Same subject can have multiple MRAs; all are collected in an array
      expect(result.size).toBe(1)
      expect(result.get(`${UserKind}|user1`)).toEqual([mcra1, mcra2])
    })

    it('should handle mixed user and group lookups with correct subject kind', () => {
      const mcraUser = createMockMulticlusterRoleAssignment('mcra-user1', 'user1', UserKind)
      const flattenedUser = createMockFlattenedRoleAssignment('user1', UserKind, mcraUser)

      mockFindRoleAssignments.mockReturnValue([flattenedUser])

      const roleAssignmentsToSave: RoleAssignmentToSave[] = [
        {
          clusterRole: 'admin',
          clusterNames: ['cluster-1'],
          clusterSetNames: [],
          subject: { name: 'user1', kind: UserKind },
          isGlobalScope: false,
        },
      ]

      const result = existingRoleAssignmentsBySubjectRole(roleAssignmentsToSave, UserKind, [], [])

      expect(result.get(`${UserKind}|user1`)).toEqual([mcraUser])
      // Verify that a group with the same name would have a different key
      expect(result.get(`${GroupKind}|user1`)).toBeUndefined()
    })
  })

  describe('saveRoleAssignment', () => {
    const mockAddRoleAssignment = addRoleAssignment as jest.MockedFunction<typeof addRoleAssignment>
    const mockFindManagedClusterSetBinding = findManagedClusterSetBinding as jest.MockedFunction<
      typeof findManagedClusterSetBinding
    >

    beforeEach(() => {
      jest.clearAllMocks()
    })

    const createMockMulticlusterRoleAssignment = (name: string): MulticlusterRoleAssignment => ({
      apiVersion: MulticlusterRoleAssignmentApiVersion,
      kind: MulticlusterRoleAssignmentKind,
      metadata: { name, namespace: MulticlusterRoleAssignmentNamespace },
      spec: {
        subject: { name: 'user1', kind: UserKind },
        roleAssignments: [
          {
            name: 'test-role-assignment',
            clusterRole: 'admin',
            clusterSelection: { type: 'placements', placements: [{ name: 'test-placement', namespace: 'test-ns' }] },
          },
        ],
      },
    })

    const createMockManagedClusterSetBinding = (name: string): ManagedClusterSetBinding => ({
      apiVersion: 'cluster.open-cluster-management.io/v1beta2',
      kind: 'ManagedClusterSetBinding',
      metadata: { name, namespace: MulticlusterRoleAssignmentNamespace },
      spec: { clusterSet: name },
    })

    const createPlacementClustersArray = (entries: { name: string; clusters: string[] }[]): PlacementClusters[] =>
      entries.map(({ name, clusters }) => ({
        placement: createMockPlacement(name),
        clusters,
        clusterSetNames: ['default'],
      }))

    const mockGetPlacementsForRoleAssignment = getPlacementsForRoleAssignment as jest.MockedFunction<
      typeof getPlacementsForRoleAssignment
    >

    it('should call addRoleAssignment with correct parameters and invoke onSuccess callback', async () => {
      const existingMcra = createMockMulticlusterRoleAssignment('existing-mcra')
      const existingBySubjectRole = new Map<string, MulticlusterRoleAssignment[]>()
      existingBySubjectRole.set(`${UserKind}|user1`, [existingMcra])

      const mockMcsb = createMockManagedClusterSetBinding('cluster-set-1')
      const placementClusters = createPlacementClustersArray([{ name: 'placement-1', clusters: ['cluster-1'] }])
      const existingPlacements = [placementClusters[0].placement]

      const savedRoleAssignment: RoleAssignment = {
        name: 'saved-role-assignment',
        clusterRole: 'admin',
        clusterSelection: { type: 'placements', placements: [{ name: 'placement-1', namespace: 'test-ns' }] },
      }

      mockFindManagedClusterSetBinding.mockReturnValue([mockMcsb])
      mockGetPlacementsForRoleAssignment.mockReturnValue(existingPlacements)
      mockAddRoleAssignment.mockResolvedValue(savedRoleAssignment)

      const roleAssignment: RoleAssignmentToSave = {
        clusterRole: 'admin',
        clusterNames: ['cluster-1'],
        clusterSetNames: ['cluster-set-1'],
        subject: { name: 'user1', kind: UserKind },
        isGlobalScope: false,
      }

      const callbacks: SaveRoleAssignmentCallbacks = {
        onSuccess: jest.fn(),
        onError: jest.fn(),
      }

      const managedClusterSetBindings = [mockMcsb]

      const result = await saveRoleAssignment(
        roleAssignment,
        existingBySubjectRole,
        managedClusterSetBindings,
        placementClusters,
        callbacks
      )

      expect(mockFindManagedClusterSetBinding).toHaveBeenCalledWith(managedClusterSetBindings, {
        clusterSets: ['cluster-set-1'],
        namespaces: [MulticlusterRoleAssignmentNamespace],
      })
      expect(mockAddRoleAssignment).toHaveBeenCalledWith(roleAssignment, {
        existingMulticlusterRoleAssignments: [existingMcra],
        existingManagedClusterSetBindings: [mockMcsb],
        existingPlacements,
      })
      expect(callbacks.onSuccess).toHaveBeenCalledWith(savedRoleAssignment)
      expect(callbacks.onError).not.toHaveBeenCalled()
      expect(result).toBe(savedRoleAssignment)
    })

    it('should invoke onError callback when addRoleAssignment fails', async () => {
      mockFindManagedClusterSetBinding.mockReturnValue([])
      mockGetPlacementsForRoleAssignment.mockReturnValue([])
      mockAddRoleAssignment.mockRejectedValue(new Error('Network error'))

      const roleAssignment: RoleAssignmentToSave = {
        clusterRole: 'viewer',
        clusterNames: ['cluster-1'],
        clusterSetNames: [],
        subject: { name: 'user1', kind: UserKind },
        isGlobalScope: false,
      }

      const callbacks: SaveRoleAssignmentCallbacks = {
        onSuccess: jest.fn(),
        onError: jest.fn(),
      }

      await expect(saveRoleAssignment(roleAssignment, new Map(), [], [], callbacks)).rejects.toThrow('Network error')

      expect(callbacks.onSuccess).not.toHaveBeenCalled()
      expect(callbacks.onError).toHaveBeenCalledWith('viewer', expect.any(Error), false)
    })

    it('should detect duplicate error and pass isDuplicateError=true to onError', async () => {
      mockFindManagedClusterSetBinding.mockReturnValue([])
      mockGetPlacementsForRoleAssignment.mockReturnValue([])
      mockAddRoleAssignment.mockRejectedValue(new Error('Duplicate role assignment detected for this subject'))

      const roleAssignment: RoleAssignmentToSave = {
        clusterRole: 'editor',
        clusterNames: ['cluster-1'],
        clusterSetNames: [],
        subject: { name: 'user1', kind: UserKind },
        isGlobalScope: false,
      }

      const callbacks: SaveRoleAssignmentCallbacks = {
        onSuccess: jest.fn(),
        onError: jest.fn(),
      }

      await expect(saveRoleAssignment(roleAssignment, new Map(), [], [], callbacks)).rejects.toThrow(
        'Duplicate role assignment detected'
      )

      expect(callbacks.onError).toHaveBeenCalledWith('editor', expect.any(Error), true)
    })

    it('should pass undefined for existingMulticlusterRoleAssignments when not found in map', async () => {
      const savedRoleAssignment: RoleAssignment = {
        name: 'saved-role-assignment',
        clusterRole: 'admin',
        clusterSelection: { type: 'placements', placements: [] },
      }

      mockFindManagedClusterSetBinding.mockReturnValue([])
      mockGetPlacementsForRoleAssignment.mockReturnValue([])
      mockAddRoleAssignment.mockResolvedValue(savedRoleAssignment)

      const roleAssignment: RoleAssignmentToSave = {
        clusterRole: 'admin',
        clusterNames: ['cluster-1'],
        clusterSetNames: [],
        subject: { name: 'newuser', kind: UserKind },
        isGlobalScope: false,
      }

      const callbacks: SaveRoleAssignmentCallbacks = {
        onSuccess: jest.fn(),
        onError: jest.fn(),
      }

      const result = await saveRoleAssignment(roleAssignment, new Map(), [], [], callbacks)

      expect(mockAddRoleAssignment).toHaveBeenCalledWith(roleAssignment, {
        existingMulticlusterRoleAssignments: undefined,
        existingManagedClusterSetBindings: [],
        existingPlacements: [],
      })
      expect(result).toBe(savedRoleAssignment)
    })

    it('should find placement matching exact cluster list', async () => {
      const placementClusters = createPlacementClustersArray([
        { name: 'placement-1', clusters: ['cluster-1'] },
        { name: 'placement-2', clusters: ['cluster-1', 'cluster-2'] },
      ])
      const existingPlacements = [placementClusters[0].placement]
      const savedRoleAssignment: RoleAssignment = {
        name: 'saved-role-assignment',
        clusterRole: 'admin',
        clusterSelection: { type: 'placements', placements: [{ name: 'placement-1', namespace: 'test-ns' }] },
      }

      mockFindManagedClusterSetBinding.mockReturnValue([])
      mockGetPlacementsForRoleAssignment.mockReturnValue(existingPlacements)
      mockAddRoleAssignment.mockResolvedValue(savedRoleAssignment)

      const roleAssignment: RoleAssignmentToSave = {
        clusterRole: 'admin',
        clusterNames: ['cluster-1'],
        clusterSetNames: [],
        subject: { name: 'user1', kind: UserKind },
        isGlobalScope: false,
      }

      const callbacks: SaveRoleAssignmentCallbacks = {
        onSuccess: jest.fn(),
        onError: jest.fn(),
      }

      const result = await saveRoleAssignment(roleAssignment, new Map(), [], placementClusters, callbacks)

      // Should find placement-1 which exactly matches ['cluster-1']
      expect(mockAddRoleAssignment).toHaveBeenCalledWith(
        roleAssignment,
        expect.objectContaining({
          existingPlacements,
        })
      )
      expect(result).toBe(savedRoleAssignment)
    })

    it('should handle group subjects correctly', async () => {
      const existingMcra = createMockMulticlusterRoleAssignment('group-mcra')
      const existingBySubjectRole = new Map<string, MulticlusterRoleAssignment[]>()
      existingBySubjectRole.set(`${GroupKind}|developers`, [existingMcra])

      const savedRoleAssignment: RoleAssignment = {
        name: 'saved-role-assignment',
        clusterRole: 'admin',
        clusterSelection: { type: 'placements', placements: [] },
      }

      mockFindManagedClusterSetBinding.mockReturnValue([])
      mockGetPlacementsForRoleAssignment.mockReturnValue([])
      mockAddRoleAssignment.mockResolvedValue(savedRoleAssignment)

      const roleAssignment: RoleAssignmentToSave = {
        clusterRole: 'admin',
        clusterNames: ['cluster-1'],
        clusterSetNames: [],
        subject: { name: 'developers', kind: GroupKind },
        isGlobalScope: false,
      }

      const callbacks: SaveRoleAssignmentCallbacks = {
        onSuccess: jest.fn(),
        onError: jest.fn(),
      }

      const result = await saveRoleAssignment(roleAssignment, existingBySubjectRole, [], [], callbacks)

      expect(mockAddRoleAssignment).toHaveBeenCalledWith(
        roleAssignment,
        expect.objectContaining({
          existingMulticlusterRoleAssignments: [existingMcra],
        })
      )
      expect(callbacks.onSuccess).toHaveBeenCalledWith(savedRoleAssignment)
      expect(result).toBe(savedRoleAssignment)
    })

    it('should call addRoleAssignment with global placement when isGlobalScope is true', async () => {
      const existingMcra = createMockMulticlusterRoleAssignment('existing-mcra')
      const existingBySubjectRole = new Map<string, MulticlusterRoleAssignment[]>()
      existingBySubjectRole.set(`${UserKind}|user1`, [existingMcra])

      const globalPlacement: Placement = {
        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
        kind: 'Placement',
        metadata: { name: GlobalPlacementName, namespace: MulticlusterRoleAssignmentNamespace },
        spec: {},
      }

      const placementClusters: PlacementClusters[] = [
        {
          placement: globalPlacement,
          clusters: ['cluster-a', 'cluster-b', 'cluster-c'],
          clusterSetNames: undefined,
        },
      ]

      const savedRoleAssignment: RoleAssignment = {
        name: 'saved-role-assignment',
        clusterRole: 'admin',
        clusterSelection: {
          type: 'placements',
          placements: [{ name: GlobalPlacementName, namespace: MulticlusterRoleAssignmentNamespace }],
        },
      }

      mockFindManagedClusterSetBinding.mockReturnValue([])
      mockGetPlacementsForRoleAssignment.mockReturnValue([globalPlacement])
      mockAddRoleAssignment.mockResolvedValue(savedRoleAssignment)

      const roleAssignment: RoleAssignmentToSave = {
        clusterRole: 'admin',
        subject: { name: 'user1', kind: UserKind },
        isGlobalScope: true,
      }

      const callbacks: SaveRoleAssignmentCallbacks = {
        onSuccess: jest.fn(),
        onError: jest.fn(),
      }

      await saveRoleAssignment(roleAssignment, existingBySubjectRole, [], placementClusters, callbacks)

      expect(mockGetPlacementsForRoleAssignment).toHaveBeenCalledWith(roleAssignment, placementClusters)
      expect(mockAddRoleAssignment).toHaveBeenCalledWith(roleAssignment, {
        existingMulticlusterRoleAssignments: [existingMcra],
        existingManagedClusterSetBindings: [],
        existingPlacements: [globalPlacement],
      })
      expect(callbacks.onSuccess).toHaveBeenCalledWith(savedRoleAssignment)
      expect(callbacks.onError).not.toHaveBeenCalled()
    })

    it('should invoke onError callback when isGlobalScope is true but global placement is not found', async () => {
      const placementClusters: PlacementClusters[] = [
        {
          placement: createMockPlacement('other-placement'),
          clusters: ['cluster-a'],
          clusterSetNames: ['default'],
        },
      ]

      mockFindManagedClusterSetBinding.mockReturnValue([])
      mockGetPlacementsForRoleAssignment.mockImplementation(() => {
        throw new Error(
          'Global placement not found. Expected placement with name: global and namespace: open-cluster-management-global-set.'
        )
      })

      const roleAssignment: RoleAssignmentToSave = {
        clusterRole: 'admin',
        subject: { name: 'user1', kind: UserKind },
        isGlobalScope: true,
      }

      const callbacks: SaveRoleAssignmentCallbacks = {
        onSuccess: jest.fn(),
        onError: jest.fn(),
      }

      let errorThrown: Error | undefined
      try {
        await saveRoleAssignment(roleAssignment, new Map(), [], placementClusters, callbacks)
      } catch (error) {
        errorThrown = error as Error
      }

      expect(errorThrown).toBeDefined()
      expect(errorThrown?.message).toContain('Global placement not found')

      expect(callbacks.onSuccess).not.toHaveBeenCalled()
      expect(callbacks.onError).not.toHaveBeenCalled()
    })
  })

  describe('saveAllRoleAssignments', () => {
    const mockAddRoleAssignment = addRoleAssignment as jest.MockedFunction<typeof addRoleAssignment>
    const mockFindManagedClusterSetBinding = findManagedClusterSetBinding as jest.MockedFunction<
      typeof findManagedClusterSetBinding
    >
    const mockGetPlacementsForRoleAssignment = getPlacementsForRoleAssignment as jest.MockedFunction<
      typeof getPlacementsForRoleAssignment
    >

    const mockToastContext = {
      addAlert: jest.fn(),
      removeAlert: jest.fn(),
      activeAlerts: [],
      alertInfos: [],
      removeVisibleAlert: jest.fn(),
      clearAlerts: jest.fn(),
    }

    const mockT = ((key: string, options?: Record<string, unknown>) => {
      if (options) {
        return Object.entries(options).reduce((acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)), key)
      }
      return key
    }) as unknown as jest.MockedFunction<typeof jest.fn>

    beforeEach(() => {
      jest.clearAllMocks()
      mockFindManagedClusterSetBinding.mockReturnValue([])
      mockGetPlacementsForRoleAssignment.mockReturnValue([])
    })

    it('should save all role assignments and show success toasts', async () => {
      const savedRoleAssignment1: RoleAssignment = {
        name: 'saved-role-assignment-1',
        clusterRole: 'admin',
        clusterSelection: { type: 'placements', placements: [] },
      }
      const savedRoleAssignment2: RoleAssignment = {
        name: 'saved-role-assignment-2',
        clusterRole: 'viewer',
        clusterSelection: { type: 'placements', placements: [] },
      }

      mockAddRoleAssignment.mockResolvedValueOnce(savedRoleAssignment1).mockResolvedValueOnce(savedRoleAssignment2)

      const roleAssignmentsToSave: RoleAssignmentToSave[] = [
        {
          clusterRole: 'admin',
          clusterNames: ['cluster-1'],
          clusterSetNames: [],
          subject: { name: 'user1', kind: UserKind },
          isGlobalScope: false,
        },
        {
          clusterRole: 'viewer',
          clusterNames: ['cluster-1'],
          clusterSetNames: [],
          subject: { name: 'user2', kind: UserKind },
          isGlobalScope: false,
        },
      ]

      const result = await saveAllRoleAssignments(
        roleAssignmentsToSave,
        new Map(),
        [],
        [],
        mockToastContext,
        mockT as never
      )

      expect(mockAddRoleAssignment).toHaveBeenCalledTimes(2)
      expect(mockToastContext.addAlert).toHaveBeenCalledTimes(2)
      expect(mockToastContext.addAlert).toHaveBeenCalledWith({
        title: 'Role assignment added',
        message: 'A role assignment for admin role added.',
        type: 'success',
        autoClose: true,
      })
      expect(mockToastContext.addAlert).toHaveBeenCalledWith({
        title: 'Role assignment added',
        message: 'A role assignment for viewer role added.',
        type: 'success',
        autoClose: true,
      })
      expect(result).toEqual([savedRoleAssignment1, savedRoleAssignment2])
    })

    it('should show error toast when role assignment fails', async () => {
      mockAddRoleAssignment.mockRejectedValue(new Error('Network error'))

      const roleAssignmentsToSave: RoleAssignmentToSave[] = [
        {
          clusterRole: 'admin',
          clusterNames: ['cluster-1'],
          clusterSetNames: [],
          subject: { name: 'user1', kind: UserKind },
          isGlobalScope: false,
        },
      ]

      await expect(
        saveAllRoleAssignments(roleAssignmentsToSave, new Map(), [], [], mockToastContext, mockT as never)
      ).rejects.toThrow('Network error')

      expect(mockToastContext.addAlert).toHaveBeenCalledWith({
        title: 'Role assignment creation failed',
        message: 'The role assignment creation for admin role failed. Error: Error: Network error',
        type: 'danger',
        autoClose: true,
      })
    })

    it('should show duplicate error toast when duplicate is detected', async () => {
      mockAddRoleAssignment.mockRejectedValue(new Error('Duplicate role assignment detected'))

      const roleAssignmentsToSave: RoleAssignmentToSave[] = [
        {
          clusterRole: 'editor',
          clusterNames: ['cluster-1'],
          clusterSetNames: [],
          subject: { name: 'user1', kind: UserKind },
          isGlobalScope: false,
        },
      ]

      await expect(
        saveAllRoleAssignments(roleAssignmentsToSave, new Map(), [], [], mockToastContext, mockT as never)
      ).rejects.toThrow('Duplicate role assignment detected')

      expect(mockToastContext.addAlert).toHaveBeenCalledWith({
        title: 'Role assignment creation failed',
        message: 'This role assignment already exists. Please modify the selection to create a unique assignment.',
        type: 'danger',
        autoClose: true,
      })
    })

    it('should handle mixed success and failure scenarios', async () => {
      const savedRoleAssignment: RoleAssignment = {
        name: 'saved-role-assignment',
        clusterRole: 'admin',
        clusterSelection: { type: 'placements', placements: [] },
      }

      mockAddRoleAssignment.mockResolvedValueOnce(savedRoleAssignment).mockRejectedValueOnce(new Error('Network error'))

      const roleAssignmentsToSave: RoleAssignmentToSave[] = [
        {
          clusterRole: 'admin',
          clusterNames: ['cluster-1'],
          clusterSetNames: [],
          subject: { name: 'user1', kind: UserKind },
          isGlobalScope: false,
        },
        {
          clusterRole: 'viewer',
          clusterNames: ['cluster-1'],
          clusterSetNames: [],
          subject: { name: 'user2', kind: UserKind },
          isGlobalScope: false,
        },
      ]

      await expect(
        saveAllRoleAssignments(roleAssignmentsToSave, new Map(), [], [], mockToastContext, mockT as never)
      ).rejects.toThrow('Network error')

      expect(mockToastContext.addAlert).toHaveBeenCalledTimes(2)
      expect(mockToastContext.addAlert).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))
      expect(mockToastContext.addAlert).toHaveBeenCalledWith(expect.objectContaining({ type: 'danger' }))
    })

    it('should handle empty role assignments array', async () => {
      const result = await saveAllRoleAssignments([], new Map(), [], [], mockToastContext, mockT as never)

      expect(mockAddRoleAssignment).not.toHaveBeenCalled()
      expect(mockToastContext.addAlert).not.toHaveBeenCalled()
      expect(result).toEqual([])
    })

    it('should pass existing role assignments to saveRoleAssignment', async () => {
      const existingMcra: MulticlusterRoleAssignment = {
        apiVersion: MulticlusterRoleAssignmentApiVersion,
        kind: MulticlusterRoleAssignmentKind,
        metadata: { name: 'existing-mcra', namespace: MulticlusterRoleAssignmentNamespace },
        spec: {
          subject: { name: 'user1', kind: UserKind },
          roleAssignments: [],
        },
      }

      const existingBySubjectRole = new Map<string, MulticlusterRoleAssignment[]>()
      existingBySubjectRole.set(`${UserKind}|user1`, [existingMcra])

      const savedRoleAssignment: RoleAssignment = {
        name: 'saved-role-assignment',
        clusterRole: 'admin',
        clusterSelection: { type: 'placements', placements: [] },
      }

      mockAddRoleAssignment.mockResolvedValue(savedRoleAssignment)

      const roleAssignmentsToSave: RoleAssignmentToSave[] = [
        {
          clusterRole: 'admin',
          clusterNames: ['cluster-1'],
          clusterSetNames: [],
          subject: { name: 'user1', kind: UserKind },
          isGlobalScope: false,
        },
      ]

      const result = await saveAllRoleAssignments(
        roleAssignmentsToSave,
        existingBySubjectRole,
        [],
        [],
        mockToastContext,
        mockT as never
      )

      expect(mockAddRoleAssignment).toHaveBeenCalledWith(
        roleAssignmentsToSave[0],
        expect.objectContaining({
          existingMulticlusterRoleAssignments: [existingMcra],
        })
      )
      expect(result).toEqual([savedRoleAssignment])
    })

    it('should handle group subjects correctly', async () => {
      const savedRoleAssignment: RoleAssignment = {
        name: 'saved-role-assignment',
        clusterRole: 'admin',
        clusterSelection: { type: 'placements', placements: [] },
      }

      mockAddRoleAssignment.mockResolvedValue(savedRoleAssignment)

      const roleAssignmentsToSave: RoleAssignmentToSave[] = [
        {
          clusterRole: 'admin',
          clusterNames: ['cluster-1'],
          clusterSetNames: [],
          subject: { name: 'developers', kind: GroupKind },
          isGlobalScope: false,
        },
      ]

      const result = await saveAllRoleAssignments(
        roleAssignmentsToSave,
        new Map(),
        [],
        [],
        mockToastContext,
        mockT as never
      )

      expect(mockAddRoleAssignment).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: { name: 'developers', kind: GroupKind },
        }),
        expect.anything()
      )
      expect(mockToastContext.addAlert).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))
      expect(result).toEqual([savedRoleAssignment])
    })

    it('should save role assignment with isGlobalScope true and show success toast', async () => {
      const globalPlacement: Placement = {
        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
        kind: 'Placement',
        metadata: { name: GlobalPlacementName, namespace: MulticlusterRoleAssignmentNamespace },
        spec: {},
      }

      const savedRoleAssignment: RoleAssignment = {
        name: 'saved-role-assignment',
        clusterRole: 'admin',
        clusterSelection: {
          type: 'placements',
          placements: [{ name: GlobalPlacementName, namespace: MulticlusterRoleAssignmentNamespace }],
        },
      }

      mockAddRoleAssignment.mockResolvedValue(savedRoleAssignment)
      mockGetPlacementsForRoleAssignment.mockReturnValue([globalPlacement])

      const roleAssignmentsToSave: RoleAssignmentToSave[] = [
        {
          clusterRole: 'admin',
          subject: { name: 'user1', kind: UserKind },
          isGlobalScope: true,
        },
      ]

      const placementClusters: PlacementClusters[] = [
        {
          placement: globalPlacement,
          clusters: ['cluster-a', 'cluster-b'],
          clusterSetNames: undefined,
        },
      ]

      await saveAllRoleAssignments(
        roleAssignmentsToSave,
        new Map(),
        [],
        placementClusters,
        mockToastContext,
        mockT as never
      )

      expect(mockAddRoleAssignment).toHaveBeenCalledTimes(1)
      expect(mockGetPlacementsForRoleAssignment).toHaveBeenCalledWith(roleAssignmentsToSave[0], placementClusters)
      expect(mockToastContext.addAlert).toHaveBeenCalledWith({
        title: 'Role assignment added',
        message: 'A role assignment for admin role added.',
        type: 'success',
        autoClose: true,
      })
    })

    it('should show error toast when isGlobalScope is true but global placement is not found', async () => {
      const placementClusters: PlacementClusters[] = [
        {
          placement: createMockPlacement('other-placement'),
          clusters: ['cluster-a'],
          clusterSetNames: ['default'],
        },
      ]

      mockGetPlacementsForRoleAssignment.mockImplementation(() => {
        throw new Error(
          'Global placement not found. Expected placement with name: global and namespace: open-cluster-management-global-set.'
        )
      })

      const roleAssignmentsToSave: RoleAssignmentToSave[] = [
        {
          clusterRole: 'admin',
          subject: { name: 'user1', kind: UserKind },
          isGlobalScope: true,
        },
      ]

      await expect(
        saveAllRoleAssignments(
          roleAssignmentsToSave,
          new Map(),
          [],
          placementClusters,
          mockToastContext,
          mockT as never
        )
      ).rejects.toThrow('Global placement not found')

      expect(mockAddRoleAssignment).not.toHaveBeenCalled()
      expect(mockToastContext.addAlert).not.toHaveBeenCalled()
    })

    it('should handle mixed isGlobalScope true and false role assignments', async () => {
      const globalPlacement: Placement = {
        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
        kind: 'Placement',
        metadata: { name: GlobalPlacementName, namespace: MulticlusterRoleAssignmentNamespace },
        spec: {},
      }

      const regularPlacement = createMockPlacement('placement-1')

      const savedRoleAssignment1: RoleAssignment = {
        name: 'saved-role-assignment-1',
        clusterRole: 'admin',
        clusterSelection: {
          type: 'placements',
          placements: [{ name: GlobalPlacementName, namespace: MulticlusterRoleAssignmentNamespace }],
        },
      }
      const savedRoleAssignment2: RoleAssignment = {
        name: 'saved-role-assignment-2',
        clusterRole: 'viewer',
        clusterSelection: {
          type: 'placements',
          placements: [{ name: 'placement-1', namespace: MulticlusterRoleAssignmentNamespace }],
        },
      }

      mockAddRoleAssignment
        .mockResolvedValueOnce(savedRoleAssignment1) // For isGlobalScope: true
        .mockResolvedValueOnce(savedRoleAssignment2) // For isGlobalScope: false
      mockGetPlacementsForRoleAssignment
        .mockReturnValueOnce([globalPlacement]) // For isGlobalScope: true
        .mockReturnValueOnce([regularPlacement]) // For isGlobalScope: false

      const roleAssignmentsToSave: RoleAssignmentToSave[] = [
        {
          clusterRole: 'admin',
          subject: { name: 'user1', kind: UserKind },
          isGlobalScope: true,
        },
        {
          clusterRole: 'viewer',
          clusterNames: ['cluster-1'],
          clusterSetNames: [],
          subject: { name: 'user2', kind: UserKind },
          isGlobalScope: false,
        },
      ]

      const placementClusters: PlacementClusters[] = [
        {
          placement: globalPlacement,
          clusters: ['cluster-a', 'cluster-b'],
          clusterSetNames: undefined,
        },
        {
          placement: regularPlacement,
          clusters: ['cluster-1'],
          clusterSetNames: ['default'],
        },
      ]

      await saveAllRoleAssignments(
        roleAssignmentsToSave,
        new Map(),
        [],
        placementClusters,
        mockToastContext,
        mockT as never
      )

      expect(mockAddRoleAssignment).toHaveBeenCalledTimes(2)
      expect(mockToastContext.addAlert).toHaveBeenCalledTimes(2)
      expect(mockToastContext.addAlert).toHaveBeenCalledWith({
        title: 'Role assignment added',
        message: 'A role assignment for admin role added.',
        type: 'success',
        autoClose: true,
      })
      expect(mockToastContext.addAlert).toHaveBeenCalledWith({
        title: 'Role assignment added',
        message: 'A role assignment for viewer role added.',
        type: 'success',
        autoClose: true,
      })
    })
  })
})
