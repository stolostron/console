/* istanbul ignore file */

import '@patternfly/react-core/dist/styles/base.css'
import React, { lazy } from 'react'
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom'
import './lib/i18n'
import { NavigationPath } from './NavigationPath'
import { AppContextContainer } from './components/AppContext'

const ClusterManagementPage = lazy(() => import('./routes/ClusterManagement/ClusterManagement'))
const ClusterDetailsPage = lazy(() => import('./routes/ClusterManagement/Clusters/ClusterDetails/ClusterDetails'))
const CreateClusterPage = lazy(() => import('./routes/ClusterManagement/Clusters/CreateCluster/CreateCluster'))
const ImportClusterPage = lazy(() => import('./routes/ClusterManagement/Clusters/ImportCluster/ImportCluster'))
const AddConnectionPage = lazy(() => import('./routes/ProviderConnections/AddConnection/AddConnection'))
const CreateBareMetalAssetPage = lazy(() => import('./routes/BareMetalAssets/CreateBareMetalAsset'))
const BareMetalAssetsPage = lazy(() => import('./routes/BareMetalAssets/BareMetalAssetsPage'))
const EditBareMetalAssetPage = lazy(() => import('./routes/BareMetalAssets/CreateBareMetalAsset'))

export default function App() {
    return (
        <AppContextContainer>
            <Router>
                <Switch>
                    <Route path={NavigationPath.clusterDetails} component={ClusterDetailsPage} />
                    <Route exact path={NavigationPath.createCluster} component={CreateClusterPage} />
                    <Route exact path={NavigationPath.importCluster} component={ImportClusterPage} />
                    <Route exact path={NavigationPath.addConnection} component={AddConnectionPage} />
                    <Route exact path={NavigationPath.editConnection} component={AddConnectionPage} />
                    <Route exact path={NavigationPath.bareMetalAssets} component={BareMetalAssetsPage} />
                    <Route exact path={NavigationPath.editBareMetalAsset} component={EditBareMetalAssetPage} />
                    <Route exact path={NavigationPath.createBareMetalAsset} component={CreateBareMetalAssetPage} />
                    <Route path={NavigationPath.console} component={ClusterManagementPage} />
                    <Route exact path="*">
                        <Redirect to={NavigationPath.console} />
                    </Route>
                </Switch>
            </Router>
        </AppContextContainer>
    )
}
