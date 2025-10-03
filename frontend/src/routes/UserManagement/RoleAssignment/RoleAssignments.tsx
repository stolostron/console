/* Copyright Contributors to the Open Cluster Management project */
import { ButtonVariant, PageSection } from '@patternfly/react-core'
import { fitContent, nowrap } from '@patternfly/react-table'
import { useCallback, useMemo, useState } from 'react'
import { generatePath, Link } from 'react-router-dom-v5-compat'
import { BulkActionModal, BulkActionModalProps } from '../../../components/BulkActionModal'
import { useTranslation } from '../../../lib/acm-i18next'
import { DOC_LINKS, ViewDocumentationLink } from '../../../lib/doc-util'
import { NavigationPath } from '../../../NavigationPath'
import {
  deleteRoleAssignment,
  FlattenedRoleAssignment,
} from '../../../resources/clients/multicluster-role-assignment-client'
import { IRequestResult } from '../../../resources/utils/resource-request'
import {
  AcmButton,
  AcmEmptyState,
  AcmLoadingPage,
  AcmTable,
  compareStrings,
  IAcmTableColumn,
} from '../../../ui-components'
import { IAcmTableAction, IAcmTableButtonAction, ITableFilter } from '../../../ui-components/AcmTable/AcmTableTypes'
import { RoleAssignmentPreselected } from '../RoleAssignments/model/role-assignment-preselected'
import { RoleAssignmentActionDropdown } from './RoleAssignmentActionDropdown'
import { RoleAssignmentLabel } from './RoleAssignmentLabel'
import { RoleAssignmentModal } from '../RoleAssignments/RoleAssignmentModal'
import { RoleAssignmentStatusComponent } from './RoleAssignmentStatusComponent'

// Component for rendering clickable role links
const RoleLinkCell = ({ roleName }: { roleName: string }) => (
  <Link to={generatePath(NavigationPath.roleDetails, { id: roleName })}>{roleName}</Link>
)

// Component for rendering clickable cluster links
const ClusterLinksCell = ({ clusterNames }: { clusterNames: string[] }) => (
  <RoleAssignmentLabel
    elements={clusterNames}
    numLabel={3}
    renderElement={(clusterName) => (
      <Link
        key={clusterName}
        to={generatePath(NavigationPath.clusterOverview, {
          namespace: clusterName,
          name: clusterName,
        })}
      >
        {clusterName}
      </Link>
    )}
  />
)

// Component for rendering namespaces with label group
const NamespacesCell = ({ namespaces }: { namespaces?: string[] }) => (
  <RoleAssignmentLabel elements={namespaces} numLabel={5} />
)

// Component for rendering status
const StatusCell = ({ status }: { status?: any }) => <RoleAssignmentStatusComponent status={status} />

// Component for rendering created date placeholder
const CreatedCell = () => {
  // FlattenedRoleAssignment doesn't have metadata.creationTimestamp
  // Show dash since this data is not available at the flattened level
  return <span>-</span>
}

// Cell renderer functions
const renderRoleCell = (roleAssignment: FlattenedRoleAssignment) => (
  <RoleLinkCell roleName={roleAssignment.clusterRole} />
)

const renderNamespacesCell = (roleAssignment: FlattenedRoleAssignment) => (
  <NamespacesCell namespaces={roleAssignment.targetNamespaces} />
)

const renderStatusCell = (roleAssignment: FlattenedRoleAssignment) => <StatusCell status={roleAssignment.status} />

const renderCreatedCell = () => <CreatedCell />

const renderClustersCell = (roleAssignment: FlattenedRoleAssignment) => {
  const clusterNames = roleAssignment.clusterSelection?.clusterNames || []
  return <ClusterLinksCell clusterNames={clusterNames} />
}

// Component for rendering action dropdown
const ActionCell = ({
  roleAssignment,
  setModalProps,
  deleteAction,
}: {
  roleAssignment: FlattenedRoleAssignment
  setModalProps: React.Dispatch<React.SetStateAction<BulkActionModalProps<FlattenedRoleAssignment> | { open: false }>>
  deleteAction: (roleAssignment: FlattenedRoleAssignment) => IRequestResult<unknown>
}) => (
  <RoleAssignmentActionDropdown
    roleAssignment={roleAssignment}
    setModalProps={setModalProps}
    deleteAction={deleteAction}
  />
)

type RoleAssignmentsProps = {
  roleAssignments: FlattenedRoleAssignment[]
  isLoading?: boolean
  hiddenColumns?: ('subject' | 'role' | 'clusters')[]
  // isCreateButtonHidden?: boolean
  preselected: RoleAssignmentPreselected
}

