/* Copyright Contributors to the Open Cluster Management project */
import { RoleAssignmentPreselected } from '../../routes/UserManagement/RoleAssignments/model/role-assignment-preselected'
import { GroupKindType, ServiceAccountKindType, UserKindType } from '../../resources'

export interface RoleAssignmentFormData {
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

export interface RoleAssignmentWizardFormData extends RoleAssignmentFormData {
  scopeType?: 'Global access' | 'Select cluster sets' | 'Select clusters'
  selectedClusterSets?: any[]
  selectedClusters?: any[]
  clusterSetAccessLevel?: 'Cluster set role assignment' | 'Cluster role assignment'
  selectedClustersAccessLevel?: 'Cluster role assignment' | 'Project role assignment'
}

export interface RoleAssignmentWizardModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: RoleAssignmentFormData) => void
  isEditing?: boolean
  preselected?: RoleAssignmentPreselected
}
