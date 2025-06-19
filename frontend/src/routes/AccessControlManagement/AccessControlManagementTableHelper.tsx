/* Copyright Contributors to the Open Cluster Management project */
import { fitContent } from '@patternfly/react-table'
import jsYaml from 'js-yaml'
import { Dispatch, SetStateAction, useMemo } from 'react'
import { TFunction } from 'react-i18next'
import { generatePath, Link, NavigateFunction } from 'react-router-dom-v5-compat'
import { BulkActionModalProps } from '../../components/BulkActionModal'
import { RbacDropdown } from '../../components/Rbac'
import AcmTimestamp from '../../lib/AcmTimestamp'
import { rbacDelete, rbacGet, rbacPatch } from '../../lib/rbac-util'
import { NavigationPath } from '../../NavigationPath'
import { AccessControl } from '../../resources/access-control'
import { Cluster, createDownloadFile, deleteResource, getISOStringTimestamp } from '../../resources/utils'
import { AcmLabels, compareStrings } from '../../ui-components'
import { AccessControlStatus } from './AccessControlStatus'

const LABELS_LENGTH = 5
const EXPORT_FILE_PREFIX = 'access-control-management'

type AccessControlManagementTableHelperProps = {
  t: TFunction
  setModalProps: Dispatch<SetStateAction<BulkActionModalProps<AccessControl> | { open: false }>>
  navigate: NavigateFunction
}

const accessControlRoleBindingsFilter = (accessControl: AccessControl, kind: 'User' | 'Role' | 'Group') =>
  accessControl.spec.roleBindings
    ?.filter((e) => e.subject?.kind === kind && e.subject?.name)
    .map((e) => e.subject?.name) ?? []

const ACTIONS = {
  EDIT: ({
    accessControl,
    navigate,
  }: { accessControl: AccessControl } & Pick<AccessControlManagementTableHelperProps, 'navigate'>) => {
    navigate(
      generatePath(NavigationPath.editAccessControlManagement, {
        id: accessControl.metadata?.uid!,
      })
    )
  },
  DELETE: ({
    accessControls,
    t,
    setModalProps,
  }: { accessControls: AccessControl[] } & Pick<AccessControlManagementTableHelperProps, 't' | 'setModalProps'>) => {
    setModalProps({
      open: true,
      title: t('Permanently delete permissions?'),
      action: t('Delete'),
      processing: t('Deleting'),
      items: [...accessControls],
      emptyState: undefined, // table action is only enabled when items are selected
      description: t(
        'You cannot create new clusters from deleted permissions. Clusters that you previously created will not be affected.'
      ),
      columns: [
        {
          header: t('Name'),
          sort: 'metadata.name',
          search: 'metadata.name',
          cell: COLUMN_CELLS.NAME,
          exportContent: (accessControl: AccessControl) => accessControl.metadata?.uid!,
        },
        {
          header: t('Status'),
          sort: 'accessControl.status?.conditions[0].status',
          cell: (accessControl: AccessControl) => COLUMN_CELLS.STATUS(accessControl),
        },
        {
          header: t('Cluster'),
          sort: 'metadata.namespace',
          search: 'metadata.namespace',
          cell: (accessControl: AccessControl) => accessControl.metadata?.namespace,
        },
        {
          header: t('Created'),
          sort: 'metadata.creationTimestamp',
          cell: COLUMN_CELLS.CREATION_DATE,
        },
      ],
      keyFn: (accessControl: AccessControl) => accessControl.metadata?.uid!,
      actionFn: deleteResource,
      close: () => setModalProps({ open: false }),
      isDanger: true,
    })
  },
  EXPORT_YAML: (accessControl: AccessControl, exportFilePrefix: string) => {
    const yamlContent = jsYaml.dump(accessControl)
    const fileName = `${exportFilePrefix}-${accessControl.metadata?.uid}-${Date.now()}.yaml`
    createDownloadFile(fileName, yamlContent, 'application/yaml')
  },
}

