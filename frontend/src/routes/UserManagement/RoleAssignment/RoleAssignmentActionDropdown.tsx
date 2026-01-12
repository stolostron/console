/* Copyright Contributors to the Open Cluster Management project */
import { useCallback } from 'react'
import { BulkActionModalProps } from '../../../components/BulkActionModal'
import { RbacDropdown } from '../../../components/Rbac'
import { useTranslation } from '../../../lib/acm-i18next'
import { IRequestResult } from '../../../resources/utils'
import { compareStrings } from '../../../ui-components'
import { FlattenedRoleAssignment } from '../../../resources/clients/model/flattened-role-assignment'

const RoleAssignmentActionDropdown = ({
  roleAssignment,
  setModalProps,
  deleteAction,
  canDelete,
  onEdit,
}: {
  roleAssignment: FlattenedRoleAssignment
  setModalProps: (props: BulkActionModalProps<FlattenedRoleAssignment> | { open: false }) => void
  deleteAction: (roleAssignment: FlattenedRoleAssignment) => IRequestResult<unknown>
  canDelete: boolean
  onEdit?: (roleAssignment: FlattenedRoleAssignment) => void
}) => {
  const { t } = useTranslation()

  const keyFn = useCallback((roleAssignment: FlattenedRoleAssignment) => roleAssignment.name, [])

  const actions = [
    {
      id: 'edit-role-assignment',
      text: t('Edit role assignment'),
      click: (roleAssignment: FlattenedRoleAssignment) => {
        onEdit?.(roleAssignment)
      },
    },
    {
      id: 'delete-role-assignment',
      text: t('Delete role assignment'),
      isDisabled: !canDelete,
      tooltip: canDelete ? '' : t('rbac.unauthorized'),
      click: (roleAssignment: FlattenedRoleAssignment) => {
        setModalProps({
          open: true,
          title: t('Delete role assignment?'),
          action: t('Delete'),
          processing: t('Deleting'),
          items: [roleAssignment],
          emptyState: undefined,
          description: t('Are you sure that you want to delete the role assignments? This action cannot be undone.'),
          columns: [
            {
              header: t('Subject'),
              cell: (roleAssignment: FlattenedRoleAssignment) =>
                `${roleAssignment.subject.kind}: ${roleAssignment.subject.name}`,
              sort: (a: FlattenedRoleAssignment, b: FlattenedRoleAssignment) =>
                compareStrings(a.subject.name, b.subject.name),
            },
            {
              header: t('Role'),
              cell: (roleAssignment: FlattenedRoleAssignment) => roleAssignment.clusterRole,
              sort: (a: FlattenedRoleAssignment, b: FlattenedRoleAssignment) =>
                compareStrings(a.clusterRole, b.clusterRole),
            },
          ],
          keyFn,
          actionFn: deleteAction,
          close: () => setModalProps({ open: false }),
          isDanger: true,
          icon: 'warning',
          confirmText: t('confirm'),
        })
      },
    },
  ]

  return (
    <RbacDropdown<FlattenedRoleAssignment>
      id={`${keyFn(roleAssignment)}-actions`}
      item={roleAssignment}
      isKebab={true}
      text={t('Actions')}
      actions={actions}
    />
  )
}

export { RoleAssignmentActionDropdown }
