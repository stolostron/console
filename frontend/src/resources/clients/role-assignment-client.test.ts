/* Copyright Contributors to the Open Cluster Management project */
import {
  getRoleAssignments,
  postRoleAssignment,
  deleteRoleAssignment,
  RoleAssignmentQuery,
} from './role-assignment-client'
import { RoleAssignment } from '../role-assignment'
import mockRoleAssignments from './mock-data/role-assignments.json'

describe('role-assignment-client', () => {
  const testRoleAssignment: RoleAssignment = {
    apiVersion: 'rbac.open-cluster-management.io/v1alpha1',
    kind: 'RoleAssignment',
    metadata: {
      name: 'test-assignment',
    },
    spec: {
      role: 'test-role',
      subjects: [
        {
          kind: 'User',
          name: 'test-user',
          clusters: [
            {
              name: 'test-cluster',
              clusterWide: true,
            },
          ],
        },
      ],
    },
  }

  describe('listRoleAssignments', () => {
    it('returns all role assignments when empty query is provided', () => {
      const result = getRoleAssignments({})
      expect(result).toEqual(mockRoleAssignments)
    })

    describe('filtering by role names', () => {
      it('filters role assignments by single role name', () => {
        const query: RoleAssignmentQuery = {
          roleNames: ['kubevirt.io:admin'],
        }
        const result = getRoleAssignments(query)

        expect(result.length).toBeGreaterThan(0)
        result.forEach((roleAssignment) => {
          expect(roleAssignment.spec.role).toBe('kubevirt.io:admin')
        })
      })

      it('filters role assignments by multiple role names', () => {
        const query: RoleAssignmentQuery = {
          roleNames: ['kubevirt.io:admin', 'cluster-admin'],
        }
        const result = getRoleAssignments(query)

        result.forEach((roleAssignment) => {
          expect(['kubevirt.io:admin', 'cluster-admin']).toContain(roleAssignment.spec.role)
        })
      })

      it('returns empty array for non-existent role name', () => {
        const query: RoleAssignmentQuery = {
          roleNames: ['non-existent-role'],
        }
        const result = getRoleAssignments(query)
        expect(result).toHaveLength(0)
      })
    })

    describe('filtering by subject names', () => {
      it('filters role assignments by single subject name', () => {
        const query: RoleAssignmentQuery = {
          subjectNames: ['alice.trask'],
        }
        const result = getRoleAssignments(query)

        expect(result.length).toBeGreaterThan(0)
        result.forEach((roleAssignment) => {
          const hasSubject = roleAssignment.spec.subjects.every((subject) => subject.name === 'alice.trask')
          expect(hasSubject).toBe(true)
        })
      })

      it('filters role assignments by multiple subject names', () => {
        const query: RoleAssignmentQuery = {
          subjectNames: ['alice.trask', 'kubevirt-admins'],
        }
        const result = getRoleAssignments(query)
        result.forEach((roleAssignment) => {
          const hasValidSubject = roleAssignment.spec.subjects.every((subject) =>
            ['alice.trask', 'kubevirt-admins'].includes(subject.name)
          )
          expect(hasValidSubject).toBe(true)
        })
      })

      it('returns empty array for non-existent subject name', () => {
        const query: RoleAssignmentQuery = {
          subjectNames: ['non-existent-subject'],
        }
        const result = getRoleAssignments(query)
        expect(result).toHaveLength(0)
      })
    })

    describe('filtering by subject types', () => {
      it('filters role assignments by User subject type', () => {
        const query: RoleAssignmentQuery = {
          subjectTypes: ['User'],
        }
        const result = getRoleAssignments(query)

        expect(result.length).toBeGreaterThan(0)
        result.forEach((roleAssignment) => {
          const hasUserSubject = roleAssignment.spec.subjects.every((subject) => subject.kind === 'User')
          expect(hasUserSubject).toBe(true)
        })
      })

      it('filters role assignments by Group subject type', () => {
        const query: RoleAssignmentQuery = {
          subjectTypes: ['Group'],
        }
        const result = getRoleAssignments(query)

        expect(result.length).toBeGreaterThan(0)
        result.forEach((roleAssignment) => {
          const hasGroupSubject = roleAssignment.spec.subjects.every((subject) => subject.kind === 'Group')
          expect(hasGroupSubject).toBe(true)
        })
      })

      it('filters role assignments by ServiceAccount subject type', () => {
        const query: RoleAssignmentQuery = {
          subjectTypes: ['ServiceAccount'],
        }
        const result = getRoleAssignments(query)

        expect(result.length).toBeGreaterThan(0)
        result.forEach((roleAssignment) => {
          const hasServiceAccountSubject = roleAssignment.spec.subjects.every(
            (subject) => subject.kind === 'ServiceAccount'
          )
          expect(hasServiceAccountSubject).toBe(true)
        })
      })

      it('filters role assignments by multiple subject types', () => {
        const query: RoleAssignmentQuery = {
          subjectTypes: ['User', 'Group'],
        }
        const result = getRoleAssignments(query)

        result.forEach((roleAssignment) => {
          const hasValidSubjectType = roleAssignment.spec.subjects.every((subject) =>
            ['User', 'Group'].includes(subject.kind)
          )
          expect(hasValidSubjectType).toBe(true)
        })
      })
    })

    describe('filtering by clusters', () => {
      it('filters role assignments by single cluster', () => {
        const query: RoleAssignmentQuery = {
          clusters: ['production-cluster'],
        }
        const result = getRoleAssignments(query)

        expect(result.length).toBeGreaterThan(0)
        result.forEach((roleAssignment) => {
          const hasCluster = roleAssignment.spec.subjects.every((subject) =>
            subject.clusters.every((cluster) => cluster.name === 'production-cluster')
          )
          expect(hasCluster).toBe(true)
        })
      })

      it('filters role assignments by multiple clusters', () => {
        const query: RoleAssignmentQuery = {
          clusters: ['production-cluster', 'staging-cluster'],
        }
        const result = getRoleAssignments(query)

        result.forEach((roleAssignment) => {
          const hasValidCluster = roleAssignment.spec.subjects.every((subject) =>
            subject.clusters.every((cluster) => ['production-cluster', 'staging-cluster'].includes(cluster.name))
          )
          expect(hasValidCluster).toBe(true)
        })
      })

      it('returns empty array for non-existent cluster', () => {
        const query: RoleAssignmentQuery = {
          clusters: ['non-existent-cluster'],
        }
        const result = getRoleAssignments(query)
        expect(result).toHaveLength(0)
      })

      it('filters out subjects with no matching clusters', () => {
        const query: RoleAssignmentQuery = {
          clusters: ['production-cluster'],
        }
        const result = getRoleAssignments(query)

        result.forEach((roleAssignment) => {
          roleAssignment.spec.subjects.forEach((subject) => {
            const hasMatchingCluster = subject.clusters.every((cluster) => cluster.name === 'production-cluster')
            expect(hasMatchingCluster).toBe(true)
          })
        })
      })
    })

    describe('combined filtering', () => {
      it('filters by role name and subject type', () => {
        const query: RoleAssignmentQuery = {
          roleNames: ['kubevirt.io:admin'],
          subjectTypes: ['User'],
        }
        const result = getRoleAssignments(query)

        result.forEach((roleAssignment) => {
          expect(roleAssignment.spec.role).toBe('kubevirt.io:admin')
          const hasUserSubject = roleAssignment.spec.subjects.every((subject) => subject.kind === 'User')
          expect(hasUserSubject).toBe(true)
        })
      })

      it('filters by subject name and cluster', () => {
        const query: RoleAssignmentQuery = {
          subjectNames: ['alice.trask'],
          clusters: ['production-cluster'],
        }
        const result = getRoleAssignments(query)

        result.forEach((roleAssignment) => {
          const hasValidSubject = roleAssignment.spec.subjects.every(
            (subject) =>
              subject.name === 'alice.trask' &&
              subject.clusters.every((cluster) => cluster.name === 'production-cluster')
          )
          expect(hasValidSubject).toBe(true)
        })
      })

      it('filters by all parameters', () => {
        const query: RoleAssignmentQuery = {
          roleNames: ['kubevirt.io:admin'],
          subjectNames: ['alice.trask'],
          subjectTypes: ['User'],
          clusters: ['production-cluster'],
        }
        const result = getRoleAssignments(query)

        result.forEach((roleAssignment) => {
          expect(roleAssignment.spec.role).toBe('kubevirt.io:admin')
          const hasValidSubject = roleAssignment.spec.subjects.every(
            (subject) =>
              subject.name === 'alice.trask' &&
              subject.kind === 'User' &&
              subject.clusters.every((cluster) => cluster.name === 'production-cluster')
          )
          expect(hasValidSubject).toBe(true)
        })
      })

      it('returns empty array when combined filters have no matches', () => {
        const query: RoleAssignmentQuery = {
          roleNames: ['kubevirt.io:admin'],
          subjectNames: ['non-existent-subject'],
        }
        const result = getRoleAssignments(query)
        expect(result).toHaveLength(0)
      })
    })
  })

  describe('postRoleAssignment', () => {
    it('does not throw when called with valid role assignment', () => {
      expect(() => postRoleAssignment(testRoleAssignment)).not.toThrow()
    })

    it('accepts any role assignment structure', () => {
      const minimalRoleAssignment = {} as RoleAssignment
      expect(() => postRoleAssignment(minimalRoleAssignment)).not.toThrow()
    })
  })

  describe('deleteRoleAssignment', () => {
    it('does not throw when called with valid role assignment', () => {
      expect(() => deleteRoleAssignment(testRoleAssignment)).not.toThrow()
    })

    it('accepts any role assignment structure', () => {
      const minimalRoleAssignment = {} as RoleAssignment
      expect(() => deleteRoleAssignment(minimalRoleAssignment)).not.toThrow()
    })
  })
})
