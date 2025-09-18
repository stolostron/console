/* Copyright Contributors to the Open Cluster Management project */
import { AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem, AcmEmptyState } from '../../../ui-components'
import { Link, Outlet, useLocation } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { useIsAnyNamespaceAuthorized, rbacGet } from '../../../lib/rbac-util'
import { UserDefinition, GroupDefinition } from '../../../resources/rbac'

export default function IdentitiesPage() {
  const { t } = useTranslation()
  const location = useLocation()

  // Check if user has access to read users or groups
  // TODO: add rbacGet for service accounts to rbac.ts and add it here
  const canReadUsers = useIsAnyNamespaceAuthorized(rbacGet(UserDefinition))
  const canReadGroups = useIsAnyNamespaceAuthorized(rbacGet(GroupDefinition))

  const isUsersActive = location.pathname.startsWith(NavigationPath.identitiesUsers)
  const isGroupsActive = location.pathname.startsWith(NavigationPath.identitiesGroups)

  switch (true) {
    case !canReadUsers && !canReadGroups:
      return (
        <AcmPage
          header={
            <AcmPageHeader
              title={t('Identities')}
              description={
                'Manage all identities including users, groups, and service accounts in one place. Assign access individually or by group, with users automatically inheriting group permissions.'
              }
              breadcrumb={[{ text: t('User Management') }, { text: t('Identities') }]}
            />
          }
        >
          <AcmEmptyState
            title={t('Unauthorized')}
            message={t('You do not have permission to access identities.')}
            showSearchIcon={true}
          />
        </AcmPage>
      )

    default:
      return (
        <AcmPage
          hasDrawer
          header={
            <AcmPageHeader
              title={t('Identities')}
              description={
                'Manage all identities including users, groups, and service accounts in one place. Assign access individually or by group, with users automatically inheriting group permissions.'
              }
              breadcrumb={[{ text: t('User Management') }, { text: t('Identities') }]}
              navigation={
                <AcmSecondaryNav>
                  <AcmSecondaryNavItem isActive={isUsersActive}>
                    <Link to={NavigationPath.identitiesUsers}>{t('Users')}</Link>
                  </AcmSecondaryNavItem>
                  <AcmSecondaryNavItem isActive={isGroupsActive}>
                    <Link to={NavigationPath.identitiesGroups}>{t('Groups')}</Link>
                  </AcmSecondaryNavItem>
                </AcmSecondaryNav>
              }
            />
          }
        >
          <Outlet />
        </AcmPage>
      )
  }
}
