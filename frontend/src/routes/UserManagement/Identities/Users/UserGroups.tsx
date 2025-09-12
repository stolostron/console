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
import { useFilters } from '../Groups/GroupsTableHelper'

const UserGroups = () => {
  const { t } = useTranslation()
  const { user, groups, loading: userLoading, groupsLoading } = useUserDetailsContext()
  const navigate = useNavigate()
  const filters = useFilters()

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
      exportContent: (group) => group.metadata.name ?? '',
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
            filters={filters}
            keyFn={keyFn}
            items={userGroups}
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
}

export { UserGroups }
