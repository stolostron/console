/* Copyright Contributors to the Open Cluster Management project */
import { useContext } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmToastContext } from '../../../ui-components'
import { RoleAssignmentPreselected } from './model/role-assignment-preselected'
import { useGetPlacementClusters } from '../../../resources/clients/placement-client'
import { existingRoleAssignmentsBySubjectRole, saveRoleAssignment } from './roleAssignmentModalHelper'
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

    await Promise.all(
      roleAssignmentsToSave.map((roleAssignment) =>
        saveRoleAssignment(roleAssignment, existingBySubjectRole, managedClusterSetBindings, placementClusters, {
          onSuccess: (role) =>
            toastContext.addAlert({
              title: t('Role assignment added'),
              message: t('A role assignment for {{role}} role added.', { role }),
              type: 'success',
              autoClose: true,
            }),
          onError: (role, error, isDuplicateError) =>
            toastContext.addAlert({
              title: t('Role assignment creation failed'),
              message: isDuplicateError
                ? t('This role assignment already exists. Please modify the selection to create a unique assignment.')
                : t('The role assignment creation for {{role}} role failed. Error: {{error}}', { role, error }),
              type: 'danger',
              autoClose: true,
            }),
        })
      )
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
