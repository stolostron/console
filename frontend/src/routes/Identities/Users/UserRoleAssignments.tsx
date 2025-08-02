/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useParams } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../lib/acm-i18next'
import { useQuery } from '../../../lib/useQuery'
import { listUsers, listClusterRoleBindings } from '../../../resources/rbac'
import { ClusterRoleBinding } from '../../../resources/access-control'
import { useMemo, useState, useCallback } from 'react'
import { AcmTable, compareStrings, IAcmTableColumn, AcmEmptyState, AcmLoadingPage, AcmButton } from '../../../ui-components'
import { fitContent } from '@patternfly/react-table'
import { ITableFilter, IAcmTableButtonAction, IAcmTableAction } from '../../../ui-components/AcmTable/AcmTableTypes'
import { ButtonVariant } from '@patternfly/react-core'
import { Dropdown, DropdownItem } from '@patternfly/react-core/deprecated'
import { KebabToggle } from '@patternfly/react-core/deprecated'
import { DOC_LINKS, ViewDocumentationLink } from '../../../lib/doc-util'
import { CreateRoleAssignmentModal } from './UserRoleAssignmentsCreate'

const RoleAssignmentActionDropdown = (props: { roleBinding: ClusterRoleBinding }) => {
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
            // TODO: Delete role assignment
            console.log('Delete role assignment:', props.roleBinding.metadata?.name)
          }}
        >
          {t('Delete role assingment')}
        </DropdownItem>,
        <DropdownItem
          key="edit-assignment"
          onClick={() => {
            // TODO: Edit role assignment
            console.log('Edit role assignment:', props.roleBinding.metadata?.name)
          }}
        >
          {t('Edit role assingment')}
        </DropdownItem>,
      ]}
    />
  )
}

