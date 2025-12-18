/* Copyright Contributors to the Open Cluster Management project */
import { RoleAssignmentPreselected } from '../../routes/UserManagement/RoleAssignments/model/role-assignment-preselected'

export interface RoleAssignmentWizardModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: any) => void
  isEditing?: boolean
  preselected?: RoleAssignmentPreselected
}

export interface RoleAssignmentFormData {
  scope: string
  selectedClusterSets?: any[]
  selectedClusters?: any[]
}
