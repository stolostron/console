/* Copyright Contributors to the Open Cluster Management project */
import { ButtonVariant } from '@patternfly/react-core'
import { fitContent, nowrap } from '@patternfly/react-table'
import { useCallback, useMemo, useState } from 'react'
import { BulkActionModal, BulkActionModalProps } from '../../../components/BulkActionModal'
import { useTranslation } from '../../../lib/acm-i18next'
import { DOC_LINKS, ViewDocumentationLink } from '../../../lib/doc-util'
import { rbacCreate, rbacDelete, rbacPatch, useIsAnyNamespaceAuthorized } from '../../../lib/rbac-util'
import { FlattenedRoleAssignment } from '../../../resources/clients/model/flattened-role-assignment'
import { deleteRoleAssignment } from '../../../resources/clients/multicluster-role-assignment-client'
import { MulticlusterRoleAssignmentDefinition } from '../../../resources/multicluster-role-assignment'
import { AcmButton, AcmEmptyState, AcmTable, compareStrings, IAcmTableColumn } from '../../../ui-components'
import { IAcmTableAction, IAcmTableButtonAction, ITableFilter } from '../../../ui-components/AcmTable/AcmTableTypes'
import { RoleAssignmentPreselected } from '../RoleAssignments/model/role-assignment-preselected'
import { RoleAssignmentWizardModalWrapper } from '../RoleAssignments/RoleAssignmentWizardModalWrapper'
import {
  renderActionCell,
  renderClustersCell,
  renderClusterSetsCell,
  renderCreatedCell,
  renderNamespacesCell,
  renderRoleCell,
  renderStatusCell,
  renderSubjectNameCell,
} from './RoleAssignmentsHelper'

type RoleAssignmentsProps = {
  roleAssignments: FlattenedRoleAssignment[]
  isLoading?: boolean
  hiddenColumns?: ('subject' | 'role' | 'clusters' | 'clusterSets' | 'name')[]
  hiddenFilters?: ('role' | 'identity' | 'clusters' | 'clusterSets' | 'namespace' | 'status')[]
  preselected: RoleAssignmentPreselected
}

