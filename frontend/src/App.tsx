/* Copyright Contributors to the Open Cluster Management project */

/* istanbul ignore file */

import '@patternfly/react-core/dist/styles/base.css'
import { createBrowserHistory } from 'history'
import { lazy } from 'react'
import { Redirect, Route, Router, Switch } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { Startup } from './atoms'
import { AppContextContainer } from './components/AppContext'
import './lib/i18n'
import { NavigationPath } from './NavigationPath'

const ClusterManagementPage = lazy(() => import('./routes/ClusterManagement/ClusterManagement'))
const ClusterDetailsPage = lazy(() => import('./routes/ClusterManagement/Clusters/ClusterDetails/ClusterDetails'))
const CreateClusterPage = lazy(() => import('./routes/ClusterManagement/Clusters/CreateCluster/CreateCluster'))
const ImportClusterPage = lazy(() => import('./routes/ClusterManagement/Clusters/ImportCluster/ImportCluster'))
const AddConnectionPage = lazy(() => import('./routes/ProviderConnections/AddConnection/AddConnection'))
const CreateBareMetalAssetPage = lazy(() => import('./routes/BareMetalAssets/CreateBareMetalAsset'))
const DiscoveryConfig = lazy(() => import('./routes/Discovery/DiscoveryConfig/DiscoveryConfig'))

declare global {
    interface Window {
        SHARED_HISTORY: any
    }
}

window.SHARED_HISTORY = window.SHARED_HISTORY ?? createBrowserHistory()

export default function App() {
    return (
        <RecoilRoot>
            <Startup>
                <AppContextContainer>
                    <Router history={window.SHARED_HISTORY}>
                        <Switch>
                            <Route path={NavigationPath.clusterDetails} component={ClusterDetailsPage} />
                            <Route exact path={NavigationPath.createCluster} component={CreateClusterPage} />
                            <Route exact path={NavigationPath.importCluster} component={ImportClusterPage} />
                            <Route exact path={NavigationPath.addConnection} component={AddConnectionPage} />
                            <Route exact path={NavigationPath.editConnection} component={AddConnectionPage} />
                            <Route
                                exact
                                path={NavigationPath.editBareMetalAsset}
                                component={CreateBareMetalAssetPage}
                            />
                            <Route
                                exact
                                path={NavigationPath.createBareMetalAsset}
                                component={CreateBareMetalAssetPage}
                            />
                            <Route exact path={NavigationPath.discoveryConfig} component={DiscoveryConfig} />
                            <Route path={NavigationPath.console} component={ClusterManagementPage} />
                            <Route exact path="*">
                                <Redirect to={NavigationPath.console} />
                            </Route>
                        </Switch>
                    </Router>
                </AppContextContainer>
            </Startup>
        </RecoilRoot>
    )
}
