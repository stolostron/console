/* Copyright Contributors to the Open Cluster Management project */
import { GroupKindType, ServiceAccountKindType, UserKindType } from '../../../../resources'

type RoleAssignmentPreselected = {
  subject?: { kind: UserKindType | GroupKindType | ServiceAccountKindType; value?: string }
  roles?: string[]
  clusterNames?: string[]
  clusterSetNames?: string[]
  namespaces?: string[]
  // Context indicates which page/view the wizard was opened from
  context?: 'role' | 'cluster' | 'clusterSets' | 'identity'
}

export type { RoleAssignmentPreselected }
