/* Copyright Contributors to the Open Cluster Management project */

import { AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../ui-components'
import { Fragment, lazy, Suspense, useEffect, useState } from 'react'
import { Link, matchPath, Redirect, Route, Switch, useLocation, useRouteMatch } from 'react-router-dom'
import { useTranslation } from '../../lib/acm-i18next'
import { queryRemoteArgoApps, queryOCPAppResources, queryEmpty } from '../../lib/search'
import { useQuery } from '../../lib/useQuery'
import { NavigationPath } from '../../NavigationPath'
import { useSetRecoilState, useSharedAtoms } from '../../shared-recoil'
import { LoadingPage } from '../../components/LoadingPage'

const ApplicationsOverviewPage = lazy(() => import('./Overview'))
const AdvancedConfigurationPage = lazy(() => import('./AdvancedConfiguration'))

export default function ApplicationsPage() {
    const { t } = useTranslation()
    const location = useLocation()
    const applicationsMatch = useRouteMatch()
    const advancedMatch = matchPath(location.pathname, NavigationPath.advancedConfiguration)

    const { discoveredApplicationsState, discoveredOCPAppResourcesState } = useSharedAtoms()

    const appTableFilter: any = window.localStorage.getItem('acm-table-filter.applicationTable') || '{}'
    const appTableFilterItems = JSON.parse(appTableFilter)['table-filter-type-acm-application-label'] || []
    const loadOCPResources =
        !(
            appTableFilterItems.includes('argoproj.io/ApplicationSet') ||
            appTableFilterItems.includes('argoproj.io/Application') ||
            appTableFilterItems.includes('app.k8s.io/Application')
        ) ||
        appTableFilterItems.includes('openshiftapps') ||
        appTableFilterItems.includes('openshift-default') ||
        appTableFilterItems.includes('fluxapps')

    const { data, loading, startPolling } = useQuery(queryRemoteArgoApps)
    const {
        data: dataOCPResources,
        loading: loadingOCPResources,
        startPolling: startPollingOCPResources,
        stopPolling: stopPollingOCPResources,
    } = useQuery(loadOCPResources ? queryOCPAppResources : queryEmpty)
    const [timedOut, setTimedOut] = useState<boolean>()
    const setDiscoveredApplications = useSetRecoilState(discoveredApplicationsState)
    const setDiscoveredOCPAppResources = useSetRecoilState(discoveredOCPAppResourcesState)

    useEffect(() => {
        if (applicationsMatch.isExact) {
            // No need to poll for Advanced configuration page
            startPolling()
            if (loadingOCPResources) {
                startPollingOCPResources()
            }
        }
        if (!loadingOCPResources) {
            stopPollingOCPResources()
        }
    }, [applicationsMatch, loadingOCPResources, startPolling, startPollingOCPResources, stopPollingOCPResources])

    useEffect(() => {
        const remoteArgoApps = data?.[0]?.data?.searchResult?.[0]?.items || []
        setDiscoveredApplications(remoteArgoApps)
        const ocpAppResources = dataOCPResources?.[0]?.data?.searchResult?.[0]?.items || []
        setDiscoveredOCPAppResources(ocpAppResources)
    }, [data, dataOCPResources, setDiscoveredApplications, setDiscoveredOCPAppResources])

    // failsafe in case search api is sleeping
    useEffect(() => {
        const handle = setTimeout(() => {
            setTimedOut(true)
        }, 5000)

        return () => {
            clearInterval(handle)
        }
    }, [])

    if ((loading || loadingOCPResources) && !timedOut) {
        return <LoadingPage />
    }

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
