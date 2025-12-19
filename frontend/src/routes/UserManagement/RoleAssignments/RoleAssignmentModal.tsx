/* Copyright Contributors to the Open Cluster Management project */
import { ModalVariant } from '@patternfly/react-core'
import { useContext } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmModal, AcmToastContext } from '../../../ui-components'
import { RoleAssignmentFormDataType } from './hook/RoleAssignmentFormDataHook'
import { RoleAssignmentPreselected } from './model/role-assignment-preselected'
import { RoleAssignmentForm } from './RoleAssignmentForm'
import { useGetPlacementClusters } from '../../../resources/clients/placement-client'
import {
  dataToRoleAssignmentToSave,
  existingRoleAssignmentsBySubjectRole,
  saveRoleAssignment,
} from './roleAssignmentModalHelper'

type RoleAssignmentModalProps = {
  close: () => void
  isOpen: boolean
  isEditing?: boolean
  preselected?: RoleAssignmentPreselected
}

const RoleAssignmentModal = ({ close, isOpen, isEditing, preselected }: RoleAssignmentModalProps) => {
  const { multiclusterRoleAssignmentState } = useSharedAtoms()
  const multiClusterRoleAssignments = useRecoilValue(multiclusterRoleAssignmentState)
  const placementClusters = useGetPlacementClusters()

  const { managedClusterSetBindingsState } = useSharedAtoms()
  const managedClusterSetBindings = useRecoilValue(managedClusterSetBindingsState)

  const toastContext = useContext(AcmToastContext)
  const { t } = useTranslation()

  const save = async (data: RoleAssignmentFormDataType) => {
    const roleAssignmentsToSave = dataToRoleAssignmentToSave(data)
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
    <AcmModal
      isOpen={isOpen}
      onClose={close}
      variant={ModalVariant.large}
      height="90%"
      aria-label={isEditing ? t('Edit role assignment') : t('Create role assignment')}
    >
      <RoleAssignmentForm
        isEditing={isEditing}
        onCancel={close}
        onSubmit={save}
        hideYaml={true}
        preselected={preselected}
      />
    </AcmModal>
  )
}

export { RoleAssignmentModal }
