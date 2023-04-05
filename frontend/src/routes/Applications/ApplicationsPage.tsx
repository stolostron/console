/* Copyright Contributors to the Open Cluster Management project */

import { AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../ui-components'
import { Fragment, lazy, Suspense } from 'react'
import { Link, matchPath, Redirect, Route, Switch, useLocation, useRouteMatch } from 'react-router-dom'
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
  const appTableFilterItems = JSON.parse(appTableFilter)['table-filter-type-acm-application-label'] || []
  const waitForSearch =
    appTableFilterItems.includes('openshiftapps') ||
    appTableFilterItems.includes('openshift-default') ||
    appTableFilterItems.includes('fluxapps') ||
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
        <Switch>
          <Route exact path={NavigationPath.applications} component={ApplicationsOverviewPage} />
          <Route exact path={NavigationPath.advancedConfiguration} component={AdvancedConfigurationPage} />
          <Route path="*">
            <Redirect to={NavigationPath.applications} />
          </Route>
        </Switch>
      </Suspense>
    </AcmPage>
  )
}
