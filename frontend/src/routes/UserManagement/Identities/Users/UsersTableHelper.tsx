/* Copyright Contributors to the Open Cluster Management project */
import { cellWidth } from '@patternfly/react-table'
import { useMemo } from 'react'
import { TFunction } from 'react-i18next'
import { generatePath, Link, NavigateFunction } from 'react-router-dom-v5-compat'
import { HighlightSearchText } from '../../../../components/HighlightSearchText'
import { NavigationPath } from '../../../../NavigationPath'
import { User as RbacUser } from '../../../../resources/rbac'
import AcmTimestamp from '../../../../lib/AcmTimestamp'
import { IAcmTableColumn, IAcmRowAction } from '../../../../ui-components/AcmTable/AcmTableTypes'
import { getISOStringTimestamp } from '../../../../resources/utils'

import { Label } from '@patternfly/react-core'
import { CheckCircleIcon } from '@patternfly/react-icons'

const EXPORT_FILE_PREFIX = 'users-table'

type UsersTableHelperProps = {
  t: TFunction
  navigate: NavigateFunction
}

const ACTIONS = {
  DETAILS: ({ user, navigate }: { user: RbacUser } & Pick<UsersTableHelperProps, 'navigate'>) => {
    navigate(
      generatePath(NavigationPath.identitiesUsersDetails, {
        id: user.metadata.uid ?? '',
      })
    )
  },
  EDIT: ({ user, navigate }: { user: RbacUser } & Pick<UsersTableHelperProps, 'navigate'>) => {
    navigate(
      generatePath(NavigationPath.identitiesUsersDetails, {
        id: user.metadata.uid ?? '',
      })
    )
  },
  DELETE: ({ user, navigate }: { user: RbacUser } & Pick<UsersTableHelperProps, 'navigate'>) => {
    navigate(
      generatePath(NavigationPath.identitiesUsersDetails, {
        id: user.metadata.uid ?? '',
      })
    )
  },
}

const COLUMN_CELLS = {
  NAME: (user: RbacUser, search: string) => (
    <span style={{ whiteSpace: 'nowrap' }}>
      <Link to={generatePath(NavigationPath.identitiesUsersDetails, { id: user.metadata.uid ?? '' })}>
        <HighlightSearchText text={user.metadata.name ?? ''} searchText={search} isTruncate />
      </Link>
    </span>
  ),
  IDENTITY_PROVIDER: (user: RbacUser) =>
    user.identities ? <span style={{ whiteSpace: 'nowrap' }}>{user.identities}</span> : '-',
  STATUS: () => (
    <Label variant="outline">
      <CheckCircleIcon style={{ color: 'var(--pf-v5-global--success-color--100)' }} /> Active
    </Label>
  ),
  CREATED: (user: RbacUser) => {
    return user.metadata.creationTimestamp ? (
      <span style={{ whiteSpace: 'nowrap' }}>
        <AcmTimestamp timestamp={user.metadata.creationTimestamp} />
      </span>
    ) : (
      '-'
    )
  },
}

export const usersTableColumns = ({ t }: Pick<UsersTableHelperProps, 't'>): IAcmTableColumn<RbacUser>[] => [
  {
    header: t('Name'),
    sort: 'metadata.name',
    search: 'metadata.name',
    transforms: [cellWidth(50)],
    cell: (user, search) => COLUMN_CELLS.NAME(user, search),
    exportContent: (user) => user.metadata.name ?? '',
  },
  {
    header: t('Identity provider'),
    sort: 'identities',
    cell: (user) => COLUMN_CELLS.IDENTITY_PROVIDER(user),
  },
  {
    header: t('Status'),
    cell: () => COLUMN_CELLS.STATUS(),
    exportContent: () => 'Active',
  },
  {
    header: t('Created'),
    cell: (user) => COLUMN_CELLS.CREATED(user),
    sort: 'metadata.creationTimestamp',
    exportContent: (user) =>
      user.metadata.creationTimestamp ? getISOStringTimestamp(user.metadata.creationTimestamp) : '',
  },
]

export const useFilters = () => {
  return useMemo(
    () => [
      {
        id: 'identity-provider',
        label: 'Identity Provider',
        tableFilterFn: (selection: string[], user: RbacUser) => {
          if (selection.length === 0) return true
          return (
            user.identities?.some((identity: string) =>
              selection.some((selected: string) => identity.split(':')[0] === selected)
            ) ?? false
          )
        },
        options: [
          { label: 'htpasswd', value: 'htpasswd' },
          { label: 'ldap', value: 'ldap' },
          { label: 'oauth', value: 'oauth' },
          { label: 'github', value: 'github' },
        ],
      },
      {
        id: 'status',
        label: 'Status',
        tableFilterFn: (selection: string[], user: RbacUser) => {
          if (selection.length === 0) return true
          return selection.some((selected: string) => {
            if (selected === 'active') return !!user.metadata.creationTimestamp
            if (selected === 'inactive') return !user.metadata.creationTimestamp
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

export const useRowActions = ({ t, navigate }: UsersTableHelperProps) => {
  return useMemo(
    (): IAcmRowAction<RbacUser>[] => [
      {
        id: 'details',
        title: (
          <>
            {t('Impersonate user')} <strong>{t('user')}</strong>
          </>
        ),
        click: (user) => ACTIONS.DETAILS({ user, navigate }),
      },
      {
        id: 'edit',
        title: t('Edit user'),
        click: (user) => ACTIONS.EDIT({ user, navigate }),
      },
      {
        id: 'delete',
        title: t('Delete user'),
        click: (user) => ACTIONS.DELETE({ user, navigate }),
      },
    ],
    [t, navigate]
  )
}

export { EXPORT_FILE_PREFIX, ACTIONS, COLUMN_CELLS }
