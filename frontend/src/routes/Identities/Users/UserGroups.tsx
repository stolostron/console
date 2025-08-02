/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useParams } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../lib/acm-i18next'
import { useQuery } from '../../../lib/useQuery'
import { listUsers, listGroups, Group } from '../../../resources/rbac'
import { useMemo } from 'react'
import { AcmTable, compareStrings, IAcmTableColumn, AcmEmptyState, AcmLoadingPage } from '../../../ui-components'
import { cellWidth } from '@patternfly/react-table'
import AcmTimestamp from '../../../lib/AcmTimestamp'
import { getISOStringTimestamp } from '../../../resources/utils'

const UserGroups = () => {
  const { t } = useTranslation()
  const { id = undefined } = useParams()
  const { data: users, loading: usersLoading } = useQuery(listUsers)
  const { data: groups, loading: groupsLoading } = useQuery(listGroups)

  const user = useMemo(() => {
    if (!users || !id) return undefined
    return users.find((u) => u.metadata.uid === id || u.metadata.name === id)
  }, [users, id])

  const userGroups = useMemo(() => {
    if (!user || !groups) return []

    const userGroupNames = user.groups ?? []
    return groups.filter((group) =>
      userGroupNames.includes(group.metadata.name ?? '')
    ).sort((a, b) => compareStrings(a.metadata.name ?? '', b.metadata.name ?? ''))
  }, [user, groups])

  if (usersLoading || groupsLoading) {
    return (
      <PageSection>
        <AcmLoadingPage />
      </PageSection>
    )
  }

  if (!user) {
    return (
      <PageSection>
        <div>{t('User not found')}</div>
      </PageSection>
    )
  }

  const columns: IAcmTableColumn<Group>[] = [
    {
      header: t('Name'),
      sort: 'metadata.name',
      search: 'metadata.name',
      transforms: [cellWidth(40)],
      cell: (group) => group.metadata.name ?? '',
      exportContent: (group) => group.metadata.name ?? '',
    },
    {
      header: t('Users count'),
      cell: (group) => group.users?.length ?? 0,
      transforms: [cellWidth(20)],
      exportContent: (group) => (group.users?.length ?? 0).toString(),
    },
    {
      header: t('Created'),
      cell: (group) => {
        return group.metadata.creationTimestamp ? (
          <span style={{ whiteSpace: 'nowrap' }}>
            <AcmTimestamp timestamp={group.metadata.creationTimestamp} />
          </span>
        ) : (
          '-'
        )
      },
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
        key="user-groups-table"
        columns={columns}
        keyFn={keyFn}
        items={userGroups}
        emptyState={
          <AcmEmptyState
            key="userGroupsEmptyState"
            title={t('No groups found')}
            message={t('This user is not a member of any groups.')}
          />
        }
      />
    </PageSection>
  )
}

export { UserGroups }
