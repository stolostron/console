/* Copyright Contributors to the Open Cluster Management project */
import { useContext } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { UserKind } from '../../../resources'
import {
  addRoleAssignment,
  findRoleAssignments,
  FlattenedRoleAssignment,
} from '../../../resources/clients/multicluster-role-assignment-client'
import { RoleAssignment } from '../../../resources/multicluster-role-assignment'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmModal, AcmToastContext } from '../../../ui-components'
import { RoleAssignmentFormDataType } from './hook/RoleAssignmentFormDataHook'
import { RoleAssignmentPreselected } from './model/role-assignment-preselected'
import { RoleAssignmentForm } from './RoleAssignmentForm'
import { ModalVariant } from '@patternfly/react-core'

type RoleAssignmentModalProps = {
  close: () => void
  isOpen: boolean
  isEditing?: boolean
  preselected?: RoleAssignmentPreselected
}

const RoleAssignmentModal = ({ close, isOpen, isEditing, preselected }: RoleAssignmentModalProps) => {
  const { multiclusterRoleAssignmentState } = useSharedAtoms()
  const multiClusterRoleAssignments = useRecoilValue(multiclusterRoleAssignmentState)
  const toastContext = useContext(AcmToastContext)
  const { t } = useTranslation()

  const save = async (data: RoleAssignmentFormDataType) => {
    const subjectNames = data.subject.kind === UserKind ? [data.subject.user] : [data.subject.group]
    const existingRoleAssignments = findRoleAssignments(
      {
        roles: data.roles,
        subjectKinds: [data.subject.kind],
        subjectNames: subjectNames.filter((e) => e !== undefined),
      },
      multiClusterRoleAssignments
    )
    const existingMultiClusterRoleAssignment =
      existingRoleAssignments?.length > 0
        ? existingRoleAssignments[existingRoleAssignments.length - 1].relatedMulticlusterRoleAssignment
        : undefined

    const roleAssignmentsToSave: {
      roleAssignment: Omit<RoleAssignment, 'name'>
      subject: FlattenedRoleAssignment['subject']
    }[] = data.roles.map((role) => ({
      roleAssignment: {
        clusterRole: role,
        clusterSelection: {
          type: 'clusterNames' as const,
          clusterNames: data.scope.kind === 'specific' ? data.scope.clusterNames || [] : [],
        },
        targetNamespaces:
          data.scope.kind === 'specific' && data.scope.namespaces?.length ? data.scope.namespaces : undefined,
      },
      subject: {
        name: (data.subject.kind === UserKind ? data.subject.user : data.subject.group) ?? '',
        kind: data.subject.kind,
      },
    }))

    await Promise.all(
      roleAssignmentsToSave.map((roleAssignment) =>
        addRoleAssignment(roleAssignment.roleAssignment, roleAssignment.subject, existingMultiClusterRoleAssignment)
          .promise.then(() =>
            toastContext.addAlert({
              title: t('Role assignment added'),
              message: t('A role assignment for {{role}} role added.', {
                role: roleAssignment.roleAssignment.clusterRole,
              }),
              type: 'success',
              autoClose: true,
            })
          )
          .catch((e) =>
            toastContext.addAlert({
              title: t('Role assignment creation failed'),
              message: t('The role assignment creation for {{role}} role failed. Error: {{error}}', {
                role: roleAssignment.roleAssignment.clusterRole,
                error: e,
              }),
              type: 'danger',
              autoClose: true,
            })
          )
      )
    )
    close()
  }

  return (
    <AcmModal isOpen={isOpen} onClose={close} variant={ModalVariant.large} height="90%">
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
