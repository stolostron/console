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
import { FlattenedRoleAssignment } from '../../../resources/clients/model/flattened-role-assignment'
import { deleteRoleAssignment } from '../../../resources/clients/multicluster-role-assignment-client'

type RoleAssignmentWizardModalWrapperProps = {
  close: () => void
  isOpen: boolean
  preselected?: RoleAssignmentPreselected
  editingRoleAssignment?: FlattenedRoleAssignment
}

export const RoleAssignmentWizardModalWrapper = ({
  close,
  isOpen,
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

  const saveFromWizard = async (data: RoleAssignmentWizardFormData) => {
    if (editingRoleAssignment) {
      try {
        await deleteRoleAssignment(editingRoleAssignment).promise
      } catch (error: any) {
        toastContext.addAlert({
          title: t('Role assignment update failed'),
          message: t("The role assignment can't be updated. Error: {{error}}", {
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

    const filteredMultiClusterRoleAssignments = editingRoleAssignment
      ? multiClusterRoleAssignments.map((mcra) =>
          mcra.metadata.name === editingRoleAssignment.relatedMulticlusterRoleAssignment.metadata.name
            ? {
                ...mcra,
                spec: {
                  ...mcra.spec,
                  roleAssignments:
                    mcra.spec.roleAssignments?.filter((ra) => ra.name !== editingRoleAssignment.name) || [],
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
      t,
      !!editingRoleAssignment
    )
    close()
  }

  return (
    <RoleAssignmentWizardModal
      isOpen={isOpen}
      onClose={close}
      onSubmit={saveFromWizard}
      isEditing={!!editingRoleAssignment}
      preselected={preselected}
    />
  )
}
