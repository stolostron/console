/* Copyright Contributors to the Open Cluster Management project */
import { Subject } from '../../kubernetes-client'
import { MulticlusterRoleAssignment, RoleAssignment, RoleAssignmentStatus } from '../../multicluster-role-assignment'

export interface FlattenedRoleAssignment extends RoleAssignment {
  relatedMulticlusterRoleAssignment: MulticlusterRoleAssignment
  subject: Pick<Subject, 'name' | 'kind'>
  status?: RoleAssignmentStatus
  clusterNames: string[]
  clusterSetNames: string[]
}
