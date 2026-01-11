import { GroupKindType, ServiceAccountKindType, UserKindType } from '../../../../resources'

type RoleAssignmentFormDataType = {
  subject: {
    kind: UserKindType | GroupKindType | ServiceAccountKindType
    user?: string[]
    group?: string[]
  }
  scope: {
    kind: 'all' | 'specific'
    clusterNames?: string[]
    namespaces?: string[]
  }
  roles: string[]
}

export type { RoleAssignmentFormDataType }
