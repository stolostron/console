/* Copyright Contributors to the Open Cluster Management project */
import { Page, PageSection } from '@patternfly/react-core'
import { useTranslation } from '../../../../lib/acm-i18next'
import { Group } from '../../../../resources/rbac'
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
import { useUserDetailsContext } from './UserPage'
import { ErrorPage } from '../../../../components/ErrorPage'
import { NavigationPath } from '../../../../NavigationPath'
import { useNavigate, Link, generatePath } from 'react-router-dom-v5-compat'

const UserGroups = () => {
  const { t } = useTranslation()
  const { user, groups, loading: groupLoading, groupsLoading } = useUserDetailsContext()
  const navigate = useNavigate()

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
      cell: (group) => {
        const groupName = group.metadata.name ?? ''
        const groupId = group.metadata.uid ?? ''
        return groupName ? (
          <Link to={generatePath(NavigationPath.identitiesGroupsDetails, { id: groupId })}>{groupName}</Link>
        ) : (
          ''
        )
      },
      exportContent: (user) => user.metadata.name ?? '',
    },
    {
      header: t('Created'),
      cell: (user) => {
        return user.metadata.creationTimestamp ? (
          <span style={{ whiteSpace: 'nowrap' }}>
            <AcmTimestamp timestamp={user.metadata.creationTimestamp} />
          </span>
        ) : (
          '-'
        )
      },
      transforms: [cellWidth(40)],
      sort: 'metadata.creationTimestamp',
      exportContent: (user) => {
        return user.metadata.creationTimestamp ? getISOStringTimestamp(user.metadata.creationTimestamp) : ''
      },
    },
  ]

  const keyFn = (group: Group) => group.metadata.uid ?? ''

  switch (true) {
    case groupLoading || groupsLoading:
      return (
        <PageSection>
          <AcmLoadingPage />
        </PageSection>
      )
    case !user:
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
          <AcmTable<Group>
            key="group-users-table"
            columns={columns}
            keyFn={keyFn}
            items={userGroups}
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

export { UserGroups }
