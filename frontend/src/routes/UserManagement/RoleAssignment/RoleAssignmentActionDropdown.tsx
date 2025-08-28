/* Copyright Contributors to the Open Cluster Management project */
import { useCallback } from 'react'
import { BulkActionModalProps } from '../../../components/BulkActionModal'
import { RbacDropdown } from '../../../components/Rbac'
import { useTranslation } from '../../../lib/acm-i18next'
import { FlattenedRoleAssignment } from '../../../resources/clients/multicluster-role-assignment-client'
import { IRequestResult } from '../../../resources/utils'
import { compareStrings } from '../../../ui-components'

const RoleAssignmentActionDropdown = ({
  roleAssignment,
  setModalProps,
  deleteAction,
}: {
  roleAssignment: FlattenedRoleAssignment
  setModalProps: (props: BulkActionModalProps<FlattenedRoleAssignment> | { open: false }) => void
  deleteAction: (roleAssignment: FlattenedRoleAssignment) => IRequestResult<unknown>
}) => {
  const { t } = useTranslation()

  const keyFn = useCallback(
    (roleAssignment: FlattenedRoleAssignment) =>
      `${roleAssignment.clusterRole}${roleAssignment.clusterSets.join('')}${roleAssignment.targetNamespaces?.join('')}`,
    []
  )

  const actions = [
    {
      id: 'delete-role-assignment',
      text: t('Delete role assignment'),
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
              cell: (roleAssignment: FlattenedRoleAssignment) => `${roleAssignment.kind}: ${roleAssignment.name}`,
              sort: (a: FlattenedRoleAssignment, b: FlattenedRoleAssignment) => compareStrings(a.name, b.name),
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
          confirmText: 'delete',
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
