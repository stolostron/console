import '@patternfly/react-core/dist/styles/base.css'
import React, { lazy } from 'react'
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom'
import './lib/i18n'
import { NavigationPath } from './NavigationPath'

const ClusterManagementPage = lazy(() => import('./routes/ClusterManagement/ClusterManagement'))
const ClusterDetailsPage = lazy(() => import('./routes/ClusterManagement/Clusters/ClusterDetails/ClusterDetails'))
const CreateClusterPage = lazy(() => import('./routes/ClusterManagement/Clusters/CreateCluster/CreateCluster'))
const ImportClusterPage = lazy(() => import('./routes/ClusterManagement/Clusters/ImportCluster/ImportCluster'))
const ImportCommandPage = lazy(() => import('./routes/ClusterManagement/Clusters/ImportCommand/ImportCommand'))
const AddConnectionPage = lazy(() => import('./routes/ProviderConnections/AddConnection/AddConnection'))
const CreateBareMetalAssetPage = lazy(() => import('./routes/BareMetalAssets/CreateBareMetalAsset'))

function App() {
    return (
        <Router>
            <Switch>
                <Route path={NavigationPath.clusterDetails} component={ClusterDetailsPage} />
                <Route exact path={NavigationPath.createCluster} component={CreateClusterPage} />
                <Route exact path={NavigationPath.importCluster} component={ImportClusterPage} />
                <Route exact path={NavigationPath.importCommand} component={ImportCommandPage} />
                <Route exact path={NavigationPath.addConnection} component={AddConnectionPage} />
                <Route exact path={NavigationPath.createBareMetalAssets} component={CreateBareMetalAssetPage} />
                <Route path={NavigationPath.clusterManagement} component={ClusterManagementPage} />
                <Route exact path="*">
                    <Redirect to={NavigationPath.clusterManagement} />
                </Route>
            </Switch>
        </Router>
    )
}

export default App