const COLUMN_CELLS = {
  NAME: (accessControl: AccessControl) => (
    <span style={{ whiteSpace: 'nowrap' }}>
      <Link
        to={generatePath(NavigationPath.viewAccessControlManagement, {
          id: accessControl.metadata?.uid!,
        })}
      >
        {accessControl.metadata?.name}
      </Link>
    </span>
  ),
  CLUSTER: (accessControl: AccessControl) => (
    <span style={{ whiteSpace: 'nowrap' }}>
      {accessControl.metadata?.namespace ? (
        <Link
          to={generatePath(NavigationPath.clusterDetails, {
            name: accessControl.metadata?.namespace,
            namespace: accessControl.metadata?.namespace,
          })}
        >
          {accessControl.metadata?.namespace}
        </Link>
      ) : (
        '-'
      )}
    </span>
  ),
  USER_GROUP: (accessControl: AccessControl, t: TFunction) => {
    const roleBindingsSubjectNames =
      accessControl.spec.roleBindings?.flatMap((rb) =>
        rb.subject ? [`${rb.subject.kind}: ${rb.subject.name}`] : rb.subjects?.map((s) => `${s.kind}: ${s.name}`) ?? []
      ) ?? []

    const clusterRoleBindingSubjectNames =
      accessControl.spec.clusterRoleBinding?.subjects?.map((s) => `${s.kind}: ${s.name}`) ??
      (accessControl.spec.clusterRoleBinding?.subject
        ? [
            `${accessControl.spec.clusterRoleBinding.subject.kind}: ${accessControl.spec.clusterRoleBinding.subject.name}`,
          ]
        : [])

    const users_groups = [...roleBindingsSubjectNames, ...clusterRoleBindingSubjectNames]

    const uniqueUsersGroups = Array.from(new Set(users_groups))
    return users_groups ? (
      <AcmLabels
        labels={uniqueUsersGroups}
        expandedText={t('Show less')}
        collapsedText={t('show.more', { count: users_groups.length })}
        allCollapsedText={t('count.items', { count: users_groups.length })}
        isCompact={uniqueUsersGroups.length > LABELS_LENGTH}
      />
    ) : (
      <span style={{ whiteSpace: 'nowrap' }}>'-'</span>
    )
  },
  ROLES: (accessControl: AccessControl, t: TFunction) => {
    const roleBindingRoles = accessControl.spec.roleBindings?.map((e) => e.roleRef.name) ?? []
    const clusterRoleBindingRole = accessControl.spec.clusterRoleBinding?.roleRef?.name

    const allRoles = [...roleBindingRoles, clusterRoleBindingRole].filter((role): role is string => !!role)

    const uniqueRoles = Array.from(new Set(allRoles))

    return uniqueRoles.length > 0 ? (
      <AcmLabels
        labels={uniqueRoles}
        expandedText={t('Show less')}
        collapsedText={t('show.more', { count: uniqueRoles.length })}
        allCollapsedText={t('count.items', { count: uniqueRoles.length })}
        isCompact={uniqueRoles.length > LABELS_LENGTH}
      />
    ) : (
      <span style={{ whiteSpace: 'nowrap' }}>'-'</span>
    )
  },
  NAMESPACES: (accessControl: AccessControl, t: TFunction) => {
    const roleBindingNamespaces = accessControl.spec.roleBindings?.map((e) => e.namespace) ?? []
    const hasCRB = !!accessControl.spec.clusterRoleBinding?.roleRef
    const allNamespaces = [...roleBindingNamespaces, ...(hasCRB ? ['All Namespaces'] : [])]

    const uniqueNamespaces = Array.from(new Set(allNamespaces))

    return uniqueNamespaces.length > 0 ? (
      <AcmLabels
        labels={uniqueNamespaces}
        expandedText={t('Show less')}
        collapsedText={t('show.more', { count: uniqueNamespaces.length })}
        allCollapsedText={t('count.items', { count: uniqueNamespaces.length })}
        isCompact={uniqueNamespaces.length > LABELS_LENGTH}
      />
    ) : (
      <span style={{ whiteSpace: 'nowrap' }}>'-'</span>
    )
  },
  STATUS: (accessControl: AccessControl) => <AccessControlStatus condition={accessControl.status?.conditions?.[0]} />,
  CREATION_DATE: (accessControl: AccessControl) => (
    <span style={{ whiteSpace: 'nowrap' }}>
      <AcmTimestamp timestamp={accessControl.metadata?.creationTimestamp} />
    </span>
  ),
  ACTIONS: (
    accessControl: AccessControl,
    t: AccessControlManagementTableHelperProps['t'],
    setModalProps: AccessControlManagementTableHelperProps['setModalProps'],
    navigate: AccessControlManagementTableHelperProps['navigate']
  ) => (
    <RbacDropdown<AccessControl>
      id={`${accessControl.metadata?.uid}-actions`}
      item={accessControl}
      isKebab={true}
      text={t('Actions')}
      actions={[
        {
          id: 'editAccessControl',
          text: t('Edit permission'),
          isAriaDisabled: true,
          click: (accessControl) => ACTIONS.EDIT({ accessControl, navigate }),
          rbac: [rbacPatch(accessControl)],
        },
        {
          id: 'deleteAccessControl',
          text: t('Delete permission'),
          isAriaDisabled: true,
          click: (accessControl) => ACTIONS.DELETE({ accessControls: [accessControl], setModalProps, t }),
          rbac: [rbacDelete(accessControl)],
        },
        {
          id: 'exportAccessControl',
          text: t('Export to YAML'),
          isAriaDisabled: true,
          click: (accessControl) => ACTIONS.EXPORT_YAML(accessControl, EXPORT_FILE_PREFIX),
          rbac: [rbacGet(accessControl)],
        },
      ]}
    />
  ),
}

