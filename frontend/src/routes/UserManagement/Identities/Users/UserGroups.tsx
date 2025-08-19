/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useTranslation } from '../../../../lib/acm-i18next'
import { Group } from '../../../../resources/rbac'
import { useMemo } from 'react'
import { AcmTable, compareStrings, IAcmTableColumn, AcmEmptyState, AcmLoadingPage } from '../../../../ui-components'
import { cellWidth } from '@patternfly/react-table'
import AcmTimestamp from '../../../../lib/AcmTimestamp'
import { getISOStringTimestamp } from '../../../../resources/utils'
import { useUserDetailsContext } from './UserPage'

const UserGroups = () => {
  const { t } = useTranslation()
  const { user, groups, loading: userLoading, groupsLoading } = useUserDetailsContext()

  const userGroups = useMemo(() => {
    if (!user || !groups) return []

    const userGroupNames = user.groups ?? []
    return groups
      .filter((group) => userGroupNames.includes(group.metadata.name ?? ''))
      .sort((a, b) => compareStrings(a.metadata.name ?? '', b.metadata.name ?? ''))
  }, [user, groups])

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

  switch (true) {
    case userLoading || groupsLoading:
      return (
        <PageSection>
          <AcmLoadingPage />
        </PageSection>
      )
    case !user:
      return (
        <PageSection>
          <div>{t('User not found')}</div>
        </PageSection>
      )
    default:
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
}

export { UserGroups }
