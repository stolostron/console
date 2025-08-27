/* Copyright Contributors to the Open Cluster Management project */
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { MulticlusterRoleAssignment } from '../multicluster-role-assignment'
import { GroupKind, UserKind } from '../rbac'
import { createResource, deleteResource } from '../utils'
import multiclusterRoleAssignmentsMockData from './mock-data/multicluster-role-assignments.json'
import { create, remove, useFindRoleAssignments } from './multicluster-role-assignment-client'

jest.mock('../utils', () => ({
  createResource: jest.fn(),
  deleteResource: jest.fn(),
}))

jest.mock('../../shared-recoil', () => ({
  useRecoilValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

const createResourceMock = createResource as jest.MockedFunction<typeof createResource>
const deleteResourceMock = deleteResource as jest.MockedFunction<typeof deleteResource>
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
      const result = useFindRoleAssignments({})

      // Assert
      expect(result).toHaveLength(31)
    })

    it('should filter by subject name', () => {
      // Act
      const result = useFindRoleAssignments({
        subjectNames: ['alice.trask'],
      })

      // Assert
      expect(result).toHaveLength(2)
      result.forEach((roleAssignment) => {
        expect(roleAssignment.name).toBe('alice.trask')
      })
    })

    it('should filter by subject kind', () => {
      // Act
      const result = useFindRoleAssignments({
        subjectKinds: [GroupKind],
      })

      // Assert
      expect(result).toHaveLength(14)
      expect(result.filter((e) => e.kind === GroupKind)).toHaveLength(14)
    })

    it('should filter by role', () => {
      // Arrange
      const role = 'kubevirt.io:admin'

      // Act
      const result = useFindRoleAssignments({
        roles: [role],
      })

      // Assert
      expect(result).toHaveLength(6)
      expect(result.filter((e) => e.clusterRole === role)).toHaveLength(6)
    })

    it('should filter by cluster set', () => {
      // Arrange
      const clusterSet = 'production-cluster'

      // Act
      const result = useFindRoleAssignments({
        clusterSets: [clusterSet],
      })

      // Assert
      expect(result).toHaveLength(11)
      expect(result.filter((e) => e.clusterSets.includes(clusterSet))).toHaveLength(11)
    })

    it('should filter by multiple criteria', () => {
      // Arrange
      const role = 'kubevirt.io:admin'
      const clusterSet = 'production-cluster'

      // Act
      const result = useFindRoleAssignments({
        subjectKinds: [UserKind],
        roles: [role],
        clusterSets: [clusterSet],
      })

      // Assert
      expect(result).toHaveLength(3)
      expect(
        result.filter((e) => e.kind === UserKind && e.clusterRole === role && e.clusterSets.includes(clusterSet))
      ).toHaveLength(3)
    })

    it('should return empty array when no matches found', () => {
      // Act
      const result = useFindRoleAssignments({
        subjectNames: ['nonexistent.user'],
      })

      // Assert
      expect(result).toHaveLength(0)
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

  describe('remove', () => {
    it('deleteResourceMock is called with proper parameter', () => {
      // Arrange
      const multiclusterRoleAssignment: MulticlusterRoleAssignment = {} as MulticlusterRoleAssignment

      // Act
      remove(multiclusterRoleAssignment)

      // Assert
      expect(deleteResourceMock).toHaveBeenCalledTimes(1)
      expect(deleteResourceMock).toHaveBeenCalledWith(multiclusterRoleAssignment)
    })
  })
})
