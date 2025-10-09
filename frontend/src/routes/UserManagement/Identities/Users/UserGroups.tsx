/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useTranslation } from '../../../../lib/acm-i18next'
import { Group } from '../../../../resources/rbac'
import { useMemo } from 'react'
import { AcmTable, IAcmTableColumn, AcmEmptyState } from '../../../../ui-components'
import { cellWidth } from '@patternfly/react-table'
import AcmTimestamp from '../../../../lib/AcmTimestamp'
import { getISOStringTimestamp } from '../../../../resources/utils'
import { useUserDetailsContext } from './UserPage'
import { NavigationPath } from '../../../../NavigationPath'
import { Link, generatePath } from 'react-router-dom-v5-compat'
import { useFilters } from '../Groups/GroupsTableHelper'

const renderGroupNameCell = (group: Group) => {
  return group.metadata.name ? (
    <Link to={generatePath(NavigationPath.identitiesGroupsDetails, { id: group.metadata.uid ?? '' })}>
      {group.metadata.name}
    </Link>
  ) : (
    ''
  )
}

const renderGroupCreatedCell = (group: Group) => {
  return group.metadata.creationTimestamp ? (
    <span style={{ whiteSpace: 'nowrap' }}>
      <AcmTimestamp timestamp={group.metadata.creationTimestamp} />
    </span>
  ) : (
    '-'
  )
}

const findGroupsContainingUser = (groups: Group[], username: string): Group[] => {
  return groups
    .filter((group) => group.users.includes(username))
    .sort((a, b) => (a.metadata.name || '').localeCompare(b.metadata.name || ''))
}

const UserGroups = () => {
  const { t } = useTranslation()
  const { user, groups } = useUserDetailsContext()
  const filters = useFilters()

  const userGroups = useMemo(() => {
    if (!user || !groups) return []

    return findGroupsContainingUser(groups, user.metadata.name || '')
  }, [user, groups])

  const columns: IAcmTableColumn<Group>[] = [
    {
      header: t('Name'),
      sort: 'metadata.name',
      search: 'metadata.name',
      transforms: [cellWidth(40)],
      cell: renderGroupNameCell,
      exportContent: (group) => group.metadata.name ?? '',
    },
    {
      header: t('Created'),
      cell: renderGroupCreatedCell,
      transforms: [cellWidth(40)],
      sort: 'metadata.creationTimestamp',
      exportContent: (group) => {
        return group.metadata.creationTimestamp ? getISOStringTimestamp(group.metadata.creationTimestamp) : ''
      },
    },
  ]

  const keyFn = (group: Group) => group.metadata.uid ?? ''

  return (
    <PageSection>
      <AcmTable<Group>
        key="group-users-table"
        columns={columns}
        filters={filters}
        keyFn={keyFn}
        items={userGroups}
        resultView={{
          page: 1,
          loading: false,
          refresh: () => {},
          items: [],
          emptyResult: false,
          processedItemCount: 0,
          isPreProcessed: true,
        }}
        emptyState={
          <AcmEmptyState
            key="groupUsersEmptyState"
            title={t('No groups found')}
            message={t('This user is not a member of any groups yet.')}
          />
        }
      />
    </PageSection>
  )
}

export { UserGroups }
