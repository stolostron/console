/* Copyright Contributors to the Open Cluster Management project */
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmToastContext } from '../../../ui-components'
import { RoleAssignmentPreselected } from './model/role-assignment-preselected'
import { useGetPlacementClusters } from '../../../resources/clients/placement-client'
import { existingRoleAssignmentsBySubjectRole, saveAllRoleAssignments } from './roleAssignmentModalHelper'
import { RoleAssignmentWizardModal } from '../../../wizards/RoleAssignment/RoleAssignmentWizardModal'
import { wizardDataToRoleAssignmentToSave } from '../../../wizards/RoleAssignment/roleAssignmentWizardHelper'
import { RoleAssignmentWizardFormData } from '../../../wizards/RoleAssignment/types'
import { FlattenedRoleAssignment } from '../../../resources/clients/model/flattened-role-assignment'
import { deleteRoleAssignment } from '../../../resources/clients/multicluster-role-assignment-client'

type RoleAssignmentWizardModalWrapperProps = {
  close: () => void
  isOpen: boolean
  isEditing?: boolean
  preselected?: RoleAssignmentPreselected
  editingRoleAssignment?: FlattenedRoleAssignment
}

export const RoleAssignmentWizardModalWrapper = ({
  close,
  isOpen,
  isEditing,
  preselected,
  editingRoleAssignment,
}: RoleAssignmentWizardModalWrapperProps) => {
  const { multiclusterRoleAssignmentState } = useSharedAtoms()
  const multiClusterRoleAssignments = useRecoilValue(multiclusterRoleAssignmentState)
  const placementClusters = useGetPlacementClusters()

  const { managedClusterSetBindingsState } = useSharedAtoms()
  const managedClusterSetBindings = useRecoilValue(managedClusterSetBindingsState)

  const toastContext = useContext(AcmToastContext)
  const { t } = useTranslation()

  const [isEditingState, setIsEditingState] = useState(isEditing && editingRoleAssignment)
  useEffect(() => setIsEditingState(isEditing && editingRoleAssignment), [editingRoleAssignment, isEditing])

  const saveFromWizard = async (data: RoleAssignmentWizardFormData) => {
    if (isEditingState) {
      try {
        await deleteRoleAssignment(editingRoleAssignment!).promise.then(() => {
          toastContext.addAlert({
            title: t('Role assignment deleted'),
            message: t('The previous role assignment has been deleted due to the editing procedure.'),
            type: 'success',
            autoClose: true,
          })
        })
      } catch (error: any) {
        toastContext.addAlert({
          title: t('Role assignment deletion failed'),
          message: t("The previous role assignment can't be edited. Error: {{error}}", {
            error: (error as Error).message,
          }),
          type: 'danger',
          autoClose: true,
        })
        close()
        return
      }
    }

    const allClusterNames = [...new Set(placementClusters.flatMap((placementCluster) => placementCluster.clusters))]

    const roleAssignmentsToSave = wizardDataToRoleAssignmentToSave(data, allClusterNames)

    const filteredMultiClusterRoleAssignments = isEditingState
      ? multiClusterRoleAssignments.map((mcra) =>
          mcra.metadata.name === editingRoleAssignment!.relatedMulticlusterRoleAssignment.metadata.name
            ? {
                ...mcra,
                spec: {
                  ...mcra.spec,
                  roleAssignments:
                    mcra.spec.roleAssignments?.filter((ra) => ra.name !== editingRoleAssignment!.name) || [],
                },
              }
            : mcra
        )
      : multiClusterRoleAssignments

    const existingBySubjectRole = existingRoleAssignmentsBySubjectRole(
      roleAssignmentsToSave,
      data.subject.kind,
      filteredMultiClusterRoleAssignments,
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
