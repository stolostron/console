/* Copyright Contributors to the Open Cluster Management project */

import { AcmLoadingPage, AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '@stolostron/ui-components'
import { Fragment, lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Link, Redirect, Route, Switch, useLocation } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { discoveredApplicationsState, discoveredOCPAppResourcesState, managedClustersState } from '../../atoms'
import { useTranslation } from '../../lib/acm-i18next'
import { queryRemoteArgoApps, queryOCPAppResources, ISearchResult } from '../../lib/search'
import { useQuery } from '../../lib/useQuery'
import { NavigationPath } from '../../NavigationPath'
import { IRequestResult } from '../../resources'

const ApplicationsOverviewPage = lazy(() => import('./Overview'))
const AdvancedConfigurationPage = lazy(() => import('./AdvancedConfiguration'))

export default function ApplicationsPage() {
    const location = useLocation()
    const { t } = useTranslation()

    const [managedClusters] = useRecoilState(managedClustersState)
    const managedClusterNames = managedClusters.map((cluster) => cluster.metadata.name)

    const { data, loading, startPolling } = useQuery(queryRemoteArgoApps)

    const queryFunction = useCallback<() => IRequestResult<ISearchResult>>(() => {
        if (managedClusterNames.length) {
            return queryOCPAppResources(managedClusterNames as string[])
        } else {
            return {
                promise: Promise.resolve({ data: { searchResult: [] } } as ISearchResult),
                abort: () => {
                    // nothing to abort
                },
            }
        }
    }, [managedClusterNames])
    const dataOCPResources = useQuery(queryFunction).data
    const loadingOCPResources = useQuery(queryFunction).loading
    const startPollingOCPResources = useQuery(queryFunction).startPolling
    useEffect(startPolling, [startPolling])
    useEffect(startPollingOCPResources, [startPollingOCPResources])
    const [timedOut, setTimedOut] = useState<boolean>()

    const [, setDiscoveredAppilcations] = useRecoilState(discoveredApplicationsState)
    const [, setDiscoveredOCPAppResources] = useRecoilState(discoveredOCPAppResourcesState)
    useEffect(() => {
        const remoteArgoApps = data?.[0]?.data?.searchResult?.[0]?.items || []
        setDiscoveredAppilcations(remoteArgoApps)
        const remoteOCPAppResources = dataOCPResources?.[0]?.data?.searchResult?.[0]?.items || []
        setDiscoveredOCPAppResources(remoteOCPAppResources)
    }, [data, dataOCPResources, setDiscoveredAppilcations, setDiscoveredOCPAppResources])

    // failsafe in case search api is sleeping
    useEffect(() => {
        const handle = setTimeout(() => {
            setTimedOut(true)
        }, 5000)

        return () => {
            clearInterval(handle)
        }
    }, [])

    if (loading && loadingOCPResources && !timedOut) {
        return <AcmLoadingPage />
    }

    return (
        <AcmPage
            hasDrawer
            header={
                <AcmPageHeader
                    title={t('Applications')}
                    navigation={
                        <AcmSecondaryNav>
                            <AcmSecondaryNavItem isActive={location.pathname.endsWith(NavigationPath.applications)}>
                                <Link to={NavigationPath.applications}>{t('Overview')}</Link>
                            </AcmSecondaryNavItem>
                            <AcmSecondaryNavItem
                                isActive={location.pathname.endsWith(NavigationPath.advancedConfiguration)}
                            >
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
