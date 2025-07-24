/* Copyright Contributors to the Open Cluster Management project */
import { AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../ui-components'
import { Link, Outlet, useLocation } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../lib/acm-i18next'
import { NavigationPath } from '../../NavigationPath'

export default function IdentitiesPage() {
  const { t } = useTranslation()
  const location = useLocation()

  const isUsersActive = location.pathname.startsWith(NavigationPath.identitiesUsers)
  const isGroupsActive = location.pathname.startsWith(NavigationPath.identitiesGroups)
  const isServiceAccountsActive = location.pathname.startsWith(NavigationPath.identitiesServiceAccounts)

  return (
    <AcmPage
      hasDrawer
      header={
        <AcmPageHeader
          title={t('Identities')}
          description={t('Manage user identities, groups, and service accounts')}
          navigation={
            <AcmSecondaryNav>
              <AcmSecondaryNavItem isActive={isUsersActive}>
                <Link to={NavigationPath.identitiesUsers}>{t('Users')}</Link>
              </AcmSecondaryNavItem>
              <AcmSecondaryNavItem isActive={isGroupsActive}>
                <Link to={NavigationPath.identitiesGroups}>{t('Groups')}</Link>
              </AcmSecondaryNavItem>
              <AcmSecondaryNavItem isActive={isServiceAccountsActive}>
                <Link to={NavigationPath.identitiesServiceAccounts}>{t('Service Accounts')}</Link>
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
