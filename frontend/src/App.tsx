/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

import { AcmHeader, AcmTablePaginationContextProvider } from '@open-cluster-management/ui-components'
import { Suspense, lazy } from 'react'
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { acmRouteState, LoadData } from './atoms'
import './lib/i18n'
import { NavigationPath } from './NavigationPath'
import { LoadingPage } from './components/LoadingPage'

const ClusterManagementPage = lazy(() => import('./routes/ClusterManagement/ClusterManagement'))
const ClusterDetailsPage = lazy(() => import('./routes/ClusterManagement/Clusters/ClusterDetails/ClusterDetails'))
const ClusterSetDetailsPage = lazy(
    () => import('./routes/ClusterManagement/ClusterSets/ClusterSetDetails/ClusterSetDetails')
)
const CreateClusterSetPage = lazy(
    () => import('./routes/ClusterManagement/ClusterSets/CreateClusterSet/CreateClusterSet')
)
const CreateClusterPoolPage = lazy(
    () => import('./routes/ClusterManagement/ClusterPools/CreateClusterPool/CreateClusterPool')
)
const CreateClusterPage = lazy(() => import('./routes/ClusterManagement/Clusters/CreateCluster/CreateCluster'))
const ImportClusterPage = lazy(() => import('./routes/ClusterManagement/Clusters/ImportCluster/ImportCluster'))
const CredentialPage = lazy(() => import('./routes/Credentials/CredentialsForm'))
const CreateBareMetalAssetPage = lazy(() => import('./routes/BareMetalAssets/CreateBareMetalAsset'))
const DiscoveryConfig = lazy(() => import('./routes/Discovery/DiscoveryConfig/DiscoveryConfig'))
const CredentialsPage = lazy(() => import('./routes/Credentials/Credentials'))

export default function App() {
    const [route] = useRecoilState(acmRouteState)
    return (
        <BrowserRouter>
            <AcmHeader route={route}>
                <LoadData>
                    <AcmTablePaginationContextProvider localStorageKey="clusters">
                        <Suspense fallback={<LoadingPage />}>
                            <Switch>
                                <Route path={NavigationPath.clusterDetails} component={ClusterDetailsPage} />
                                <Route path={NavigationPath.clusterSetDetails} component={ClusterSetDetailsPage} />
                                <Route exact path={NavigationPath.createClusterSet} component={CreateClusterSetPage} />
                                <Route
                                    exact
                                    path={NavigationPath.createClusterPool}
                                    component={CreateClusterPoolPage}
                                />
                                <Route exact path={NavigationPath.createCluster} component={CreateClusterPage} />
                                <Route exact path={NavigationPath.importCluster} component={ImportClusterPage} />
                                <Route exact path={NavigationPath.credentials} component={CredentialsPage} />
                                <Route exact path={NavigationPath.addCredentials} component={CredentialPage} />
                                <Route exact path={NavigationPath.editCredentials} component={CredentialPage} />
                                <Route exact path={NavigationPath.viewCredentials} component={CredentialPage} />
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
                                <Route exact path={NavigationPath.addDiscoveryConfig} component={DiscoveryConfig} />
                                <Route exact path={NavigationPath.editDiscoveryConfig} component={DiscoveryConfig} />
                                <Route path={NavigationPath.console} component={ClusterManagementPage} />
                                <Route exact path="*">
                                    <Redirect to={NavigationPath.console} />
                                </Route>
                            </Switch>
                        </Suspense>
                    </AcmTablePaginationContextProvider>
                </LoadData>
            </AcmHeader>
        </BrowserRouter>
    )
}
