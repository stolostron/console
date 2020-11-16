import '@patternfly/react-core/dist/styles/base.css'
import React, { lazy } from 'react'
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom'
import './lib/i18n'

const ClusterManagementPage = lazy(() => import('./routes/ClusterManagement/ClusterManagement'))
const BareMetalAssetsPage = lazy(() => import('./routes/BareMetalAssets/BaremetalAssets'))
const ClusterDetailsPage = lazy(() => import('./routes/ClusterManagement/Clusters/ClusterDetails/ClusterDetails'))
const CreateClusterPage = lazy(() => import('./routes/ClusterManagement/Clusters/CreateCluster/CreateCluster'))
const ImportClusterPage = lazy(() => import('./routes/ClusterManagement/Clusters/ImportCluster/ImportCluster'))
const ImportCommandPage = lazy(() => import('./routes/ClusterManagement/Clusters/ImportCommand/ImportCommand'))
const AddConnectionPage = lazy(() => import('./routes/ProviderConnections/AddConnection/AddConnection'))

export enum NavigationPath {
    clusterManagement = '/cluster-management/cluster-management',
    clusters = '/cluster-management/cluster-management/clusters',
    discoveredClusters = '/cluster-management/cluster-management/discovered',
    clusterDetails = '/cluster-management/cluster-management/clusters/:id',
    clusterOverview = '/cluster-management/cluster-management/clusters/:id/overview',
    clusterNodePools = '/cluster-management/cluster-management/clusters/:id/node-pools',
    clusterSettings = '/cluster-management/cluster-management/clusters/:id/settings',
    createCluster = '/cluster-management/cluster-management/create-cluster',
    importCluster = '/cluster-management/cluster-management/import-cluster',
    importCommand = '/cluster-management/cluster-management/import-cluster/:clusterName',
    providerConnections = '/cluster-management/cluster-management/provider-connections',
    addConnection = '/cluster-management/cluster-management/provider-connections/add-connection',
    baremetalAssets = '/cluster-management/baremetal-assets',
}

function App() {
    return (
        <Router>
            <Switch>
                <Route path={NavigationPath.clusterDetails} component={ClusterDetailsPage} />
                <Route exact path={NavigationPath.createCluster} component={CreateClusterPage} />
                <Route exact path={NavigationPath.importCluster} component={ImportClusterPage} />
                <Route exact path={NavigationPath.importCommand} component={ImportCommandPage} />
                <Route exact path={NavigationPath.addConnection} component={AddConnectionPage} />
                <Route exact path={NavigationPath.baremetalAssets} component={BareMetalAssetsPage} />
                <Route path={NavigationPath.clusterManagement} component={ClusterManagementPage} />
                <Route exact path="*">
                    <Redirect to={NavigationPath.clusterManagement} />
                </Route>
            </Switch>
        </Router>
    )
}

export default App
