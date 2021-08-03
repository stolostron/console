/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmPage,
    AcmPageHeader,
    AcmRoute,
    AcmSecondaryNav,
    AcmSecondaryNavItem,
} from '@open-cluster-management/ui-components'
import { createContext, ElementType, Fragment, lazy, ReactNode, Suspense, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Redirect, Route, Switch, useLocation } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { acmRouteState } from '../../../atoms'
import { DOC_LINKS } from '../../../lib/doc-util'
import { NavigationPath } from '../../../NavigationPath'

const ClustersPage = lazy(() => import('./ManagedClusters/ManagedClusters'))
const DiscoveredClustersPage = lazy(() => import('./DiscoveredClusters/DiscoveredClusters'))
const ClusterSetsPage = lazy(() => import('./ClusterSets/ClusterSets'))
const ClusterPoolsPage = lazy(() => import('./ClusterPools/ClusterPools'))

export const PageContext = createContext<{
    readonly actions: null | ReactNode
    setActions: (actions: null | ReactNode) => void
}>({
    actions: null,
    setActions: () => {},
})

export const usePageContext = (showActions: boolean, Component: ElementType) => {
    const { setActions } = useContext(PageContext)

    useEffect(() => {
        if (showActions) {
            setActions(<Component />)
        } else {
            setActions(null)
        }
        return () => setActions(null)
    }, [showActions, setActions, Component])

    return Component
}

export default function ClusterManagementPage() {
    const [actions, setActions] = useState<undefined | ReactNode>(undefined)
    const location = useLocation()
    const { t } = useTranslation(['cluster', 'bma'])

    const [, setRoute] = useRecoilState(acmRouteState)
    useEffect(() => setRoute(AcmRoute.Clusters), [setRoute])
    return (
        <AcmPage
            hasDrawer
            header={
                <AcmPageHeader
                    title={t('page.header.cluster-management')}
                    titleTooltip={
                        <>
                            {t('page.header.cluster-management.tooltip')}
                            <a
                                href={DOC_LINKS.CLUSTERS}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'block', marginTop: '4px' }}
                            >
                                {t('common:learn.more')}
                            </a>
                        </>
                    }
                    navigation={
                        <AcmSecondaryNav>
                            <AcmSecondaryNavItem isActive={location.pathname.startsWith(NavigationPath.clusters)}>
                                <Link to={NavigationPath.clusters}>{t('cluster:clusters')}</Link>
                            </AcmSecondaryNavItem>
                            <AcmSecondaryNavItem isActive={location.pathname.startsWith(NavigationPath.clusterSets)}>
                                <Link to={NavigationPath.clusterSets}>{t('cluster:clusterSets')}</Link>
                            </AcmSecondaryNavItem>
                            <AcmSecondaryNavItem isActive={location.pathname.startsWith(NavigationPath.clusterPools)}>
                                <Link to={NavigationPath.clusterPools}>{t('cluster:clusterPools')}</Link>
                            </AcmSecondaryNavItem>
                            <AcmSecondaryNavItem
                                isActive={location.pathname.startsWith(NavigationPath.discoveredClusters)}
                            >
                                <Link to={NavigationPath.discoveredClusters}>{t('cluster:clusters.discovered')}</Link>
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
                        <Route exact path={NavigationPath.clusters} component={ClustersPage} />
                        <Route exact path={NavigationPath.clusterSets} component={ClusterSetsPage} />
                        <Route exact path={NavigationPath.clusterPools} component={ClusterPoolsPage} />
                        <Route exact path={NavigationPath.discoveredClusters} component={DiscoveredClustersPage} />
                        <Route exact path={NavigationPath.console}>
                            <Redirect to={NavigationPath.clusters} />
                        </Route>
                    </Switch>
                </Suspense>
            </PageContext.Provider>
        </AcmPage>
    )
}
