import { AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import React, { Fragment, lazy, Suspense, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Redirect, Route, Switch, useLocation } from 'react-router-dom'
import { NavigationPath } from '../../NavigationPath'
import { AppContext } from '../../components/AppContext'

const ClustersPage = lazy(() => import('./Clusters/Clusters'))
const DiscoveredClustersPage = lazy(() => import('./DiscoveredClusters/DiscoveredClusters'))
const ProviderConnectionsPage = lazy(() => import('../ProviderConnections/ProviderConnections/ProviderConnections'))
const BareMetalAssetsPage = lazy(() => import('../BareMetalAssets/BareMetalAssetsPage'))

export const PageContext = React.createContext<{
    readonly actions: null | React.ReactNode
    setActions: (actions: null | React.ReactNode) => void
}>({
    actions: null,
    setActions: () => {},
})

export const usePageContext = (showActions: boolean, Component: React.ElementType) => {
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
    const [actions, setActions] = useState<undefined | React.ReactNode>(undefined)
    const location = useLocation()
    const { t } = useTranslation(['cluster', 'connection', 'bma'])
    const { featureGates } = useContext(AppContext)
    return (
        <Page>
            <PageContext.Provider value={{ actions, setActions }}>
                <AcmPageHeader
                    title={t('page.header.cluster-management')}
                    navigation={
                        <AcmSecondaryNav>
                            <AcmSecondaryNavItem isActive={location.pathname.startsWith(NavigationPath.clusters)}>
                                <Link to={NavigationPath.clusters}>{t('cluster:clusters')}</Link>
                            </AcmSecondaryNavItem>
                            {featureGates['open-cluster-management-discovery'] && (
                                <AcmSecondaryNavItem
                                    isActive={location.pathname.startsWith(NavigationPath.discoveredClusters)}
                                >
                                    <Link to={NavigationPath.discoveredClusters}>{t('cluster:clusters.discovered')}</Link>
                                </AcmSecondaryNavItem>
                            )}
                            <AcmSecondaryNavItem
                                isActive={location.pathname.startsWith(NavigationPath.providerConnections)}
                            >
                                <Link to={NavigationPath.providerConnections}>{t('connection:connections')}</Link>
                            </AcmSecondaryNavItem>
                        </AcmSecondaryNav>
                    }
                    actions={actions}
                />
                <Suspense fallback={<Fragment />}>
                    <Switch>
                        <Route exact path={NavigationPath.clusters} component={ClustersPage} />
                        {featureGates['open-cluster-management-discovery'] && <Route exact path={NavigationPath.discoveredClusters} component={DiscoveredClustersPage} />}
                        <Route exact path={NavigationPath.providerConnections} component={ProviderConnectionsPage} />
                        <Route exact path={NavigationPath.bareMetalAssets} component={BareMetalAssetsPage} />

                        <Route exact path={NavigationPath.console}>
                            <Redirect to={NavigationPath.clusters} />
                        </Route>
                    </Switch>
                </Suspense>
            </PageContext.Provider>
        </Page>
    )
}