const accessControlTableColumns = ({ t, setModalProps, navigate }: AccessControlManagementTableHelperProps) => [
  {
    header: t('Name'),
    sort: 'metadata.name',
    search: 'metadata.name',
    cell: COLUMN_CELLS.NAME,
    exportContent: (accessControl: AccessControl) => accessControl.metadata?.uid!,
  },
  {
    header: t('Status'),
    sort: 'accessControl.status?.conditions[0].status',
    cell: (accessControl: AccessControl) => COLUMN_CELLS.STATUS(accessControl),
    exportContent: (accessControl: AccessControl) => accessControl.status?.conditions[0].status,
  },
  {
    header: t('Cluster'),
    sort: 'metadata.namespace',
    search: 'metadata.namespace',
    cell: COLUMN_CELLS.CLUSTER,
    exportContent: (accessControl: AccessControl) => accessControl.metadata?.namespace,
  },
  {
    header: t('Users/Groups'),
    search: (accessControl: AccessControl) => {
      const roleBindingUsers = accessControl.spec.roleBindings?.map((e) => e.subject?.name).join() ?? ''
      const clusterRoleBindingUser = accessControl.spec.clusterRoleBinding?.subject?.name ?? ''
      return `${roleBindingUsers},${clusterRoleBindingUser}`
    },
    cell: (accessControl: AccessControl) => COLUMN_CELLS.USER_GROUP(accessControl, t),
    exportContent: (accessControl: AccessControl) => {
      const roleBindingUsers = accessControl.spec.roleBindings?.map((e) => e.subject?.name ?? '') ?? []
      const clusterRoleBindingUser = accessControl.spec.clusterRoleBinding?.subject?.name ?? ''
      return [...new Set([...roleBindingUsers, clusterRoleBindingUser])]
    },
  },
  {
    header: t('Roles'),
    search: (accessControl: AccessControl) => {
      const roleBindingRoles = accessControl.spec.roleBindings?.map((e) => e.roleRef.name).join() ?? ''
      const clusterRoleBindingRole = accessControl.spec.clusterRoleBinding?.roleRef?.name ?? ''
      return `${roleBindingRoles},${clusterRoleBindingRole}`
    },
    cell: (accessControl: AccessControl) => COLUMN_CELLS.ROLES(accessControl, t),
    exportContent: (accessControl: AccessControl) => {
      const roleBindingRoles = accessControl.spec.roleBindings?.map((e) => e.roleRef.name) ?? []
      const clusterRoleBindingRole = accessControl.spec.clusterRoleBinding?.roleRef?.name ?? ''
      return [...new Set([...roleBindingRoles, clusterRoleBindingRole])]
    },
  },
  {
    header: t('Namespaces'),
    search: (accessControl: AccessControl) => {
      const roleBindingNamespaces = accessControl.spec.roleBindings?.map((e) => e.namespace).join() ?? ''
      const clusterRoleBindingNamespace = accessControl.spec.clusterRoleBinding?.roleRef ? 'All Namespaces' : ''
      return `${roleBindingNamespaces},${clusterRoleBindingNamespace}`
    },
    cell: (accessControl: AccessControl) => COLUMN_CELLS.NAMESPACES(accessControl, t),
    exportContent: (accessControl: AccessControl) => {
      const roleBindingNamespaces = accessControl.spec.roleBindings?.map((e) => e.namespace) ?? []
      const clusterRoleBindingNamespace = accessControl.spec.clusterRoleBinding?.roleRef ? 'All Namespaces' : ''
      return [...new Set([...roleBindingNamespaces, clusterRoleBindingNamespace])]
    },
  },
  {
    header: t('Created'),
    sort: 'metadata.creationTimestamp',
    cell: COLUMN_CELLS.CREATION_DATE,
    exportContent: (accessControl: AccessControl) =>
      accessControl.metadata?.creationTimestamp ? getISOStringTimestamp(accessControl.metadata?.creationTimestamp) : '',
  },
  {
    header: '',
    cellTransforms: [fitContent],
    cell: (accessControl: AccessControl) => COLUMN_CELLS.ACTIONS(accessControl, t, setModalProps, navigate),
  },
]
const buildClusterOptions = (clusters: Cluster[]) =>
  clusters
    .map((cluster) => ({
      label: cluster.name,
      value: cluster.name,
    }))
    .sort((lhs, rhs) => compareStrings(lhs.label, rhs.label))

