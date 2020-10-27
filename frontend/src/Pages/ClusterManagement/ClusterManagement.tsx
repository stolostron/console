import { AcmPageHeader } from '@open-cluster-management/ui-components'
import { Nav, NavItem, NavList, PageSection, PageSectionVariants } from '@patternfly/react-core'
import React from 'react'
import { BrowserRouter as Router, Link, Redirect, Route, Switch, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BareMetalAssetsPage } from './BareMetalAssets/BaremetalAssets'
import { ClusterDetailsPage } from './Clusters/ClusterDetails'
import { ClustersPage } from './Clusters/Clusters'
import { CreateClusterPage } from './Clusters/CreateCluster'
import { ImportClusterPage } from './Clusters/ImportCluster'
import { AddConnectionPage } from './ProviderConnections/AddConnection'
import { ProviderConnectionsPage } from './ProviderConnections/ProviderConnections'

export enum NavigationPath {
    clusterManagement = '/cluster-management',
    clusters = '/cluster-management/clusters',
    createCluster = '/cluster-management/clusters/create',
    importCluster = '/cluster-management/clusters/import',
    clusterDetails = '/cluster-management/clusters/details/:id',
    providerConnections = '/cluster-management/provider-connections',
    addConnection = '/cluster-management/provider-connections/add',
    baremetalAssets = '/cluster-management/baremetal-assets',
}

export function ClusterManagementPageHeader() {
    const { t } = useTranslation(['cluster'])
    return (
        <React.Fragment>
            <AcmPageHeader title={t('page.header.cluster-management')} />
            <ClusterManagementNavigation />
        </React.Fragment>
    )
}

export function ClusterManagementNavigation() {
    const l = useLocation()
    const { t } = useTranslation(['cluster', 'connection', 'bma'])
    return (
        <PageSection variant={PageSectionVariants.light} padding={{ default: 'noPadding' }}>
            <Nav variant="tertiary" style={{ paddingLeft: '12px' }}>
                <NavList>
                    <NavItem isActive={l.pathname.endsWith(NavigationPath.clusters)} to={NavigationPath.clusters}>
                        <Link to={NavigationPath.clusters}>{t('cluster:clusters')}</Link>
                    </NavItem>
                    <NavItem isActive={l.pathname.endsWith(NavigationPath.providerConnections)}>
                        <Link to={NavigationPath.providerConnections}>{t('connection:connections')}</Link>
                    </NavItem>
                    <NavItem isActive={l.pathname.endsWith(NavigationPath.baremetalAssets)}>
                        <Link to={NavigationPath.baremetalAssets}>{t('bma:bmas')}</Link>
                    </NavItem>
                </NavList>
            </Nav>
        </PageSection>
    )
}

export function ClusterManagement() {
    return (
        <React.Fragment>
            <Router>
                <Switch>
                    <Route path={NavigationPath.clusters} exact>
                        <ClustersPage />
                    </Route>
                    <Route path={NavigationPath.createCluster} exact>
                        <CreateClusterPage />
                    </Route>
                    <Route path={NavigationPath.importCluster} exact>
                        <ImportClusterPage />
                    </Route>
                    <Route path={NavigationPath.clusterDetails}>
                        <ClusterDetailsPage />
                    </Route>

                    <Route path={NavigationPath.providerConnections} exact>
                        <ProviderConnectionsPage />
                    </Route>
                    <Route path={NavigationPath.addConnection} exact>
                        <AddConnectionPage />
                    </Route>

                    <Route path={NavigationPath.baremetalAssets} exact>
                        <BareMetalAssetsPage />
                    </Route>

                    <Route path={NavigationPath.clusterManagement} exact>
                        <Redirect to={NavigationPath.clusters} />
                    </Route>
                </Switch>
            </Router>
        </React.Fragment>
    )
}
