/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { generatePath, Outlet, useLocation, useParams } from 'react-router'
import { ErrorPage } from '../../../../components/ErrorPage'
import { LoadingPage } from '../../../../components/LoadingPage'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { useSharedValue, useSharedAtoms } from '../../../../shared-atoms'
import { AcmButton, AcmPage, AcmPageHeader, AcmSecondaryNav } from '../../../../ui-components'
import { useUsersByNames } from '../Users/useUsersSearch'
import { useCurrentGroup } from './useCurrentGroup'
import { GroupDetailsContext } from './useGroupDetailsContext'

const GroupPage = () => {
  const { t } = useTranslation()
  const { id = undefined } = useParams()
  const location = useLocation()

  const { group, loaded, error } = useCurrentGroup()
  const { isDirectAuthenticationEnabledState } = useSharedAtoms()
  const isDirectAuth = useSharedValue(isDirectAuthenticationEnabledState)
  const { users, loaded: usersLoaded } = useUsersByNames(group?.users)

  const groupDetailsContext = useMemo<GroupDetailsContext>(
    () => ({
      group,
      users,
    }),
    [group, users]
  )

  const isDetailsActive = location.pathname === generatePath(NavigationPath.identitiesGroupsDetails, { id: id ?? '' })
  const isYamlActive = location.pathname.includes('/yaml')
  const isRoleAssignmentsActive = location.pathname.includes('/role-assignments')
  const isUsersActive = location.pathname.includes('/users')

  const backToGroups = (
    <AcmButton component="a" href={NavigationPath.identitiesGroups} style={{ marginRight: '10px' }}>
      {t('button.backToGroups')}
    </AcmButton>
  )

  if (!loaded || (group && !usersLoaded)) {
    return <LoadingPage />
  }

  if (!group) {
    return <ErrorPage error={error ?? new ResourceError(ResourceErrorCode.NotFound)} actions={backToGroups} />
  }

  return (
    <AcmPage
      hasDrawer
      header={
        <AcmPageHeader
          title={group?.metadata.name ?? t('Unknown Group')}
          description={group?.metadata.name}
          breadcrumb={[
            { text: t('Identities'), to: NavigationPath.identities },
            { text: t('Groups'), to: NavigationPath.identitiesGroups },
            { text: group?.metadata.name ?? t('Unknown Group') },
          ]}
          navigation={
            <AcmSecondaryNav
              navItems={[
                {
                  key: 'user-mgmt-identities-groups-details',
                  title: t('Details'),
                  isActive: isDetailsActive,
                  to: generatePath(NavigationPath.identitiesGroupsDetails, { id: id ?? '' }),
                },
                ...(!isDirectAuth
                  ? [
                      {
                        key: 'user-mgmt-identities-groups-yaml',
                        title: t('YAML'),
                        isActive: isYamlActive,
                        to: generatePath(NavigationPath.identitiesGroupsYaml, { id: id ?? '' }),
                      },
                    ]
                  : []),
                {
                  key: 'user-mgmt-identities-groups-role-assignments',
                  title: t('Role assignments'),
                  isActive: isRoleAssignmentsActive,
                  to: generatePath(NavigationPath.identitiesGroupsRoleAssignments, { id: id ?? '' }),
                },
                ...(!isDirectAuth
                  ? [
                      {
                        key: 'user-mgmt-identities-groups-users',
                        title: t('Users'),
                        isActive: isUsersActive,
                        to: generatePath(NavigationPath.identitiesGroupsUsers, { id: id ?? '' }),
                      },
                    ]
                  : []),
              ]}
            />
          }
        />
      }
    >
      <Outlet context={groupDetailsContext} />
    </AcmPage>
  )
}

export { GroupPage }
