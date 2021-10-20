/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmPage,
    AcmPageHeader,
    AcmRoute,
    AcmSecondaryNav,
    AcmSecondaryNavItem,
} from '@open-cluster-management/ui-components'
import { createContext, ElementType, Fragment, ReactNode, Suspense, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Redirect, Route, Switch, useLocation } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { acmRouteState } from '../../../atoms'
import { DOC_LINKS } from '../../../lib/doc-util'
import { NavigationPath } from '../../../NavigationPath'
import ClusterPoolsPage from './ClusterPools/ClusterPools'
import CreateClusterPoolPage from './ClusterPools/CreateClusterPool/CreateClusterPool'
import ClusterSetDetailsPage from './ClusterSets/ClusterSetDetails/ClusterSetDetails'
import ClusterSetsPage from './ClusterSets/ClusterSets'
import DiscoveredClustersPage from './DiscoveredClusters/DiscoveredClusters'
import DiscoveryConfigPage from './DiscoveredClusters/DiscoveryConfig/DiscoveryConfig'
import ClusterDetailsPage from './ManagedClusters/ClusterDetails/ClusterDetails'
import ClusterCreateProgress from './ManagedClusters/components/cim/ClusterCreateProgress'
import EditAICluster from './ManagedClusters/components/cim/EditAICluster'
import CreateClusterPage from './ManagedClusters/CreateCluster/CreateCluster'
import ImportClusterPage from './ManagedClusters/ImportCluster/ImportCluster'
import ManagedClusters from './ManagedClusters/ManagedClusters'
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

export default function Clusters() {
    return (
        <Switch>
            <Route exact path={NavigationPath.createCluster} component={CreateClusterPage} />
            <Route exact path={NavigationPath.clusterCreateProgress} component={ClusterCreateProgress} />
            <Route exact path={NavigationPath.importCluster} component={ImportClusterPage} />
            <Route path={NavigationPath.clusterDetails} component={ClusterDetailsPage} />
            <Route path={NavigationPath.clusterSetDetails} component={ClusterSetDetailsPage} />
            <Route exact path={NavigationPath.createClusterPool} component={CreateClusterPoolPage} />
            <Route exact path={NavigationPath.editCluster} component={EditAICluster} />
            <Route exact path={NavigationPath.configureDiscovery} component={DiscoveryConfigPage} />
            <Route exact path={NavigationPath.createDiscovery} component={DiscoveryConfigPage} />
            <Route path="*" component={ClustersPage} />
        </Switch>
    )
}

export function ClustersPage() {
    const [actions, setActions] = useState<undefined | ReactNode>(undefined)
    const location = useLocation()
    const { t } = useTranslation(['cluster', 'bma', 'common'])

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
                        <Route exact path={NavigationPath.managedClusters} component={ManagedClusters} />
                        <Route exact path={NavigationPath.clusterSets} component={ClusterSetsPage} />
                        <Route exact path={NavigationPath.clusterPools} component={ClusterPoolsPage} />
                        <Route exact path={NavigationPath.discoveredClusters} component={DiscoveredClustersPage} />
                        <Route path="*">
                            <Redirect to={NavigationPath.managedClusters} />
                        </Route>
                    </Switch>
                </Suspense>
            </PageContext.Provider>
        </AcmPage>
    )
}
