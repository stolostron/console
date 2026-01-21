/* Copyright Contributors to the Open Cluster Management project */
import { Subject } from '../../kubernetes-client'
import { RoleAssignment, RoleAssignmentStatus } from '../../multicluster-role-assignment'

export interface RoleAssignmentToSave extends Pick<RoleAssignment, 'clusterRole' | 'targetNamespaces'> {
  subject: Pick<Subject, 'name' | 'kind'>
  status?: RoleAssignmentStatus
  isGlobalScope: boolean
  clusterNames?: string[]
  clusterSetNames?: string[]
}