const buildOptions = (names: (string | undefined)[]) =>
  [...new Set(names)]
    .filter((name): name is string => name !== undefined)
    .map((e) => ({ label: e, value: e }))
    .sort((lhs, rhs) => compareStrings(lhs.label, rhs.label))

const filterByCluster = (selectedValues: string[], item: AccessControl) =>
  selectedValues.some((e) => item.spec.roleBindings?.map((e) => e.namespace).includes(e))

const createTableFilterFn = (kind: 'User' | 'Group' | 'Role') => (selectedValues: string[], item: AccessControl) =>
  selectedValues.some((e) => accessControlRoleBindingsFilter(item, kind).includes(e))

const useFilters = ({
  managedClusters,
  accessControls,
  t,
}: {
  managedClusters: Cluster[]
  accessControls: AccessControl[] | undefined
  t: TFunction
}) => {
  return useMemo(
    () => [
      {
        id: 'cluster',
        label: t('Cluster'),
        options: buildClusterOptions(Object.values(managedClusters)),
        tableFilterFn: filterByCluster,
      },
      {
        id: 'user',
        label: t('access.add.user'),
        options: buildOptions(accessControls?.flatMap((ac) => accessControlRoleBindingsFilter(ac, 'User')) ?? []),
        tableFilterFn: createTableFilterFn('User'),
      },
      {
        id: 'group',
        label: t('access.add.group'),
        options: buildOptions(accessControls?.flatMap((ac) => accessControlRoleBindingsFilter(ac, 'Group')) ?? []),
        tableFilterFn: createTableFilterFn('Group'),
      },
      {
        id: 'role',
        label: t('Role'),
        options: buildOptions(accessControls?.flatMap((ac) => accessControlRoleBindingsFilter(ac, 'Role')) ?? []),
        tableFilterFn: createTableFilterFn('Role'),
      },
    ],
    [t, managedClusters, accessControls]
  )
}

export { accessControlTableColumns, ACTIONS, COLUMN_CELLS, EXPORT_FILE_PREFIX, useFilters }
