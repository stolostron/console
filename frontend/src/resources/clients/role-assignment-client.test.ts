/* Copyright Contributors to the Open Cluster Management project */
import {
  getRoleAssignments,
  RoleAssignmentQuery,
  postRoleAssignment,
  deleteRoleAssignment,
} from './role-assignment-client'
import { RoleAssignment } from '../role-assignment'
import { UserKindType, GroupKindType, ServiceAccountKindType } from '../rbac'
import mockRoleAssignments from './mock-data/role-assignments.json'

describe('RoleAssignmentClient', () => {
  describe('getRoleAssignments', () => {
    it('should return all role assignments when no filters are provided', () => {
      const query: RoleAssignmentQuery = {}
      const results = getRoleAssignments(query)

      expect(results).toHaveLength(16)
      expect(results[0].metadata.name).toBe('alice-admin-assignment')
      expect(results[1].metadata.name).toBe('kubevirt-admins-multi-cluster')
    })

    describe('cluster filtering', () => {
      it('should filter by single cluster', () => {
        const query: RoleAssignmentQuery = {
          clusters: ['production-cluster'],
        }
        const results = getRoleAssignments(query)

        expect(results).toHaveLength(10)
        results.forEach((ra) => {
          expect(ra.spec.clusters.some((cluster) => cluster.name === 'production-cluster')).toBe(true)
        })

        const names = results.map((ra) => ra.metadata.name)
        const expectedNames = [
          'alice-admin-assignment',
          'kubevirt-admins-multi-cluster',
          'operator-multi-cluster-edit',
          'shared-name-user-assignment',
        ]
        expectedNames.forEach((expectedName) => expect(names).toContain(expectedName))
      })

      it('should filter by multiple clusters', () => {
        const query: RoleAssignmentQuery = {
          clusters: ['edge-cluster-1', 'edge-cluster-2'],
        }
        const results = getRoleAssignments(query)

        expect(results.length).toBe(3)
        results.forEach((ra) => {
          expect(
            ra.spec.clusters.some((cluster) => cluster.name === 'edge-cluster-1' || cluster.name === 'edge-cluster-2')
          ).toBe(true)
        })
      })

      it('should return empty array for non-existent cluster', () => {
        const query: RoleAssignmentQuery = {
          clusters: ['non-existent-cluster'],
        }
        const results = getRoleAssignments(query)

        expect(results).toHaveLength(0)
      })
    })

    describe('subject name filtering', () => {
      it('should filter by single subject name', () => {
        const query: RoleAssignmentQuery = {
          subjectNames: ['alice.trask'],
        }
        const results = getRoleAssignments(query)

        expect(results).toHaveLength(1)
        expect(results[0].spec.subjects.some((subject) => subject.name === 'alice.trask')).toBe(true)
      })

      it('should filter by multiple subject names', () => {
        const query: RoleAssignmentQuery = {
          subjectNames: ['bob.levy', 'charlie.cranston'],
        }
        const results = getRoleAssignments(query)

        expect(results).toHaveLength(2)

        const names = results.map((ra) => ra.metadata.name)
        const expectedNames = ['bob-edit-assignment', 'charlie-edge-edit']
        expectedNames.forEach((expectedName) => expect(names).toContain(expectedName))
      })

      it('should filter by service account name', () => {
        const query: RoleAssignmentQuery = {
          subjectNames: ['kubevirt-admin-sa'],
        }
        const results = getRoleAssignments(query)

        expect(results).toHaveLength(1)
        expect(results[0].metadata.name).toBe('admin-sa-management')
        expect(results[0].spec.subjects[0].kind).toBe('ServiceAccount')
      })

      it('should return empty array for non-existent subject', () => {
        const query: RoleAssignmentQuery = {
          subjectNames: ['non-existent-user'],
        }
        const results = getRoleAssignments(query)

        expect(results).toHaveLength(0)
      })
    })

    describe('subject type filtering', () => {
      it('should filter by User type only', () => {
        const query: RoleAssignmentQuery = {
          subjectTypes: ['User' as UserKindType],
        }
        const results = getRoleAssignments(query)

        expect(results).toHaveLength(9)
        results.forEach((ra) => {
          expect(ra.spec.subjects.some((subject) => subject.kind === 'User')).toBe(true)
        })

        const names = results.map((ra) => ra.metadata.name)
        const expectedNames = ['alice-admin-assignment', 'bob-edit-assignment', 'charlie-edge-edit']
        expectedNames.forEach((expectedName) => expect(names).toContain(expectedName))
      })

      it('should filter by Group type only', () => {
        const query: RoleAssignmentQuery = {
          subjectTypes: ['Group' as GroupKindType],
        }
        const results = getRoleAssignments(query)

        expect(results).toHaveLength(5)

        results.forEach((ra) => {
          expect(ra.spec.subjects.some((subject) => subject.kind === 'Group')).toBe(true)
        })

        const names = results.map((ra) => ra.metadata.name)
        const expectedNames = ['kubevirt-admins-multi-cluster', 'developers-development-edit', 'sre-team-view-all']
        expectedNames.forEach((expectedName) => expect(names).toContain(expectedName))
      })

      it('should filter by ServiceAccount type only', () => {
        const query: RoleAssignmentQuery = {
          subjectTypes: ['ServiceAccount' as ServiceAccountKindType],
        }
        const results = getRoleAssignments(query)

        expect(results).toHaveLength(5)

        results.forEach((ra) => {
          expect(ra.spec.subjects.some((subject) => subject.kind === 'ServiceAccount')).toBe(true)
        })

        const names = results.map((ra) => ra.metadata.name)
        const expectedNames = ['admin-sa-management', 'operator-multi-cluster-edit', 'prometheus-monitoring-view']
        expectedNames.forEach((expectedName) => expect(names).toContain(expectedName))
      })

      it('should filter by multiple subject types', () => {
        const query: RoleAssignmentQuery = {
          subjectTypes: ['User' as UserKindType, 'ServiceAccount' as ServiceAccountKindType],
        }
        const results = getRoleAssignments(query)

        expect(results).toHaveLength(14)
        results.forEach((ra) => {
          expect(ra.spec.subjects.some((subject) => subject.kind === 'User' || subject.kind === 'ServiceAccount')).toBe(
            true
          )
        })
      })

      it('should find multiple role assignments with same subject name but different subject kinds', () => {
        const query: RoleAssignmentQuery = {
          subjectNames: ['same.name'],
        }
        const results = getRoleAssignments(query)

        expect(results).toHaveLength(2)

        const subjectKinds = results.flatMap((ra) => ra.spec.subjects.map((subject) => subject.kind))
        expect(subjectKinds).toContain('User')
        expect(subjectKinds).toContain('ServiceAccount')

        results.forEach((ra) => {
          expect(ra.spec.subjects.some((subject) => subject.name === 'same.name')).toBe(true)
        })
      })
    })

    describe('role name filtering', () => {
      it('should filter by single role name', () => {
        const query: RoleAssignmentQuery = {
          roles: ['kubevirt.io:admin'],
        }
        const results = getRoleAssignments(query)

        results.forEach((ra) => {
          expect(ra.spec.roles.includes('kubevirt.io:admin')).toBe(true)
        })

        const names = results.map((ra) => ra.metadata.name)
        const expectedNames = ['alice-admin-assignment', 'kubevirt-admins-multi-cluster', 'admin-sa-management']
        expectedNames.forEach((expectedName) => expect(names).toContain(expectedName))
      })

      it('should filter by multiple role names', () => {
        const query: RoleAssignmentQuery = {
          roles: ['network-admin', 'storage-admin'],
        }
        const results = getRoleAssignments(query)

        results.forEach((ra) => {
          expect(ra.spec.roles.some((role) => role === 'network-admin' || role === 'storage-admin')).toBe(true)
        })

        const names = results.map((ra) => ra.metadata.name)
        const expectedNames = ['developers-development-edit', 'network-admin-special', 'storage-team-assignment']
        expectedNames.forEach((expectedName) => expect(names).toContain(expectedName))
      })

      it('should return empty array for non-existent role', () => {
        const query: RoleAssignmentQuery = {
          roles: ['non-existent-role'],
        }
        const results = getRoleAssignments(query)

        expect(results).toHaveLength(0)
      })

      it('should handle role assignments with multiple roles', () => {
        const query: RoleAssignmentQuery = {
          roles: ['live-migration-admin'],
        }
        const results = getRoleAssignments(query)

        expect(results).toHaveLength(1)
        expect(results[0].metadata.name).toBe('kubevirt-admins-multi-cluster')

        const expectedRoles = ['live-migration-admin', 'kubevirt.io:admin']
        expectedRoles.forEach((expectedRole) => expect(results[0].spec.roles).toContain(expectedRole))
      })
    })

    describe('combined filtering', () => {
      it('should apply multiple filters together', () => {
        const query: RoleAssignmentQuery = {
          clusters: ['production-cluster'],
          subjectTypes: ['User' as UserKindType],
          roles: ['kubevirt.io:admin'],
        }
        const results = getRoleAssignments(query)

        expect(results).toHaveLength(3)

        const names = results.map((ra) => ra.metadata.name)
        const expectedNames = ['alice-admin-assignment', 'kubevirt-admins-multi-cluster', 'network-admin-special']
        expectedNames.forEach((expectedName) => expect(names).toContain(expectedName))

        results.forEach((result) => {
          expect(result.spec.clusters.some((cluster) => cluster.name === 'production-cluster')).toBe(true)
          expect(result.spec.subjects.some((subject) => subject.kind === 'User')).toBe(true)
          expect(result.spec.roles.includes('kubevirt.io:admin')).toBe(true)
        })
      })

      it('should return empty array when combined filters have no matches', () => {
        const query: RoleAssignmentQuery = {
          clusters: ['production-cluster'],
          subjectNames: ['non-existent-user'],
          roles: ['kubevirt.io:admin'],
        }
        const results = getRoleAssignments(query)

        expect(results).toHaveLength(0)
      })

      it('should filter by cluster and subject name', () => {
        const query: RoleAssignmentQuery = {
          clusters: ['development-cluster'],
          subjectNames: ['bob.levy'],
        }
        const results = getRoleAssignments(query)

        expect(results).toHaveLength(1)
        expect(results[0].metadata.name).toBe('bob-edit-assignment')
      })

      it('should filter complex scenario with groups and multiple roles', () => {
        const query: RoleAssignmentQuery = {
          clusters: ['development-cluster'],
          subjectTypes: ['Group' as GroupKindType],
          roles: ['kubevirt.io:edit', 'storage-admin'],
        }
        const results = getRoleAssignments(query)

        expect(results).toHaveLength(2)
        results.forEach((ra) => {
          expect(ra.spec.clusters.some((cluster) => cluster.name === 'development-cluster')).toBe(true)
          expect(ra.spec.subjects.some((subject) => subject.kind === 'Group')).toBe(true)
          expect(ra.spec.roles.some((role) => role === 'kubevirt.io:edit' || role === 'storage-admin')).toBe(true)
        })
      })
    })
  })

  describe('postRoleAssignment', () => {
    it('should accept a role assignment without throwing', () => {
      expect(() => postRoleAssignment(mockRoleAssignments[3] as RoleAssignment)).not.toThrow()
    })
  })

  describe('deleteRoleAssignment', () => {
    it('should accept a role assignment without throwing', () => {
      expect(() => deleteRoleAssignment(mockRoleAssignments[0] as RoleAssignment)).not.toThrow()
    })
  })
})
