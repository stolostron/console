/* Copyright Contributors to the Open Cluster Management project */

import { AcmLoadingPage, AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '@stolostron/ui-components'
import { Fragment, lazy, Suspense, useEffect, useState } from 'react'
import { Link, Redirect, Route, Switch, useLocation } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { discoveredApplicationsState } from '../../atoms'
import { useTranslation } from '../../lib/acm-i18next'
import { queryRemoteArgoApps } from '../../lib/search'
import { useQuery } from '../../lib/useQuery'
import { NavigationPath } from '../../NavigationPath'

const ApplicationsOverviewPage = lazy(() => import('./Overview'))
const AdvancedConfigurationPage = lazy(() => import('./AdvancedConfiguration'))

export default function ApplicationsPage() {
    const location = useLocation()
    const { t } = useTranslation()

    const { data, loading, startPolling } = useQuery(queryRemoteArgoApps)
    useEffect(startPolling, [startPolling])
    const [timedOut, setTimedOut] = useState<boolean>()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, setDiscoveredAppilcations] = useRecoilState(discoveredApplicationsState)
    useEffect(() => {
        const remoteArgoApps = data?.[0]?.data?.searchResult?.[0]?.items || []
        setDiscoveredAppilcations(remoteArgoApps)
    }, [data, setDiscoveredAppilcations])

    // failsafe in case search api is sleeping
    useEffect(() => {
        const handle = setTimeout(() => {
            setTimedOut(true)
        }, 5000)

        return () => {
            clearInterval(handle)
        }
    }, [])

    if (loading && !timedOut) {
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
