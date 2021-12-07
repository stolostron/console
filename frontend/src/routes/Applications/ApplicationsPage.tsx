/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmPage,
    AcmPageHeader,
    AcmRoute,
    AcmSecondaryNav,
    AcmSecondaryNavItem,
} from '@open-cluster-management/ui-components'
import { Fragment, lazy, ReactNode, Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Route, Switch, useLocation } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { acmRouteState } from '../../atoms'
import { NavigationPath } from '../../NavigationPath'
import { PageContext } from '../Infrastructure/Clusters/ClustersPage'

const ApplicationsOverviewPage = lazy(() => import('./Overview'))
const ApplicationsTopologyPage = lazy(() => import('./ApplicationTopology/ApplicationTopology'))
const AdvancedConfigurationPage = lazy(() => import('./AdvancedConfiguration'))

export default function ApplicationsPage() {
    const [actions, setActions] = useState<undefined | ReactNode>(undefined)
    const location = useLocation()
    const { t } = useTranslation()

    const [, setRoute] = useRecoilState(acmRouteState)
    useEffect(() => setRoute(AcmRoute.Applications), [setRoute])
    return (
        <AcmPage
            hasDrawer
            header={
                <AcmPageHeader
                    title={t('Applications')}
                    navigation={
                        <AcmSecondaryNav>
                            <AcmSecondaryNavItem isActive={location.pathname.startsWith(NavigationPath.applications)}>
                                <Link to={NavigationPath.applications}>{t('Overview')}</Link>
                            </AcmSecondaryNavItem>
                            <AcmSecondaryNavItem
                                isActive={location.pathname.startsWith(NavigationPath.advancedConfiguration)}
                            >
                                <Link to={NavigationPath.advancedConfiguration}>{t('Advanced configuration')}</Link>
                            </AcmSecondaryNavItem>
                        </AcmSecondaryNav>
                    }
                    actions={actions}
                />
            }
        >
            <PageContext.Provider value={{ actions, setActions }}>
                <Suspense fallback={<Fragment />}>
                    <Switch>
                        <Route exact path={NavigationPath.applications} component={ApplicationsOverviewPage} />
                        <Route
                            exact
                            path="/multicloud/applications/namespace/name/topology"
                            component={ApplicationsTopologyPage}
                        />
                        <Route
                            exact
                            path={NavigationPath.advancedConfiguration}
                            component={AdvancedConfigurationPage}
                        />
                    </Switch>
                </Suspense>
            </PageContext.Provider>
        </AcmPage>
    )
}
