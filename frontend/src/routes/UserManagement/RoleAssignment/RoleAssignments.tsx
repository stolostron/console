/* Copyright Contributors to the Open Cluster Management project */
import { ButtonVariant, Label, LabelGroup, PageSection } from '@patternfly/react-core'
import { fitContent, nowrap } from '@patternfly/react-table'
import { useCallback, useMemo, useState } from 'react'
import { BulkActionModal, BulkActionModalProps } from '../../../components/BulkActionModal'
import { useTranslation } from '../../../lib/acm-i18next'
import { DOC_LINKS, ViewDocumentationLink } from '../../../lib/doc-util'
import { deleteRoleAssignment, RoleAssignmentUI } from '../../../resources/clients/multicluster-role-assignment-client'
import { Group, ServiceAccount, User } from '../../../resources/rbac'
import {
  AcmButton,
  AcmEmptyState,
  AcmLoadingPage,
  AcmTable,
  compareStrings,
  IAcmTableColumn
} from '../../../ui-components'
import { IAcmTableAction, IAcmTableButtonAction, ITableFilter } from '../../../ui-components/AcmTable/AcmTableTypes'
import { IdentityStatus } from '../../../ui-components/IdentityStatus/IdentityStatus'
import { RoleAssignmentActionDropdown } from './RoleAssignmentActionDropdown'

type RoleAssignmentsProps = {
  roleAssignments: RoleAssignmentUI[]
  isLoading?: boolean
  hiddenColumns?: ('subject' | 'role' | 'clusters' | 'clusterSets')[]
}

const RoleAssignments = ({ roleAssignments, isLoading, hiddenColumns }: RoleAssignmentsProps) => {
  const { t } = useTranslation()
  // Key function for the table that generates a unique key for each role assignment
  const keyFn = useCallback(
    (roleAssignment: RoleAssignmentUI) =>
      `${roleAssignment.clusterRole}${roleAssignment.clusterSets.join('')}${roleAssignment.targetNamespaces?.join('')}`,
    []
  )

  // Modal state for delete confirmation
  const [modalProps, setModalProps] = useState<BulkActionModalProps<RoleAssignmentUI> | { open: false }>({
    open: false,
  })

  // Table actions for bulk operations
  const tableActions = useMemo<IAcmTableAction<RoleAssignmentUI>[]>(
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
        variant: 'bulk-action',
      },
    ],
    [t, keyFn]
  )

  // Filters for RoleAssignmentUI
  const filters = useMemo<ITableFilter<RoleAssignmentUI>[]>(() => {
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
      ra.targetNamespaces?.forEach((namespace) => {
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
          return selectedValues.some((selectedNamespace) =>
            roleAssignment.targetNamespaces?.includes(selectedNamespace)
          )
        },
      },
      {
        id: 'status',
        label: t('Status'),
        options: statusOptions,
        tableFilterFn: (selectedValues) => {
          const roleAssignmentStatus = 'Active' // TODO: for now mock status as Active for all
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
  const columns: IAcmTableColumn<RoleAssignmentUI>[] = [
    {
      header: t('Role'),
      sort: (a, b) => compareStrings(a.clusterRole, b.clusterRole),
      cell: (roleAssignment) => roleAssignment.clusterRole,
      exportContent: (roleAssignment) => roleAssignment.clusterRole,
      isHidden: hiddenColumns?.includes('role'),
    },
    {
      header: t('Subject'),
      sort: (a, b) => compareStrings(a.name, b.name),
      cell: (roleAssignment) => `${roleAssignment.kind}: ${roleAssignment.name}`,
      exportContent: (roleAssignment) => `${roleAssignment.kind}: ${roleAssignment.name}`,
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
      isHidden: hiddenColumns?.includes('clusterSets'),
    },
    {
      header: t('Clusters'),
      cell: (roleAssignment) => {
        return (
          <LabelGroup
            collapsedText={t('show.more', { count: roleAssignment.clusters?.length ?? 0 - 3 })}
            expandedText={t('Show less')}
            numLabels={3}
          >
            {roleAssignment.clusters?.map((cluster) => (
              <Label key={cluster} style={{ fontSize: '14px' }}>
                {cluster}
              </Label>
            ))}
          </LabelGroup>
        )
      },
      exportContent: (roleAssignment) => roleAssignment.clusters?.join(', ') ?? '',
      isHidden: hiddenColumns?.includes('clusters'),
    },
    {
      header: t('Namespaces'),
      cell: (roleAssignment) => {
        return (
          <LabelGroup
            collapsedText={t('show.more', { count: roleAssignment.targetNamespaces?.length ?? 0 - 5 })}
            expandedText={t('Show less')}
            numLabels={5}
          >
            {roleAssignment.targetNamespaces?.map((namespace) => (
              <Label key={namespace} style={{ fontSize: '14px' }}>
                {namespace}
              </Label>
            ))}
          </LabelGroup>
        )
      },
      exportContent: (roleAssignment) => roleAssignment.targetNamespaces?.join(', ') ?? '',
    },
    {
      header: t('Status'),
      cell: (roleAssignment) => (
        <IdentityStatus identity={{ kind: roleAssignment.kind } as User | Group | ServiceAccount} />
      ),
      exportContent: () => 'Active', // TODO: for now mock status as Active for all, replace it by real status as soon as it is ready
    },
    {
      header: t('Created'),
      sort: 'metadata.creationTimestamp',
      cellTransforms: [nowrap],
      cell: () => {
        // RoleAssignmentUI doesn't have metadata.creationTimestamp
        // We could show the parent MulticlusterRoleAssignment creation time instead
        return <span>-</span>
      },
      exportContent: () => '',
    },
    {
      header: '',
      cell: (roleAssignment: RoleAssignmentUI) => (
        <RoleAssignmentActionDropdown roleAssignment={roleAssignment} setModalProps={setModalProps} />
      ),
      cellTransforms: [fitContent],
      isActionCol: true,
    },
  ]

  return (
    <PageSection>
      {isLoading ? (
        <AcmLoadingPage />
      ) : (
        <AcmTable<RoleAssignmentUI>
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
      <BulkActionModal<RoleAssignmentUI> {...modalProps} />
    </PageSection>
  )
}

export { RoleAssignments }
