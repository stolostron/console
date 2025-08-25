/* Copyright Contributors to the Open Cluster Management project */
import { ButtonVariant, Label, LabelGroup, PageSection } from '@patternfly/react-core'
import { fitContent, nowrap } from '@patternfly/react-table'
import { useCallback, useContext, useMemo, useState } from 'react'
import { BulkActionModal, BulkActionModalProps } from '../../../components/BulkActionModal'
import { useTranslation } from '../../../lib/acm-i18next'
import { DOC_LINKS, ViewDocumentationLink } from '../../../lib/doc-util'
import { MulticlusterRoleAssignment } from '../../../resources/multicluster-role-assignment'
import { User, Group, ServiceAccount } from '../../../resources/rbac'
import {
  filterAndTrackRoleAssignments,
  TrackedRoleAssignment,
  MulticlusterRoleAssignmentQuery,
} from '../../../resources/clients/multicluster-role-assignment-client'
import {
  AcmButton,
  AcmEmptyState,
  AcmLoadingPage,
  AcmTable,
  AcmToastContext,
  compareStrings,
  IAcmTableColumn,
} from '../../../ui-components'
import { IdentityStatus } from '../../../ui-components/IdentityStatus/IdentityStatus'
import { IAcmTableAction, IAcmTableButtonAction, ITableFilter } from '../../../ui-components/AcmTable/AcmTableTypes'
import { RoleAssignmentActionDropdown } from './RoleAssignmentActionDropdown'
type RoleAssignmentsProps = {
  multiclusterRoleAssignments: MulticlusterRoleAssignment[]
  isLoading?: boolean
  hiddenColumns?: ('subject' | 'role' | 'cluster')[]
  query?: MulticlusterRoleAssignmentQuery
}

