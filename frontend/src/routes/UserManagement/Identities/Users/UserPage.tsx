/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { generatePath, Outlet, useLocation, useOutletContext, useParams } from 'react-router-dom-v5-compat'
import { ErrorPage } from '../../../../components/ErrorPage'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { Group, User } from '../../../../resources/rbac'
import { ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { AcmButton, AcmPage, AcmPageHeader, AcmSecondaryNav } from '../../../../ui-components'

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
      <>
        <ErrorPage
          error={new ResourceError(ResourceErrorCode.NotFound)}
          actions={
            <AcmButton component="a" href={NavigationPath.identitiesUsers} style={{ marginRight: '10px' }}>
              {t('button.backToUsers')}
            </AcmButton>
          }
        />
      </>
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
            <AcmSecondaryNav
              navItems={[
                {
                  key: 'user-mgmt-identities-users-details',
                  title: t('Details'),
                  isActive: isDetailsActive,
                  to: generatePath(NavigationPath.identitiesUsersDetails, { id: id ?? '' }),
                },
                {
                  key: 'user-mgmt-identities-users-yaml',
                  title: t('YAML'),
                  isActive: isYamlActive,
                  to: generatePath(NavigationPath.identitiesUsersYaml, { id: id ?? '' }),
                },
                {
                  key: 'user-mgmt-identities-users-role-assignments',
                  title: t('Role assignments'),
                  isActive: isRoleAssignmentsActive,
                  to: generatePath(NavigationPath.identitiesUsersRoleAssignments, { id: id ?? '' }),
                },
                {
                  key: 'user-mgmt-identities-users-groups',
                  title: t('Groups'),
                  isActive: isGroupsActive,
                  to: generatePath(NavigationPath.identitiesUsersGroups, { id: id ?? '' }),
                },
              ]}
            />
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
