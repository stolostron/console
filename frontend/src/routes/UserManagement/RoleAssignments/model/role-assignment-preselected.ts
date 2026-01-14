/* Copyright Contributors to the Open Cluster Management project */
import { GroupKindType, ServiceAccountKindType, UserKindType } from '../../../../resources'

type RoleAssignmentPreselected = {
  subject?: { kind: UserKindType | GroupKindType | ServiceAccountKindType; value?: string }
  roles?: string[]
  clusterNames?: string[]
  namespaces?: string[]
  // Context indicates which page/view the wizard was opened from
  context?: 'role' | 'cluster' | 'identity'
}

export type { RoleAssignmentPreselected }
