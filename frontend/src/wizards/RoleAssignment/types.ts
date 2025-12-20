/* Copyright Contributors to the Open Cluster Management project */
import { RoleAssignmentPreselected } from '../../routes/UserManagement/RoleAssignments/model/role-assignment-preselected'

export type ScopeType = 'Global access' | 'Select cluster sets' | 'Select clusters'

export interface RoleAssignmentFormData {
  scope: ScopeType
  selectedClusterSets?: any[]
  selectedClusters?: any[]
}

export interface RoleAssignmentWizardModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: RoleAssignmentFormData) => void
  isEditing?: boolean
  preselected?: RoleAssignmentPreselected
}
