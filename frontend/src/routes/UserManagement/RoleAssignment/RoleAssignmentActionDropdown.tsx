/* Copyright Contributors to the Open Cluster Management project */
import { useTranslation } from '../../../lib/acm-i18next'
import { Dropdown, DropdownItem, KebabToggle } from '@patternfly/react-core/deprecated'
import { useState } from 'react'
import { BulkActionModalProps } from '../../../components/BulkActionModal'
import { TrackedRoleAssignment } from '../../../resources/clients/multicluster-role-assignment-client'
import { compareStrings } from '../../../ui-components'

const RoleAssignmentActionDropdown = (props: {
  roleAssignment: TrackedRoleAssignment
  setModalProps: (props: BulkActionModalProps<TrackedRoleAssignment> | { open: false }) => void
  toastContext: any
}) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const onToggle = () => setIsOpen(!isOpen)
  const onSelect = () => setIsOpen(false)

  return (
    <Dropdown
      onSelect={onSelect}
      toggle={<KebabToggle onToggle={onToggle} />}
      isOpen={isOpen}
      isPlain
      position="right"
      style={{ zIndex: 9999 }}
      dropdownItems={[
        <DropdownItem
          key="delete-details"
          onClick={() => {
            props.setModalProps({
              open: true,
              title: t('Delete role assignment?'),
              action: t('Delete'),
              processing: t('Deleting'),
              items: [props.roleAssignment],
              emptyState: undefined,
              description: t(
                'Are you sure that you want to delete the role assignments? This action cannot be undone.'
              ),
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
            setIsOpen(false)
          }}
        >
          {t('Delete role assignment')}
        </DropdownItem>,
      ]}
    />
  )
}

export { RoleAssignmentActionDropdown }
