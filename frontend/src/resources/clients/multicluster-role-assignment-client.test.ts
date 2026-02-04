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
  getRoleAssignmentName,
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
  createMRAWithMultipleRoles,
  createMRAWithSingleRoleAndMultiplePlacements,
  createMRAWithSingleRoleAndPlacement,
  createPlacementClusters,
  createPlacementClustersWithNamespace,
  findRoleAssignmentsSortTestCases,
  getClustersDeduplicationTestCases,
  getClustersSortingTestCases,
  getRoleAssignmentNameEquivalentPairTestCases,
  globalScopeTestCases,
  minimalPlacementCoverClusterSetsTestCases,
  minimalPlacementCoverClustersTestCases,
  namespaceFilteringTestCases,
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

    it('should filter by cluster set name', () => {
      // Arrange
      const clusterSetName = 'test-cluster-set'

      // Configure mock to return placement clusters with cluster set names
      const mockPlacementClustersWithClusterSets: PlacementClusters[] = [
        createPlacementClusters('placement-production', ['production-cluster'], ['test-cluster-set']),
        createPlacementClusters('placement-staging', ['staging-cluster'], ['other-cluster-set']),
      ]
      ;(placementClient.useGetPlacementClusters as jest.Mock).mockReturnValue(mockPlacementClustersWithClusterSets)

      // Act
      const { result } = renderHook(() =>
        useFindRoleAssignments({
          clusterSetNames: [clusterSetName],
        })
      )

      // Assert
      expect(result.current.length).toBeGreaterThan(0)
      expect(result.current.filter((e) => !e.clusterSetNames.includes(clusterSetName))).toHaveLength(0)

      // Restore original mock
      ;(placementClient.useGetPlacementClusters as jest.Mock).mockReturnValue(mockPlacementClustersArray)
    })

    it('should filter by multiple cluster set names', () => {
      // Arrange
      const clusterSetNames = ['cluster-set-1', 'cluster-set-2']

      // Configure mock to return placement clusters with cluster set names
      const mockPlacementClustersWithClusterSets: PlacementClusters[] = [
        createPlacementClusters('placement-1', ['cluster-a'], ['cluster-set-1']),
        createPlacementClusters('placement-2', ['cluster-b'], ['cluster-set-2']),
        createPlacementClusters('placement-3', ['cluster-c'], ['cluster-set-3']),
      ]
      ;(placementClient.useGetPlacementClusters as jest.Mock).mockReturnValue(mockPlacementClustersWithClusterSets)

      // Create mock MulticlusterRoleAssignments that reference the placements with cluster sets
      const mockMRAs: MulticlusterRoleAssignment[] = [
        createMRAWithSingleRoleAndPlacement(
          'mra-1',
          { name: 'user1', kind: UserKind },
          'role-1',
          'admin',
          'placement-1'
        ),
        createMRAWithSingleRoleAndPlacement(
          'mra-2',
          { name: 'user2', kind: UserKind },
          'role-2',
          'viewer',
          'placement-2'
        ),
      ]
      useRecoilValueMock.mockReturnValue(mockMRAs)

      // Act
      const { result } = renderHook(() =>
        useFindRoleAssignments({
          clusterSetNames,
        })
      )

      // Assert
      expect(result.current.length).toBeGreaterThan(0)
      // All results should have at least one of the specified cluster set names
      expect(
        result.current.filter((e) => !e.clusterSetNames.some((csn) => clusterSetNames.includes(csn)))
      ).toHaveLength(0)

      // Restore original mocks
      ;(placementClient.useGetPlacementClusters as jest.Mock).mockReturnValue(mockPlacementClustersArray)
      useRecoilValueMock.mockReturnValue(mockMulticlusterRoleAssignments)
    })

    it('should filter by cluster set name combined with other criteria', () => {
      // Arrange
      const clusterSetName = 'combined-cluster-set'
      const role = 'kubevirt.io:admin'

      // Configure mock to return placement clusters with cluster set names
      const mockPlacementClustersWithClusterSets: PlacementClusters[] = [
        createPlacementClusters('placement-production', ['production-cluster'], ['combined-cluster-set']),
        createPlacementClusters('placement-staging', ['staging-cluster'], ['combined-cluster-set']),
        createPlacementClusters('placement-development', ['development-cluster'], ['other-cluster-set']),
      ]
      ;(placementClient.useGetPlacementClusters as jest.Mock).mockReturnValue(mockPlacementClustersWithClusterSets)

      // Act
      const { result } = renderHook(() =>
        useFindRoleAssignments({
          subjectKinds: [UserKind],
          roles: [role],
          clusterSetNames: [clusterSetName],
        })
      )

      // Assert
      expect(result.current.length).toBeGreaterThan(0)
      expect(
        result.current.filter(
          (e) => e.subject.kind !== UserKind || e.clusterRole !== role || !e.clusterSetNames.includes(clusterSetName)
        )
      ).toHaveLength(0)

      // Restore original mock
      ;(placementClient.useGetPlacementClusters as jest.Mock).mockReturnValue(mockPlacementClustersArray)
    })

    it('should return empty array when cluster set name does not match', () => {
      // Arrange
      const nonExistentClusterSetName = 'non-existent-cluster-set'

      // Configure mock to return placement clusters with different cluster set names
      const mockPlacementClustersWithClusterSets: PlacementClusters[] = [
        createPlacementClusters('placement-1', ['cluster-a'], ['existing-cluster-set-1']),
        createPlacementClusters('placement-2', ['cluster-b'], ['existing-cluster-set-2']),
      ]
      ;(placementClient.useGetPlacementClusters as jest.Mock).mockReturnValue(mockPlacementClustersWithClusterSets)

      // Act
      const { result } = renderHook(() =>
        useFindRoleAssignments({
          clusterSetNames: [nonExistentClusterSetName],
        })
      )

      // Assert
      expect(result.current).toHaveLength(0)

      // Restore original mock
      ;(placementClient.useGetPlacementClusters as jest.Mock).mockReturnValue(mockPlacementClustersArray)
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
        clusterSetNames: [],
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
        clusterSetNames: [],
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
        clusterSetNames: [],
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
        clusterSetNames: [],
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
        clusterSetNames: [],
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

    describe('minimal placement cover (clusters)', () => {
      it.each(minimalPlacementCoverClustersTestCases)(
        '$description',
        ({ placementClusters, roleAssignment, expectedPlacementNames }) => {
          const result = getPlacementsForRoleAssignment(roleAssignment, placementClusters)

          expect(result).toHaveLength(expectedPlacementNames.length)
          expect(result.map((p) => p.metadata.name)).toEqual(expectedPlacementNames)
        }
      )
    })

    describe('minimal placement cover (cluster sets)', () => {
      it.each(minimalPlacementCoverClusterSetsTestCases)(
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

    describe('namespace filtering', () => {
      /**
       * These test cases verify that only placements in the correct namespace
       * (open-cluster-management-global-set) are returned. This prevents the bug
       * where all clusters were being saved instead of only the selected clusters.
       *
       * Before the refactoring (ACM-28428), getPlacementsForRoleAssignment was returning
       * placements from all namespaces, causing the wizard to save all clusters instead
       * of just the selected ones.
       */
      it.each(namespaceFilteringTestCases)(
        '$description',
        ({ placementClusters, roleAssignment, expectedPlacementNames }) => {
          const result = getPlacementsForRoleAssignment(roleAssignment, placementClusters)

          expect(result).toHaveLength(expectedPlacementNames.length)
          expect(result.map((p) => p.metadata.name)).toEqual(expectedPlacementNames)
        }
      )

      it('should only consider placements from open-cluster-management-global-set namespace', () => {
        // Arrange: Create placements in different namespaces with the same clusters
        const placementClusters = [
          createPlacementClustersWithNamespace('placement-global', MulticlusterRoleAssignmentNamespace, [
            'selected-cluster',
          ]),
          createPlacementClustersWithNamespace('placement-default', 'default', ['selected-cluster']),
          createPlacementClustersWithNamespace('placement-kube-system', 'kube-system', ['selected-cluster']),
          createPlacementClustersWithNamespace('placement-custom', 'my-custom-namespace', ['selected-cluster']),
        ]

        const roleAssignment: RoleAssignmentToSave = {
          clusterRole: 'admin',
          clusterNames: ['selected-cluster'],
          subject: { name: 'user1', kind: UserKind },
          isGlobalScope: false,
        }

        // Act
        const result = getPlacementsForRoleAssignment(roleAssignment, placementClusters)

        // Assert: Only the placement from the correct namespace should be returned
        expect(result).toHaveLength(1)
        expect(result[0].metadata.name).toBe('placement-global')
        expect(result[0].metadata.namespace).toBe(MulticlusterRoleAssignmentNamespace)
      })

      it('should prevent returning all clusters when placements exist in multiple namespaces', () => {
        // This test specifically verifies the bug fix from ACM-28428
        // Before the fix, if a user selected specific clusters, but placements existed
        // in other namespaces with more clusters, all clusters would be returned

        // Arrange: Simulate the bug scenario
        // - User wants to select only 'cluster-a'
        // - There's a placement in the correct namespace with just 'cluster-a'
        // - There's a placement in another namespace with ALL clusters
        const placementClusters = [
          createPlacementClustersWithNamespace('placement-selected', MulticlusterRoleAssignmentNamespace, [
            'cluster-a',
          ]),
          createPlacementClustersWithNamespace('placement-all-clusters', 'other-namespace', [
            'cluster-a',
            'cluster-b',
            'cluster-c',
            'cluster-d',
            'cluster-e',
          ]),
        ]

        const roleAssignment: RoleAssignmentToSave = {
          clusterRole: 'admin',
          clusterNames: ['cluster-a'],
          subject: { name: 'user1', kind: UserKind },
          isGlobalScope: false,
        }

        // Act
        const result = getPlacementsForRoleAssignment(roleAssignment, placementClusters)

        // Assert: Only the placement with the selected cluster should be returned
        // NOT the placement with all clusters from the wrong namespace
        expect(result).toHaveLength(1)
        expect(result[0].metadata.name).toBe('placement-selected')
        expect(result[0].metadata.namespace).toBe(MulticlusterRoleAssignmentNamespace)
      })

      it('should return empty array when matching placements only exist in wrong namespaces', () => {
        // Arrange: All matching placements are in wrong namespaces
        const placementClusters = [
          createPlacementClustersWithNamespace('placement-ns1', 'namespace-1', ['cluster-a', 'cluster-b']),
          createPlacementClustersWithNamespace('placement-ns2', 'namespace-2', ['cluster-a', 'cluster-b']),
          createPlacementClustersWithNamespace('placement-ns3', 'namespace-3', ['cluster-a', 'cluster-b']),
        ]

        const roleAssignment: RoleAssignmentToSave = {
          clusterRole: 'admin',
          clusterNames: ['cluster-a', 'cluster-b'],
          subject: { name: 'user1', kind: UserKind },
          isGlobalScope: false,
        }

        // Act
        const result = getPlacementsForRoleAssignment(roleAssignment, placementClusters)

        // Assert: No placements should be returned since none are in the correct namespace
        expect(result).toHaveLength(0)
      })
    })

    describe('isGlobalScope: true', () => {
      it.each(globalScopeTestCases.filter((tc) => !tc.shouldThrow))(
        '$description',
        ({ placementClusters, roleAssignment, expectedPlacementNames }) => {
          const result = getPlacementsForRoleAssignment(roleAssignment, placementClusters)

          expect(result).toHaveLength(expectedPlacementNames!.length)
          expect(result.map((p) => p.metadata.name)).toEqual(expectedPlacementNames)
        }
      )

      it.each(globalScopeTestCases.filter((tc) => tc.shouldThrow))(
        '$description',
        ({ placementClusters, roleAssignment, expectedErrorMessage }) => {
          expect(() => getPlacementsForRoleAssignment(roleAssignment, placementClusters)).toThrow(expectedErrorMessage)
        }
      )
    })
  })

  describe('getClustersForRoleAssignment deduplication', () => {
    /**
     * Tests cluster deduplication through findRoleAssignments which internally uses getClustersForRoleAssignment.
     * The goal is to verify that when multiple placements reference overlapping clusters,
     * the returned clusterNames array contains no duplicates.
     */
    it.each(getClustersDeduplicationTestCases)(
      '$description',
      ({ placementClusters, placementNames, expectedClusters }) => {
        // Create a MulticlusterRoleAssignment with a RoleAssignment that references the given placements
        const mra = createMRAWithSingleRoleAndMultiplePlacements(
          'test-mra',
          { name: 'test-user', kind: UserKind },
          'test-role-assignment',
          'admin',
          placementNames
        )

        // Call findRoleAssignments which internally uses getClustersForRoleAssignment
        const result = findRoleAssignments({}, [mra], placementClusters)

        // Verify the result
        expect(result).toHaveLength(1)

        // Verify no duplicates in clusterNames and proper sorting
        const clusterNames = result[0].clusterNames
        const uniqueClusterNames = [...new Set(clusterNames)]
        expect(clusterNames).toHaveLength(uniqueClusterNames.length)
        expect(clusterNames).toEqual(expectedClusters)
        expect(clusterNames).toHaveLength(expectedClusters.length)
      }
    )

    it('should return unique cluster names when the same cluster appears in multiple placements', () => {
      // Arrange: Create placements where the same cluster appears multiple times
      const placementClusters: PlacementClusters[] = [
        createPlacementClusters('placement-prod', ['production-cluster', 'shared-cluster']),
        createPlacementClusters('placement-staging', ['staging-cluster', 'shared-cluster']),
        createPlacementClusters('placement-dev', ['dev-cluster', 'shared-cluster']),
      ]

      const mra = createMRAWithSingleRoleAndMultiplePlacements(
        'test-mra',
        { name: 'test-user', kind: UserKind },
        'multi-placement-role',
        'admin',
        ['placement-prod', 'placement-staging', 'placement-dev']
      )

      // Act
      const result = findRoleAssignments({}, [mra], placementClusters)

      // Assert
      expect(result).toHaveLength(1)

      // Verify 'shared-cluster' appears only once despite being in all 3 placements
      const clusterNames = result[0].clusterNames
      const sharedClusterCount = clusterNames.filter((c) => c === 'shared-cluster').length
      expect(sharedClusterCount).toBe(1)

      // Verify all unique clusters are present and sorted alphabetically
      expect(clusterNames).toEqual(['dev-cluster', 'production-cluster', 'shared-cluster', 'staging-cluster'])
      expect(clusterNames).toHaveLength(4)
    })

    it('should not have duplicates when placements have completely overlapping clusters', () => {
      // Arrange: Create placements with identical cluster lists
      const placementClusters: PlacementClusters[] = [
        createPlacementClusters('placement-1', ['cluster-a', 'cluster-b', 'cluster-c']),
        createPlacementClusters('placement-2', ['cluster-a', 'cluster-b', 'cluster-c']),
        createPlacementClusters('placement-3', ['cluster-a', 'cluster-b', 'cluster-c']),
      ]

      const mra = createMRAWithSingleRoleAndMultiplePlacements(
        'test-mra',
        { name: 'test-user', kind: UserKind },
        'identical-placements-role',
        'admin',
        ['placement-1', 'placement-2', 'placement-3']
      )

      // Act
      const result = findRoleAssignments({}, [mra], placementClusters)

      // Assert
      expect(result).toHaveLength(1)

      // Verify only 3 unique clusters despite 3 placements each having the same 3 clusters, sorted alphabetically
      const clusterNames = result[0].clusterNames
      expect(clusterNames).toHaveLength(3)
      expect(clusterNames).toEqual(['cluster-a', 'cluster-b', 'cluster-c'])
    })
  })

  describe('getClustersForRoleAssignment sorting', () => {
    /**
     * Tests cluster sorting through findRoleAssignments which internally uses getClustersForRoleAssignment.
     * The goal is to verify that the returned clusterNames array is sorted alphabetically using localeCompare.
     */
    it.each(getClustersSortingTestCases)('$description', ({ placementClusters, placementNames, expectedClusters }) => {
      // Create a MulticlusterRoleAssignment with a RoleAssignment that references the given placements
      const mra = createMRAWithSingleRoleAndMultiplePlacements(
        'test-mra',
        { name: 'test-user', kind: UserKind },
        'test-role-assignment',
        'admin',
        placementNames
      )

      // Call findRoleAssignments which internally uses getClustersForRoleAssignment
      const result = findRoleAssignments({}, [mra], placementClusters)

      // Verify the result
      expect(result).toHaveLength(1)

      // Verify clusters are sorted correctly
      const clusterNames = result[0].clusterNames
      expect(clusterNames).toEqual(expectedClusters)
    })

    it('should return clusters in alphabetical order regardless of placement order', () => {
      // Arrange: Create placements with clusters in various orders
      const placementClusters: PlacementClusters[] = [
        createPlacementClusters('placement-z', ['zulu-cluster', 'mike-cluster']),
        createPlacementClusters('placement-a', ['alpha-cluster', 'yankee-cluster']),
        createPlacementClusters('placement-m', ['bravo-cluster']),
      ]

      const mra = createMRAWithSingleRoleAndMultiplePlacements(
        'test-mra',
        { name: 'test-user', kind: UserKind },
        'multi-placement-role',
        'admin',
        ['placement-z', 'placement-a', 'placement-m']
      )

      // Act
      const result = findRoleAssignments({}, [mra], placementClusters)

      // Assert
      expect(result).toHaveLength(1)
      const clusterNames = result[0].clusterNames
      expect(clusterNames).toEqual(['alpha-cluster', 'bravo-cluster', 'mike-cluster', 'yankee-cluster', 'zulu-cluster'])
    })

    it('should deduplicate and sort clusters from overlapping placements', () => {
      // Arrange: Create placements with overlapping unsorted clusters
      const placementClusters: PlacementClusters[] = [
        createPlacementClusters('placement-1', ['zebra', 'alpha', 'delta']),
        createPlacementClusters('placement-2', ['alpha', 'charlie', 'zebra']),
        createPlacementClusters('placement-3', ['bravo', 'delta', 'echo']),
      ]

      const mra = createMRAWithSingleRoleAndMultiplePlacements(
        'test-mra',
        { name: 'test-user', kind: UserKind },
        'overlapping-role',
        'admin',
        ['placement-1', 'placement-2', 'placement-3']
      )

      // Act
      const result = findRoleAssignments({}, [mra], placementClusters)

      // Assert
      expect(result).toHaveLength(1)
      const clusterNames = result[0].clusterNames

      // Verify sorted order and no duplicates
      expect(clusterNames).toEqual(['alpha', 'bravo', 'charlie', 'delta', 'echo', 'zebra'])
      expect(clusterNames).toHaveLength(6)
    })

    it('should verify clusters are sorted using localeCompare semantics', () => {
      // Arrange: Test localeCompare-specific behavior
      const placementClusters: PlacementClusters[] = [
        createPlacementClusters('placement-1', ['zzz', 'AAA', 'aaa', 'ZZZ', 'bbb', 'BBB']),
      ]

      const mra = createMRAWithSingleRoleAndPlacement(
        'test-mra',
        { name: 'test-user', kind: UserKind },
        'locale-compare-role',
        'admin',
        'placement-1'
      )

      // Act
      const result = findRoleAssignments({}, [mra], placementClusters)

      // Assert
      expect(result).toHaveLength(1)
      const clusterNames = result[0].clusterNames

      // Verify the result matches what localeCompare would produce
      const expectedOrder = ['zzz', 'AAA', 'aaa', 'ZZZ', 'bbb', 'BBB'].sort((a, b) => a.localeCompare(b))
      expect(clusterNames).toEqual(expectedOrder)
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
          isGlobalScope: false,
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
          isGlobalScope: false,
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
          isGlobalScope: false,
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
          isGlobalScope: false,
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
          isGlobalScope: false,
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
          isGlobalScope: false,
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
          isGlobalScope: false,
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
          isGlobalScope: false,
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
          isGlobalScope: false,
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
          isGlobalScope: false,
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
          isGlobalScope: false,
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
          isGlobalScope: false,
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
          isGlobalScope: false,
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
          isGlobalScope: false,
        }

        const result = await createAdditionalRoleAssignmentResources(roleAssignment, {
          existingManagedClusterSetBindings: [],
          existingPlacements: undefined,
        })

        expect(result).toEqual([])
      })
    })
  })

  describe('flattenMulticlusterRoleAssignment clusterSetNames isolation', () => {
    /**
     * Regression tests for ACM-28795: Each FlattenedRoleAssignment should only contain
     * clusterSetNames from placements it actually references, not from all placements.
     *
     * Before the fix, all FlattenedRoleAssignments were getting the same clusterSetNames
     * from all placementClusters, causing incorrect filtering and display issues.
     */
    it('should assign clusterSetNames only from placements referenced by the role assignment', () => {
      // Arrange: Create placement clusters with different cluster sets
      const placementClusters: PlacementClusters[] = [
        createPlacementClusters('placement-1', ['cluster-a'], ['cluster-set-alpha']),
        createPlacementClusters('placement-2', ['cluster-b'], ['cluster-set-beta']),
        createPlacementClusters('placement-3', ['cluster-c'], ['cluster-set-gamma']),
      ]

      const mra = createMRAWithSingleRoleAndPlacement(
        'test-mra',
        { name: 'test-user', kind: UserKind },
        'role-1',
        'admin',
        'placement-1'
      )

      // Act
      const result = findRoleAssignments({}, [mra], placementClusters)

      // Assert: role-1 should only have cluster-set-alpha, not beta or gamma
      expect(result).toHaveLength(1)
      expect(result[0].clusterSetNames).toEqual(['cluster-set-alpha'])
      expect(result[0].clusterSetNames).not.toContain('cluster-set-beta')
      expect(result[0].clusterSetNames).not.toContain('cluster-set-gamma')
    })

    it('should assign different clusterSetNames to different role assignments in the same MRA', () => {
      // Arrange: Create placement clusters with different cluster sets
      const placementClusters: PlacementClusters[] = [
        createPlacementClusters('placement-1', ['cluster-a'], ['cluster-set-alpha']),
        createPlacementClusters('placement-2', ['cluster-b'], ['cluster-set-beta']),
        createPlacementClusters('placement-3', ['cluster-c'], ['cluster-set-gamma']),
      ]

      const mra = createMRAWithMultipleRoles('test-mra', { name: 'test-user', kind: UserKind }, [
        { name: 'role-1', clusterRole: 'admin', placementNames: ['placement-1'] },
        { name: 'role-2', clusterRole: 'viewer', placementNames: ['placement-2'] },
      ])

      // Act
      const result = findRoleAssignments({}, [mra], placementClusters)

      // Assert: Each role assignment should have different cluster set names
      expect(result).toHaveLength(2)
      const role1 = result.find((r) => r.name === 'role-1')
      const role2 = result.find((r) => r.name === 'role-2')
      expect(role1?.clusterSetNames).toEqual(['cluster-set-alpha'])
      expect(role2?.clusterSetNames).toEqual(['cluster-set-beta'])
      expect(role1?.clusterSetNames).not.toEqual(role2?.clusterSetNames)
    })

    it('should collect clusterSetNames from all placements referenced by a single role assignment', () => {
      // Arrange: Create placement clusters with different cluster sets
      const placementClusters: PlacementClusters[] = [
        createPlacementClusters('placement-1', ['cluster-a'], ['cluster-set-alpha']),
        createPlacementClusters('placement-2', ['cluster-b'], ['cluster-set-beta']),
        createPlacementClusters('placement-3', ['cluster-c'], ['cluster-set-gamma']),
      ]

      const mra = createMRAWithSingleRoleAndMultiplePlacements(
        'test-mra',
        { name: 'test-user', kind: UserKind },
        'role-1',
        'admin',
        ['placement-1', 'placement-2']
      )

      // Act
      const result = findRoleAssignments({}, [mra], placementClusters)

      // Assert: role-1 should have cluster set names from both placement-1 and placement-2
      expect(result).toHaveLength(1)
      expect(result[0].clusterSetNames).toContain('cluster-set-alpha')
      expect(result[0].clusterSetNames).toContain('cluster-set-beta')
      expect(result[0].clusterSetNames).not.toContain('cluster-set-gamma')
    })

    it('should return empty clusterSetNames when role assignment references placements without cluster sets', () => {
      // Arrange: Create placement clusters where some have cluster sets and some don't
      const placementClusters: PlacementClusters[] = [
        createPlacementClusters('placement-1', ['cluster-a'], undefined), // No cluster sets
        createPlacementClusters('placement-2', ['cluster-b'], ['cluster-set-beta']),
      ]

      const mra = createMRAWithSingleRoleAndPlacement(
        'test-mra',
        { name: 'test-user', kind: UserKind },
        'role-1',
        'admin',
        'placement-1'
      )

      // Act
      const result = findRoleAssignments({}, [mra], placementClusters)

      // Assert: role-1 should have empty cluster set names
      expect(result).toHaveLength(1)
      expect(result[0].clusterSetNames).toEqual([])
    })

    it('should handle role assignments with multiple placements, some with cluster sets and some without', () => {
      // Arrange: Create placement clusters with mixed cluster set configurations
      const placementClusters: PlacementClusters[] = [
        createPlacementClusters('placement-1', ['cluster-a'], undefined), // No cluster sets
        createPlacementClusters('placement-2', ['cluster-b'], ['cluster-set-beta']),
        createPlacementClusters('placement-3', ['cluster-c'], ['cluster-set-gamma']),
      ]

      const mra = createMRAWithSingleRoleAndMultiplePlacements(
        'test-mra',
        { name: 'test-user', kind: UserKind },
        'role-1',
        'admin',
        ['placement-1', 'placement-2', 'placement-3']
      )

      // Act
      const result = findRoleAssignments({}, [mra], placementClusters)

      // Assert: role-1 should have cluster set names from placement-2 and placement-3 only
      expect(result).toHaveLength(1)
      expect(result[0].clusterSetNames).toContain('cluster-set-beta')
      expect(result[0].clusterSetNames).toContain('cluster-set-gamma')
      expect(result[0].clusterSetNames.length).toBe(2)
    })

    it('should not include clusterSetNames from unrelated placements in the same placementClusters array', () => {
      // Arrange: Create many placement clusters, but role assignment only references one
      const placementClusters: PlacementClusters[] = [
        createPlacementClusters('placement-1', ['cluster-a'], ['cluster-set-alpha']),
        createPlacementClusters('placement-2', ['cluster-b'], ['cluster-set-beta']),
        createPlacementClusters('placement-3', ['cluster-c'], ['cluster-set-gamma']),
        createPlacementClusters('placement-4', ['cluster-d'], ['cluster-set-delta']),
        createPlacementClusters('placement-5', ['cluster-e'], ['cluster-set-epsilon']),
      ]

      const mra = createMRAWithSingleRoleAndPlacement(
        'test-mra',
        { name: 'test-user', kind: UserKind },
        'role-1',
        'admin',
        'placement-1'
      )

      // Act
      const result = findRoleAssignments({}, [mra], placementClusters)

      // Assert: role-1 should only have cluster-set-alpha, not any of the others
      expect(result).toHaveLength(1)
      expect(result[0].clusterSetNames).toEqual(['cluster-set-alpha'])
      expect(result[0].clusterSetNames).not.toContain('cluster-set-beta')
      expect(result[0].clusterSetNames).not.toContain('cluster-set-gamma')
      expect(result[0].clusterSetNames).not.toContain('cluster-set-delta')
      expect(result[0].clusterSetNames).not.toContain('cluster-set-epsilon')
    })

    it('should handle placements with multiple cluster sets correctly', () => {
      // Arrange: Create placement clusters where one placement has multiple cluster sets
      const placementClusters: PlacementClusters[] = [
        createPlacementClusters('placement-1', ['cluster-a'], ['cluster-set-alpha', 'cluster-set-beta']),
        createPlacementClusters('placement-2', ['cluster-b'], ['cluster-set-gamma']),
      ]

      const mra = createMRAWithSingleRoleAndPlacement(
        'test-mra',
        { name: 'test-user', kind: UserKind },
        'role-1',
        'admin',
        'placement-1'
      )

      // Act
      const result = findRoleAssignments({}, [mra], placementClusters)

      // Assert: role-1 should have both cluster set names from placement-1
      expect(result).toHaveLength(1)
      expect(result[0].clusterSetNames).toContain('cluster-set-alpha')
      expect(result[0].clusterSetNames).toContain('cluster-set-beta')
      expect(result[0].clusterSetNames).not.toContain('cluster-set-gamma')
      expect(result[0].clusterSetNames.length).toBe(2)
    })

    it('should include cluster set names from all referenced placements (may include duplicates)', () => {
      // Arrange: Create placement clusters where multiple placements have the same cluster set
      // Note: The current implementation uses flatMap which may include duplicates.
      // This test verifies that cluster set names are collected from all referenced placements.
      const placementClusters: PlacementClusters[] = [
        createPlacementClusters('placement-1', ['cluster-a'], ['cluster-set-shared']),
        createPlacementClusters('placement-2', ['cluster-b'], ['cluster-set-shared']),
        createPlacementClusters('placement-3', ['cluster-c'], ['cluster-set-unique']),
      ]

      const mra = createMRAWithSingleRoleAndMultiplePlacements(
        'test-mra',
        { name: 'test-user', kind: UserKind },
        'role-1',
        'admin',
        ['placement-1', 'placement-2', 'placement-3']
      )

      // Act
      const result = findRoleAssignments({}, [mra], placementClusters)

      // Assert: cluster-set-shared appears from both placement-1 and placement-2
      // The current implementation may include duplicates (flatMap doesn't deduplicate)
      expect(result).toHaveLength(1)
      expect(result[0].clusterSetNames).toContain('cluster-set-shared')
      expect(result[0].clusterSetNames).toContain('cluster-set-unique')
      // Verify it contains cluster set names from all three placements
      expect(result[0].clusterSetNames.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('isClusterOrClustersetOrRoleMatch filtering', () => {
    /**
     * Tests the isClusterOrClustersetOrRoleMatch function through findRoleAssignments.
     * This function filters FlattenedRoleAssignments by cluster names, cluster set names, and roles.
     *
     * Note: After the fix (ACM-28795), each FlattenedRoleAssignment only contains cluster set names
     * from placements it actually references, ensuring correct filtering behavior.
     */

    it('should filter by cluster set names when query.clusterSetNames is provided', () => {
      // Arrange - placement clusters with different cluster sets
      // The flattenMulticlusterRoleAssignment collects ALL cluster set names from ALL placement clusters
      // So we need to test the filtering at the query level
      const placementClusters: PlacementClusters[] = [
        createPlacementClusters('placement-1', ['cluster-a'], ['cluster-set-alpha']),
        createPlacementClusters('placement-2', ['cluster-b'], ['cluster-set-beta']),
      ]

      const mra = createMRAWithSingleRoleAndPlacement(
        'test-mra',
        { name: 'test-user', kind: UserKind },
        'role-1',
        'admin',
        'placement-1'
      )

      // Act - filter by cluster-set-alpha
      const result = findRoleAssignments({ clusterSetNames: ['cluster-set-alpha'] }, [mra], placementClusters)

      // Assert - role assignment matches because its clusterSetNames (from all placements) contains cluster-set-alpha
      expect(result).toHaveLength(1)
      expect(result[0].clusterSetNames).toContain('cluster-set-alpha')
      expect(result[0].clusterRole).toBe('admin')
    })

    it('should return role assignments when cluster set names match any of the provided values', () => {
      // Arrange - placement clusters with different cluster sets
      const placementClusters: PlacementClusters[] = [
        createPlacementClusters('placement-1', ['cluster-a'], ['cluster-set-alpha']),
        createPlacementClusters('placement-2', ['cluster-b'], ['cluster-set-beta']),
      ]

      const mra = createMRAWithSingleRoleAndPlacement(
        'test-mra',
        { name: 'test-user', kind: UserKind },
        'role-1',
        'admin',
        'placement-1'
      )

      // Act - filter by multiple cluster set names
      const result = findRoleAssignments(
        { clusterSetNames: ['cluster-set-alpha', 'cluster-set-beta'] },
        [mra],
        placementClusters
      )

      // Assert - role assignment matches because its clusterSetNames contains alpha
      // (it only references placement-1, so it only has cluster-set-alpha, not beta)
      expect(result).toHaveLength(1)
      expect(result[0].clusterSetNames).toContain('cluster-set-alpha')
      expect(result[0].clusterSetNames).not.toContain('cluster-set-beta')
    })

    it('should return empty array when no cluster set names match', () => {
      // Arrange
      const placementClusters: PlacementClusters[] = [
        createPlacementClusters('placement-1', ['cluster-a'], ['cluster-set-alpha']),
      ]

      const mra = createMRAWithSingleRoleAndPlacement(
        'test-mra',
        { name: 'test-user', kind: UserKind },
        'role-1',
        'admin',
        'placement-1'
      )

      // Act - filter by non-existent cluster set name
      const result = findRoleAssignments({ clusterSetNames: ['non-existent-cluster-set'] }, [mra], placementClusters)

      // Assert
      expect(result).toHaveLength(0)
    })

    it('should combine cluster set names filter with cluster names filter', () => {
      // Arrange
      const placementClusters: PlacementClusters[] = [
        createPlacementClusters('placement-1', ['cluster-a', 'cluster-b'], ['cluster-set-alpha']),
        createPlacementClusters('placement-2', ['cluster-c'], ['cluster-set-beta']),
      ]

      const mra = createMRAWithMultipleRoles('test-mra', { name: 'test-user', kind: UserKind }, [
        { name: 'role-1', clusterRole: 'admin', placementNames: ['placement-1'] },
        { name: 'role-2', clusterRole: 'viewer', placementNames: ['placement-2'] },
      ])

      // Act - filter by both cluster set name AND cluster name
      const result = findRoleAssignments(
        { clusterSetNames: ['cluster-set-alpha'], clusterNames: ['cluster-a'] },
        [mra],
        placementClusters
      )

      // Assert - only role-1 matches both criteria
      expect(result).toHaveLength(1)
      expect(result[0].clusterRole).toBe('admin')
      expect(result[0].clusterSetNames).toContain('cluster-set-alpha')
      expect(result[0].clusterNames).toContain('cluster-a')
    })

    it('should combine cluster set names filter with roles filter', () => {
      // Arrange
      const placementClusters: PlacementClusters[] = [
        createPlacementClusters('placement-1', ['cluster-a'], ['cluster-set-alpha']),
        createPlacementClusters('placement-2', ['cluster-b'], ['cluster-set-alpha']),
      ]

      const mra = createMRAWithMultipleRoles('test-mra', { name: 'test-user', kind: UserKind }, [
        { name: 'role-1', clusterRole: 'admin', placementNames: ['placement-1'] },
        { name: 'role-2', clusterRole: 'viewer', placementNames: ['placement-2'] },
      ])

      // Act - filter by cluster set name AND role
      const result = findRoleAssignments(
        { clusterSetNames: ['cluster-set-alpha'], roles: ['admin'] },
        [mra],
        placementClusters
      )

      // Assert - only role-1 matches both criteria
      expect(result).toHaveLength(1)
      expect(result[0].clusterRole).toBe('admin')
    })

    it('should return all results when no cluster set names filter is provided', () => {
      // Arrange
      const placementClusters: PlacementClusters[] = [
        createPlacementClusters('placement-1', ['cluster-a'], ['cluster-set-alpha']),
        createPlacementClusters('placement-2', ['cluster-b'], ['cluster-set-beta']),
      ]

      const mra = createMRAWithMultipleRoles('test-mra', { name: 'test-user', kind: UserKind }, [
        { name: 'role-1', clusterRole: 'admin', placementNames: ['placement-1'] },
        { name: 'role-2', clusterRole: 'viewer', placementNames: ['placement-2'] },
      ])

      // Act - no cluster set names filter
      const result = findRoleAssignments({}, [mra], placementClusters)

      // Assert - all role assignments returned
      expect(result).toHaveLength(2)
    })

    it('should handle empty cluster set names array in query (returns all results)', () => {
      // Arrange
      const placementClusters: PlacementClusters[] = [
        createPlacementClusters('placement-1', ['cluster-a'], ['cluster-set-alpha']),
      ]

      const mra = createMRAWithSingleRoleAndPlacement(
        'test-mra',
        { name: 'test-user', kind: UserKind },
        'role-1',
        'admin',
        'placement-1'
      )

      // Act - empty cluster set names array (should not filter)
      const result = findRoleAssignments({ clusterSetNames: [] }, [mra], placementClusters)

      // Assert - all role assignments returned (empty array doesn't filter)
      expect(result).toHaveLength(1)
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
          await expect(
            addRoleAssignment(roleAssignment, {
              existingMulticlusterRoleAssignment: undefined,
              existingManagedClusterSetBindings: [],
              existingPlacements,
            })
          ).rejects.toThrow(expectedErrorMessage)
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
          expect(result.name).toBeDefined()
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

          expect(result).toBeDefined()
          expect(result.name).toBeDefined()
          expect(mockPatchResourceForAdd).toHaveBeenCalled()
        }
      )
    })

    describe('duplicate detection', () => {
      it('should reject when adding duplicate role assignment', async () => {
        const roleAssignment: RoleAssignmentToSave = {
          clusterRole: 'admin',
          clusterNames: ['cluster-a'],
          subject: { name: 'user1', kind: UserKind },
          isGlobalScope: false,
          targetNamespaces: [],
        }

        const expectedHash = getRoleAssignmentName(roleAssignment)

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
        await expect(
          addRoleAssignment(roleAssignment, {
            existingMulticlusterRoleAssignment: existingMRA,
            existingManagedClusterSetBindings: [],
            existingPlacements: [],
          })
        ).rejects.toThrow('Duplicate role assignment detected.')
      })

      it('should succeed when role assignment is unique', async () => {
        const roleAssignment: RoleAssignmentToSave = {
          clusterRole: 'admin',
          clusterNames: ['cluster-a'],
          subject: { name: 'user1', kind: UserKind },
          isGlobalScope: false,
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

        expect(result).toBeDefined()
        expect(result.name).toBeDefined()
        expect(mockPatchResourceForAdd).toHaveBeenCalled()
      })
    })
  })

  describe('getRoleAssignmentName', () => {
    it.each(getRoleAssignmentNameEquivalentPairTestCases)('$description', ({ roleAssignmentA, roleAssignmentB }) => {
      const nameA = getRoleAssignmentName(roleAssignmentA)
      const nameB = getRoleAssignmentName(roleAssignmentB)
      expect(nameA).toBe(nameB)
    })

    it('produces different names when array contents differ', () => {
      const withClusterA: RoleAssignmentToSave = {
        clusterRole: 'admin',
        clusterNames: ['cluster-a'],
        clusterSetNames: [],
        subject: { name: 'user1', kind: UserKind },
        isGlobalScope: false,
        targetNamespaces: [],
      }
      const withClusterB: RoleAssignmentToSave = {
        clusterRole: 'admin',
        clusterNames: ['cluster-b'],
        clusterSetNames: [],
        subject: { name: 'user1', kind: UserKind },
        isGlobalScope: false,
        targetNamespaces: [],
      }
      expect(getRoleAssignmentName(withClusterA)).not.toBe(getRoleAssignmentName(withClusterB))
    })
  })
})
