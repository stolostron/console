/* Copyright Contributors to the Open Cluster Management project */
import { AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../../ui-components'
import { Link, Outlet, useLocation } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
// TODO: trigger sonar issue
export default function IdentitiesPage() {
  const { t } = useTranslation()
  const location = useLocation()

  const isUsersActive = location.pathname.startsWith(NavigationPath.identitiesUsers)
  const isGroupsActive = location.pathname.startsWith(NavigationPath.identitiesGroups)

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