const RoleAssignments = ({
  multiclusterRoleAssignments,
  isLoading,
  hiddenColumns,
  query = {},
}: RoleAssignmentsProps) => {
  const { t } = useTranslation()
  const toastContext = useContext(AcmToastContext)

  // Flatten MulticlusterRoleAssignments to TrackedRoleAssignments for the table
  const roleAssignments = useMemo(
    () => filterAndTrackRoleAssignments(multiclusterRoleAssignments, query),
    [multiclusterRoleAssignments, query]
  )

  // Key function for the table that generates a unique key for each role assignment
  const keyFn = useCallback(
    (roleAssignment: TrackedRoleAssignment) =>
      roleAssignment.multiclusterRoleAssignmentUid + '-' + roleAssignment.roleAssignmentIndex,
    []
  )

  // Modal state for delete confirmation
  const [modalProps, setModalProps] = useState<BulkActionModalProps<TrackedRoleAssignment> | { open: false }>({
    open: false,
  })

  // Table actions for bulk operations
  const tableActions = useMemo<IAcmTableAction<TrackedRoleAssignment>[]>(
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
              // TODO: Implement actual bulk delete API call from multicluster-role-assignment-client.ts file
              console.log(
                'Bulk deleting role assignment:',
                `${roleAssignment.subjectName}-${roleAssignment.clusterRole}`
              )
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
    ],
    [t, setModalProps, toastContext]
  )

  // Filters for TrackedRoleAssignment
  const filters = useMemo<ITableFilter<TrackedRoleAssignment>[]>(() => {
    // Get all unique values for filter options
    const allRoles = new Set<string>()
    const allClusterSets = new Set<string>()
    const allNamespaces = new Set<string>()
    const allStatuses = new Set<string>()

    // Extract all unique values from role assignments
    roleAssignments.forEach((ra) => {
      // Add single role
      allRoles.add(ra.clusterRole)

      // TODO: change to correspondent status once is available on the schema
      // Add status (mock as Active for all)
      allStatuses.add('Active')

      // Add cluster sets and target namespaces
      ra.clusterSets.forEach((clusterSet) => {
        allClusterSets.add(clusterSet)
      })
      ra.targetNamespaces.forEach((namespace) => {
        allNamespaces.add(namespace)
      })
    })

    // Convert sets to sorted arrays for options
    const roleOptions = Array.from(allRoles)
      .sort((a, b) => a.localeCompare(b))
      .map((role) => ({ label: role, value: role }))
    const clusterSetOptions = Array.from(allClusterSets)
      .sort((a, b) => a.localeCompare(b))
      .map((clusterSet) => ({ label: clusterSet, value: clusterSet }))
    const namespaceOptions = Array.from(allNamespaces)
      .sort((a, b) => a.localeCompare(b))
      .map((namespace) => ({ label: namespace, value: namespace }))
    const statusOptions = Array.from(allStatuses)
      .sort((a, b) => a.localeCompare(b))
      .map((status) => ({ label: status, value: status }))

    return [
      {
        id: 'role',
        label: t('Role'),
        options: roleOptions,
        tableFilterFn: (selectedValues, roleAssignment) => {
          return selectedValues.includes(roleAssignment.clusterRole)
        },
      },
      {
        id: 'clusterSet',
        label: t('Cluster Set'),
        options: clusterSetOptions,
        tableFilterFn: (selectedValues, roleAssignment) => {
          return selectedValues.some((selectedClusterSet) => roleAssignment.clusterSets.includes(selectedClusterSet))
        },
      },
      {
        id: 'namespace',
        label: t('Namespace'),
        options: namespaceOptions,
        tableFilterFn: (selectedValues, roleAssignment) => {
          return selectedValues.some((selectedNamespace) => roleAssignment.targetNamespaces.includes(selectedNamespace))
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
  }, [roleAssignments, t])

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

  // Table columns
  const columns: IAcmTableColumn<TrackedRoleAssignment>[] = [
    {
      header: t('Role'),
      sort: (a, b) => compareStrings(a.clusterRole, b.clusterRole),
      cell: (roleAssignment) => roleAssignment.clusterRole,
      exportContent: (roleAssignment) => roleAssignment.clusterRole,
      isHidden: hiddenColumns?.includes('role'),
    },
    {
      header: t('Subject'),
      sort: (a, b) => compareStrings(a.subjectName, b.subjectName),
      cell: (roleAssignment) => `${roleAssignment.subjectKind}: ${roleAssignment.subjectName}`,
      exportContent: (roleAssignment) => `${roleAssignment.subjectKind}: ${roleAssignment.subjectName}`,
      isHidden: hiddenColumns?.includes('subject'),
    },
    {
      header: t('Cluster Sets'),
      cell: (roleAssignment) => {
        return (
          <LabelGroup
            collapsedText={t('show.more', { count: roleAssignment.clusterSets.length - 3 })}
            expandedText={t('Show less')}
            numLabels={3}
          >
            {roleAssignment.clusterSets.map((clusterSet) => (
              <Label key={clusterSet} style={{ fontSize: '14px' }}>
                {clusterSet}
              </Label>
            ))}
          </LabelGroup>
        )
      },
      exportContent: (roleAssignment) => roleAssignment.clusterSets.join(', '),
      isHidden: hiddenColumns?.includes('cluster'),
    },
    {
      header: t('Namespaces'),
      cell: (roleAssignment) => {
        return (
          <LabelGroup
            collapsedText={t('show.more', { count: roleAssignment.targetNamespaces.length - 5 })}
            expandedText={t('Show less')}
            numLabels={5}
          >
            {roleAssignment.targetNamespaces.map((namespace) => (
              <Label key={namespace} style={{ fontSize: '14px' }}>
                {namespace}
              </Label>
            ))}
          </LabelGroup>
        )
      },
      exportContent: (roleAssignment) => roleAssignment.targetNamespaces.join(', '),
    },
    {
      header: t('Status'),
      cell: (roleAssignment) => (
        <IdentityStatus identity={{ kind: roleAssignment.subjectKind } as User | Group | ServiceAccount} />
      ),
      exportContent: () => 'Active',
    },
    {
      header: t('Created'),
      sort: 'metadata.creationTimestamp',
      cellTransforms: [nowrap],
      cell: () => {
        // TrackedRoleAssignment doesn't have metadata.creationTimestamp
        // We could show the parent MulticlusterRoleAssignment creation time instead
        return <span>-</span>
      },
      exportContent: () => '',
    },
    {
      header: '',
      cell: (roleAssignment: TrackedRoleAssignment) => {
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
      {isLoading ? (
        <AcmLoadingPage />
      ) : (
        <AcmTable<TrackedRoleAssignment>
          key="role-assignments-table"
          columns={columns}
          keyFn={keyFn}
          items={roleAssignments}
          searchPlaceholder={t('Search for role assignments...')}
          filters={filters}
          tableActionButtons={tableActionButtons}
          tableActions={tableActions}
          emptyState={
            <AcmEmptyState
              key="roleAssignmentsEmptyState"
              title={t('No role assignment created yet')}
              message={t(
                'No role assignments have been created for this entity yet. Create a role assignment to grant specific permissions.'
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
          }
        />
      )}
      <BulkActionModal<TrackedRoleAssignment> {...modalProps} />
    </PageSection>
  )
}

export { RoleAssignments }
