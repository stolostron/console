/* Copyright Contributors to the Open Cluster Management project */
import { useCallback } from 'react'
import { BulkActionModalProps } from '../../../components/BulkActionModal'
import { RbacDropdown } from '../../../components/Rbac'
import { useTranslation } from '../../../lib/acm-i18next'
import { deleteRoleAssignment, RoleAssignmentUI } from '../../../resources/clients/multicluster-role-assignment-client'
import { compareStrings } from '../../../ui-components'

const RoleAssignmentActionDropdown = ({
  roleAssignment,
  setModalProps,
}: {
  roleAssignment: RoleAssignmentUI
  setModalProps: (props: BulkActionModalProps<RoleAssignmentUI> | { open: false }) => void
}) => {
  const { t } = useTranslation()

  const keyFn = useCallback(
    (roleAssignment: RoleAssignmentUI) =>
      `${roleAssignment.clusterRole}${roleAssignment.clusterSets.join('')}${roleAssignment.targetNamespaces?.join('')}`,
    []
  )

  const actions = [
    {
      id: 'delete-role-assignment',
      text: t('Delete role assignment'),
      click: (roleAssignment: RoleAssignmentUI) => {
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
              cell: (roleAssignment: RoleAssignmentUI) => `${roleAssignment.kind}: ${roleAssignment.name}`,
              sort: (a: RoleAssignmentUI, b: RoleAssignmentUI) => compareStrings(a.name, b.name),
            },
            {
              header: t('Role'),
              cell: (roleAssignment: RoleAssignmentUI) => roleAssignment.clusterRole,
              sort: (a: RoleAssignmentUI, b: RoleAssignmentUI) => compareStrings(a.clusterRole, b.clusterRole),
            },
          ],
          keyFn,
          actionFn: deleteRoleAssignment,
          close: () => setModalProps({ open: false }),
          isDanger: true,
          icon: 'warning',
          confirmText: 'delete',
        })
      },
    },
  ]

  return (
    <RbacDropdown<RoleAssignmentUI>
      id={`${keyFn(roleAssignment)}-actions`}
      item={roleAssignment}
      isKebab={true}
      text={t('Actions')}
      actions={actions}
    />
  )
}

export { RoleAssignmentActionDropdown }
