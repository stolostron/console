/* Copyright Contributors to the Open Cluster Management project */
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { RoleAssignment } from '../../../resources'
import { FlattenedRoleAssignment } from '../../../resources/clients/model/flattened-role-assignment'
import { deleteRoleAssignment } from '../../../resources/clients/multicluster-role-assignment-client'
import { useGetPlacementClusters } from '../../../resources/clients/placement-client'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmToastContext } from '../../../ui-components'
import { RoleAssignmentWizardModal } from '../../../wizards/RoleAssignment/RoleAssignmentWizardModal'
import { wizardDataToRoleAssignmentToSave } from '../../../wizards/RoleAssignment/roleAssignmentWizardHelper'
import { RoleAssignmentWizardFormData } from '../../../wizards/RoleAssignment/types'
import { RoleAssignmentPreselected } from './model/role-assignment-preselected'
import { existingRoleAssignmentsBySubjectRole, saveAllRoleAssignments } from './roleAssignmentModalHelper'

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
  const [savedRoleAssignments, setSavedRoleAssignments] = useState<RoleAssignment[]>([])
  const [isSaving, setIsSaving] = useState<boolean>(false)

  const { multiclusterRoleAssignmentState } = useSharedAtoms()
  const multiClusterRoleAssignments = useRecoilValue(multiclusterRoleAssignmentState)
  const placementClusters = useGetPlacementClusters()

  const { managedClusterSetBindingsState } = useSharedAtoms()
  const managedClusterSetBindings = useRecoilValue(managedClusterSetBindingsState)

  const toastContext = useContext(AcmToastContext)
  const { t } = useTranslation()

  useEffect(() => {
    if (savedRoleAssignments.length > 0 && multiClusterRoleAssignments) {
      const allRoleAssignmentNames = new Set(
        multiClusterRoleAssignments.flatMap((mcra) => mcra.spec.roleAssignments?.map((ra) => ra.name) ?? [])
      )
      const allSaved = savedRoleAssignments.every((savedRoleAssignment) =>
        allRoleAssignmentNames.has(savedRoleAssignment.name)
      )
      if (allSaved) {
        if (editingRoleAssignment) {
          deleteRoleAssignment(editingRoleAssignment)
            .promise.catch((error: any) =>
              console.error(
                'Failed to delete role assignment, this is expected if the subject is not affected by the editing',
                error
              )
            )
            .finally(() => {
              setSavedRoleAssignments([])
              setIsSaving(false)
              close()
            })
        } else {
          setSavedRoleAssignments([])
          setIsSaving(false)
          close()
        }
      }
    }
  }, [savedRoleAssignments, multiClusterRoleAssignments, close, editingRoleAssignment, toastContext, t])

  const saveFromWizard = async (data: RoleAssignmentWizardFormData) => {
    setIsSaving(true)

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

    saveAllRoleAssignments(
      roleAssignmentsToSave,
      existingBySubjectRole,
      managedClusterSetBindings,
      placementClusters,
      toastContext,
      t,
      !!editingRoleAssignment
    )
      .then((roleAssignments) => setSavedRoleAssignments(roleAssignments))
      .catch(() => setIsSaving(false))
  }

  return (
    <RoleAssignmentWizardModal
      isOpen={isOpen}
      onClose={close}
      onSubmit={saveFromWizard}
      isEditing={!!editingRoleAssignment}
      preselected={preselected}
      isLoading={isSaving}
    />
  )
}