const RoleAssignments = ({
  roleAssignments,
  isLoading,
  hiddenColumns,
  // isCreateButtonHidden,
  preselected,
}: RoleAssignmentsProps) => {
  const { t } = useTranslation()
  // Key function for the table that generates a unique key for each role assignment
  const keyFn = useCallback((roleAssignment: FlattenedRoleAssignment) => roleAssignment.name, [])

  // Modal state for delete confirmation
  const [deleteModalProps, setDeleteModalProps] = useState<
    BulkActionModalProps<FlattenedRoleAssignment> | { open: false }
  >({
    open: false,
  })

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Table actions for bulk operations
  const tableActions = useMemo<IAcmTableAction<FlattenedRoleAssignment>[]>(
    () => [
      {
        id: 'deleteRoleAssignments',
        title: t('Delete role assignments'),
        click: (roleAssignments) => {
          setDeleteModalProps({
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
            actionFn: deleteRoleAssignment,
            close: () => setDeleteModalProps({ open: false }),
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

  // Filters for FlattenedRoleAssignment
  const filters = useMemo<ITableFilter<FlattenedRoleAssignment>[]>(() => {
    // Get all unique values for filter options
    const allRoles = new Set<string>()
    const allClusters = new Set<string>()
    const allNamespaces = new Set<string>()
    const allStatuses = new Set<string>()

    // Extract all unique values from role assignments
    for (const roleAssignment of roleAssignments) {
      // Add single role
      allRoles.add(roleAssignment.clusterRole)

      if (roleAssignment.status?.status) {
        allStatuses.add(roleAssignment.status.status)
      }

      // Add cluster names and target namespaces
      const clusterNames = roleAssignment.clusterSelection?.clusterNames || []
      for (const clusterName of clusterNames) {
        allClusters.add(clusterName)
      }
      for (const namespace of roleAssignment.targetNamespaces || []) {
        allNamespaces.add(namespace)
      }
    }

    // Convert sets to sorted arrays for options
    const roleOptions = Array.from(allRoles)
      .sort((a, b) => a.localeCompare(b))
      .map((role) => ({ label: role, value: role }))
    const clusterOptions = Array.from(allClusters)
      .sort((a, b) => a.localeCompare(b))
      .map((cluster) => ({ label: cluster, value: cluster }))
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
        tableFilterFn: (selectedValues, roleAssignment) => selectedValues.includes(roleAssignment.clusterRole),
      },
      {
        id: 'clusters',
        label: t('Clusters'),
        options: clusterOptions,
        tableFilterFn: (selectedValues, roleAssignment) => {
          const clusterNames = roleAssignment.clusterSelection?.clusterNames || []
          return selectedValues.some((selectedClusterName) => clusterNames.includes(selectedClusterName))
        },
      },
      {
        id: 'namespace',
        label: t('Namespace'),
        options: namespaceOptions,
        tableFilterFn: (selectedValues, roleAssignment) =>
          selectedValues.some((selectedNamespace) => roleAssignment.targetNamespaces?.includes(selectedNamespace)),
      },
      {
        id: 'status',
        label: t('Status'),
        options: statusOptions,
        tableFilterFn: (selectedValues, roleAssignment) =>
          selectedValues.some((selectedValues) => selectedValues.includes(roleAssignment.status?.status ?? '')),
      },
    ]
  }, [roleAssignments, t])

  // Table action buttons
  const tableActionButtons = useMemo<IAcmTableButtonAction[]>(
    () => [
      {
        id: 'create-role-assignment',
        title: t('Create role assignment'),
        click: () => setIsCreateModalOpen(true),
        variant: ButtonVariant.primary,
      },
    ],
    [t]
  )

  // Action cell renderer (needs access to component state)
  const renderActionCell = (roleAssignment: FlattenedRoleAssignment) => (
    <ActionCell
      roleAssignment={roleAssignment}
      setModalProps={setDeleteModalProps}
      deleteAction={deleteRoleAssignment}
    />
  )

  // Table columns
  const columns: IAcmTableColumn<FlattenedRoleAssignment>[] = [
    {
      header: t('Role'),
      sort: (a, b) => compareStrings(a.clusterRole, b.clusterRole),
      cell: renderRoleCell,
      exportContent: (roleAssignment) => roleAssignment.clusterRole,
      isHidden: hiddenColumns?.includes('role'),
    },
    {
      header: t('Subject'),
      sort: (a, b) => compareStrings(a.subject.name, b.subject.name),
      cell: (roleAssignment) => `${roleAssignment.subject.kind}: ${roleAssignment.subject.name}`,
      exportContent: (roleAssignment) => `${roleAssignment.subject.kind}: ${roleAssignment.subject.name}`,
      isHidden: hiddenColumns?.includes('subject'),
    },
    {
      header: t('Clusters'),
      cell: renderClustersCell,
      exportContent: (roleAssignment) => {
        const clusterNames = roleAssignment.clusterSelection?.clusterNames || []
        return clusterNames.join(', ')
      },
      isHidden: hiddenColumns?.includes('clusters'),
    },
    {
      header: t('Namespaces'),
      cell: renderNamespacesCell,
      exportContent: (roleAssignment) => roleAssignment.targetNamespaces?.join(', ') ?? '',
    },
    {
      header: t('Status'),
      cell: renderStatusCell,
      exportContent: (roleAssignment) => roleAssignment.status?.status ?? '',
    },
    {
      header: t('Created'),
      sort: 'metadata.creationTimestamp',
      cellTransforms: [nowrap],
      // FlattenedRoleAssignment doesn't have metadata.creationTimestamp
      // We could show the parent MulticlusterRoleAssignment creation time instead
      cell: renderCreatedCell,
      exportContent: () => '',
    },
    {
      header: '',
      cell: renderActionCell,
      cellTransforms: [fitContent],
      isActionCol: true,
    },
  ]

  return (
    <PageSection>
      {isLoading ? (
        <AcmLoadingPage />
      ) : (
        <>
          <AcmTable<FlattenedRoleAssignment>
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
                    {/* TODO: add RBAC for RA creation */}
                    {/* {isCreateButtonHidden ? ( */}
                    <AcmButton variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                      {t('Create role assignment')}
                    </AcmButton>
                    {/* ) : null} */}
                    {/* TODO: add correct documentation link */}
                    <ViewDocumentationLink doclink={DOC_LINKS.CLUSTERS} />
                  </div>
                }
              />
            }
          />
          <RoleAssignmentModal
            close={() => setIsCreateModalOpen(false)}
            isOpen={isCreateModalOpen}
            preselected={preselected}
          />
        </>
      )}
      <BulkActionModal<FlattenedRoleAssignment> {...deleteModalProps} />
    </PageSection>
  )
}

export { RoleAssignments }