const UserRoleAssignments = () => {
  const { t } = useTranslation()
  const { id = undefined } = useParams()
  const { data: users, loading: usersLoading } = useQuery(listUsers)
  const { data: clusterRoleBindings, loading: rolesLoading, refresh: refreshRoleBindings } = useQuery(listClusterRoleBindings)

  const [showCreateModal, setShowCreateModal] = useState(false)

  const user = users?.find((user) => user.metadata.name === id || user.metadata.uid === id)

  const userRoleBindings = useMemo(() => {
    if (!user || !clusterRoleBindings) return []

    return clusterRoleBindings.filter((crb) =>
      crb.subjects?.some((subject) => subject.kind === 'User' && subject.name === user.metadata.name)
    ).sort((a, b) => compareStrings(a.metadata?.name ?? '', b.metadata?.name ?? ''))
  }, [user, clusterRoleBindings])

  console.log(userRoleBindings, 'userRoleBindings')

  const keyFn = useCallback((roleBinding: ClusterRoleBinding) => roleBinding.metadata?.uid ?? '', [])

  // Filters for the table
  const filters = useMemo<ITableFilter<ClusterRoleBinding>[]>(() => {
    // Get unique role names for filter options
    const roleOptions = [...new Set(userRoleBindings.map(crb => crb.roleRef.name))]
      .sort()
      .map(role => ({ label: role, value: role }))

    // Get unique kind options
    const kindOptions = [...new Set(userRoleBindings.map(crb => crb.roleRef.kind))]
      .sort()
      .map(kind => ({ label: kind, value: kind }))

    return [
      {
        id: 'role',
        label: t('Role'),
        options: roleOptions,
        tableFilterFn: (selectedValues, roleBinding) => 
          selectedValues.includes(roleBinding.roleRef.name)
      },
      {
        id: 'kind',
        label: t('Kind'),
        options: kindOptions,
        tableFilterFn: (selectedValues, roleBinding) => 
          selectedValues.includes(roleBinding.roleRef.kind)
      },
      {
        id: 'namespace',
        label: t('Scope'),
        options: [
          { label: t('Cluster-wide'), value: 'cluster-wide' },
          { label: t('Namespaced'), value: 'namespaced' }
        ],
        tableFilterFn: (selectedValues, roleBinding) => {
          const isClusterWide = !roleBinding.metadata?.namespace
          return isClusterWide 
            ? selectedValues.includes('cluster-wide')
            : selectedValues.includes('namespaced')
        }
      }
    ]
  }, [userRoleBindings, t])

  // Table action buttons
  const tableActionButtons = useMemo<IAcmTableButtonAction[]>(() => [
    {
      id: 'create-role-assignment',
      title: t('Create role assignment'),
      click: () => {
        setShowCreateModal(true)
      },
      variant: ButtonVariant.primary,
    }
  ], [t])

  // Table actions for bulk operations
  const tableActions = useMemo<IAcmTableAction<ClusterRoleBinding>[]>(() => [
    {
      id: 'delete-assignments',
      title: t('Delete role assingment'),
      click: () => {
        // TODO: Open delete modal
      },
      variant: 'bulk-action',
    },
    {
      id: 'bulk-edit-assignments',
      title: t('Edit role assingment'),
      click: () => {
        // TODO: Open bulk edit modal
      },
      variant: 'bulk-action',
    },
  ], [t])

  // Show loading spinner only when both are loading, otherwise show partial data
  const isInitialLoading = usersLoading && rolesLoading
  
  const isUserLoading = usersLoading && !user

  // console.log(userRoleBindings,'userRoleBindings')
  const columns: IAcmTableColumn<ClusterRoleBinding>[] = [
    {
      header: t('Name'),
      sort: 'metadata.name',
      cell: (roleBinding) => roleBinding.metadata?.name ?? '',
      exportContent: (roleBinding) => roleBinding.metadata?.name ?? '',
    },
    {
      header: t('Roles'),
      sort: 'metadata.name',
      cell: (roleBinding) => roleBinding.roleRef.name,
      exportContent: (roleBinding) => roleBinding.roleRef.name,
    },
    {
      header: t('Cluster'),
      sort: 'metadata.name',
      cell: () => 'hub-cluster',
      exportContent: () => 'hub-cluster',
    },
    {
      header: t('Namespaces'),
      sort: 'metadata.name',
      cell: (roleBinding) => roleBinding.metadata?.namespace ?? t('All namespaces'),
      exportContent: (roleBinding) => roleBinding.metadata?.namespace ?? t('All namespaces'),
    },
    {
      header: t('Status'),
      sort: 'metadata.name',
      cell: () => 'Active',
      exportContent: () => 'Active',
    },
    {
      header: t('Created on'),
      sort: 'metadata.creationTimestamp',
      cell: (roleBinding) => roleBinding.metadata?.creationTimestamp ?? "0000-00-00T00:00:00Z",
      exportContent: (roleBinding) => roleBinding.metadata?.creationTimestamp ?? "0000-00-00T00:00:00Z",
    },
    {
      header: '',
      cell: (roleBinding: ClusterRoleBinding) => {
        return <RoleAssignmentActionDropdown roleBinding={roleBinding} />
      },
      cellTransforms: [fitContent],
      isActionCol: true,
    },
  ]

  return (
    <PageSection>
      {isInitialLoading ? (
        <AcmLoadingPage />
      ) : isUserLoading ? (
        <AcmLoadingPage />
      ) : !user ? (
        <div>{t('User not found')}</div>
      ) : (
        <>
          <AcmTable<ClusterRoleBinding>
            key="user-role-assignments-table"
            columns={columns}
            keyFn={keyFn}
            items={rolesLoading ? [] : userRoleBindings}
            searchPlaceholder={t('Search for role assignments...')}
            filters={filters}
            tableActionButtons={tableActionButtons}
            tableActions={tableActions}
            emptyState={
              rolesLoading ? (
                <AcmLoadingPage />
              ) : (
                <AcmEmptyState
                  key="roleAssignmentsEmptyState"
                  title={t('No role assignment created yet')}
                  message={t('Description text that allows users to easily understand what this is for and how does it help them achieve their needs.')}
                  action={
                    <div>
                      <AcmButton
                        variant="primary"
                        onClick={() => {
                          setShowCreateModal(true)
                        }}
                      >
                        {t('Create role assignment')}
                      </AcmButton>
                      <ViewDocumentationLink doclink={DOC_LINKS.CLUSTERS} />
                    </div>
                  }
                />
              )
            }
          />
          {showCreateModal && (
            <CreateRoleAssignmentModal 
              onSuccess={() => {
                refreshRoleBindings()
                setShowCreateModal(false)
              }}
              onCancel={() => setShowCreateModal(false)}
            />
          )}
        </>
      )}
    </PageSection>
  )
}

export { UserRoleAssignments }
