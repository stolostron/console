import { AcmPageHeader } from '@open-cluster-management/ui-components'
import { Nav, NavItem, NavList, Page, PageSection, PageSectionVariants } from '@patternfly/react-core'
import React, { Fragment, lazy, Suspense, useContext, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Redirect, Route, Switch, useLocation } from 'react-router-dom'
import { NavigationPath } from '../../NavigationPath'

const ClustersPage = lazy(() => import('./Clusters/Clusters'))
const DiscoveredClustersPage = lazy(() => import('./DiscoveredClusters/DiscoveredClusters'))
const ProviderConnectionsPage = lazy(() => import('../ProviderConnections/ProviderConnections/ProviderConnections'))
const BareMetalAssetsPage = lazy(() => import('../BareMetalAssets/BaremetalAssets'))

export const PageContext = React.createContext<{
    readonly actions: null | React.ReactNode
    setActions: (actions: null | React.ReactNode) => void
}>({
    actions: null,
    setActions: () => {}
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
    return (
        <Page>
            <PageContext.Provider value={{ actions, setActions }}>
                <AcmPageHeader title={t('page.header.cluster-management')} actions={actions} />
                <PageSection variant={PageSectionVariants.light} padding={{ default: 'noPadding' }}>
                    <Nav variant="tertiary" style={{ paddingLeft: '12px' }}>
                        <NavList>
                            <NavItem isActive={location.pathname.startsWith(NavigationPath.clusters)}>
                                <Link to={NavigationPath.clusters}>{t('cluster:clusters')}</Link>
                            </NavItem>
                            <NavItem isActive={location.pathname.startsWith(NavigationPath.discoveredClusters)}>
                                <Link to={NavigationPath.discoveredClusters}>{'Discovered Clusters'}</Link>
                            </NavItem>
                            <NavItem isActive={location.pathname.startsWith(NavigationPath.providerConnections)}>
                                <Link to={NavigationPath.providerConnections}>{'Provider Connections'}</Link>
                            </NavItem>
                            <NavItem isActive={location.pathname.startsWith(NavigationPath.bareMetalAssets)}>
                                <Link to={NavigationPath.bareMetalAssets}>{'Bare Metal Assets'}</Link>
                            </NavItem>
                        </NavList>
                    </Nav>
                </PageSection>
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