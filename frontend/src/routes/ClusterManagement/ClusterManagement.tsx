import { AcmPageHeader } from '@open-cluster-management/ui-components'
import { Nav, NavItem, NavList, Page, PageSection, PageSectionVariants } from '@patternfly/react-core'
import React, { Fragment, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Redirect, Route, Switch, useLocation } from 'react-router-dom'
import { NavigationPath } from '../../NavigationPath'

const ClustersPage = lazy(() => import('./Clusters/Clusters'))
const DiscoveredClustersPage = lazy(() => import('./DiscoveredClusters/DiscoveredClusters'))
const ProviderConnectionsPage = lazy(() => import('../ProviderConnections/ProviderConnections/ProviderConnections'))

export default function ClusterManagementPage() {
    const location = useLocation()
    const { t } = useTranslation(['cluster', 'connection', 'bma'])
    return (
        <Fragment>
            <Page>
                <AcmPageHeader title={t('page.header.cluster-management')} />
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
                        </NavList>
                    </Nav>
                </PageSection>
                <Suspense fallback={<Fragment />}>
                    <Switch>
                        <Route exact path={NavigationPath.clusters} component={ClustersPage} />
                        <Route exact path={NavigationPath.discoveredClusters} component={DiscoveredClustersPage} />
                        <Route exact path={NavigationPath.providerConnections} component={ProviderConnectionsPage} />
                        <Route exact path={NavigationPath.clusterManagement}>
                            <Redirect to={NavigationPath.clusters} />
                        </Route>
                    </Switch>
                </Suspense>
            </Page>
        </Fragment>
    )
}
