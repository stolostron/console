/* eslint-disable jest/no-conditional-expect */
/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import * as req from '../../resources/utils/resource-request'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { MulticlusterRoleAssignment, MulticlusterRoleAssignmentNamespace } from '../multicluster-role-assignment'
import { Placement } from '../placement'
import { GroupKind, UserKind } from '../rbac'
import { RoleAssignmentToSave } from './model/role-assignment-to-save'
import { createResource, deleteResource, patchResource } from '../utils'
import multiclusterRoleAssignmentsMockData from './mock-data/multicluster-role-assignments.json'
import { FlattenedRoleAssignment } from './model/flattened-role-assignment'
import {
  addRoleAssignment,
  createAdditionalRoleAssignmentResources,
  deleteRoleAssignment,
  findRoleAssignments,
  getPlacementsForRoleAssignment,
  useFindRoleAssignments,
} from './multicluster-role-assignment-client'
import * as managedClusterSetBindingClient from './managed-cluster-set-binding-client'
import { PlacementClusters } from './model/placement-clusters'
import * as placementClient from './placement-client'
import {
  addRoleAssignmentTestCases,
  clusterNamesMatchingTestCases,
  clusterSetsMatchingTestCases,
  combinedMatchingTestCases,
  createMockMulticlusterRoleAssignment,
  createPlacementClusters,
  findRoleAssignmentsSortTestCases,
} from './multicluster-role-assignment-client.fixtures'

const mockGetResource = jest.spyOn(req, 'getResource')

jest.mock('../utils', () => ({
  createResource: jest.fn(),
  deleteResource: jest.fn(),
  patchResource: jest.fn(),
}))

