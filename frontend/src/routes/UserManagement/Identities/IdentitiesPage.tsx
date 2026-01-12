/* Copyright Contributors to the Open Cluster Management project */
import { Outlet, useLocation } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { AcmPage, AcmPageHeader, AcmSecondaryNav } from '../../../ui-components'

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
          description={t(
            'Manage all identities including users, groups, and service accounts in one place. Assign access individually or by group, with users automatically inheriting group permissions.'
          )}
          breadcrumb={[{ text: t('User Management') }, { text: t('Identities') }]}
          navigation={
            <AcmSecondaryNav
              navItems={[
                {
                  key: 'user-mgmt-identities-users',
                  title: t('Users'),
                  isActive: isUsersActive,
                  to: NavigationPath.identitiesUsers,
                },
                {
                  key: 'user-mgmt-identities-groups',
                  title: t('Groups'),
                  isActive: isGroupsActive,
                  to: NavigationPath.identitiesGroups,
                },
              ]}
            />
          }
        />
      }
    >
      <Outlet />
    </AcmPage>
  )
}