const RoleAssignments = ({
  roleAssignments,
  isLoading,
  hiddenColumns,
  hiddenFilters,
  preselected,
}: RoleAssignmentsProps) => {
  const { t } = useTranslation()
  const unauthorizedMessage = t('rbac.unauthorized')

  const canCreate = useIsAnyNamespaceAuthorized(rbacCreate(MulticlusterRoleAssignmentDefinition))
  const canPatchRoleAssignment = useIsAnyNamespaceAuthorized(rbacPatch(MulticlusterRoleAssignmentDefinition))
  const canDelete = useIsAnyNamespaceAuthorized(rbacDelete(MulticlusterRoleAssignmentDefinition))

  // User needs both create and patch to add role assignments
  const canCreateRoleAssignment = canCreate && canPatchRoleAssignment
  // User needs both delete and patch to remove role assignments
  const canDeleteRoleAssignment = canDelete && canPatchRoleAssignment

  const keyFn = useCallback(
    (roleAssignment: FlattenedRoleAssignment) =>
      `${roleAssignment.relatedMulticlusterRoleAssignment.metadata.name}-${roleAssignment.name}-${roleAssignment.subject.name}-${roleAssignment.clusterRole}`,
    []
  )

  // Modal state for delete confirmation
  const [deleteModalProps, setDeleteModalProps] = useState<
    BulkActionModalProps<FlattenedRoleAssignment> | { open: false }
  >({
    open: false,
  })

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingRoleAssignment, setEditingRoleAssignment] = useState<FlattenedRoleAssignment>()

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
            actionOneByOne: true,
            actionFn: deleteRoleAssignment,
            close: () => setDeleteModalProps({ open: false }),
            isDanger: true,
            icon: 'warning',
            confirmText: t('confirm'),
          })
        },
        variant: 'bulk-action',
        isDisabled: !canDeleteRoleAssignment,
        tooltip: canDeleteRoleAssignment ? '' : unauthorizedMessage,
      },
    ],
    [t, keyFn, canDeleteRoleAssignment, unauthorizedMessage]
  )

  // Filters for FlattenedRoleAssignment
  const filters = useMemo<ITableFilter<FlattenedRoleAssignment>[]>(() => {
    // Get all unique values for filter options
    const allRoles = new Set<string>()
    const allClusterSets = new Set<string>()
    const allClusters = new Set<string>()
    const allNamespaces = new Set<string>()
    const allStatuses = new Set<string>()
    const allUsers = new Set<string>()
    const allGroups = new Set<string>()

    // Extract all unique values from role assignments
    for (const roleAssignment of roleAssignments) {
      // Add single role
      allRoles.add(roleAssignment.clusterRole)

      if (roleAssignment.status?.status) {
        allStatuses.add(roleAssignment.status.status)
      }
      if (roleAssignment.subject?.name) {
        if (roleAssignment.subject.kind === 'User') {
          allUsers.add(roleAssignment.subject.name)
        } else if (roleAssignment.subject.kind === 'Group') {
          allGroups.add(roleAssignment.subject.name)
        }
      }

      // Add cluster names and target namespaces
      for (const clusterSetName of roleAssignment.clusterSetNames) {
        allClusterSets.add(clusterSetName)
      }
      for (const clusterName of roleAssignment.clusterNames) {
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
    const clusterSetOptions = Array.from(allClusterSets)
      .sort((a, b) => a.localeCompare(b))
      .map((cluster) => ({ label: cluster, value: cluster }))
    const clusterOptions = Array.from(allClusters)
      .sort((a, b) => a.localeCompare(b))
      .map((cluster) => ({ label: cluster, value: cluster }))
    const namespaceOptions = Array.from(allNamespaces)
      .sort((a, b) => a.localeCompare(b))
      .map((namespace) => ({ label: namespace, value: namespace }))
    const statusOptions = Array.from(allStatuses)
      .sort((a, b) => a.localeCompare(b))
      .map((status) => ({ label: status, value: status }))
    const userOptions = Array.from(allUsers)
      .sort((a, b) => a.localeCompare(b))
      .map((user) => ({ label: user, value: `User:${user}` }))
    const groupOptions = Array.from(allGroups)
      .sort((a, b) => a.localeCompare(b))
      .map((group) => ({ label: group, value: `Group:${group}` }))

    const identityOptions = [
      ...userOptions.map((opt) => ({ ...opt, group: 'Users' })),
      ...groupOptions.map((opt) => ({ ...opt, group: 'Groups' })),
    ]

    const allFilters: ITableFilter<FlattenedRoleAssignment>[] = [
      {
        id: 'role',
        label: t('Role'),
        options: roleOptions,
        tableFilterFn: (selectedValues, roleAssignment) => selectedValues.includes(roleAssignment.clusterRole),
      },
      {
        id: 'identity',
        label: t('Identity'),
        options: identityOptions,
        tableFilterFn: (selectedValues, roleAssignment) => {
          const identityValue = `${roleAssignment.subject.kind}:${roleAssignment.subject.name}`
          return selectedValues.includes(identityValue)
        },
      },
      {
        id: 'clusterSets',
        label: t('clusterSets'),
        options: clusterSetOptions,
        tableFilterFn: (selectedValues, roleAssignment) =>
          selectedValues.some((selectedClusterSetName) =>
            roleAssignment.clusterSetNames.includes(selectedClusterSetName)
          ),
      },
      {
        id: 'clusters',
        label: t('Clusters'),
        options: clusterOptions,
        tableFilterFn: (selectedValues, roleAssignment) =>
          selectedValues.some((selectedClusterName) => roleAssignment.clusterNames.includes(selectedClusterName)),
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

    return allFilters.filter((filter) => !hiddenFilters?.includes(filter.id as any))
  }, [roleAssignments, t, hiddenFilters])

  // Table action buttons
  const tableActionButtons = useMemo<IAcmTableButtonAction[]>(
    () => [
      {
        id: 'create-role-assignment',
        title: t('Create role assignment'),
        click: () => setIsCreateModalOpen(true),
        variant: ButtonVariant.primary,
        isDisabled: !canCreateRoleAssignment,
        tooltip: canCreateRoleAssignment ? '' : unauthorizedMessage,
      },
    ],
    [t, canCreateRoleAssignment, unauthorizedMessage]
  )

  const handleEdit = useCallback((roleAssignment: FlattenedRoleAssignment) => {
    setEditingRoleAssignment(roleAssignment)
    setIsCreateModalOpen(true)
  }, [])

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
      header: t('Subject Name'),
      sort: (a, b) => compareStrings(a.subject.name, b.subject.name),
      cell: (roleAssignment) => renderSubjectNameCell(roleAssignment.subject.name, roleAssignment.subject.kind),
      exportContent: (roleAssignment) => {
        const name = roleAssignment.subject.name
        return name && name.trim() !== '' ? name : '-'
      },
      isHidden: hiddenColumns?.includes('name'),
    },
    {
      header: t('Type'),
      sort: (a, b) => compareStrings(a.subject.name, b.subject.name),
      cell: (roleAssignment) => {
        const kind = roleAssignment.subject.kind
        switch (kind.toLowerCase()) {
          case 'group':
            return 'Group'
          case 'user':
            return 'User'
          case 'serviceaccount':
            return 'ServiceAccount'
          default:
            return kind
        }
      },
      exportContent: (roleAssignment) => `${roleAssignment.subject.kind}: ${roleAssignment.subject.name}`,
      isHidden: hiddenColumns?.includes('subject'),
    },
    {
      header: t('Cluster sets'),
      cell: renderClusterSetsCell,
      exportContent: (roleAssignment) => roleAssignment.clusterSetNames.join(', '),
      isHidden: hiddenColumns?.includes('clusterSets'),
    },
    {
      header: t('Clusters'),
      cell: renderClustersCell,
      exportContent: (roleAssignment) => roleAssignment.clusterNames.join(', '),
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
      cellTransforms: [nowrap],
      sort: 'status.createdAt',
      cell: renderCreatedCell,
      exportContent: (roleAssignment) => roleAssignment.status?.createdAt ?? '',
    },
    {
      header: '',
      cell: (roleAssignment: FlattenedRoleAssignment) =>
        renderActionCell({
          roleAssignment,
          setModalProps: setDeleteModalProps,
          deleteAction: deleteRoleAssignment,
          canDelete: canDeleteRoleAssignment,
          canPatch: canPatchRoleAssignment,
          onEdit: handleEdit,
        }),
      cellTransforms: [fitContent],
      isActionCol: true,
    },
  ]

  return (
    <>
      <AcmTable<FlattenedRoleAssignment>
        key="role-assignments-table"
        columns={columns}
        keyFn={keyFn}
        items={isLoading ? undefined : roleAssignments}
        searchPlaceholder={t('Search for role assignments...')}
        filters={filters}
        tableActionButtons={tableActionButtons}
        tableActions={tableActions}
        initialSort={{
          index: 0, // default to sorting by violation count
          direction: 'asc',
        }}
        resultView={{
          page: 1,
          loading: isLoading ?? false,
          refresh: () => {},
          items: [],
          emptyResult: false,
          processedItemCount: 0,
          isPreProcessed: false,
        }}
        emptyState={
          <AcmEmptyState
            key="roleAssignmentsEmptyState"
            title={t('No role assignment created yet')}
            message={t(
              'No role assignments have been created for this entity yet. Create a role assignment to grant specific permissions.'
            )}
            action={
              <div>
                <AcmButton
                  variant="primary"
                  onClick={() => setIsCreateModalOpen(true)}
                  isDisabled={!canCreateRoleAssignment}
                  tooltip={canCreateRoleAssignment ? '' : unauthorizedMessage}
                >
                  {t('Create role assignment')}
                </AcmButton>
                {/* ) : null} */}
                <ViewDocumentationLink doclink={DOC_LINKS.RBAC} />
              </div>
            }
          />
        }
      />
      <RoleAssignmentWizardModalWrapper
        close={() => {
          setIsCreateModalOpen(false)
          setEditingRoleAssignment(undefined)
        }}
        isOpen={isCreateModalOpen}
        editingRoleAssignment={editingRoleAssignment}
        preselected={
          editingRoleAssignment
            ? {
                clusterSetNames: editingRoleAssignment.clusterSetNames,
                clusterNames: editingRoleAssignment.clusterNames,
                roles: [editingRoleAssignment.clusterRole],
                subject: {
                  kind: editingRoleAssignment.subject.kind,
                  value: editingRoleAssignment.subject.name,
                },
                namespaces: editingRoleAssignment.targetNamespaces,
                context: preselected?.context,
              }
            : preselected
        }
      />
      <BulkActionModal<FlattenedRoleAssignment> {...deleteModalProps} />
    </>
  )
}

export { RoleAssignments }
