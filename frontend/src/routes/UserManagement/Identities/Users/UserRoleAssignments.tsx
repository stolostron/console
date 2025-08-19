/* Copyright Contributors to the Open Cluster Management project */
import { PageSection, LabelGroup, Label } from '@patternfly/react-core'
import { useParams } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
// import { useQuery } from '../../../../lib/useQuery'
// import { listUsers } from '../../../../resources/rbac'
import { useMemo, useState, useCallback, useContext } from 'react'
import { RoleAssignment } from '../../../../resources/role-assignment'
import roleAssignmentsMockDataJson from '../../../../resources/clients/mock-data/role-assignments.json'
import {
  AcmTable,
  compareStrings,
  IAcmTableColumn,
  AcmEmptyState,
  AcmLoadingPage,
  AcmButton,
  AcmToastContext,
} from '../../../../ui-components'
import { fitContent, nowrap } from '@patternfly/react-table'
import { ITableFilter, IAcmTableButtonAction, IAcmTableAction } from '../../../../ui-components/AcmTable/AcmTableTypes'
import { ButtonVariant } from '@patternfly/react-core'
import { Dropdown, DropdownItem } from '@patternfly/react-core/deprecated'
import { KebabToggle } from '@patternfly/react-core/deprecated'
import { DOC_LINKS, ViewDocumentationLink } from '../../../../lib/doc-util'
import AcmTimestamp from '../../../../lib/AcmTimestamp'
import { getISOStringTimestamp } from '../../../../resources/utils'
import { BulkActionModal, BulkActionModalProps } from '../../../../components/BulkActionModal'

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
        <DropdownItem
          key="edit-assignment"
          onClick={() => {
            // TODO: Edit role assignment
            console.log('Edit role assignment:', props.roleAssignment.metadata?.name)
          }}
        >
          {t('Edit role assignment')}
        </DropdownItem>,
      ]}
    />
  )
}

