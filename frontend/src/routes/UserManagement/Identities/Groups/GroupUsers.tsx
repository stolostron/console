/* Copyright Contributors to the Open Cluster Management project */
import { Page, PageSection } from '@patternfly/react-core'
import { useTranslation } from '../../../../lib/acm-i18next'
import { User } from '../../../../resources/rbac'
import { useMemo } from 'react'
import {
  AcmTable,
  compareStrings,
  IAcmTableColumn,
  AcmEmptyState,
  AcmLoadingPage,
  AcmButton,
} from '../../../../ui-components'
import { cellWidth } from '@patternfly/react-table'
import AcmTimestamp from '../../../../lib/AcmTimestamp'
import { getISOStringTimestamp, ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { useGroupDetailsContext } from './GroupPage'
import { ErrorPage } from '../../../../components/ErrorPage'
import { NavigationPath } from '../../../../NavigationPath'
import { useNavigate } from 'react-router-dom-v5-compat'

const GroupUsers = () => {
  const { t } = useTranslation()
  const { group, users, loading: groupLoading, usersLoading } = useGroupDetailsContext()
  const navigate = useNavigate()

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
      cell: (group) => group.metadata.name ?? '',
      exportContent: (group) => group.metadata.name ?? '',
    },
    {
      header: t('Users count'),
      cell: (user) => user.groups?.length ?? 0,
      transforms: [cellWidth(20)],
      exportContent: (user) => (user.groups?.length ?? 0).toString(),
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

  const keyFn = (user: User) => user.metadata.uid ?? ''

  switch (true) {
    case groupLoading || usersLoading:
      return (
        <PageSection>
          <AcmLoadingPage />
        </PageSection>
      )
    case !group:
      return (
        <Page>
          <ErrorPage
            error={new ResourceError(ResourceErrorCode.NotFound)}
            actions={
              <AcmButton
                role="link"
                onClick={() => navigate(NavigationPath.identitiesGroups)}
                style={{ marginRight: '10px' }}
              >
                {t('button.backToGroups')}
              </AcmButton>
            }
          />
        </Page>
      )
    default:
      return (
        <PageSection>
          <AcmTable<User>
            key="group-users-table"
            columns={columns}
            keyFn={keyFn}
            items={groupUsers}
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
}

export { GroupUsers }
