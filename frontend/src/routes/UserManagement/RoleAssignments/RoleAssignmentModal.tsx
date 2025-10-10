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
    const subjectNames = data.subject.kind === UserKind ? data.subject.user || [] : data.subject.group || []
    const existingRoleAssignments = findRoleAssignments(
      {
        subjectKinds: [data.subject.kind],
        subjectNames: subjectNames.filter((e) => e !== undefined),
      },
      multiClusterRoleAssignments
    )

    const roleAssignmentsToSave: {
      roleAssignment: Omit<RoleAssignment, 'name'>
      subject: FlattenedRoleAssignment['subject']
    }[] = []

    for (const role of data.roles) {
      for (const subjectName of subjectNames) {
        roleAssignmentsToSave.push({
          roleAssignment: {
            clusterRole: role,
            clusterSelection: {
              type: 'clusterNames',
              clusterNames: data.scope.clusterNames || [],
            },
            targetNamespaces: data.scope.namespaces,
          },
          subject: {
            name: subjectName,
            kind: data.subject.kind,
          },
        })
      }
    }

    // Build quick lookup for existing assignments by subject+role to avoid O(n^2) scans
    const existingBySubjectRole = new Map<string, any>()
    for (const ra of existingRoleAssignments) {
      const key = `${ra.subject.kind}|${ra.subject.name}|${ra.clusterRole}`
      existingBySubjectRole.set(key, ra.relatedMulticlusterRoleAssignment)
    }

    await Promise.all(
      roleAssignmentsToSave.map((roleAssignment) => {
        const lookupKey = `${roleAssignment.subject.kind}|${roleAssignment.subject.name}|${roleAssignment.roleAssignment.clusterRole}`
        const existingMultiClusterRoleAssignment = existingBySubjectRole.get(lookupKey)

        return addRoleAssignment(
          roleAssignment.roleAssignment,
          roleAssignment.subject,
          existingMultiClusterRoleAssignment
        )
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
          .catch((e) => {
            const isDuplicateError = e?.message?.includes('Duplicate role assignment detected')
            toastContext.addAlert({
              title: t('Role assignment creation failed'),
              message: isDuplicateError
                ? t('This role assignment already exists. Please modify the selection to create a unique assignment.')
                : t('The role assignment creation for {{role}} role failed. Error: {{error}}', {
                    role: roleAssignment.roleAssignment.clusterRole,
                    error: e,
                  }),
              type: 'danger',
              autoClose: true,
            })
          })
      })
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
