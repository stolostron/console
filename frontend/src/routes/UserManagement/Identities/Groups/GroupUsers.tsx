/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useTranslation } from '../../../../lib/acm-i18next'
import { User } from '../../../../resources/rbac'
import { useMemo } from 'react'
import { AcmTable, compareStrings, IAcmTableColumn, AcmEmptyState } from '../../../../ui-components'
import { cellWidth } from '@patternfly/react-table'
import AcmTimestamp from '../../../../lib/AcmTimestamp'
import { getISOStringTimestamp } from '../../../../resources/utils'
import { useGroupDetailsContext } from './GroupPage'
import { NavigationPath } from '../../../../NavigationPath'
import { Link, generatePath } from 'react-router-dom-v5-compat'
import { useFilters } from '../IdentityTableHelper'

const renderUserNameCell = (user: User) => {
  return user.metadata.name ? (
    <Link to={generatePath(NavigationPath.identitiesUsersDetails, { id: user.metadata.uid ?? '' })}>
      {user.metadata.name}
    </Link>
  ) : (
    ''
  )
}

const renderUserCreatedCell = (user: User) => {
  return user.metadata.creationTimestamp ? (
    <span style={{ whiteSpace: 'nowrap' }}>
      <AcmTimestamp timestamp={user.metadata.creationTimestamp} />
    </span>
  ) : (
    '-'
  )
}

const renderIdentityProviderCell = (user: User) => {
  return user.identities ?? '-'
}

const GroupUsers = () => {
  const { t } = useTranslation()
  const { group, users } = useGroupDetailsContext()
  const filters = useFilters(users, 'user')

  const groupUsers = useMemo(() => {
    if (!group || !users) return []

    const groupUserNames = group.users ?? []
    return users
      .filter((user) => groupUserNames.includes(user.metadata.name ?? ''))
      .sort((a, b) => compareStrings(a.metadata.name ?? '', b.metadata.name ?? ''))
  }, [group, users])

  const columns: IAcmTableColumn<User>[] = [
    {
      header: t('Name'),
      sort: 'metadata.name',
      search: 'metadata.name',
      transforms: [cellWidth(40)],
      cell: renderUserNameCell,
      exportContent: (user) => user.metadata.name ?? '',
    },
    {
      header: t('Identity provider'),
      cell: renderIdentityProviderCell,
      transforms: [cellWidth(20)],
      exportContent: (user) => user.identities ?? '-',
    },
    {
      header: t('Created'),
      cell: renderUserCreatedCell,
      transforms: [cellWidth(40)],
      sort: 'metadata.creationTimestamp',
      exportContent: (user) => {
        return user.metadata.creationTimestamp ? getISOStringTimestamp(user.metadata.creationTimestamp) : ''
      },
    },
  ]

  const keyFn = (user: User) => user.metadata.uid ?? ''

  return (
    <PageSection>
      <AcmTable<User>
        key="group-users-table"
        columns={columns}
        filters={filters}
        keyFn={keyFn}
        items={groupUsers}
        resultView={{
          page: 1,
          loading: false,
          refresh: () => {},
          items: [],
          emptyResult: false,
          processedItemCount: 0,
          isPreProcessed: false,
        }}
        emptyState={
          <AcmEmptyState
            key="groupUsersEmptyState"
            title={t('No users found')}
            message={t('No users have been added to this group yet.')}
          />
        }
      />
    </PageSection>
  )
}

export { GroupUsers }
