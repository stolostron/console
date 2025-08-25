/* Copyright Contributors to the Open Cluster Management project */
import { useTranslation } from '../../../lib/acm-i18next'
import { BulkActionModalProps } from '../../../components/BulkActionModal'
import { RbacDropdown } from '../../../components/Rbac'
import { TrackedRoleAssignment } from '../../../resources/clients/multicluster-role-assignment-client'
import { compareStrings } from '../../../ui-components'

const RoleAssignmentActionDropdown = (props: {
  roleAssignment: TrackedRoleAssignment
  setModalProps: (props: BulkActionModalProps<TrackedRoleAssignment> | { open: false }) => void
  toastContext: any
}) => {
  const { t } = useTranslation()

  const actions = [
    {
      id: 'delete-role-assignment',
      text: t('Delete role assignment'),
      click: (roleAssignment: TrackedRoleAssignment) => {
        props.setModalProps({
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
              cell: (roleAssignment: TrackedRoleAssignment) =>
                `${roleAssignment.subjectKind}: ${roleAssignment.subjectName}`,
              sort: (a: TrackedRoleAssignment, b: TrackedRoleAssignment) =>
                compareStrings(a.subjectName, b.subjectName),
            },
            {
              header: t('Role'),
              cell: (roleAssignment: TrackedRoleAssignment) => roleAssignment.clusterRole,
              sort: (a: TrackedRoleAssignment, b: TrackedRoleAssignment) =>
                compareStrings(a.clusterRole, b.clusterRole),
            },
          ],
          keyFn: (roleAssignment: TrackedRoleAssignment) =>
            roleAssignment.multiclusterRoleAssignmentUid + '-' + roleAssignment.roleAssignmentIndex,
          actionFn: (roleAssignment: TrackedRoleAssignment) => {
            // TODO: Implement actual delete API call
            console.log('Deleting role assignment:', `${roleAssignment.subjectName}-${roleAssignment.clusterRole}`)
            props.toastContext.addAlert({
              title: t('Role assignment deleted'),
              type: 'success',
              autoClose: true,
            })
            return { promise: Promise.resolve(), abort: () => {} }
          },
          close: () => props.setModalProps({ open: false }),
          isDanger: true,
          icon: 'warning',
          confirmText: 'delete',
        })
      },
    },
  ]

  return (
    <RbacDropdown<TrackedRoleAssignment>
      id={`${props.roleAssignment.multiclusterRoleAssignmentUid}-${props.roleAssignment.roleAssignmentIndex}-actions`}
      item={props.roleAssignment}
      isKebab={true}
      text={t('Actions')}
      actions={actions}
    />
  )
}

export { RoleAssignmentActionDropdown }