const UserRoleAssignments = () => {
  const { t } = useTranslation()
  const { id = undefined } = useParams()
  const toastContext = useContext(AcmToastContext)
  // Mock users data to match the role assignments
  const mockUsers = [
    { metadata: { name: 'alice.trask', uid: 'mock-user-alice-trask' } },
    { metadata: { name: 'bob.levy', uid: 'mock-user-bob-levy' } },
    { metadata: { name: 'charlie.cranston', uid: 'mock-user-charlie-cranston' } },
    { metadata: { name: 'sarah.jones', uid: 'mock-user-sarah-jones' } },
    { metadata: { name: 'david.brown', uid: 'mock-user-david-brown' } },
  ]

  // Use mock data only
  const users = mockUsers
  const usersLoading = false

  // Use role assignments mock data
  const roleAssignments = roleAssignmentsMockDataJson as RoleAssignment[]
  const rolesLoading = false

  // Find user by uid
  const user = users?.find((user) => user.metadata.uid === id)

  // Filter role assignments for the current user
  const userRoleAssignments = useMemo(() => {
    if (!user || !roleAssignments) return []

    return roleAssignments
      .filter((roleAssignment) =>
        roleAssignment.spec.subjects.some((subject) => subject.kind === 'User' && subject.name === user.metadata.name)
      )
      .sort((a, b) => compareStrings(a.metadata?.name ?? '', b.metadata?.name ?? ''))
  }, [user, roleAssignments])

  // Key function for the table that generates a unique key for each role assignment
  const keyFn = useCallback((roleAssignment: RoleAssignment) => roleAssignment.metadata?.uid ?? '', [])

  // Modal state for delete confirmation
  const [modalProps, setModalProps] = useState<BulkActionModalProps<RoleAssignment> | { open: false }>({
    open: false,
  })

  // Table actions for bulk operations
  const tableActions = useMemo<IAcmTableAction<RoleAssignment>[]>(
    () => [
      {
        id: 'deleteRoleAssignments',
        title: t('Delete role assignments'),
        click: (roleAssignments) => {
          setModalProps({
            open: true,
            title: t('Delete role assignments?'),
            action: t('Delete'),
            processing: t('Deleting'),
            items: roleAssignments,
            emptyState: undefined,
            description: t('Are you sure that you want to delete the role assignments? This action cannot be undone.'),
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
              // TODO: Implement actual bulk delete API call from role-assignment-client.ts file
              console.log('Bulk deleting role assignment:', roleAssignment.metadata?.name)
              toastContext.addAlert({
                title: t('Role assignment deleted'),
                type: 'success',
                autoClose: true,
              })
              return { promise: Promise.resolve(), abort: () => {} }
            },
            close: () => setModalProps({ open: false }),
            isDanger: true,
            icon: 'warning',
            confirmText: 'delete',
          })
        },
        variant: 'bulk-action',
      },
      {
        id: 'editRoleAssignments',
        title: t('Edit role assignments'),
        click: (roleAssignments) => {
          // TODO: Implement bulk edit role assignments
          console.log(
            'Bulk edit role assignments:',
            roleAssignments.map((ra) => ra.metadata?.name)
          )
        },
        variant: 'bulk-action',
      },
    ],
    [t, setModalProps, toastContext]
  )

  // Filters for RoleAssignment
  const filters = useMemo<ITableFilter<RoleAssignment>[]>(() => {
    // Get all unique values for filter options
    const allRoles = new Set<string>()
    const allClusters = new Set<string>()
    const allNamespaces = new Set<string>()
    const allStatuses = new Set<string>()

    // Extract all unique values from role assignments
    userRoleAssignments.forEach((ra) => {
      // Add roles
      ra.spec.roles.forEach((role) => allRoles.add(role))

      // Add status (mock as Active for all)
      allStatuses.add('Active')

      // Add clusters and namespaces directly from role assignment spec
      ra.spec.clusters.forEach((cluster) => {
        allClusters.add(cluster.name)
        cluster.namespaces.forEach((namespace) => {
          allNamespaces.add(namespace)
        })
      })
    })

    // Convert sets to sorted arrays for options
    const roleOptions = Array.from(allRoles)
      .sort()
      .map((role) => ({ label: role, value: role }))
    const clusterOptions = Array.from(allClusters)
      .sort()
      .map((cluster) => ({ label: cluster, value: cluster }))
    const namespaceOptions = Array.from(allNamespaces)
      .sort()
      .map((namespace) => ({ label: namespace, value: namespace }))
    const statusOptions = Array.from(allStatuses)
      .sort()
      .map((status) => ({ label: status, value: status }))

    return [
      {
        id: 'role',
        label: t('Role'),
        options: roleOptions,
        tableFilterFn: (selectedValues, roleAssignment) => {
          return selectedValues.some((role) => roleAssignment.spec.roles.includes(role))
        },
      },
      {
        id: 'cluster',
        label: t('Cluster'),
        options: clusterOptions,
        tableFilterFn: (selectedValues, roleAssignment) => {
          const roleAssignmentClusters = roleAssignment.spec.clusters.map((cluster) => cluster.name)
          return selectedValues.some((selectedCluster) => roleAssignmentClusters.includes(selectedCluster))
        },
      },
      {
        id: 'namespace',
        label: t('Namespace'),
        options: namespaceOptions,
        tableFilterFn: (selectedValues, roleAssignment) => {
          const roleAssignmentNamespaces = roleAssignment.spec.clusters.flatMap((cluster) => cluster.namespaces)
          return selectedValues.some((selectedNamespace) => roleAssignmentNamespaces.includes(selectedNamespace))
        },
      },
      {
        id: 'status',
        label: t('Status'),
        options: statusOptions,
        tableFilterFn: (selectedValues) => {
          const roleAssignmentStatus = 'Active' // Mock status as Active for all
          return selectedValues.includes(roleAssignmentStatus)
        },
      },
    ]
  }, [userRoleAssignments, t])

  // Table action buttons
  const tableActionButtons = useMemo<IAcmTableButtonAction[]>(
    () => [
      {
        id: 'create-role-assignment',
        title: t('Create role assignment'),
        click: () => {},
        variant: ButtonVariant.primary,
      },
    ],
    [t]
  )

  // Show loading spinner only when both are loading, otherwise show partial data
  const isInitialLoading = usersLoading && rolesLoading

  const isUserLoading = usersLoading && !user

  // Table columns
  const columns: IAcmTableColumn<RoleAssignment>[] = [
    {
      header: t('Roles'),
      sort: (a, b) => compareStrings(a.spec.roles.join(', '), b.spec.roles.join(', ')),
      cell: (roleAssignment) => roleAssignment.spec.roles.join(', '),
      exportContent: (roleAssignment) => roleAssignment.spec.roles.join(', '),
    },
    {
      header: t('Cluster'),
      cell: (roleAssignment) => {
        const clusterNames = roleAssignment.spec.clusters.map((cluster) => cluster.name)
        return (
          <LabelGroup
            collapsedText={t('show.more', { count: clusterNames.length - 3 })}
            expandedText={t('Show less')}
            numLabels={3}
          >
            {clusterNames.map((cluster) => (
              <Label key={cluster} style={{ fontSize: '14px' }}>
                {cluster}
              </Label>
            ))}
          </LabelGroup>
        )
      },
      exportContent: (roleAssignment) => {
        const clusterNames = roleAssignment.spec.clusters.map((cluster) => cluster.name)
        return clusterNames.join(', ')
      },
    },
    {
      header: t('Namespace'),
      cell: (roleAssignment) => {
        const namespaces = roleAssignment.spec.clusters.flatMap((cluster) => cluster.namespaces)
        const uniqueNamespaces = Array.from(new Set(namespaces))
        return (
          <LabelGroup
            collapsedText={t('show.more', { count: uniqueNamespaces.length - 5 })}
            expandedText={t('Show less')}
            numLabels={5}
          >
            {uniqueNamespaces.map((namespace) => (
              <Label key={namespace} style={{ fontSize: '14px' }}>
                {namespace}
              </Label>
            ))}
          </LabelGroup>
        )
      },
      exportContent: (roleAssignment) => {
        const namespaces = roleAssignment.spec.clusters.flatMap((cluster) => cluster.namespaces)
        const uniqueNamespaces = Array.from(new Set(namespaces))
        return uniqueNamespaces.join(', ')
      },
    },
    {
      header: t('Status'),
      cell: () => t('Active'),
      exportContent: () => 'Active',
    },
    {
      header: t('Created'),
      sort: 'metadata.creationTimestamp',
      cellTransforms: [nowrap],
      cell: (roleAssignment) => {
        return <AcmTimestamp timestamp={roleAssignment.metadata?.creationTimestamp ?? ''} />
      },
      exportContent: (roleAssignment) => {
        if (roleAssignment.metadata?.creationTimestamp) {
          return getISOStringTimestamp(roleAssignment.metadata.creationTimestamp)
        }
      },
    },
    {
      header: '',
      cell: (roleAssignment: RoleAssignment) => {
        return (
          <RoleAssignmentActionDropdown
            roleAssignment={roleAssignment}
            setModalProps={setModalProps}
            toastContext={toastContext}
          />
        )
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
        <AcmTable<RoleAssignment>
          key="user-role-assignments-table"
          columns={columns}
          keyFn={keyFn}
          items={rolesLoading ? [] : userRoleAssignments}
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
                message={t(
                  'No role assignments have been created for this user yet. Create a role assignment to grant specific permissions.'
                )}
                action={
                  <div>
                    <AcmButton variant="primary" onClick={() => {}}>
                      {t('Create role assignment')}
                    </AcmButton>
                    {/* TODO: add correct documentation link */}
                    <ViewDocumentationLink doclink={DOC_LINKS.CLUSTERS} />
                  </div>
                }
              />
            )
          }
        />
      )}
      <BulkActionModal<RoleAssignment> {...modalProps} />
    </PageSection>
  )
}

export { UserRoleAssignments }
