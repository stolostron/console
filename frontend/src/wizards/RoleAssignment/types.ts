/* Copyright Contributors to the Open Cluster Management project */
import { RoleAssignmentPreselected } from '../../routes/UserManagement/RoleAssignments/model/role-assignment-preselected'
import { GroupKindType, ManagedClusterSet, ServiceAccountKindType, UserKindType } from '../../resources'

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
  selectedClusterSets?: (ManagedClusterSet | string)[]
  selectedClusters?: any[]
  clustersetsAccessLevel?: 'Cluster set role assignment' | 'Project role assignment'
  clustersAccessLevel?: 'Cluster role assignment' | 'Project role assignment'
  isChangingSubject?: boolean
}

export interface RoleAssignmentWizardModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: RoleAssignmentFormData) => void
  isEditing?: boolean
  preselected?: RoleAssignmentPreselected
  isLoading?: boolean
}
