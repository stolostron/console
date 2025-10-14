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
        <HighlightSearchText text={user.metadata.name ?? ''} searchText={search} useFuzzyHighlighting />
      </Link>
    </span>
  ),
  IDENTITY_PROVIDER: (user: RbacUser) =>
    user.identities ? <span style={{ whiteSpace: 'nowrap' }}>{user.identities}</span> : '-',
  // TODO: add status column once 'status' is implemented
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
  // TODO: add status column once 'status' is implemented
  {
    header: t('Created'),
    cell: (user) => COLUMN_CELLS.CREATED(user),
    sort: 'metadata.creationTimestamp',
    exportContent: (user) =>
      user.metadata.creationTimestamp ? getISOStringTimestamp(user.metadata.creationTimestamp) : '',
  },
]

const identityProviderFilter = (selection: string[], user: RbacUser): boolean => {
  if (selection.length === 0) return true

  const hasMatchingIdentity = user.identities?.some((identity: string) => {
    const provider = identity.split(':')[0]
    return selection.includes(provider)
  })

  return hasMatchingIdentity ?? false
}

export const useFilters = (users: RbacUser[] = []) => {
  return useMemo(() => {
    const identityProviders = new Set<string>()
    users.forEach((user) => {
      user.identities?.forEach((identity) => {
        const provider = identity.split(':')[0]
        if (provider) {
          identityProviders.add(provider)
        }
      })
    })

    const identityProviderOptions = Array.from(identityProviders)
      .sort((a, b) => a.localeCompare(b))
      .map((provider) => ({ label: provider, value: provider }))

    return [
      {
        id: 'name',
        label: 'User Name',
        tableFilterFn: (selectedValues: string[], user: RbacUser) => {
          if (selectedValues.length === 0) return true

          const userName = user.metadata.name || ''
          return selectedValues.some((selectedValue) => userName.toLowerCase().includes(selectedValue.toLowerCase()))
        },
        options: users
          .map((user) => user.metadata.name)
          .filter((name): name is string => name !== undefined && name !== null && name.trim() !== '')
          .sort((a, b) => a.localeCompare(b))
          .map((name) => ({ label: name, value: name })),
      },
      {
        id: 'identity-provider',
        label: 'Identity Provider',
        tableFilterFn: identityProviderFilter,
        options: identityProviderOptions,
      },
    ]
  }, [users])
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
