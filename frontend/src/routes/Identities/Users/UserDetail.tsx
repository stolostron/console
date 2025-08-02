/* Copyright Contributors to the Open Cluster Management project */
import { useParams, useLocation, Link, Outlet, useNavigate } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../lib/acm-i18next'
import { useQuery } from '../../../lib/useQuery'
import { listUsers} from '../../../resources/rbac'
import { useMemo, useState, useCallback } from 'react'
import { AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem, AcmLoadingPage } from '../../../ui-components'
import { NavigationPath } from '../../../NavigationPath'
import { generatePath } from 'react-router-dom-v5-compat'
import { PageSection } from '@patternfly/react-core'
import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core/deprecated'

const UserDetail = () => {
  const { t } = useTranslation()
  const { id = undefined } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { data: users, loading } = useQuery(listUsers)
  const [userActionsOpen, setUserActionsOpen] = useState<boolean>(false)

  const user = useMemo(() => {
    if (!users || !id) return undefined
    return users.find((u) => u.metadata.uid === id || u.metadata.name === id)
  }, [users, id])

  const getUserActions = useCallback(() => {
    if (!user) return []

    const actions = [
      <DropdownItem
        component="button"
        key="impersonate-user"
        onClick={() => {
          // TODO: Implement impersonate logic
          console.log('Impersonate user:', user.metadata.name)
        }}
      >
        {t('Impersonate user')}
      </DropdownItem>,
      <DropdownItem
        component="button"
        key="edit-user"
        onClick={() => {
          navigate(generatePath(NavigationPath.identitiesUsersYaml, { id: id ?? '' }))
        }}
      >
        {t('Edit user')}
      </DropdownItem>,
      <DropdownItem
        component="button"
        key="delete-user"
        onClick={() => {
          // TODO: Implement delete user logic
          console.log('Delete user:', user.metadata.name)
        }}
        className="pf-m-danger"
      >
        {t('Delete user')}
      </DropdownItem>,
    ]

    return actions
  }, [user, navigate, id, t])

  if (loading) {
    return (
      <PageSection>
        <AcmLoadingPage />
      </PageSection>
    )
  }

  if (!user) {
    return (
      <AcmPage
        header={
          <AcmPageHeader
            title={t('User not found')}
            breadcrumb={[
              { text: t('User Management'), to: NavigationPath.roles },
              { text: t('Users, groups and service accounts'), to: NavigationPath.identities },
              { text: id ?? t('User not found') },
            ]}
          />
        }
      >
        <div>{t('User with ID {{id}} was not found', { id })}</div>
      </AcmPage>
    )
  }

  const isDetailsActive = location.pathname === generatePath(NavigationPath.identitiesUsersDetails, { id: id ?? '' })
  const isYamlActive = location.pathname.includes('/yaml')
  const isRoleAssignmentsActive = location.pathname.includes('/role-assignments')
  const isGroupsActive = location.pathname.includes('/groups')

  return (
    <AcmPage
      hasDrawer
      header={
        <AcmPageHeader
          title={user?.fullName ?? t('Unknown user')}
          description={user.metadata.name}
          breadcrumb={[
            { text: t('User Management'), to: NavigationPath.roles },
            { text: t('Users, groups and service accounts'), to: NavigationPath.identities },
            { text: user.metadata.name ?? t('Unknown user') },
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
          actions={
            <Dropdown
              isOpen={userActionsOpen}
              position={'right'}
              toggle={
                <DropdownToggle onToggle={() => setUserActionsOpen(!userActionsOpen)}>
                  {t('Actions')}
                </DropdownToggle>
              }
              dropdownItems={getUserActions()}
              onSelect={() => setUserActionsOpen(false)}
            />
          }
        />
      }
    >
      <Outlet />
    </AcmPage>
  )
}

export { UserDetail }
