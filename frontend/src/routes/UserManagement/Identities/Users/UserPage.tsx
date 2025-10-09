/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { useParams, useLocation, Link, Outlet, generatePath, useOutletContext } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
import { User, Group } from '../../../../resources/rbac'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem, AcmButton } from '../../../../ui-components'
import { NavigationPath } from '../../../../NavigationPath'
import { Page } from '@patternfly/react-core'
import { ErrorPage } from '../../../../components/ErrorPage'
import { ResourceError, ResourceErrorCode } from '../../../../resources/utils'

export const useCurrentUser = (): User | undefined => {
  const { id } = useParams()
  const { usersState } = useSharedAtoms()
  const users = useRecoilValue(usersState)

  return useMemo(
    () => (!users || !id ? undefined : users.find((u) => u.metadata.uid === id || u.metadata.name === id)),
    [users, id]
  )
}

export type UserDetailsContext = {
  readonly user?: User
  readonly groups?: Group[]
}

const UserPage = () => {
  const { t } = useTranslation()
  const { id = undefined } = useParams()
  const location = useLocation()

  const user = useCurrentUser()
  const { groupsState } = useSharedAtoms()
  const groups = useRecoilValue(groupsState)

  const userDetailsContext = useMemo<UserDetailsContext>(
    () => ({
      user,
      groups,
    }),
    [user, groups]
  )

  const isDetailsActive = location.pathname === generatePath(NavigationPath.identitiesUsersDetails, { id: id ?? '' })
  const isYamlActive = location.pathname.includes('/yaml')
  const isRoleAssignmentsActive = location.pathname.includes('/role-assignments')
  const isGroupsActive = location.pathname.includes('/groups')

  if (!user) {
    return (
      <Page>
        <ErrorPage
          error={new ResourceError(ResourceErrorCode.NotFound)}
          actions={
            <AcmButton component="a" href={NavigationPath.identitiesUsers} style={{ marginRight: '10px' }}>
              {t('button.backToUsers')}
            </AcmButton>
          }
        />
      </Page>
    )
  }

  return (
    <AcmPage
      hasDrawer
      header={
        <AcmPageHeader
          title={user?.fullName ?? user?.metadata.name ?? t('Unknown User')}
          description={user?.metadata.name}
          breadcrumb={[
            { text: t('User Management'), to: NavigationPath.roles },
            { text: t('Identities'), to: NavigationPath.identities },
            { text: t('Users'), to: NavigationPath.identitiesUsers },
            { text: user?.fullName ?? user?.metadata.name ?? t('Unknown User') },
          ]}
          navigation={
            <AcmSecondaryNav>
              <AcmSecondaryNavItem isActive={isDetailsActive}>
                <Link to={generatePath(NavigationPath.identitiesUsersDetails, { id: id ?? '' })}>{t('Details')}</Link>
              </AcmSecondaryNavItem>
              <AcmSecondaryNavItem isActive={isYamlActive}>
                <Link to={generatePath(NavigationPath.identitiesUsersYaml, { id: id ?? '' })}>{t('YAML')}</Link>
              </AcmSecondaryNavItem>
              <AcmSecondaryNavItem isActive={isRoleAssignmentsActive}>
                <Link to={generatePath(NavigationPath.identitiesUsersRoleAssignments, { id: id ?? '' })}>
                  {t('Role assignments')}
                </Link>
              </AcmSecondaryNavItem>
              <AcmSecondaryNavItem isActive={isGroupsActive}>
                <Link to={generatePath(NavigationPath.identitiesUsersGroups, { id: id ?? '' })}>{t('Groups')}</Link>
              </AcmSecondaryNavItem>
            </AcmSecondaryNav>
          }
        />
      }
    >
      <Outlet context={userDetailsContext} />
    </AcmPage>
  )
}

export { UserPage }

export function useUserDetailsContext() {
  return useOutletContext<UserDetailsContext>()
}
