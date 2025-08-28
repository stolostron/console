/* eslint-disable jest/no-conditional-expect */
/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { MulticlusterRoleAssignment, RoleAssignment } from '../multicluster-role-assignment'
import { GroupKind, UserKind } from '../rbac'
import { createResource, deleteResource, patchResource } from '../utils'
import multiclusterRoleAssignmentsMockData from './mock-data/multicluster-role-assignments.json'
import {
  create,
  deleteRoleAssignment,
  FlattenedRoleAssignment,
  useFindRoleAssignments,
} from './multicluster-role-assignment-client'

jest.mock('../utils', () => ({
  createResource: jest.fn(),
  deleteResource: jest.fn(),
  patchResource: jest.fn(),
}))

jest.mock('../../shared-recoil', () => ({
  useRecoilValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

const createResourceMock = createResource as jest.MockedFunction<typeof createResource>
const deleteResourceMock = deleteResource as jest.MockedFunction<typeof deleteResource>
const patchResourceMock = patchResource as jest.MockedFunction<typeof patchResource>
const useSharedAtomsMock = useSharedAtoms as jest.Mock
const useRecoilValueMock = useRecoilValue as jest.Mock

describe('multicluster-role-assignment-client', function () {
  const mockMulticlusterRoleAssignments: MulticlusterRoleAssignment[] = JSON.parse(
    JSON.stringify(multiclusterRoleAssignmentsMockData)
  ) as MulticlusterRoleAssignment[]

  beforeAll(() => {
    jest.clearAllMocks()
  })

  describe('useFindRoleAssignments', () => {
    beforeAll(() => {
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
      expect(result.current.filter((e) => e.name !== name)).toHaveLength(0)
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
      expect(result.current.filter((e) => e.kind !== GroupKind)).toHaveLength(0)
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

    it('should filter by cluster set', () => {
      // Arrange
      const clusterSet = 'production-cluster'

      // Act
      const { result } = renderHook(() =>
        useFindRoleAssignments({
          clusterSets: [clusterSet],
        })
      )

      // Assert
      expect(result.current).toHaveLength(13)
      expect(result.current.filter((e) => !e.clusterSets.includes(clusterSet))).toHaveLength(0)
    })

    it('should filter by multiple criteria', () => {
      // Arrange
      const role = 'kubevirt.io:admin'
      const clusterSet = 'production-cluster'

      // Act
      const { result } = renderHook(() =>
        useFindRoleAssignments({
          subjectKinds: [UserKind],
          roles: [role],
          clusterSets: [clusterSet],
        })
      )

      // Assert
      expect(result.current).toHaveLength(3)
      expect(
        result.current.filter(
          (e) => e.kind !== UserKind || e.clusterRole !== role || !e.clusterSets.includes(clusterSet)
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

  describe('create', () => {
    it('createResource is called with proper parameter', () => {
      // Arrange
      const multiclusterRoleAssignment: MulticlusterRoleAssignment = {} as MulticlusterRoleAssignment

      // Act
      create(multiclusterRoleAssignment)

      // Assert
      expect(createResourceMock).toHaveBeenCalledTimes(1)
      expect(createResourceMock).toHaveBeenCalledWith(multiclusterRoleAssignment)
    })
  })

  describe('deleteRoleAssignment', () => {
    it('deletes existing role assignment for a MulticlusterRoleAssignment with multiple elements', () => {
      // Arrange
      const multiClusterRoleAssignment: MulticlusterRoleAssignment =
        multiclusterRoleAssignmentsMockData[0] as MulticlusterRoleAssignment
      const roleAssignmentToRemove: FlattenedRoleAssignment = {
        relatedMulticlusterRoleAssignment: multiClusterRoleAssignment,
        clusterRole: 'kubevirt.io:admin',
        clusterSets: [
          'production-cluster',
          'production-east',
          'production-west',
          'production-central',
          'production-backup',
          'production-dr',
          'production-monitoring',
        ],
        kind: 'User',
        name: 'alice.trask',
        targetNamespaces: [
          'kubevirt-production',
          'vm-workloads',
          'vm-storage',
          'vm-networking',
          'vm-compute',
          'vm-backup',
          'vm-monitoring',
          'vm-logging',
          'vm-security',
          'vm-analytics',
        ],
      }

      // Act
      deleteRoleAssignment(roleAssignmentToRemove)

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

    it('deletes existing role assignment for a MulticlusterRoleAssignment with single element', () => {
      // Arrange
      const multiClusterRoleAssignment: MulticlusterRoleAssignment =
        multiclusterRoleAssignmentsMockData[5] as MulticlusterRoleAssignment
      const roleAssignmentToRemove: FlattenedRoleAssignment = {
        relatedMulticlusterRoleAssignment: multiClusterRoleAssignment,
        clusterRole: 'kubevirt.io:edit',
        clusterSets: ['development-cluster'],
        kind: 'User',
        name: 'intern.dev',
        targetNamespaces: ['kubevirt-dev', 'vm-dev', 'storage-dev', 'networking-dev'],
      }

      // Act
      deleteRoleAssignment(roleAssignmentToRemove)

      // Assert
      expect(patchResourceMock).toHaveBeenCalledTimes(0)
      expect(deleteResourceMock).toHaveBeenCalledTimes(1)
      expect(deleteResourceMock).toHaveBeenCalledWith(roleAssignmentToRemove.relatedMulticlusterRoleAssignment)
    })

    it.each([
      [
        'no matching clusterRole',
        {
          clusterRole: 'x',
          clusterSets: [
            'production-cluster',
            'production-east',
            'production-west',
            'production-central',
            'production-backup',
            'production-dr',
            'production-monitoring',
          ],
          targetNamespaces: [
            'kubevirt-production',
            'vm-workloads',
            'vm-storage',
            'vm-networking',
            'vm-compute',
            'vm-backup',
            'vm-monitoring',
            'vm-logging',
            'vm-security',
            'vm-analytics',
          ],
        },
      ],
      [
        'no matching clusterSets',
        {
          clusterRole: 'kubevirt.io:admin',
          clusterSets: ['x'],
          targetNamespaces: [
            'kubevirt-production',
            'vm-workloads',
            'vm-storage',
            'vm-networking',
            'vm-compute',
            'vm-backup',
            'vm-monitoring',
            'vm-logging',
            'vm-security',
            'vm-analytics',
          ],
        },
      ],
      [
        'no matching targetNamespaces',
        {
          clusterRole: 'kubevirt.io:admin',
          clusterSets: [
            'production-cluster',
            'production-east',
            'production-west',
            'production-central',
            'production-backup',
            'production-dr',
            'production-monitoring',
          ],
          targetNamespaces: ['x'],
        },
      ],
      [
        'no matching field',
        {
          clusterRole: 'x',
          clusterSets: ['y'],
          targetNamespaces: ['z'],
        },
      ],
    ])(
      'deletes not existing role assignment for a MulticlusterRoleAssignment when %s',
      (_titleSuffix: string, roleAssignment: RoleAssignment) => {
        // Arrange
        const multiClusterRoleAssignment: MulticlusterRoleAssignment =
          multiclusterRoleAssignmentsMockData[0] as MulticlusterRoleAssignment
        const roleAssignmentToRemove: FlattenedRoleAssignment = {
          relatedMulticlusterRoleAssignment: multiClusterRoleAssignment,
          kind: 'User',
          name: 'alice.trask',
          ...roleAssignment,
        }

        // Act
        try {
          deleteRoleAssignment(roleAssignmentToRemove)
          expect(true).toBe(false)
        } catch (e) {
          // Assert
          expect((e as Error).message).toBe(
            'The role assignment does not exist for this particular MulticlusterRoleAssignment'
          )
          expect(deleteResourceMock).toHaveBeenCalledTimes(0)
          expect(patchResourceMock).toHaveBeenCalledTimes(0)
        }
      }
    )
  })
})
