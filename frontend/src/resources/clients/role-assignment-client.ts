/* Copyright Contributors to the Open Cluster Management project */
import { RoleAssignment } from '../role-assignment'
import { UserKindType, GroupKindType, ServiceAccountKindType } from '../rbac'
import mockRoleAssignments from './mock-data/role-assignments.json'

export interface RoleAssignmentQuery {
  clusters?: string[]
  subjectNames?: string[]
  subjectTypes?: (UserKindType | GroupKindType | ServiceAccountKindType)[]
  roles?: string[]
}

function filterByClusters(roleAssignments: RoleAssignment[], clusters: string[]): RoleAssignment[] {
  return roleAssignments.filter((ra) => ra.spec.clusters.some((cluster) => clusters.includes(cluster.name)))
}

function filterBySubjectNames(roleAssignments: RoleAssignment[], subjectNames: string[]): RoleAssignment[] {
  return roleAssignments.filter((ra) => ra.spec.subjects.some((subject) => subjectNames.includes(subject.name)))
}

function filterBySubjectTypes(
  roleAssignments: RoleAssignment[],
  subjectTypes: (UserKindType | GroupKindType | ServiceAccountKindType)[]
): RoleAssignment[] {
  return roleAssignments.filter((ra) => ra.spec.subjects.some((subject) => subjectTypes.includes(subject.kind)))
}

function filterByRoles(roleAssignments: RoleAssignment[], roles: string[]): RoleAssignment[] {
  return roleAssignments.filter((ra) => ra.spec.roles.some((role) => roles.includes(role)))
}

export function getRoleAssignments(query: RoleAssignmentQuery): RoleAssignment[] {
  let results: RoleAssignment[] = mockRoleAssignments as RoleAssignment[]

  // Apply each filter only if the corresponding query parameter is provided
  if (query.roles?.length) {
    results = filterByRoles(results, query.roles)
  }

  if (query.subjectNames?.length) {
    results = filterBySubjectNames(results, query.subjectNames)
  }

  if (query.subjectTypes?.length) {
    results = filterBySubjectTypes(results, query.subjectTypes)
  }

  if (query.clusters?.length) {
    results = filterByClusters(results, query.clusters)
  }

  return results
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
