/* Copyright Contributors to the Open Cluster Management project */
import { GroupKindType, ServiceAccountKindType, UserKindType } from '../../../../resources'

type RoleAssignmentPreselected = {
  subject?: { kind: UserKindType | GroupKindType | ServiceAccountKindType; value?: string }
  roles?: string[]
  cluterSets?: string[]
}

export type { RoleAssignmentPreselected }
