/* Copyright Contributors to the Open Cluster Management project */

import { AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../ui-components'
import { Fragment, lazy, Suspense } from 'react'
import { Link, Route, Routes, useMatch } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../lib/acm-i18next'
import { NavigationPath } from '../../NavigationPath'

const ApplicationsOverviewPage = lazy(() => import('./Overview'))
const AdvancedConfigurationPage = lazy(() => import('./AdvancedConfiguration'))

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
            <AcmSecondaryNav>
              <AcmSecondaryNavItem isActive={applicationsMatchExact}>
                <Link to={NavigationPath.applications}>{t('Overview')}</Link>
              </AcmSecondaryNavItem>
              <AcmSecondaryNavItem isActive={!!advancedMatchExact}>
                <Link to={NavigationPath.advancedConfiguration}>{t('Advanced configuration')}</Link>
              </AcmSecondaryNavItem>
            </AcmSecondaryNav>
          }
        />
      }
    >
      <Suspense fallback={<Fragment />}>
        <Routes>
          <Route path="/advanced" element={<AdvancedConfigurationPage />} />
          <Route path="/" element={<ApplicationsOverviewPage />} />
        </Routes>
      </Suspense>
    </AcmPage>
  )
}
