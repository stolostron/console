import { AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import React, { Fragment, lazy, Suspense, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Redirect, Route, Switch, useLocation } from 'react-router-dom'
import { NavigationPath } from '../../NavigationPath'
import { getFeatureGate } from '../../resources/feature-gate'

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
    const [discovery, toggleDiscovery] = useState<Boolean>(false)
    useEffect(() => {
        if (sessionStorage.getItem('DiscoveryEnabled') === null) {
            const result = getFeatureGate('open-cluster-management-discovery')
            result.promise
                .then((featureGate) => {
                    if (featureGate.spec!.featureSet === 'DiscoveryEnabled') {
                        sessionStorage.setItem('DiscoveryEnabled', 'true')
                        toggleDiscovery(true)
                    }
                })
                .catch((err: Error) => {
                    // If error retrieving feature flag, continue
                    sessionStorage.setItem('DiscoveryEnabled', 'false')
                    toggleDiscovery(false)
                })
            return result.abort
        }
        toggleDiscovery(sessionStorage.getItem('DiscoveryEnabled') === 'true' ? true : false)
    }, [])

    const [actions, setActions] = useState<undefined | React.ReactNode>(undefined)
    const location = useLocation()
    const { t } = useTranslation(['cluster', 'connection', 'bma'])
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
                            {discovery === true ? (
                                <AcmSecondaryNavItem
                                    isActive={location.pathname.startsWith(NavigationPath.discoveredClusters)}
                                >
                                    <Link to={NavigationPath.discoveredClusters}>{'Discovered Clusters'}</Link>
                                </AcmSecondaryNavItem>
                            ) : null}
                            <AcmSecondaryNavItem
                                isActive={location.pathname.startsWith(NavigationPath.providerConnections)}
                            >
                                <Link to={NavigationPath.providerConnections}>{'Provider Connections'}</Link>
                            </AcmSecondaryNavItem>
                        </AcmSecondaryNav>
                    }
                    actions={actions}
                />
                <Suspense fallback={<Fragment />}>
                    <Switch>
                        <Route exact path={NavigationPath.clusters} component={ClustersPage} />
                        <Route exact path={NavigationPath.discoveredClusters} component={DiscoveredClustersPage} />
                        <Route exact path={NavigationPath.providerConnections} component={ProviderConnectionsPage} />
                        <Route exact path={NavigationPath.bareMetalAssets} component={BareMetalAssetsPage} />

                        <Route exact path={NavigationPath.clusterManagement}>
                            <Redirect to={NavigationPath.clusters} />
                        </Route>
                    </Switch>
                </Suspense>
            </PageContext.Provider>
        </Page>
    )
}
