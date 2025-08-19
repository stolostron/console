/* Copyright Contributors to the Open Cluster Management project */
import { cellWidth } from '@patternfly/react-table'
import { useMemo } from 'react'
import { TFunction } from 'react-i18next'
import { generatePath, Link, NavigateFunction } from 'react-router-dom-v5-compat'
import { HighlightSearchText } from '../../../../components/HighlightSearchText'
import { NavigationPath } from '../../../../NavigationPath'
import { Group } from '../../../../resources/rbac'
import AcmTimestamp from '../../../../lib/AcmTimestamp'
import { IAcmTableColumn, IAcmRowAction } from '../../../../ui-components/AcmTable/AcmTableTypes'
import { getISOStringTimestamp } from '../../../../resources/utils'
import { IdentityStatus, isIdentityActive } from '../../../../ui-components/IdentityStatus/IdentityStatus'

const EXPORT_FILE_PREFIX = 'users-table'

type GroupsTableHelperProps = {
  t: TFunction
  navigate: NavigateFunction
}

const ACTIONS = {
  DETAILS: ({ group, navigate }: { group: Group } & Pick<GroupsTableHelperProps, 'navigate'>) => {
    navigate(
      generatePath(NavigationPath.identitiesGroupsDetails, {
        id: group.metadata.uid ?? '',
      })
    )
  },
  EDIT: ({ group, navigate }: { group: Group } & Pick<GroupsTableHelperProps, 'navigate'>) => {
    navigate(
      generatePath(NavigationPath.identitiesGroupsDetails, {
        id: group.metadata.uid ?? '',
      })
    )
  },
  DELETE: ({ group, navigate }: { group: Group } & Pick<GroupsTableHelperProps, 'navigate'>) => {
    navigate(
      generatePath(NavigationPath.identitiesGroupsDetails, {
        id: group.metadata.uid ?? '',
      })
    )
  },
}

const COLUMN_CELLS = {
  NAME: (group: Group, search: string) => (
    <span style={{ whiteSpace: 'nowrap' }}>
      <Link to={generatePath(NavigationPath.identitiesGroupsDetails, { id: group.metadata.uid ?? '' })}>
        <HighlightSearchText text={group.metadata.name ?? ''} searchText={search} />
      </Link>
    </span>
  ),
  IDENTITY_PROVIDER: (group: Group) =>
    group.users ? <span style={{ whiteSpace: 'nowrap' }}>{group.users.length}</span> : '-',
  STATUS: (group: Group) => <IdentityStatus identity={group} />,
  CREATED: (group: Group) => {
    return group.metadata.creationTimestamp ? (
      <span style={{ whiteSpace: 'nowrap' }}>
        <AcmTimestamp timestamp={group.metadata.creationTimestamp} />
      </span>
    ) : (
      '-'
    )
  },
}

export const groupsTableColumns = ({ t }: Pick<GroupsTableHelperProps, 't'>): IAcmTableColumn<Group>[] => [
  {
    header: t('Name'),
    sort: 'metadata.name',
    search: 'metadata.name',
    transforms: [cellWidth(50)],
    cell: (group, search) => COLUMN_CELLS.NAME(group, search),
    exportContent: (group) => group.metadata.name ?? '',
  },
  {
    header: t('Users'),
    sort: 'users.length',
    cell: (group) => COLUMN_CELLS.IDENTITY_PROVIDER(group),
  },
  // TODO: uncomment this line once 'status' is implemented
  // {
  //   header: t('Status'),
  //   cell: (group) => COLUMN_CELLS.STATUS(group),
  // },
  {
    header: t('Created'),
    cell: (group) => COLUMN_CELLS.CREATED(group),
    sort: 'metadata.creationTimestamp',
    exportContent: (group) =>
      group.metadata.creationTimestamp ? getISOStringTimestamp(group.metadata.creationTimestamp) : '',
  },
]

export const useFilters = () => {
  return useMemo(
    () => [
      {
        id: 'status',
        label: 'Status',
        tableFilterFn: (selection: string[], user: Group) => {
          if (selection.length === 0) return true
          return selection.some((selected: string) => {
            if (selected === 'active') return isIdentityActive(user)
            if (selected === 'inactive') return !isIdentityActive(user)
            return false
          })
        },
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    ],
    []
  )
}

export const useRowActions = ({ t, navigate }: GroupsTableHelperProps) => {
  return useMemo(
    (): IAcmRowAction<Group>[] => [
      {
        id: 'details',
        title: (
          <>
            {t('Impersonate group')} <strong>{t('group')}</strong>
          </>
        ),
        click: (group) => ACTIONS.DETAILS({ group, navigate }),
      },
      {
        id: 'edit',
        title: t('Edit user'),
        click: (group) => ACTIONS.EDIT({ group, navigate }),
      },
      {
        id: 'delete',
        title: t('Delete user'),
        click: (group) => ACTIONS.DELETE({ group, navigate }),
      },
    ],
    [t, navigate]
  )
}

export { EXPORT_FILE_PREFIX, ACTIONS, COLUMN_CELLS }
