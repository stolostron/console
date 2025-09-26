/* eslint-disable jest/no-conditional-expect */
/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { MulticlusterRoleAssignment, RoleAssignment } from '../multicluster-role-assignment'
import { GroupKind, UserKind } from '../rbac'
import { createResource, deleteResource, patchResource } from '../utils'
import { ResourceError } from '../utils/resource-request'
import multiclusterRoleAssignmentsMockData from './mock-data/multicluster-role-assignments.json'
import {
  addRoleAssignment,
  create,
  deleteRoleAssignment,
  FlattenedRoleAssignment,
  mapRoleAssignmentBeforeSaving,
  useFindRoleAssignments,
  validateRoleAssignmentName,
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
  const mockMulticlusterRoleAssignments: MulticlusterRoleAssignment[] =
    multiclusterRoleAssignmentsMockData as MulticlusterRoleAssignment[]

  beforeAll(() => {
    jest.clearAllMocks()
  })

  describe('RoleAssignment to FlattenedRoleAssignment mapping', () => {
    beforeAll(() => {
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
        apiVersion: 'rbac.open-cluster-management.io/v1alpha1',
        kind: 'MulticlusterRoleAssignment',
        metadata: {
          name: 'admin-user-role-assignment-console',
          namespace: 'open-cluster-management-global-set',
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
                type: 'clusterNames' as const,
                clusterNames: ['production-cluster'],
              },
            },
            {
              name: 'live-migration-admin-2f8bbe8b5ef6a395',
              clusterRole: 'live-migration-admin',
              targetNamespaces: ['kubevirt-dev', 'vm-dev'],
              clusterSelection: {
                type: 'clusterNames' as const,
                clusterNames: ['development-cluster'],
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
      expect(result.current[1].relatedMulticlusterRoleAssignment).toStrictEqual({
        apiVersion: 'rbac.open-cluster-management.io/v1alpha1',
        kind: 'MulticlusterRoleAssignment',
        metadata: {
          name: 'admin-user-role-assignment-console',
          namespace: 'open-cluster-management-global-set',
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
                type: 'clusterNames' as const,
                clusterNames: ['production-cluster'],
              },
            },
            {
              name: 'live-migration-admin-2f8bbe8b5ef6a395',
              clusterRole: 'live-migration-admin',
              targetNamespaces: ['kubevirt-dev', 'vm-dev'],
              clusterSelection: {
                type: 'clusterNames' as const,
                clusterNames: ['development-cluster'],
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
      expect(result.current[0].clusterSelection.clusterNames).toStrictEqual(['production-cluster'])

      expect(result.current[1].name).toBe('kubevirt.io:view-c89564b44096eb7a')
      expect(result.current[1].clusterRole).toBe('kubevirt.io:view')
      expect(result.current[1].targetNamespaces).toStrictEqual(['security', 'audit-logs'])
      expect(result.current[1].clusterSelection.clusterNames).toStrictEqual(['security-cluster'])
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
      expect(result.current).toHaveLength(13)
      expect(result.current.filter((e) => !e.clusterSelection.clusterNames.includes(clusterName))).toHaveLength(0)
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
      expect(result.current).toHaveLength(3)
      expect(
        result.current.filter(
          (e) =>
            e.subject.kind !== UserKind ||
            e.clusterRole !== role ||
            !e.clusterSelection.clusterNames.includes(clusterName)
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
      const multiclusterRoleAssignment: MulticlusterRoleAssignment = {
        spec: {
          roleAssignments: [],
        },
      } as any as MulticlusterRoleAssignment

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
      const multiClusterRoleAssignment: MulticlusterRoleAssignment = {
        ...multiclusterRoleAssignmentsMockData[0],
      } as MulticlusterRoleAssignment
      const roleAssignmentToRemove: FlattenedRoleAssignment = {
        relatedMulticlusterRoleAssignment: multiClusterRoleAssignment,
        name: multiClusterRoleAssignment.spec.roleAssignments[0].name,
        clusterRole: multiClusterRoleAssignment.spec.roleAssignments[0].clusterRole,
        clusterSelection: {
          type: 'clusterNames',
          clusterNames: multiClusterRoleAssignment.spec.roleAssignments[0].clusterSelection?.clusterNames || [],
        },
        subject: {
          kind: multiClusterRoleAssignment.spec.subject.kind,
          name: multiClusterRoleAssignment.spec.subject.name,
        },
        targetNamespaces: multiClusterRoleAssignment.spec.roleAssignments[0].targetNamespaces,
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
      const multiClusterRoleAssignment: MulticlusterRoleAssignment = {
        ...multiclusterRoleAssignmentsMockData[5],
      } as MulticlusterRoleAssignment

      const roleAssignmentToRemove: FlattenedRoleAssignment = {
        relatedMulticlusterRoleAssignment: multiClusterRoleAssignment,
        name: multiClusterRoleAssignment.spec.roleAssignments[0].name,
        clusterRole: multiClusterRoleAssignment.spec.roleAssignments[0].clusterRole,
        clusterSelection: {
          type: 'clusterNames',
          clusterNames: multiClusterRoleAssignment.spec.roleAssignments[0].clusterSelection?.clusterNames || [],
        },
        subject: {
          kind: multiClusterRoleAssignment.spec.subject.kind,
          name: multiClusterRoleAssignment.spec.subject.name,
        },
        targetNamespaces: multiClusterRoleAssignment.spec.roleAssignments[0].targetNamespaces,
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
          name: 'A1',
          clusterRole: 'x',
          clusterSelection: {
            type: 'clusterNames' as const,
            clusterNames: [
              'production-cluster',
              'production-east',
              'production-west',
              'production-central',
              'production-backup',
              'production-dr',
              'production-monitoring',
            ],
          },
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
        'no matching clusterNames',
        {
          name: 'A1',
          clusterRole: 'kubevirt.io:admin',
          clusterSelection: {
            type: 'clusterNames' as const,
            clusterNames: ['x'],
          },
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
          name: 'A1',
          clusterRole: 'kubevirt.io:admin',
          clusterSelection: {
            type: 'clusterNames' as const,
            clusterNames: [
              'production-cluster',
              'production-east',
              'production-west',
              'production-central',
              'production-backup',
              'production-dr',
              'production-monitoring',
            ],
          },
          targetNamespaces: ['x'],
        },
      ],
      [
        'no matching field',
        {
          name: 'A1',
          clusterRole: 'x',
          clusterSelection: {
            type: 'clusterNames' as const,
            clusterNames: ['y'],
          },
          targetNamespaces: ['z'],
        },
      ],
    ])(
      'deletes not existing role assignment for a MulticlusterRoleAssignment when %s',
      (_titleSuffix: string, roleAssignment: RoleAssignment) => {
        // Arrange
        const multiClusterRoleAssignment: MulticlusterRoleAssignment = {
          ...multiclusterRoleAssignmentsMockData[0],
        } as MulticlusterRoleAssignment
        const roleAssignmentToRemove: FlattenedRoleAssignment = {
          relatedMulticlusterRoleAssignment: multiClusterRoleAssignment,
          subject: {
            kind: 'User',
            name: 'alice.trask',
          },
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

  describe('mapRoleAssignmentBeforeSaving', () => {
    let roleAssignment: Omit<RoleAssignment, 'name'>

    beforeEach(() => {
      roleAssignment = {
        clusterRole: 'admin',
        targetNamespaces: ['default'],
        clusterSelection: {
          type: 'clusterNames' as const,
          clusterNames: ['cluster-1'],
        },
      }
    })

    it('generates deterministic name with role prefix', () => {
      // Act
      const result = mapRoleAssignmentBeforeSaving(roleAssignment)

      // Assert
      expect(result.name).toMatch(/^admin-[a-f0-9]{16}$/)
      expect(result.clusterRole).toBe(roleAssignment.clusterRole)
      expect(result.targetNamespaces).toEqual(roleAssignment.targetNamespaces)
      expect(result.clusterSelection).toEqual(roleAssignment.clusterSelection)
    })

    it('generates same name for identical input', () => {
      // Act
      const result1 = mapRoleAssignmentBeforeSaving(roleAssignment)
      const result2 = mapRoleAssignmentBeforeSaving(roleAssignment)

      // Assert
      expect(result1.name).toBe(result2.name)
    })

    it('generates different names for different inputs', () => {
      // Arrange
      const roleAssignment2 = { ...roleAssignment, clusterRole: 'viewer' }

      // Act
      const result1 = mapRoleAssignmentBeforeSaving(roleAssignment)
      const result2 = mapRoleAssignmentBeforeSaving(roleAssignment2)

      // Assert
      expect(result1.name).not.toBe(result2.name)
      expect(result1.name).toMatch(/^admin-[a-f0-9]{16}$/)
      expect(result2.name).toMatch(/^viewer-[a-f0-9]{16}$/)
    })
  })

  describe('validateRoleAssignmentName', () => {
    let newRoleAssignment: Omit<RoleAssignment, 'name'>
    let existingRoleAssignments: RoleAssignment[]

    beforeEach(() => {
      newRoleAssignment = {
        clusterRole: 'admin',
        targetNamespaces: ['default'],
        clusterSelection: {
          type: 'clusterNames' as const,
          clusterNames: ['cluster-1'],
        },
      }
      existingRoleAssignments = []
    })

    it('returns true when name is unique', () => {
      // Arrange
      existingRoleAssignments = [
        {
          name: 'viewer-1234567890123456',
          clusterRole: 'viewer',
          targetNamespaces: ['kube-system'],
          clusterSelection: { type: 'clusterNames', clusterNames: ['other-cluster'] },
        },
      ]

      // Act
      const result = validateRoleAssignmentName(newRoleAssignment, existingRoleAssignments)

      // Assert
      expect(result).toBe(true)
    })

    it('returns false when name already exists', () => {
      // Arrange
      const generatedName = mapRoleAssignmentBeforeSaving(newRoleAssignment).name
      existingRoleAssignments = [
        {
          name: generatedName,
          clusterRole: 'admin',
          targetNamespaces: ['default'],
          clusterSelection: { type: 'clusterNames', clusterNames: ['cluster-1'] },
        },
      ]

      // Act
      const result = validateRoleAssignmentName(newRoleAssignment, existingRoleAssignments)

      // Assert
      expect(result).toBe(false)
    })

    it('returns true for empty existing assignments list', () => {
      // Act
      const result = validateRoleAssignmentName(newRoleAssignment, existingRoleAssignments)

      // Assert
      expect(result).toBe(true)
    })
  })

  describe('addRoleAssignment - validation logic', () => {
    let roleAssignment: Omit<RoleAssignment, 'name'>
    let subject: FlattenedRoleAssignment['subject']

    beforeEach(() => {
      roleAssignment = {
        clusterRole: 'admin',
        targetNamespaces: ['default'],
        clusterSelection: {
          type: 'clusterNames' as const,
          clusterNames: ['cluster-1'],
        },
      }
      subject = { kind: 'User', name: 'test.user' }
    })

    it('proceeds when role assignment name is unique', () => {
      // Arrange
      const mockResult = { promise: Promise.resolve({} as MulticlusterRoleAssignment), abort: jest.fn() }
      patchResourceMock.mockReturnValue(mockResult)

      const existingMRA: MulticlusterRoleAssignment = {
        spec: {
          roleAssignments: [
            {
              name: 'viewer-1234567890123456',
              clusterRole: 'viewer',
              targetNamespaces: ['kube-system'],
              clusterSelection: { type: 'clusterNames', clusterNames: ['other-cluster'] },
            },
          ],
        },
      } as MulticlusterRoleAssignment

      // Act
      const result = addRoleAssignment(roleAssignment, subject, existingMRA)

      // Assert
      expect(patchResourceMock).toHaveBeenCalled()
      expect(result).toBe(mockResult)
    })

    it('rejects with duplicate error when role assignment name already exists', async () => {
      // Arrange
      const generatedName = mapRoleAssignmentBeforeSaving(roleAssignment).name
      const existingMRA: MulticlusterRoleAssignment = {
        spec: {
          roleAssignments: [
            {
              name: generatedName,
              clusterRole: 'admin',
              targetNamespaces: ['default'],
              clusterSelection: { type: 'clusterNames', clusterNames: ['cluster-1'] },
            },
          ],
        },
      } as MulticlusterRoleAssignment

      // Act
      const result = addRoleAssignment(roleAssignment, subject, existingMRA)

      // Assert
      await expect(result.promise).rejects.toThrow('Duplicate role assignment detected.')
      await expect(result.promise).rejects.toBeInstanceOf(ResourceError)
    })
  })
})
