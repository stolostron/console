/* eslint-disable jest/no-conditional-expect */
/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import * as req from '../../resources/utils/resource-request'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { MulticlusterRoleAssignment, MulticlusterRoleAssignmentNamespace } from '../multicluster-role-assignment'
import { Placement } from '../placement'
import { GroupKind, UserKind } from '../rbac'
import { deleteResource, patchResource } from '../utils'
import multiclusterRoleAssignmentsMockData from './mock-data/multicluster-role-assignments.json'
import { FlattenedRoleAssignment } from './model/flattened-role-assignment'
import { deleteRoleAssignment, useFindRoleAssignments } from './multicluster-role-assignment-client'
import * as placementClient from './placement-client'

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

// Helper to create mock placement
const createMockPlacement = (name: string): Placement => ({
  apiVersion: 'cluster.open-cluster-management.io/v1beta1',
  kind: 'Placement',
  metadata: { name, namespace: MulticlusterRoleAssignmentNamespace },
  spec: { clusterSets: ['default'] },
})

// Mock useGetClustersForPlacementMap with new structure { placement, clusters }
jest.spyOn(placementClient, 'useGetClustersForPlacementMap').mockReturnValue({
  'placement-production': { placement: createMockPlacement('placement-production'), clusters: ['production-cluster'] },
  'placement-staging': { placement: createMockPlacement('placement-staging'), clusters: ['staging-cluster'] },
  'placement-development': {
    placement: createMockPlacement('placement-development'),
    clusters: ['development-cluster'],
  },
  'placement-all-clusters': {
    placement: createMockPlacement('placement-all-clusters'),
    clusters: ['production-cluster', 'staging-cluster', 'development-cluster', 'testing-cluster'],
  },
  'placement-storage': {
    placement: createMockPlacement('placement-storage'),
    clusters: ['production-cluster', 'storage-primary', 'storage-backup'],
  },
  'placement-prod-staging': {
    placement: createMockPlacement('placement-prod-staging'),
    clusters: ['production-cluster', 'staging-cluster'],
  },
  'placement-dev-test': {
    placement: createMockPlacement('placement-dev-test'),
    clusters: ['development-cluster', 'testing-cluster'],
  },
  'placement-testing': { placement: createMockPlacement('placement-testing'), clusters: ['testing-cluster'] },
  'placement-edge-1': { placement: createMockPlacement('placement-edge-1'), clusters: ['edge-cluster-1'] },
  'placement-edge-2': { placement: createMockPlacement('placement-edge-2'), clusters: ['edge-cluster-2'] },
  'placement-edge': {
    placement: createMockPlacement('placement-edge'),
    clusters: ['edge-cluster-1', 'edge-cluster-2'],
  },
  'placement-security': { placement: createMockPlacement('placement-security'), clusters: ['security-cluster'] },
})

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
})
