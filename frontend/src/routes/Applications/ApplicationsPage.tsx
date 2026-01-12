/* Copyright Contributors to the Open Cluster Management project */

import { Outlet, useMatch } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../lib/acm-i18next'
import { NavigationPath } from '../../NavigationPath'
import { AcmPage, AcmPageHeader, AcmSecondaryNav } from '../../ui-components'

export default function ApplicationsPage() {
  const { t } = useTranslation()
  const applicationsMatch = useMatch(NavigationPath.applications + '/*')
  const applicationsMatchExact = applicationsMatch?.params['*'] === ''
  const advancedMatch = useMatch(NavigationPath.advancedConfiguration + '/*')
  const advancedMatchExact = advancedMatch?.params['*'] === ''

  return (
    <AcmPage
      hasDrawer
      header={
        <AcmPageHeader
          title={t('Applications')}
          navigation={
            <AcmSecondaryNav
              navItems={[
                {
                  key: 'apps-overview',
                  title: t('Overview'),
                  isActive: applicationsMatchExact,
                  to: NavigationPath.applications,
                },
                {
                  key: 'apps-advanced-config',
                  title: t('Advanced configuration'),
                  isActive: !!advancedMatchExact,
                  to: NavigationPath.advancedConfiguration,
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
