/* Copyright Contributors to the Open Cluster Management project */
import { useTranslation } from '../../../lib/acm-i18next'
import { Dropdown, DropdownItem, KebabToggle } from '@patternfly/react-core/deprecated'
import { useState } from 'react'
import { BulkActionModalProps } from '../../../components/BulkActionModal'
import { RoleAssignment } from '../../../resources/role-assignment'
import { compareStrings } from '../../../ui-components'

const RoleAssignmentActionDropdown = (props: {
  roleAssignment: RoleAssignment
  setModalProps: (props: BulkActionModalProps<RoleAssignment> | { open: false }) => void
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
                  header: t('Name'),
                  cell: (roleAssignment: RoleAssignment) => roleAssignment.metadata?.name ?? '',
                  sort: (a: RoleAssignment, b: RoleAssignment) =>
                    compareStrings(a.metadata?.name ?? '', b.metadata?.name ?? ''),
                },
                {
                  header: t('Role'),
                  cell: (roleAssignment: RoleAssignment) => roleAssignment.spec.roles.join(', '),
                  sort: (a: RoleAssignment, b: RoleAssignment) =>
                    compareStrings(a.spec.roles.join(', '), b.spec.roles.join(', ')),
                },
              ],
              keyFn: (roleAssignment: RoleAssignment) => roleAssignment.metadata?.uid ?? '',
              actionFn: (roleAssignment: RoleAssignment) => {
                // TODO: Implement actual delete API call
                console.log('Deleting role assignment:', roleAssignment.metadata?.name)
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
