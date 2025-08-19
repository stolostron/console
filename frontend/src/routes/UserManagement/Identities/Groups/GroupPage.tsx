/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { useParams, useLocation, Link, Outlet, useNavigate } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
import { useQuery } from '../../../../lib/useQuery'
import { listUsers, listGroups, User, Group } from '../../../../resources/rbac'
import {
  AcmPage,
  AcmPageHeader,
  AcmSecondaryNav,
  AcmSecondaryNavItem,
  AcmLoadingPage,
  AcmButton,
} from '../../../../ui-components'
import { NavigationPath } from '../../../../NavigationPath'
import { generatePath, useOutletContext } from 'react-router-dom-v5-compat'
import { Page, PageSection } from '@patternfly/react-core'
import { ErrorPage } from '../../../../components/ErrorPage'
import { ResourceError, ResourceErrorCode } from '../../../../resources/utils'

export type GroupDetailsContext = {
  readonly group?: Group
  readonly users?: User[]
  readonly loading: boolean
  readonly groupsLoading: boolean
}

const GroupPage = () => {
  const { t } = useTranslation()
  const { id = undefined } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { data: users, loading } = useQuery(listUsers)
  const { data: groups, loading: groupsLoading } = useQuery(listGroups)

  const group = useMemo(() => {
    if (!groups || !id) return undefined
    return groups.find((u) => u.metadata.uid === id || u.metadata.name === id)
  }, [groups, id])

  const groupDetailsContext = useMemo<GroupDetailsContext>(
    () => ({
      group,
      users,
      loading,
      groupsLoading,
    }),
    [group, users, loading, groupsLoading]
  )

  const isDetailsActive = location.pathname === generatePath(NavigationPath.identitiesGroupsDetails, { id: id ?? '' })
  const isYamlActive = location.pathname.includes('/yaml')
  const isRoleAssignmentsActive = location.pathname.includes('/role-assignments')
  const isUsersActive = location.pathname.includes('/users')

  switch (true) {
    case loading:
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
        <AcmPage
          hasDrawer
          header={
            <AcmPageHeader
              title={group.metadata.name ?? t('Unknown Group')}
              description={group.metadata.name}
              breadcrumb={[
                { text: t('User Management'), to: NavigationPath.roles },
                { text: t('Identities'), to: NavigationPath.identities },
                { text: t('Groups'), to: NavigationPath.identitiesGroups },
                { text: group.metadata.name ?? t('Unknown Group') },
              ]}
              navigation={
                <AcmSecondaryNav>
                  <AcmSecondaryNavItem isActive={isDetailsActive}>
                    <Link to={generatePath(NavigationPath.identitiesGroupsDetails, { id: id ?? '' })}>
                      {t('Details')}
                    </Link>
                  </AcmSecondaryNavItem>
                  <AcmSecondaryNavItem isActive={isYamlActive}>
                    <Link to={generatePath(NavigationPath.identitiesGroupsYaml, { id: id ?? '' })}>{t('YAML')}</Link>
                  </AcmSecondaryNavItem>
                  <AcmSecondaryNavItem isActive={isRoleAssignmentsActive}>
                    <Link to={generatePath(NavigationPath.identitiesGroupsRoleAssignments, { id: id ?? '' })}>
                      {t('Role assignments')}
                    </Link>
                  </AcmSecondaryNavItem>
                  <AcmSecondaryNavItem isActive={isUsersActive}>
                    <Link to={generatePath(NavigationPath.identitiesGroupsUsers, { id: id ?? '' })}>{t('Users')}</Link>
                  </AcmSecondaryNavItem>
                </AcmSecondaryNav>
              }
            />
          }
        >
          <Outlet context={groupDetailsContext} />
        </AcmPage>
      )
  }
}

export { GroupPage as GroupDetail }

export function useGroupDetailsContext() {
  return useOutletContext<GroupDetailsContext>()
}
