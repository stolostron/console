import { AcmPageHeader, AcmScrollable, AcmSecondaryNav, AcmSecondaryNavItem } from '@stolostron/ui-components'
import { Page } from '@patternfly/react-core'
import React, { Fragment, lazy, Suspense, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Redirect, Route, Switch, useLocation } from 'react-router-dom'
import { AppContext } from '../../components/AppContext'
import { NavigationPath } from '../../NavigationPath'
import { DOC_LINKS } from '../../lib/doc-util'

const ClustersPage = lazy(() => import('./Clusters/Clusters'))
const DiscoveredClustersPage = lazy(() => import('./DiscoveredClusters/DiscoveredClusters'))
const ProviderConnectionsPage = lazy(() => import('../ProviderConnections/ProviderConnections/ProviderConnections'))

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
                            {featureGates['open-cluster-management-discovery'] && (
                                <AcmSecondaryNavItem
                                    isActive={location.pathname.startsWith(NavigationPath.discoveredClusters)}
                                >
                                    <Link to={NavigationPath.discoveredClusters}>
                                        {t('cluster:clusters.discovered')}
                                    </Link>
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
                <AcmScrollable>
                    <Suspense fallback={<Fragment />}>
                        <Switch>
                            <Route exact path={NavigationPath.clusters} component={ClustersPage} />
                            {featureGates['open-cluster-management-discovery'] && (
                                <Route
                                    exact
                                    path={NavigationPath.discoveredClusters}
                                    component={DiscoveredClustersPage}
                                />
                            )}
                            <Route
                                exact
                                path={NavigationPath.providerConnections}
                                component={ProviderConnectionsPage}
                            />
                            <Route exact path={NavigationPath.console}>
                                <Redirect to={NavigationPath.clusters} />
                            </Route>
                        </Switch>
                    </Suspense>
                </AcmScrollable>
            </PageContext.Provider>
        </Page>
    )
}
