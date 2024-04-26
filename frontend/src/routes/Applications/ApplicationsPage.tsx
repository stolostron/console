/* Copyright Contributors to the Open Cluster Management project */

import { AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../ui-components'
import { Fragment, lazy, Suspense } from 'react'
import { matchPath, useRouteMatch } from 'react-router-dom'
import { useLocation, Link, Route, Routes } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../lib/acm-i18next'
import { NavigationPath } from '../../NavigationPath'
import { GetDiscoveredOCPApps } from '../../components/GetDiscoveredOCPApps'

const ApplicationsOverviewPage = lazy(() => import('./Overview'))
const AdvancedConfigurationPage = lazy(() => import('./AdvancedConfiguration'))

export default function ApplicationsPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const applicationsMatch = useRouteMatch()
  const advancedMatch = matchPath(location.pathname, NavigationPath.advancedConfiguration)
  const appTableFilter: any = window.localStorage.getItem('acm-table-filter.applicationTable') || '{}'
  const appTableFilterItems = JSON.parse(appTableFilter)['type'] || []
  const waitForSearch =
    appTableFilterItems.includes('openshift') ||
    appTableFilterItems.includes('openshift-default') ||
    appTableFilterItems.includes('flux') ||
    !appTableFilterItems.length

  GetDiscoveredOCPApps(applicationsMatch.isExact, waitForSearch)

  return (
    <AcmPage
      hasDrawer
      header={
        <AcmPageHeader
          title={t('Applications')}
          navigation={
            <AcmSecondaryNav>
              <AcmSecondaryNavItem isActive={applicationsMatch.isExact}>
                <Link to={NavigationPath.applications}>{t('Overview')}</Link>
              </AcmSecondaryNavItem>
              <AcmSecondaryNavItem isActive={!!advancedMatch?.isExact}>
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
