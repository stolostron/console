/* Copyright Contributors to the Open Cluster Management project */
import { UserKind, GroupKind } from '../rbac'
import {
  MulticlusterRoleAssignment,
  RoleAssignment,
  MulticlusterRoleAssignmentNamespace,
  MulticlusterRoleAssignmentApiVersion,
  MulticlusterRoleAssignmentKind,
} from '../multicluster-role-assignment'
import { createResource, patchResource, deleteResource } from '../utils'
import {
  MulticlusterRoleAssignmentQuery,
  TrackedRoleAssignment,
  filterAndTrackRoleAssignments,
  addRoleAssignmentK8s,
  updateRoleAssignmentK8s,
  deleteRoleAssignmentK8s,
  moveRoleAssignmentBetweenSubjectsK8s,
  createRoleAssignmentHash,
} from './multicluster-role-assignment-client'
import multiclusterRoleAssignmentsMockData from './mock-data/multicluster-role-assignments.json'

const mockAbort = jest.fn()
const mockPromise = Promise.resolve({})

jest.mock('../utils', () => ({
  createResource: jest.fn(),
  patchResource: jest.fn(),
  deleteResource: jest.fn(),
}))

const createResourceMock = createResource as jest.MockedFunction<typeof createResource>
const patchResourceMock = patchResource as jest.MockedFunction<typeof patchResource>
const deleteResourceMock = deleteResource as jest.MockedFunction<typeof deleteResource>