jest.mock('../../shared-recoil', () => ({
  useRecoilValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

// Mock placement-client module
jest.mock('./placement-client', () => ({
  useGetClustersForPlacementMap: jest.fn(),
  useGetPlacementClusters: jest.fn(),
  createForClusters: jest.fn(),
  createForClusterSets: jest.fn(),
  isPlacementForClusterNames: jest.fn(),
  isPlacementForClusterSets: jest.fn(),
  doesPlacementContainsClusterName: jest.fn(),
  doesPlacementContainsClusterSet: jest.fn(),
}))

// Mock managed-cluster-set-binding-client module
jest.mock('./managed-cluster-set-binding-client', () => ({
  createForClusterSets: jest.fn(),
}))

// Mock data as array for useGetPlacementClusters
const mockPlacementClustersArray: PlacementClusters[] = [
  createPlacementClusters('placement-production', ['production-cluster']),
  createPlacementClusters('placement-staging', ['staging-cluster']),
  createPlacementClusters('placement-development', ['development-cluster']),
  createPlacementClusters('placement-all-clusters', [
    'production-cluster',
    'staging-cluster',
    'development-cluster',
    'testing-cluster',
  ]),
  createPlacementClusters('placement-storage', ['production-cluster', 'storage-primary', 'storage-backup']),
  createPlacementClusters('placement-prod-staging', ['production-cluster', 'staging-cluster']),
  createPlacementClusters('placement-dev-test', ['development-cluster', 'testing-cluster']),
  createPlacementClusters('placement-testing', ['testing-cluster']),
  createPlacementClusters('placement-edge-1', ['edge-cluster-1']),
  createPlacementClusters('placement-edge-2', ['edge-cluster-2']),
  createPlacementClusters('placement-edge', ['edge-cluster-1', 'edge-cluster-2']),
  createPlacementClusters('placement-security', ['security-cluster']),
]

// Configure the mock return value
;(placementClient.useGetPlacementClusters as jest.Mock).mockReturnValue(mockPlacementClustersArray)

const deleteResourceMock = deleteResource as jest.MockedFunction<typeof deleteResource>
const patchResourceMock = patchResource as jest.MockedFunction<typeof patchResource>
const useSharedAtomsMock = useSharedAtoms as jest.Mock
const useRecoilValueMock = useRecoilValue as jest.Mock

describe('multicluster-role-assignment-client', function () {
  const mockMulticlusterRoleAssignments: MulticlusterRoleAssignment[] =
    multiclusterRoleAssignmentsMockData as MulticlusterRoleAssignment[]

  beforeAll(() => {
    jest.clearAllMocks()
  })

  describe('RoleAssignment to FlattenedRoleAssignment mapping', () => {
    beforeEach(() => {
      useSharedAtomsMock.mockReturnValue({ multiclusterRoleAssignmentState: {} })
      useRecoilValueMock.mockReturnValue(mockMulticlusterRoleAssignments)
    })

    it('relatedMulticlusterRoleAssignment properly mapped', () => {
      // Arrange
      const kind = 'User'
      const name = 'admin.user'

      // Act
      const { result } = renderHook(() =>
        useFindRoleAssignments({
          subjectKinds: [kind],
          subjectNames: [name],
        })
      )

      // Assert
      expect(result.current).toHaveLength(2)
      expect(result.current[0].relatedMulticlusterRoleAssignment).toStrictEqual({
        apiVersion: 'rbac.open-cluster-management.io/v1beta1',
        kind: 'MulticlusterRoleAssignment',
        metadata: {
          name: 'admin-user-role-assignment-console',
          namespace: MulticlusterRoleAssignmentNamespace,
          uid: '2f4a6c8e-3b7d-4e9a-6c2f-8e4a7b9d2c5f',
          labels: { 'open-cluster-management.io/managed-by': 'console' },
        },
        spec: {
          subject: { kind: 'User', name: 'admin.user' },
          roleAssignments: [
            {
              name: 'kubevirt.io:admin-0ce91c74417862a9',
              clusterRole: 'kubevirt.io:admin',
              targetNamespaces: ['kubevirt-production'],
              clusterSelection: {
                type: 'placements',
                placements: [{ name: 'placement-production', namespace: MulticlusterRoleAssignmentNamespace }],
              },
            },
            {
              name: 'live-migration-admin-2f8bbe8b5ef6a395',
              clusterRole: 'live-migration-admin',
              targetNamespaces: ['kubevirt-dev', 'vm-dev'],
              clusterSelection: {
                type: 'placements',
                placements: [{ name: 'placement-development', namespace: MulticlusterRoleAssignmentNamespace }],
              },
            },
          ],
        },
        status: {
          roleAssignments: [
            { name: 'kubevirt.io:admin-0ce91c74417862a9', status: 'Active' },
            { name: 'live-migration-admin-2f8bbe8b5ef6a395', status: 'Active' },
          ],
        },
      })
    })

    it('subject properly mapped', () => {
      // Arrange
      const kind = 'Group'
      const name = 'security-auditors'

      // Act
      const { result } = renderHook(() =>
        useFindRoleAssignments({
          subjectKinds: [kind],
          subjectNames: [name],
        })
      )

      // Assert
      expect(result.current).toHaveLength(2)
      expect(result.current[0].subject.kind).toBe(kind)
      expect(result.current[0].subject.name).toBe(name)
    })

    it('RoleAssignment fields properly mapped', () => {
      // Arrange
      const kind = 'Group'
      const name = 'security-auditors'

      // Act
      const { result } = renderHook(() =>
        useFindRoleAssignments({
          subjectKinds: [kind],
          subjectNames: [name],
        })
      )

      // Assert
      expect(result.current).toHaveLength(2)

      expect(result.current[0].name).toBe('kubevirt.io:view-26f10cdfc6e71e8d')
      expect(result.current[0].clusterRole).toBe('kubevirt.io:view')
      expect(result.current[0].targetNamespaces).toStrictEqual(['kubevirt-production'])
      expect(result.current[0].clusterNames).toStrictEqual(['production-cluster'])

      expect(result.current[1].name).toBe('kubevirt.io:view-c89564b44096eb7a')
      expect(result.current[1].clusterRole).toBe('kubevirt.io:view')
      expect(result.current[1].targetNamespaces).toStrictEqual(['security', 'audit-logs'])
      expect(result.current[1].clusterNames).toStrictEqual(['security-cluster'])
    })

    it('status properly mapped', () => {
      // Arrange
      const kind = 'Group'
      const name = 'security-auditors'

      // Act
      const { result } = renderHook(() =>
        useFindRoleAssignments({
          subjectKinds: [kind],
          subjectNames: [name],
        })
      )

      // Assert
      expect(result.current).toHaveLength(2)
      expect((result.current.find((e) => e.name === 'kubevirt.io:view-26f10cdfc6e71e8d') ?? {}).status).toStrictEqual({
        name: 'kubevirt.io:view-26f10cdfc6e71e8d',
        status: 'Active',
      })
      expect((result.current.find((e) => e.name === 'kubevirt.io:view-c89564b44096eb7a') ?? {}).status).toStrictEqual({
        name: 'kubevirt.io:view-c89564b44096eb7a',
        status: 'Error',
        reason: "permissions don't applied",
      })
    })
  })

  describe('useFindRoleAssignments', () => {
    beforeEach(() => {
      useSharedAtomsMock.mockReturnValue({ multiclusterRoleAssignmentState: {} })
      useRecoilValueMock.mockReturnValue(mockMulticlusterRoleAssignments)
    })

    it('should return all role assignments when no query filters are provided', () => {
      // Act
      const { result } = renderHook(() => useFindRoleAssignments({}))

      // Assert
      expect(result.current).toHaveLength(33)
    })

    it('should filter by subject name', () => {
      // Arrange
      const name = 'alice.trask'

      // Act
      const { result } = renderHook(() =>
        useFindRoleAssignments({
          subjectNames: [name],
        })
      )

      // Assert
      expect(result.current).toHaveLength(5)
      expect(result.current.filter((e) => e.subject.name !== name)).toHaveLength(0)
    })

    it('should filter by subject kind', () => {
      // Act
      const { result } = renderHook(() =>
        useFindRoleAssignments({
          subjectKinds: [GroupKind],
        })
      )

      // Assert
      expect(result.current).toHaveLength(14)
      expect(result.current.filter((e) => e.subject.kind !== GroupKind)).toHaveLength(0)
    })

    it('should filter by role', () => {
      // Arrange
      const role = 'kubevirt.io:admin'

      // Act
      const { result } = renderHook(() =>
        useFindRoleAssignments({
          roles: [role],
        })
      )

      // Assert
      expect(result.current).toHaveLength(6)
      expect(result.current.filter((e) => e.clusterRole !== role)).toHaveLength(0)
    })

    it('should filter by cluster name', () => {
      // Arrange
      const clusterName = 'production-cluster'

      // Act
      const { result } = renderHook(() =>
        useFindRoleAssignments({
          clusterNames: [clusterName],
        })
      )

      // Assert
      expect(result.current.length).toBeGreaterThan(0)
      expect(result.current.filter((e) => !e.clusterNames.includes(clusterName))).toHaveLength(0)
    })

    it('should filter by multiple criteria', () => {
      // Arrange
      const role = 'kubevirt.io:admin'
      const clusterName = 'production-cluster'

      // Act
      const { result } = renderHook(() =>
        useFindRoleAssignments({
          subjectKinds: [UserKind],
          roles: [role],
          clusterNames: [clusterName],
        })
      )

      // Assert
      expect(result.current.length).toBeGreaterThan(0)
      expect(
        result.current.filter(
          (e) => e.subject.kind !== UserKind || e.clusterRole !== role || !e.clusterNames.includes(clusterName)
        )
      ).toHaveLength(0)
    })

    it('should return empty array when no matches found', () => {
      // Act
      const { result } = renderHook(() =>
        useFindRoleAssignments({
          subjectNames: ['nonexistent.user'],
        })
      )

      // Assert
      expect(result.current).toHaveLength(0)
    })
  })

  describe('deleteRoleAssignment', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      patchResourceMock.mockReturnValue({
        promise: Promise.resolve({} as any),
        abort: jest.fn(),
      })
      deleteResourceMock.mockReturnValue({
        promise: Promise.resolve({} as any),
        abort: jest.fn(),
      })
    })

    it('deletes existing role assignment for a MulticlusterRoleAssignment with multiple elements', async () => {
      // Arrange
      const multiClusterRoleAssignment: MulticlusterRoleAssignment = {
        ...multiclusterRoleAssignmentsMockData[0],
      } as MulticlusterRoleAssignment

      const roleAssignmentToRemove: FlattenedRoleAssignment = {
        relatedMulticlusterRoleAssignment: multiClusterRoleAssignment,
        name: multiClusterRoleAssignment.spec.roleAssignments[0].name,
        clusterRole: multiClusterRoleAssignment.spec.roleAssignments[0].clusterRole,
        clusterSelection: multiClusterRoleAssignment.spec.roleAssignments[0].clusterSelection,
        clusterNames: ['production-cluster'],
        subject: {
          kind: multiClusterRoleAssignment.spec.subject.kind,
          name: multiClusterRoleAssignment.spec.subject.name,
        },
        targetNamespaces: multiClusterRoleAssignment.spec.roleAssignments[0].targetNamespaces,
      }

      mockGetResource.mockReturnValueOnce({
        promise: Promise.resolve(multiClusterRoleAssignment as MulticlusterRoleAssignment),
        abort: jest.fn(),
      })

      // Act
      await deleteRoleAssignment(roleAssignmentToRemove).promise
      // Assert
      expect(deleteResourceMock).toHaveBeenCalledTimes(0)
      expect(patchResourceMock).toHaveBeenCalledTimes(1)
      expect(patchResourceMock).toHaveBeenCalledWith(roleAssignmentToRemove.relatedMulticlusterRoleAssignment, {
        spec: {
          ...multiClusterRoleAssignment.spec,
          roleAssignments: [...multiClusterRoleAssignment.spec.roleAssignments].slice(
            1,
            multiClusterRoleAssignment.spec.roleAssignments.length
          ),
        },
      })
    })

    it('deletes existing role assignment for a MulticlusterRoleAssignment with single element', async () => {
      // Arrange
      const multiClusterRoleAssignment: MulticlusterRoleAssignment = {
        ...multiclusterRoleAssignmentsMockData[5],
      } as MulticlusterRoleAssignment

      const roleAssignmentToRemove: FlattenedRoleAssignment = {
        relatedMulticlusterRoleAssignment: multiClusterRoleAssignment,
        name: multiClusterRoleAssignment.spec.roleAssignments[0].name,
        clusterRole: multiClusterRoleAssignment.spec.roleAssignments[0].clusterRole,
        clusterSelection: multiClusterRoleAssignment.spec.roleAssignments[0].clusterSelection,
        clusterNames: ['development-cluster'],
        subject: {
          kind: multiClusterRoleAssignment.spec.subject.kind,
          name: multiClusterRoleAssignment.spec.subject.name,
        },
        targetNamespaces: multiClusterRoleAssignment.spec.roleAssignments[0].targetNamespaces,
      }

      mockGetResource.mockReturnValueOnce({
        promise: Promise.resolve(multiClusterRoleAssignment as MulticlusterRoleAssignment),
        abort: jest.fn(),
      })

      // Act
      await deleteRoleAssignment(roleAssignmentToRemove).promise

      // Assert
      expect(patchResourceMock).toHaveBeenCalledTimes(0)
      expect(deleteResourceMock).toHaveBeenCalledTimes(1)
      expect(deleteResourceMock).toHaveBeenCalledWith(roleAssignmentToRemove.relatedMulticlusterRoleAssignment)
    })

    it('deletes mulitple role assignments under the same MulticlusterRoleAssignment', async () => {
      // Arrange
      const multiClusterRoleAssignment: MulticlusterRoleAssignment = {
        ...multiclusterRoleAssignmentsMockData[2],
      } as MulticlusterRoleAssignment

      const roleAssignmentToRemoveFirst: FlattenedRoleAssignment = {
        relatedMulticlusterRoleAssignment: multiClusterRoleAssignment,
        name: multiClusterRoleAssignment.spec.roleAssignments[0].name,
        clusterRole: multiClusterRoleAssignment.spec.roleAssignments[0].clusterRole,
        clusterSelection: multiClusterRoleAssignment.spec.roleAssignments[0].clusterSelection,
        clusterNames: ['production-cluster'],
        subject: {
          kind: multiClusterRoleAssignment.spec.subject.kind,
          name: multiClusterRoleAssignment.spec.subject.name,
        },
        targetNamespaces: multiClusterRoleAssignment.spec.roleAssignments[0].targetNamespaces,
      }

      const roleAssignmentToRemoveSecond: FlattenedRoleAssignment = {
        relatedMulticlusterRoleAssignment: multiClusterRoleAssignment,
        name: multiClusterRoleAssignment.spec.roleAssignments[1].name,
        clusterRole: multiClusterRoleAssignment.spec.roleAssignments[1].clusterRole,
        clusterSelection: multiClusterRoleAssignment.spec.roleAssignments[1].clusterSelection,
        clusterNames: ['development-cluster'],
        subject: {
          kind: multiClusterRoleAssignment.spec.subject.kind,
          name: multiClusterRoleAssignment.spec.subject.name,
        },
        targetNamespaces: multiClusterRoleAssignment.spec.roleAssignments[1].targetNamespaces,
      }

      mockGetResource
        .mockReturnValueOnce({
          promise: Promise.resolve(multiClusterRoleAssignment as MulticlusterRoleAssignment),
          abort: jest.fn(),
        })
        .mockReturnValueOnce({
          promise: Promise.resolve({
            ...multiClusterRoleAssignment,
            spec: {
              ...multiClusterRoleAssignment.spec,
              roleAssignments: [...multiClusterRoleAssignment.spec.roleAssignments].slice(
                1,
                multiClusterRoleAssignment.spec.roleAssignments.length
              ),
            },
          } as MulticlusterRoleAssignment),
          abort: jest.fn(),
        })

      // Act
      await deleteRoleAssignment(roleAssignmentToRemoveFirst).promise
      expect(patchResourceMock).toHaveBeenCalledTimes(1)
      expect(deleteResourceMock).toHaveBeenCalledTimes(0)

      // Reset
      patchResourceMock.mockClear()
      deleteResourceMock.mockClear()

      await deleteRoleAssignment(roleAssignmentToRemoveSecond).promise
      expect(patchResourceMock).toHaveBeenCalledTimes(0)
      expect(deleteResourceMock).toHaveBeenCalledTimes(1)
    })

    it('throws error when deleting non-existing role assignment', async () => {
      // Arrange
      const multiClusterRoleAssignment: MulticlusterRoleAssignment = {
        ...multiclusterRoleAssignmentsMockData[0],
      } as MulticlusterRoleAssignment

      const roleAssignmentToRemove: FlattenedRoleAssignment = {
        relatedMulticlusterRoleAssignment: multiClusterRoleAssignment,
        name: 'non-existing-role-assignment',
        clusterRole: 'non-existing',
        clusterSelection: {
          type: 'placements',
          placements: [{ name: 'placement-production', namespace: MulticlusterRoleAssignmentNamespace }],
        },
        clusterNames: ['production-cluster'],
        subject: {
          kind: 'User',
          name: 'alice.trask',
        },
        targetNamespaces: ['default'],
      }

      mockGetResource.mockReturnValue({
        promise: Promise.resolve(multiClusterRoleAssignment as MulticlusterRoleAssignment),
        abort: jest.fn(),
      })

      // Act
      try {
        await deleteRoleAssignment(roleAssignmentToRemove).promise
        expect(true).toBe(false)
      } catch (e) {
        // Assert
        expect((e as Error).message).toBe(
          'The role assignment does not exist for this particular MulticlusterRoleAssignment'
        )
        expect(deleteResourceMock).toHaveBeenCalledTimes(0)
        expect(patchResourceMock).toHaveBeenCalledTimes(0)
      }
    })
  })

  describe('getPlacementsForRoleAssignment', () => {
    describe('cluster sets matching', () => {
      it.each(clusterSetsMatchingTestCases)(
        '$description',
        ({ placementClusters, roleAssignment, expectedPlacementNames }) => {
          const result = getPlacementsForRoleAssignment(roleAssignment, placementClusters)

          expect(result).toHaveLength(expectedPlacementNames.length)
          expect(result.map((p) => p.metadata.name)).toEqual(expectedPlacementNames)
        }
      )
    })

    describe('cluster names matching', () => {
      it.each(clusterNamesMatchingTestCases)(
        '$description',
        ({ placementClusters, roleAssignment, expectedPlacementNames }) => {
          const result = getPlacementsForRoleAssignment(roleAssignment, placementClusters)

          expect(result).toHaveLength(expectedPlacementNames.length)
          expect(result.map((p) => p.metadata.name)).toEqual(expectedPlacementNames)
        }
      )
    })

    describe('combined matching', () => {
      it.each(combinedMatchingTestCases)(
        '$description',
        ({ placementClusters, roleAssignment, expectedPlacementNames }) => {
          const result = getPlacementsForRoleAssignment(roleAssignment, placementClusters)

          expect(result).toHaveLength(expectedPlacementNames.length)
          expect(result.map((p) => p.metadata.name)).toEqual(expectedPlacementNames)
        }
      )
    })
  })

  describe('createAdditionalRoleAssignmentResources', () => {
    const mockCreateForClusterSetsBinding = managedClusterSetBindingClient.createForClusterSets as jest.Mock
    const mockCreateForClusters = placementClient.createForClusters as jest.Mock
    const mockCreateForClusterSets = placementClient.createForClusterSets as jest.Mock
    const mockIsPlacementForClusterNames = placementClient.isPlacementForClusterNames as jest.Mock
    const mockIsPlacementForClusterSets = placementClient.isPlacementForClusterSets as jest.Mock
    const mockDoesPlacementContainsClusterName = placementClient.doesPlacementContainsClusterName as jest.Mock
    const mockDoesPlacementContainsClusterSet = placementClient.doesPlacementContainsClusterSet as jest.Mock

    const createMockPlacement = (name: string, clusterSets?: string[]): Placement => ({
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: { name, namespace: MulticlusterRoleAssignmentNamespace },
      spec: { clusterSets },
    })

    beforeEach(() => {
      jest.clearAllMocks()
    })

    describe('ManagedClusterSetBinding creation', () => {
      it('should create ManagedClusterSetBinding for cluster sets not in existingManagedClusterSetBindings', async () => {
        const roleAssignment: RoleAssignmentToSave = {
          clusterRole: 'admin',
          clusterSetNames: ['cs01', 'cs02'],
          subject: { kind: UserKind, name: 'user1' },
        }
        const existingManagedClusterSetBindings = [{ spec: { clusterSet: 'cs01' } }] as any[]

        mockCreateForClusterSetsBinding.mockReturnValue({ promise: Promise.resolve({}) })
        mockCreateForClusterSets.mockReturnValue({ promise: Promise.resolve(createMockPlacement('cs02', ['cs02'])) })
        mockIsPlacementForClusterSets.mockReturnValue(false)

        await createAdditionalRoleAssignmentResources(roleAssignment, {
          existingManagedClusterSetBindings,
          existingPlacements: [],
        })

        expect(mockCreateForClusterSetsBinding).toHaveBeenCalledTimes(1)
        expect(mockCreateForClusterSetsBinding).toHaveBeenCalledWith('cs02')
      })

      it('should not create ManagedClusterSetBinding if all cluster sets already exist', async () => {
        const roleAssignment: RoleAssignmentToSave = {
          clusterRole: 'admin',
          clusterSetNames: ['cs01'],
          subject: { kind: UserKind, name: 'user1' },
        }
        const existingManagedClusterSetBindings = [{ spec: { clusterSet: 'cs01' } }] as any[]

        mockIsPlacementForClusterSets.mockReturnValue(false)

        await createAdditionalRoleAssignmentResources(roleAssignment, {
          existingManagedClusterSetBindings,
          existingPlacements: [],
        })

        expect(mockCreateForClusterSetsBinding).not.toHaveBeenCalled()
      })

      it('should not create ManagedClusterSetBinding when clusterSetNames is undefined', async () => {
        const roleAssignment: RoleAssignmentToSave = {
          clusterRole: 'admin',
          clusterNames: ['cluster-a'],
          subject: { kind: UserKind, name: 'user1' },
        }
        const newPlacement = createMockPlacement('clusters-cluster-a')

        mockIsPlacementForClusterNames.mockReturnValue(false)
        mockCreateForClusters.mockReturnValue({ promise: Promise.resolve(newPlacement) })

        await createAdditionalRoleAssignmentResources(roleAssignment, {
          existingManagedClusterSetBindings: [],
          existingPlacements: [],
        })

        expect(mockCreateForClusterSetsBinding).not.toHaveBeenCalled()
      })
    })

    describe('Placement creation for cluster names', () => {
      it('should create Placement for clusters not in existing placements', async () => {
        const roleAssignment: RoleAssignmentToSave = {
          clusterRole: 'admin',
          clusterNames: ['cluster-a', 'cluster-b'],
          subject: { kind: UserKind, name: 'user1' },
        }
        const existingPlacement = createMockPlacement('existing-placement')
        const newPlacement = createMockPlacement('clusters-cluster-a-and-cluster-b')

        mockIsPlacementForClusterNames.mockReturnValue(true)
        mockDoesPlacementContainsClusterName.mockReturnValue(false) // no clusters match
        mockCreateForClusters.mockReturnValue({ promise: Promise.resolve(newPlacement) })

        const result = await createAdditionalRoleAssignmentResources(roleAssignment, {
          existingManagedClusterSetBindings: [],
          existingPlacements: [existingPlacement],
        })

        expect(mockCreateForClusters).toHaveBeenCalledTimes(1)
        expect(mockCreateForClusters).toHaveBeenCalledWith(['cluster-a', 'cluster-b'])
        expect(result).toContain(existingPlacement)
        expect(result).toContain(newPlacement)
      })

      it('should not create Placement if all clusters are in existing placements', async () => {
        const roleAssignment: RoleAssignmentToSave = {
          clusterRole: 'admin',
          clusterNames: ['cluster-a'],
          subject: { kind: UserKind, name: 'user1' },
        }
        const existingPlacement = createMockPlacement('existing-placement')

        mockIsPlacementForClusterNames.mockReturnValue(true)
        mockDoesPlacementContainsClusterName.mockReturnValue(true) // cluster matches

        const result = await createAdditionalRoleAssignmentResources(roleAssignment, {
          existingManagedClusterSetBindings: [],
          existingPlacements: [existingPlacement],
        })

        expect(mockCreateForClusters).not.toHaveBeenCalled()
        expect(result).toEqual([existingPlacement])
      })

      it('should only create Placement for clusters not matching existing placements', async () => {
        const roleAssignment: RoleAssignmentToSave = {
          clusterRole: 'admin',
          clusterNames: ['cluster-a', 'cluster-b', 'cluster-c'],
          subject: { kind: UserKind, name: 'user1' },
        }
        const existingPlacement = createMockPlacement('existing-placement')
        const newPlacement = createMockPlacement('clusters-cluster-b-and-cluster-c')

        mockIsPlacementForClusterNames.mockReturnValue(true)
        mockDoesPlacementContainsClusterName
          .mockReturnValueOnce(true) // cluster-a matches
          .mockReturnValueOnce(false) // cluster-b doesn't match
          .mockReturnValueOnce(false) // cluster-c doesn't match
        mockCreateForClusters.mockReturnValue({ promise: Promise.resolve(newPlacement) })

        const result = await createAdditionalRoleAssignmentResources(roleAssignment, {
          existingManagedClusterSetBindings: [],
          existingPlacements: [existingPlacement],
        })

        expect(mockCreateForClusters).toHaveBeenCalledWith(['cluster-b', 'cluster-c'])
        expect(result).toHaveLength(2)
      })

      it('should not create Placement when clusterNames is undefined', async () => {
        const roleAssignment: RoleAssignmentToSave = {
          clusterRole: 'admin',
          clusterSetNames: ['cs01'],
          subject: { kind: UserKind, name: 'user1' },
        }

        mockIsPlacementForClusterSets.mockReturnValue(false)

        await createAdditionalRoleAssignmentResources(roleAssignment, {
          existingManagedClusterSetBindings: [],
          existingPlacements: [],
        })

        expect(mockCreateForClusters).not.toHaveBeenCalled()
      })
    })

    describe('Placement creation for cluster sets', () => {
      it('should create Placement for each cluster set not in existing placements', async () => {
        const roleAssignment: RoleAssignmentToSave = {
          clusterRole: 'admin',
          clusterSetNames: ['cs01', 'cs02'],
          subject: { kind: UserKind, name: 'user1' },
        }
        const newPlacement1 = createMockPlacement('cs01', ['cs01'])
        const newPlacement2 = createMockPlacement('cs02', ['cs02'])

        mockCreateForClusterSetsBinding.mockReturnValue({ promise: Promise.resolve({}) })
        mockIsPlacementForClusterSets.mockReturnValue(false) // no existing clusterSets placements
        mockCreateForClusterSets
          .mockReturnValueOnce({ promise: Promise.resolve(newPlacement1) })
          .mockReturnValueOnce({ promise: Promise.resolve(newPlacement2) })

        const result = await createAdditionalRoleAssignmentResources(roleAssignment, {
          existingManagedClusterSetBindings: [],
          existingPlacements: [],
        })

        expect(mockCreateForClusterSets).toHaveBeenCalledTimes(2)
        expect(mockCreateForClusterSets).toHaveBeenCalledWith(['cs01'])
        expect(mockCreateForClusterSets).toHaveBeenCalledWith(['cs02'])
        expect(result).toContain(newPlacement1)
        expect(result).toContain(newPlacement2)
      })

      it('should not create Placement for cluster sets already in existing placements', async () => {
        const roleAssignment: RoleAssignmentToSave = {
          clusterRole: 'admin',
          clusterSetNames: ['cs01'],
          subject: { kind: UserKind, name: 'user1' },
        }
        const existingPlacement = createMockPlacement('cs01', ['cs01'])

        mockCreateForClusterSetsBinding.mockReturnValue({ promise: Promise.resolve({}) })
        mockIsPlacementForClusterSets.mockReturnValue(true)
        mockDoesPlacementContainsClusterSet.mockReturnValue(true)

        const result = await createAdditionalRoleAssignmentResources(roleAssignment, {
          existingManagedClusterSetBindings: [],
          existingPlacements: [existingPlacement],
        })

        expect(mockCreateForClusterSets).not.toHaveBeenCalled()
        expect(result).toEqual([existingPlacement])
      })

      it('should only create Placement for cluster sets not in existing placements', async () => {
        const roleAssignment: RoleAssignmentToSave = {
          clusterRole: 'admin',
          clusterSetNames: ['cs01', 'cs02', 'cs03'],
          subject: { kind: UserKind, name: 'user1' },
        }
        const existingPlacement = createMockPlacement('cs01', ['cs01'])
        const newPlacement2 = createMockPlacement('cs02', ['cs02'])
        const newPlacement3 = createMockPlacement('cs03', ['cs03'])

        mockCreateForClusterSetsBinding.mockReturnValue({ promise: Promise.resolve({}) })
        mockIsPlacementForClusterSets.mockReturnValue(true)
        mockDoesPlacementContainsClusterSet
          .mockReturnValueOnce(true) // cs01 matches
          .mockReturnValueOnce(false) // cs02 doesn't match
          .mockReturnValueOnce(false) // cs03 doesn't match
        mockCreateForClusterSets
          .mockReturnValueOnce({ promise: Promise.resolve(newPlacement2) })
          .mockReturnValueOnce({ promise: Promise.resolve(newPlacement3) })

        const result = await createAdditionalRoleAssignmentResources(roleAssignment, {
          existingManagedClusterSetBindings: [],
          existingPlacements: [existingPlacement],
        })

        expect(mockCreateForClusterSets).toHaveBeenCalledTimes(2)
        expect(result).toHaveLength(3)
        expect(result).toContain(existingPlacement)
        expect(result).toContain(newPlacement2)
        expect(result).toContain(newPlacement3)
      })
    })

    describe('combined scenarios', () => {
      it('should return all existing placements plus created ones for both clusters and cluster sets', async () => {
        const roleAssignment: RoleAssignmentToSave = {
          clusterRole: 'admin',
          clusterNames: ['cluster-a'],
          clusterSetNames: ['cs01'],
          subject: { kind: UserKind, name: 'user1' },
        }
        const existingPlacement = createMockPlacement('existing')
        const clusterPlacement = createMockPlacement('clusters-cluster-a')
        const clusterSetPlacement = createMockPlacement('cs01', ['cs01'])

        mockCreateForClusterSetsBinding.mockReturnValue({ promise: Promise.resolve({}) })
        mockIsPlacementForClusterNames.mockReturnValue(false)
        mockIsPlacementForClusterSets.mockReturnValue(false)
        mockCreateForClusters.mockReturnValue({ promise: Promise.resolve(clusterPlacement) })
        mockCreateForClusterSets.mockReturnValue({ promise: Promise.resolve(clusterSetPlacement) })

        const result = await createAdditionalRoleAssignmentResources(roleAssignment, {
          existingManagedClusterSetBindings: [],
          existingPlacements: [existingPlacement],
        })

        expect(result).toHaveLength(3)
        expect(result).toContain(existingPlacement)
        expect(result).toContain(clusterPlacement)
        expect(result).toContain(clusterSetPlacement)
      })

      it('should return only existing placements when all clusters and cluster sets match', async () => {
        const roleAssignment: RoleAssignmentToSave = {
          clusterRole: 'admin',
          clusterNames: ['cluster-a'],
          clusterSetNames: ['cs01'],
          subject: { kind: UserKind, name: 'user1' },
        }
        const clusterPlacement = createMockPlacement('clusters-cluster-a')
        const clusterSetPlacement = createMockPlacement('cs01', ['cs01'])

        mockCreateForClusterSetsBinding.mockReturnValue({ promise: Promise.resolve({}) })
        mockIsPlacementForClusterNames.mockReturnValue(true)
        mockIsPlacementForClusterSets.mockReturnValue(true)
        mockDoesPlacementContainsClusterName.mockReturnValue(true)
        mockDoesPlacementContainsClusterSet.mockReturnValue(true)

        const result = await createAdditionalRoleAssignmentResources(roleAssignment, {
          existingManagedClusterSetBindings: [{ spec: { clusterSet: 'cs01' } }] as any[],
          existingPlacements: [clusterPlacement, clusterSetPlacement],
        })

        expect(mockCreateForClusterSetsBinding).not.toHaveBeenCalled()
        expect(mockCreateForClusters).not.toHaveBeenCalled()
        expect(mockCreateForClusterSets).not.toHaveBeenCalled()
        expect(result).toEqual([clusterPlacement, clusterSetPlacement])
      })

      it('should return empty array when no existing placements and no clusters/clusterSets to create', async () => {
        const roleAssignment: RoleAssignmentToSave = {
          clusterRole: 'admin',
          subject: { kind: UserKind, name: 'user1' },
        }

        const result = await createAdditionalRoleAssignmentResources(roleAssignment, {
          existingManagedClusterSetBindings: [],
          existingPlacements: [],
        })

        expect(result).toEqual([])
      })

      it('should handle undefined existingPlacements (covers ?? [] condition)', async () => {
        const roleAssignment: RoleAssignmentToSave = {
          clusterRole: 'admin',
          subject: { kind: UserKind, name: 'user1' },
        }

        const result = await createAdditionalRoleAssignmentResources(roleAssignment, {
          existingManagedClusterSetBindings: [],
          existingPlacements: undefined,
        })

        expect(result).toEqual([])
      })
    })
  })

  describe('findRoleAssignments sort', () => {
    it.each(findRoleAssignmentsSortTestCases)('$description', ({ subjectNames, expectedOrder }) => {
      // Create mock MulticlusterRoleAssignments that will produce these FlattenedRoleAssignments
      const mockMRAs: MulticlusterRoleAssignment[] = subjectNames.map((name, index) => ({
        apiVersion: 'rbac.open-cluster-management.io/v1beta1' as const,
        kind: 'MulticlusterRoleAssignment' as const,
        metadata: { name: `mra-${index}`, namespace: MulticlusterRoleAssignmentNamespace },
        spec: {
          subject: { name: name ?? '', kind: UserKind, apiGroup: 'rbac.authorization.k8s.io' },
          roleAssignments: [
            {
              name: `role-${index}`,
              clusterRole: 'admin',
              clusterSelection: { type: 'placements' as const, placements: [] },
              targetNamespaces: [],
            },
          ],
        },
        status: {},
      }))

      // Override subject names to include undefined for testing
      const result = findRoleAssignments({}, mockMRAs, [])

      // For items with empty string (from undefined), they will sort first
      const resultNames = result.map((fra) => (fra.subject.name === '' ? undefined : fra.subject.name))
      expect(resultNames).toEqual(expectedOrder)
    })
  })

  describe('addRoleAssignment', () => {
    const mockCreateResource = createResource as jest.MockedFunction<typeof createResource>
    const mockPatchResourceForAdd = patchResource as jest.MockedFunction<typeof patchResource>
    const mockCreateForClusterSetsBindingAdd = managedClusterSetBindingClient.createForClusterSets as jest.Mock
    const mockCreateForClustersAdd = placementClient.createForClusters as jest.Mock
    const mockCreateForClusterSetsAdd = placementClient.createForClusterSets as jest.Mock
    const mockIsPlacementForClusterNamesAdd = placementClient.isPlacementForClusterNames as jest.Mock
    const mockIsPlacementForClusterSetsAdd = placementClient.isPlacementForClusterSets as jest.Mock

    const createMockPlacementAdd = (name: string, clusterSets?: string[]): Placement => ({
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: { name, namespace: MulticlusterRoleAssignmentNamespace },
      spec: { clusterSets },
    })

    beforeEach(() => {
      jest.clearAllMocks()
      mockCreateForClusterSetsBindingAdd.mockReturnValue({ promise: Promise.resolve({}) })
      mockCreateForClustersAdd.mockReturnValue({
        promise: Promise.resolve(createMockPlacementAdd('clusters-placement')),
      })
      mockCreateForClusterSetsAdd.mockReturnValue({
        promise: Promise.resolve(createMockPlacementAdd('clusterset-placement', ['cs01'])),
      })
      mockIsPlacementForClusterNamesAdd.mockReturnValue(false)
      mockIsPlacementForClusterSetsAdd.mockReturnValue(false)
    })

    describe('validation', () => {
      it.each(addRoleAssignmentTestCases.filter((tc) => !tc.shouldSucceed))(
        '$description',
        async ({ roleAssignment, existingPlacements, expectedErrorMessage }) => {
          const result = await addRoleAssignment(roleAssignment, {
            existingMulticlusterRoleAssignment: undefined,
            existingManagedClusterSetBindings: [],
            existingPlacements,
          })

          await expect(result.promise).rejects.toThrow(expectedErrorMessage)
        }
      )
    })

    describe('create new MulticlusterRoleAssignment', () => {
      it.each(addRoleAssignmentTestCases.filter((tc) => tc.shouldSucceed && !tc.existingMulticlusterRoleAssignment))(
        '$description',
        async ({ roleAssignment, existingPlacements }) => {
          const createdMRA: MulticlusterRoleAssignment = {
            apiVersion: 'rbac.open-cluster-management.io/v1beta1',
            kind: 'MulticlusterRoleAssignment',
            metadata: { name: 'new-mra', namespace: MulticlusterRoleAssignmentNamespace },
            spec: { subject: roleAssignment.subject, roleAssignments: [] },
            status: {},
          }
          mockCreateResource.mockReturnValue({ promise: Promise.resolve(createdMRA), abort: jest.fn() })

          const result = await addRoleAssignment(roleAssignment, {
            existingMulticlusterRoleAssignment: undefined,
            existingManagedClusterSetBindings: [],
            existingPlacements,
          })

          expect(result).toBeDefined()
          expect(result.promise).toBeDefined()
          await expect(result.promise).resolves.toBeDefined()
          expect(mockCreateResource).toHaveBeenCalled()
        }
      )
    })

    describe('patch existing MulticlusterRoleAssignment', () => {
      it.each(addRoleAssignmentTestCases.filter((tc) => tc.shouldSucceed && tc.existingMulticlusterRoleAssignment))(
        '$description',
        async ({ roleAssignment, existingMulticlusterRoleAssignment, existingPlacements }) => {
          mockPatchResourceForAdd.mockReturnValue({
            promise: Promise.resolve(existingMulticlusterRoleAssignment!),
            abort: jest.fn(),
          })

          const result = await addRoleAssignment(roleAssignment, {
            existingMulticlusterRoleAssignment,
            existingManagedClusterSetBindings: [],
            existingPlacements,
          })

          await expect(result.promise).resolves.toBeDefined()
          expect(mockPatchResourceForAdd).toHaveBeenCalled()
        }
      )
    })

    describe('duplicate detection', () => {
      it('should reject when adding duplicate role assignment', async () => {
        // Import sha256 to compute the expected hash
        const { sha256 } = await import('js-sha256')

        const roleAssignment: RoleAssignmentToSave = {
          clusterRole: 'admin',
          clusterNames: ['cluster-a'],
          subject: { name: 'user1', kind: UserKind },
        }

        // Compute the expected hash the same way getRoleAssignmentName does
        const sortedKeys = Object.keys(roleAssignment).sort((a, b) => a.localeCompare(b))
        const sortedObject: Record<string, unknown> = {}
        for (const key of sortedKeys) {
          const value = roleAssignment[key as keyof typeof roleAssignment]
          if (['targetNamespaces', 'clusterNames', 'clusterSetNames'].includes(key) && value && Array.isArray(value)) {
            sortedObject[key] = [...value].sort((a: string, b: string) => a.localeCompare(b))
          } else {
            sortedObject[key] = value
          }
        }
        const expectedHash = sha256(JSON.stringify(sortedObject)).substring(0, 16)

        // Create an existing MRA with a role assignment that has the same hash name
        const existingMRA = createMockMulticlusterRoleAssignment('existing-mra', roleAssignment.subject, [])
        existingMRA.spec.roleAssignments = [
          {
            name: expectedHash, // Use the computed hash to trigger duplicate detection
            clusterRole: 'admin',
            clusterSelection: { type: 'placements', placements: [] },
          },
        ]

        // Test with existing MRA that has matching role assignment - should reject as duplicate
        const result = await addRoleAssignment(roleAssignment, {
          existingMulticlusterRoleAssignment: existingMRA,
          existingManagedClusterSetBindings: [],
          existingPlacements: [],
        })

        await expect(result.promise).rejects.toThrow('Duplicate role assignment detected.')
      })

      it('should succeed when role assignment is unique', async () => {
        const roleAssignment: RoleAssignmentToSave = {
          clusterRole: 'admin',
          clusterNames: ['cluster-a'],
          subject: { name: 'user1', kind: UserKind },
        }

        // Create an existing MRA with a role assignment that has a different hash
        const existingMRA = createMockMulticlusterRoleAssignment('existing-mra', roleAssignment.subject, [])
        existingMRA.spec.roleAssignments = [
          {
            name: 'different-hash-value', // Different hash, not a duplicate
            clusterRole: 'viewer', // Different role
            clusterSelection: { type: 'placements', placements: [] },
          },
        ]

        // We cannot directly test duplicate detection without knowing the hash algorithm output
        // Instead, test that when existingMRA has matching role assignments, it works correctly
        mockCreateResource.mockReturnValue({
          promise: Promise.resolve({
            apiVersion: 'rbac.open-cluster-management.io/v1beta1' as const,
            kind: 'MulticlusterRoleAssignment' as const,
            metadata: { name: 'test', namespace: MulticlusterRoleAssignmentNamespace },
            spec: { subject: roleAssignment.subject, roleAssignments: [] },
            status: {},
          }),
          abort: jest.fn(),
        })

        const result = await addRoleAssignment(roleAssignment, {
          existingMulticlusterRoleAssignment: existingMRA,
          existingManagedClusterSetBindings: [],
          existingPlacements: [],
        })

        await expect(result.promise).resolves.toBeDefined()
        expect(mockPatchResourceForAdd).toHaveBeenCalled()
      })
    })
  })
})
