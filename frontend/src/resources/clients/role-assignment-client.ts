/* Copyright Contributors to the Open Cluster Management project */
import { RoleAssignment, RoleAssignmentSubject, Cluster } from '../role-assignment'
import { UserKindType, GroupKindType, ServiceAccountKindType } from '../rbac'
import mockRoleAssignments from './mock-data/role-assignments.json'

export interface RoleAssignmentQuery {
  clusters?: string[]
  subjectNames?: string[]
  subjectTypes?: (UserKindType | GroupKindType | ServiceAccountKindType)[]
  roleNames?: string[]
}

// TODO: Remove once real role assignment data is available
function filterClusters(clusters: Cluster[], clusterNames?: string[]): Cluster[] {
  if (!clusterNames?.length) return clusters
  // Filter clusters by name/s included in query
  return clusters.filter((cluster) => clusterNames.includes(cluster.name))
}

// TODO: Remove once real role assignment data is available
function filterSubjects(subjects: RoleAssignmentSubject[], query: RoleAssignmentQuery): RoleAssignmentSubject[] {
  return subjects
    .filter((subject) => {
      // Filter by subject name/s included in query
      if (query.subjectNames?.length && !query.subjectNames.includes(subject.name)) {
        return false
      }
      // Filter by subject type/s included in query
      if (query.subjectTypes?.length && !query.subjectTypes.includes(subject.kind)) {
        return false
      }
      return true
    })
    .map((subject) => ({
      ...subject,
      clusters: filterClusters(subject.clusters, query.clusters),
    }))
    .filter((subject) => subject.clusters.length > 0)
}

// TODO: Remove once real role assignment data is available
function filterMockRoleAssignments(query: RoleAssignmentQuery): RoleAssignment[] {
  const roleAssignments = mockRoleAssignments as RoleAssignment[]

  return roleAssignments
    .filter((roleAssignment) => {
      // Filter by role name/s included in query
      return !query.roleNames?.length || query.roleNames.includes(roleAssignment.spec.role)
    })
    .map((roleAssignment) => ({
      ...roleAssignment,
      spec: {
        ...roleAssignment.spec,
        subjects: filterSubjects(roleAssignment.spec.subjects, query),
      },
    }))
    .filter((roleAssignment) => roleAssignment.spec.subjects.length > 0)
}

export function getRoleAssignments(query: RoleAssignmentQuery): RoleAssignment[] {
  // TODO: Replace with backend API call when ready
  return filterMockRoleAssignments(query)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function postRoleAssignment(_roleAssignment: RoleAssignment): void {
  // TODO: Implement backend API call to create role assignment
  // Remove eslint-disable-next-line when backend is implemented
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function deleteRoleAssignment(_roleAssignment: RoleAssignment): void {
  // TODO: Implement backend API call to delete role assignment
  // Remove eslint-disable-next-line when backend is implemented
}