describe('MulticlusterRoleAssignmentClient', function () {
  let mockMulticlusterRoleAssignments: MulticlusterRoleAssignment[]
  let existingAssignment: RoleAssignment
  let baseTrackedAssignment: TrackedRoleAssignment

  beforeEach(() => {
    // JSON.stringify helps reset mock json data in between tests because it does a deep copy
    mockMulticlusterRoleAssignments = JSON.parse(
      JSON.stringify(multiclusterRoleAssignmentsMockData)
    ) as MulticlusterRoleAssignment[]
    jest.clearAllMocks()
    // Needed to prevent promise leaking issues between tests
    createResourceMock.mockReturnValue({ promise: mockPromise, abort: mockAbort })
    patchResourceMock.mockReturnValue({ promise: mockPromise, abort: mockAbort })
    deleteResourceMock.mockReturnValue({ promise: mockPromise, abort: mockAbort })
  })

  describe('filterAndTrackRoleAssignments', () => {
    it('should return all role assignments when no query filters are provided', () => {
      const query: MulticlusterRoleAssignmentQuery = {}
      const result = filterAndTrackRoleAssignments(mockMulticlusterRoleAssignments, query)

      expect(result).toHaveLength(31)
      result.forEach((roleAssignment) => {
        expect(roleAssignment).toHaveProperty('multiclusterRoleAssignmentUid')
        expect(roleAssignment).toHaveProperty('subjectName')
        expect(roleAssignment).toHaveProperty('subjectKind')
        expect(roleAssignment).toHaveProperty('roleAssignmentIndex')
        expect(roleAssignment).toHaveProperty('dataHash')
        expect(roleAssignment.dataHash).toMatch(/^[0-9a-f]{8}$/)
      })
    })

    it('should filter by subject name', () => {
      const query: MulticlusterRoleAssignmentQuery = {
        subjectNames: ['alice.trask'],
      }
      const result = filterAndTrackRoleAssignments(mockMulticlusterRoleAssignments, query)

      expect(result).toHaveLength(2)
      result.forEach((roleAssignment) => {
        expect(roleAssignment.subjectName).toBe('alice.trask')
      })
    })

    it('should filter by subject kind', () => {
      const query: MulticlusterRoleAssignmentQuery = {
        subjectKinds: [GroupKind],
      }
      const result = filterAndTrackRoleAssignments(mockMulticlusterRoleAssignments, query)

      expect(result).toHaveLength(14)
      result.forEach((roleAssignment) => {
        expect(roleAssignment.subjectKind).toBe(GroupKind)
      })
    })

    it('should filter by role', () => {
      const query: MulticlusterRoleAssignmentQuery = {
        roles: ['kubevirt.io:admin'],
      }
      const result = filterAndTrackRoleAssignments(mockMulticlusterRoleAssignments, query)

      expect(result).toHaveLength(6)
      result.forEach((roleAssignment) => {
        expect(roleAssignment.clusterRole).toBe('kubevirt.io:admin')
      })
    })

    it('should filter by cluster set', () => {
      const query: MulticlusterRoleAssignmentQuery = {
        clusterSets: ['production-cluster'],
      }
      const result = filterAndTrackRoleAssignments(mockMulticlusterRoleAssignments, query)

      expect(result).toHaveLength(11)
      result.forEach((roleAssignment) => {
        expect(roleAssignment.clusterSets).toContain('production-cluster')
      })
    })

    it('should filter by multiple criteria', () => {
      const query: MulticlusterRoleAssignmentQuery = {
        subjectKinds: [UserKind],
        roles: ['kubevirt.io:admin'],
        clusterSets: ['production-cluster'],
      }
      const result = filterAndTrackRoleAssignments(mockMulticlusterRoleAssignments, query)

      expect(result).toHaveLength(3)
      result.forEach((roleAssignment) => {
        expect(roleAssignment.subjectKind).toBe(UserKind)
        expect(roleAssignment.clusterRole).toBe('kubevirt.io:admin')
        expect(roleAssignment.clusterSets).toContain('production-cluster')
      })
    })

    it('should return empty array when no matches found', () => {
      const query: MulticlusterRoleAssignmentQuery = {
        subjectNames: ['nonexistent.user'],
      }
      const result = filterAndTrackRoleAssignments(mockMulticlusterRoleAssignments, query)

      expect(result).toEqual([])
    })
  })

  describe('addRoleAssignmentK8s', () => {
    const newRoleAssignment: RoleAssignment = {
      clusterRole: 'test-role',
      targetNamespaces: ['test-namespace'],
      clusterSets: ['test-cluster-set'],
    }

    it('should create new MulticlusterRoleAssignment when none exists for user', async () => {
      const result = await addRoleAssignmentK8s(
        mockMulticlusterRoleAssignments,
        'new.user',
        UserKind,
        newRoleAssignment
      )

      expect(result.success).toBe(true)
      expect(createResourceMock).toHaveBeenCalledTimes(1)

      expect(createResourceMock).toHaveBeenCalledWith({
        apiVersion: MulticlusterRoleAssignmentApiVersion,
        kind: MulticlusterRoleAssignmentKind,
        metadata: {
          name: 'new-user-role-assignment-console',
          namespace: MulticlusterRoleAssignmentNamespace,
          labels: {
            'console-created': 'true',
          },
        },
        spec: {
          subject: {
            kind: UserKind,
            name: 'new.user',
          },
          roleAssignments: [newRoleAssignment],
        },
      })
    })

    it('should add to existing MulticlusterRoleAssignment when group exists', async () => {
      const existingGroup = 'kubevirt-admins'

      const result = await addRoleAssignmentK8s(
        mockMulticlusterRoleAssignments,
        existingGroup,
        GroupKind,
        newRoleAssignment
      )

      expect(result.success).toBe(true)
      expect(patchResourceMock).toHaveBeenCalledTimes(1)

      expect(patchResourceMock).toHaveBeenCalledWith(
        {
          apiVersion: MulticlusterRoleAssignmentApiVersion,
          kind: MulticlusterRoleAssignmentKind,
          metadata: {
            name: 'kubevirt-admins-role-assignment-console',
            namespace: MulticlusterRoleAssignmentNamespace,
            uid: '7b8c9f2a-5e1d-4a6b-8c3f-9d2e7a5b8c1f',
            labels: {
              'console-created': 'true',
            },
          },
          spec: {
            subject: {
              kind: GroupKind,
              name: existingGroup,
            },
            roleAssignments: expect.any(Array),
          },
        },
        [
          {
            op: 'replace',
            path: '/spec/roleAssignments',
            value: [
              {
                clusterRole: 'kubevirt.io:admin',
                targetNamespaces: ['kubevirt-production'],
                clusterSets: ['production-cluster', 'staging-cluster'],
              },
              {
                clusterRole: 'live-migration-admin',
                targetNamespaces: ['kubevirt-dev', 'vm-dev'],
                clusterSets: ['development-cluster', 'testing-cluster'],
              },
              {
                clusterRole: 'kubevirt.io:admin',
                targetNamespaces: ['kubevirt-test', 'vm-test', 'storage-test'],
                clusterSets: ['testing-cluster'],
              },
              {
                clusterRole: 'test-role',
                targetNamespaces: ['test-namespace'],
                clusterSets: ['test-cluster-set'],
              },
            ],
          },
        ]
      )
    })

    it('should handle errors when creating resource fails', async () => {
      const mockErrorPromise = Promise.reject(new Error('API Error'))
      createResourceMock.mockReturnValue({ promise: mockErrorPromise, abort: mockAbort })

      const result = await addRoleAssignmentK8s(
        mockMulticlusterRoleAssignments,
        'new.user',
        UserKind,
        newRoleAssignment
      )

      expect(result.success).toBe(false)
      expect(createResourceMock).toHaveBeenCalledTimes(1)
      expect(result.error).toContain('Failed to add RoleAssignment')
    })

    it('should handle errors when patching existing resource fails', async () => {
      const existingUser = 'alice.trask'
      const mockErrorPromise = Promise.reject(new Error('API Error'))
      patchResourceMock.mockReturnValue({ promise: mockErrorPromise, abort: mockAbort })

      const result = await addRoleAssignmentK8s(
        mockMulticlusterRoleAssignments,
        existingUser,
        UserKind,
        newRoleAssignment
      )

      expect(result.success).toBe(false)
      expect(patchResourceMock).toHaveBeenCalledTimes(1)
      expect(result.error).toContain('Failed to add RoleAssignment')
    })

    it('should sanitize username for resource name creation', async () => {
      await addRoleAssignmentK8s(mockMulticlusterRoleAssignments, 'Wierd!!!$$$%%%Username', UserKind, newRoleAssignment)

      expect(createResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            name: 'wierd-username-role-assignment-console',
          }),
        })
      )
    })
  })

  describe('updateRoleAssignmentK8s', () => {
    beforeEach(() => {
      existingAssignment = mockMulticlusterRoleAssignments[0].spec.roleAssignments[0]
      baseTrackedAssignment = {
        clusterRole: 'updated-role',
        targetNamespaces: ['updated-namespace'],
        clusterSets: ['updated-clusterset'],
        multiclusterRoleAssignmentUid: '314843d9-ad5e-4d9c-9203-ae9553701e44',
        subjectName: 'alice.trask',
        subjectKind: UserKind,
        roleAssignmentIndex: 0,
        dataHash: createRoleAssignmentHash(existingAssignment),
      }
    })
    it('should successfully update an existing role assignment', async () => {
      const result = await updateRoleAssignmentK8s(mockMulticlusterRoleAssignments, baseTrackedAssignment)

      expect(result.success).toBe(true)
      expect(patchResourceMock).toHaveBeenCalledTimes(1)

      expect(patchResourceMock).toHaveBeenCalledWith(
        {
          apiVersion: MulticlusterRoleAssignmentApiVersion,
          kind: MulticlusterRoleAssignmentKind,
          metadata: {
            name: 'alice-trask-role-assignment-console',
            namespace: MulticlusterRoleAssignmentNamespace,
            uid: '314843d9-ad5e-4d9c-9203-ae9553701e44',
            labels: {
              'console-created': 'true',
            },
          },
          spec: {
            subject: {
              kind: UserKind,
              name: 'alice.trask',
            },
            roleAssignments: expect.any(Array),
          },
        },
        [
          {
            op: 'replace',
            path: '/spec/roleAssignments',
            value: [
              {
                clusterRole: 'updated-role',
                targetNamespaces: ['updated-namespace'],
                clusterSets: ['updated-clusterset'],
              },
              {
                clusterRole: 'kubevirt.io:admin',
                targetNamespaces: ['kubevirt-staging', 'vm-workloads'],
                clusterSets: ['staging-cluster'],
              },
            ],
          },
        ]
      )
    })

    it('should fail when MulticlusterRoleAssignment is not found', async () => {
      const trackedAssignment = {
        ...baseTrackedAssignment,
        multiclusterRoleAssignmentUid: 'nonexistent-uid',
      }

      const result = await updateRoleAssignmentK8s(mockMulticlusterRoleAssignments, trackedAssignment)

      expect(result.success).toBe(false)
      expect(result.error).toBe('MulticlusterRoleAssignment not found')
    })

    it('should fail when role assignment index is invalid', async () => {
      const trackedAssignment = {
        ...baseTrackedAssignment,
        roleAssignmentIndex: 999,
      }

      const result = await updateRoleAssignmentK8s(mockMulticlusterRoleAssignments, trackedAssignment)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid RoleAssignment index')
    })

    it('should fail when data hash does not match', async () => {
      const trackedAssignment = {
        ...baseTrackedAssignment,
        dataHash: 'wronghash',
      }

      const result = await updateRoleAssignmentK8s(mockMulticlusterRoleAssignments, trackedAssignment)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unexpected RoleAssignment data')
    })
  })

  describe('deleteRoleAssignmentK8s', () => {
    beforeEach(() => {
      existingAssignment = mockMulticlusterRoleAssignments[2].spec.roleAssignments[1]
      baseTrackedAssignment = {
        clusterRole: existingAssignment.clusterRole,
        targetNamespaces: existingAssignment.targetNamespaces,
        clusterSets: existingAssignment.clusterSets,
        multiclusterRoleAssignmentUid: '2f4a6c8e-3b7d-4e9a-6c2f-8e4a7b9d2c5f',
        subjectName: 'admin.user',
        subjectKind: UserKind,
        roleAssignmentIndex: 1,
        dataHash: createRoleAssignmentHash(existingAssignment),
      }
    })

    it('should successfully delete role assignment', async () => {
      const result = await deleteRoleAssignmentK8s(mockMulticlusterRoleAssignments, baseTrackedAssignment)

      expect(result.success).toBe(true)
      expect(patchResourceMock).toHaveBeenCalledTimes(1)

      expect(patchResourceMock).toHaveBeenCalledWith(
        {
          apiVersion: MulticlusterRoleAssignmentApiVersion,
          kind: MulticlusterRoleAssignmentKind,
          metadata: {
            name: 'admin-user-role-assignment-console',
            namespace: MulticlusterRoleAssignmentNamespace,
            uid: '2f4a6c8e-3b7d-4e9a-6c2f-8e4a7b9d2c5f',
            labels: {
              'console-created': 'true',
            },
          },
          spec: {
            subject: {
              kind: UserKind,
              name: 'admin.user',
            },
            roleAssignments: expect.any(Array),
          },
        },
        [
          {
            op: 'replace',
            path: '/spec/roleAssignments',
            value: [
              {
                clusterRole: 'kubevirt.io:admin',
                targetNamespaces: ['kubevirt-production'],
                clusterSets: ['production-cluster'],
              },
            ],
          },
        ]
      )
    })

    it('should delete entire MulticlusterRoleAssignment when no role assignments remain', async () => {
      const singleAssignmentMock = mockMulticlusterRoleAssignments[10]
      const existingAssignment = singleAssignmentMock.spec.roleAssignments[0]

      const trackedAssignment: TrackedRoleAssignment = {
        clusterRole: existingAssignment.clusterRole,
        targetNamespaces: existingAssignment.targetNamespaces,
        clusterSets: existingAssignment.clusterSets,
        multiclusterRoleAssignmentUid: '8d1f4a7c-3e6b-4d8f-1a7c-3b6e8d1f4a7c',
        subjectName: 'david.brown',
        subjectKind: UserKind,
        roleAssignmentIndex: 0,
        dataHash: createRoleAssignmentHash(existingAssignment),
      }

      const result = await deleteRoleAssignmentK8s([singleAssignmentMock], trackedAssignment)

      expect(result.success).toBe(true)
      expect(deleteResourceMock).toHaveBeenCalledTimes(1)
    })

    it('should fail when MulticlusterRoleAssignment is not found', async () => {
      const trackedAssignment = {
        ...baseTrackedAssignment,
        multiclusterRoleAssignmentUid: 'nonexistent-uid',
      }

      const result = await deleteRoleAssignmentK8s(mockMulticlusterRoleAssignments, trackedAssignment)

      expect(result.success).toBe(false)
      expect(result.error).toBe('MulticlusterRoleAssignment not found')
    })

    it('should handle API errors during delete', async () => {
      const mockErrorPromise = Promise.reject(new Error('API Error'))
      patchResourceMock.mockReturnValue({ promise: mockErrorPromise, abort: mockAbort })

      const result = await deleteRoleAssignmentK8s(mockMulticlusterRoleAssignments, baseTrackedAssignment)

      expect(patchResourceMock).toHaveBeenCalledTimes(1)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to delete RoleAssignment')
    })
  })

  describe('moveRoleAssignmentBetweenSubjectsK8s', () => {
    beforeEach(() => {
      existingAssignment = mockMulticlusterRoleAssignments[4].spec.roleAssignments[1]
      baseTrackedAssignment = {
        clusterRole: existingAssignment.clusterRole,
        targetNamespaces: existingAssignment.targetNamespaces,
        clusterSets: existingAssignment.clusterSets,
        multiclusterRoleAssignmentUid: '5d3e8b2c-7a1f-4e5d-3b8c-2f5e7a1d4b8c',
        subjectName: 'developers',
        subjectKind: GroupKind,
        roleAssignmentIndex: 1,
        dataHash: createRoleAssignmentHash(existingAssignment),
      }
    })

    it('should move role assignment from existing MulticlusterRoleAssignment to a newly created one', async () => {
      const result = await moveRoleAssignmentBetweenSubjectsK8s(
        mockMulticlusterRoleAssignments,
        baseTrackedAssignment,
        'bob.newuser',
        UserKind
      )

      expect(result.success).toBe(true)
      expect(patchResourceMock).toHaveBeenCalledTimes(1)
      expect(createResourceMock).toHaveBeenCalledTimes(1)

      expect(patchResourceMock).toHaveBeenCalledWith(
        {
          apiVersion: MulticlusterRoleAssignmentApiVersion,
          kind: MulticlusterRoleAssignmentKind,
          metadata: {
            name: 'developers-role-assignment-console',
            namespace: MulticlusterRoleAssignmentNamespace,
            uid: '5d3e8b2c-7a1f-4e5d-3b8c-2f5e7a1d4b8c',
            labels: {
              'console-created': 'true',
            },
          },
          spec: {
            subject: {
              kind: GroupKind,
              name: 'developers',
            },
            roleAssignments: expect.any(Array),
          },
        },
        [
          {
            op: 'replace',
            path: '/spec/roleAssignments',
            value: [
              {
                clusterRole: 'kubevirt.io:edit',
                targetNamespaces: ['kubevirt-dev', 'vm-dev', 'storage-dev', 'networking-dev'],
                clusterSets: ['development-cluster'],
              },
              {
                clusterRole: 'storage-admin',
                targetNamespaces: ['kubevirt-dev', 'vm-dev', 'storage-dev', 'networking-dev'],
                clusterSets: ['development-cluster'],
              },
            ],
          },
        ]
      )

      expect(createResourceMock).toHaveBeenCalledWith({
        apiVersion: MulticlusterRoleAssignmentApiVersion,
        kind: MulticlusterRoleAssignmentKind,
        metadata: {
          name: 'bob-newuser-role-assignment-console',
          namespace: MulticlusterRoleAssignmentNamespace,
          labels: {
            'console-created': 'true',
          },
        },
        spec: {
          subject: {
            kind: UserKind,
            name: 'bob.newuser',
          },
          roleAssignments: [
            {
              clusterRole: 'network-admin',
              targetNamespaces: ['kubevirt-dev', 'vm-dev', 'storage-dev', 'networking-dev'],
              clusterSets: ['development-cluster'],
            },
          ],
        },
      })
    })

    it('should move role assignment from existing MulticlusterRoleAssignment to another existing one', async () => {
      const result = await moveRoleAssignmentBetweenSubjectsK8s(
        mockMulticlusterRoleAssignments,
        baseTrackedAssignment,
        'alice.trask',
        UserKind
      )

      expect(result.success).toBe(true)
      expect(patchResourceMock).toHaveBeenCalledTimes(2)

      expect(patchResourceMock).toHaveBeenNthCalledWith(
        1,
        {
          apiVersion: MulticlusterRoleAssignmentApiVersion,
          kind: MulticlusterRoleAssignmentKind,
          metadata: {
            name: 'developers-role-assignment-console',
            namespace: MulticlusterRoleAssignmentNamespace,
            uid: '5d3e8b2c-7a1f-4e5d-3b8c-2f5e7a1d4b8c',
            labels: {
              'console-created': 'true',
            },
          },
          spec: {
            subject: {
              kind: GroupKind,
              name: 'developers',
            },
            roleAssignments: expect.any(Array),
          },
        },
        [
          {
            op: 'replace',
            path: '/spec/roleAssignments',
            value: [
              {
                clusterRole: 'kubevirt.io:edit',
                targetNamespaces: ['kubevirt-dev', 'vm-dev', 'storage-dev', 'networking-dev'],
                clusterSets: ['development-cluster'],
              },
              {
                clusterRole: 'storage-admin',
                targetNamespaces: ['kubevirt-dev', 'vm-dev', 'storage-dev', 'networking-dev'],
                clusterSets: ['development-cluster'],
              },
            ],
          },
        ]
      )

      expect(patchResourceMock).toHaveBeenNthCalledWith(
        2,
        {
          apiVersion: MulticlusterRoleAssignmentApiVersion,
          kind: MulticlusterRoleAssignmentKind,
          metadata: {
            name: 'alice-trask-role-assignment-console',
            namespace: MulticlusterRoleAssignmentNamespace,
            uid: '314843d9-ad5e-4d9c-9203-ae9553701e44',
            labels: {
              'console-created': 'true',
            },
          },
          spec: {
            subject: {
              kind: UserKind,
              name: 'alice.trask',
            },
            roleAssignments: expect.any(Array),
          },
        },
        [
          {
            op: 'replace',
            path: '/spec/roleAssignments',
            value: [
              {
                clusterRole: 'kubevirt.io:admin',
                targetNamespaces: ['kubevirt-production', 'vm-workloads'],
                clusterSets: ['production-cluster'],
              },
              {
                clusterRole: 'kubevirt.io:admin',
                targetNamespaces: ['kubevirt-staging', 'vm-workloads'],
                clusterSets: ['staging-cluster'],
              },
              {
                clusterRole: 'network-admin',
                targetNamespaces: ['kubevirt-dev', 'vm-dev', 'storage-dev', 'networking-dev'],
                clusterSets: ['development-cluster'],
              },
            ],
          },
        ]
      )
    })

    it('should fail when MulticlusterRoleAssignment is not found', async () => {
      const trackedAssignment = {
        ...baseTrackedAssignment,
        multiclusterRoleAssignmentUid: 'nonexistent-uid',
      }

      const result = await moveRoleAssignmentBetweenSubjectsK8s(
        mockMulticlusterRoleAssignments,
        trackedAssignment,
        'bob.newuser',
        UserKind
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('MulticlusterRoleAssignment not found')
    })

    it('should handle errors during move operation', async () => {
      const mockErrorPromise = Promise.reject(new Error('API Error'))
      createResourceMock.mockReturnValueOnce({ promise: mockErrorPromise, abort: mockAbort })

      const result = await moveRoleAssignmentBetweenSubjectsK8s(
        mockMulticlusterRoleAssignments,
        baseTrackedAssignment,
        'bob.newuser',
        UserKind
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to add RoleAssignment')
    })
  })
})
