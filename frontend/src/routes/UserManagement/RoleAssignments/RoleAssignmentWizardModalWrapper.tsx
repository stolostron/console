/* Copyright Contributors to the Open Cluster Management project */
import { useContext } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmToastContext } from '../../../ui-components'
import { RoleAssignmentPreselected } from './model/role-assignment-preselected'
import { useGetPlacementClusters } from '../../../resources/clients/placement-client'
import { existingRoleAssignmentsBySubjectRole, saveAllRoleAssignments } from './roleAssignmentModalHelper'
import { RoleAssignmentWizardModal } from '../../../wizards/RoleAssignment/RoleAssignmentWizardModal'
import { wizardDataToRoleAssignmentToSave } from '../../../wizards/RoleAssignment/roleAssignmentWizardHelper'
import { RoleAssignmentWizardFormData } from '../../../wizards/RoleAssignment/types'

type RoleAssignmentWizardModalWrapperProps = {
  close: () => void
  isOpen: boolean
  isEditing?: boolean
  preselected?: RoleAssignmentPreselected
}

export const RoleAssignmentWizardModalWrapper = ({
  close,
  isOpen,
  isEditing,
  preselected,
}: RoleAssignmentWizardModalWrapperProps) => {
  const { multiclusterRoleAssignmentState } = useSharedAtoms()
  const multiClusterRoleAssignments = useRecoilValue(multiclusterRoleAssignmentState)
  const placementClusters = useGetPlacementClusters()

  const { managedClusterSetBindingsState } = useSharedAtoms()
  const managedClusterSetBindings = useRecoilValue(managedClusterSetBindingsState)

  const toastContext = useContext(AcmToastContext)
  const { t } = useTranslation()

  const saveFromWizard = async (data: RoleAssignmentWizardFormData) => {
    const allClusterNames = [...new Set(placementClusters.flatMap((pc) => pc.clusters))]

    const roleAssignmentsToSave = wizardDataToRoleAssignmentToSave(data, allClusterNames)
    const existingBySubjectRole = existingRoleAssignmentsBySubjectRole(
      roleAssignmentsToSave,
      data.subject.kind,
      multiClusterRoleAssignments,
      placementClusters
    )

    await saveAllRoleAssignments(
      roleAssignmentsToSave,
      existingBySubjectRole,
      managedClusterSetBindings,
      placementClusters,
      toastContext,
      t
    )
    close()
  }

  return (
    <RoleAssignmentWizardModal
      isOpen={isOpen}
      onClose={close}
      onSubmit={saveFromWizard}
      isEditing={isEditing}
      preselected={preselected}
    />
  )
}
