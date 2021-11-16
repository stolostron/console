/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

import {
    AcmHeader,
    AcmTablePaginationContextProvider,
    AcmToastProvider,
    AcmToastGroup,
} from '@open-cluster-management/ui-components'
import { Suspense, lazy } from 'react'
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { acmRouteState, LoadData } from './atoms'
import './lib/i18n'
import { NavigationPath } from './NavigationPath'
import { LoadingPage } from './components/LoadingPage'
import './App.css'

const ClusterManagementPage = lazy(() => import('./routes/Infrastructure/Clusters/Clusters'))
const ClusterDetailsPage = lazy(
    () => import('./routes/Infrastructure/Clusters/ManagedClusters/ClusterDetails/ClusterDetails')
)
const ClusterSetDetailsPage = lazy(
    () => import('./routes/Infrastructure/Clusters/ClusterSets/ClusterSetDetails/ClusterSetDetails')
)
const CreateClusterPoolPage = lazy(
    () => import('./routes/Infrastructure/Clusters/ClusterPools/CreateClusterPool/CreateClusterPool')
)
const CreateClusterPage = lazy(
    () => import('./routes/Infrastructure/Clusters/ManagedClusters/CreateCluster/CreateCluster')
)
const ImportClusterPage = lazy(
    () => import('./routes/Infrastructure/Clusters/ManagedClusters/ImportCluster/ImportCluster')
)
const CreateBareMetalAssetPage = lazy(() => import('./routes/Infrastructure/BareMetalAssets/CreateBareMetalAsset'))
const DiscoveryConfig = lazy(
    () => import('./routes/Infrastructure/Clusters/DiscoveredClusters/DiscoveryConfig/DiscoveryConfig')
)
const CredentialPage = lazy(() => import('./routes/Credentials/CredentialsForm'))
const CredentialsPage = lazy(() => import('./routes/Credentials/Credentials'))
const AnsibleAutomationFormPage = lazy(() => import('./routes/Infrastructure/Automations/AnsibleAutomationsForm'))
const BareMetalAssetsPage = lazy(() => import('./routes/Infrastructure/BareMetalAssets/BareMetalAssetsPage'))
const AnsibleAutomationsPage = lazy(() => import('./routes/Infrastructure/Automations/AnsibleAutomations'))
const ExampleForm = lazy(() => import('./components/DataForm/ExampleForm'))

const InfraEnvironmentsPage = lazy(() => import('./routes/Infrastructure/InfraEnvironments/InfraEnvironmentsPage'))
const CreateInfraEnv = lazy(() => import('./routes/Infrastructure/InfraEnvironments/CreateInfraEnv'))
const InfraEnvironmentDetailsPage = lazy(
    () => import('./routes/Infrastructure/InfraEnvironments/Details/InfraEnvironmentDetailsPage')
)
const EditAICluster = lazy(
    () => import('./routes/Infrastructure/Clusters/ManagedClusters/components/cim/EditAICluster')
)
const ClusterCreateProgress = lazy(
    () => import('./routes/Infrastructure/Clusters/ManagedClusters/components/cim/ClusterCreateProgress')
)

export default function App() {
    const [route] = useRecoilState(acmRouteState)
    return (
        <BrowserRouter>
            <AcmHeader route={route}>
                <LoadData>
                    <AcmToastProvider>
                        <AcmToastGroup />
                        <AcmTablePaginationContextProvider localStorageKey="clusters">
                            <Suspense fallback={<LoadingPage />}>
                                <Switch>
                                    <Route path={NavigationPath.clusterDetails} component={ClusterDetailsPage} />
                                    <Route path={NavigationPath.clusterSetDetails} component={ClusterSetDetailsPage} />
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
                                        path={NavigationPath.infraEnvironments}
                                        component={InfraEnvironmentsPage}
                                    />
                                    <Route exact path={NavigationPath.createInfraEnv} component={CreateInfraEnv} />
                                    <Route
                                        path={NavigationPath.infraEnvironmentDetails}
                                        component={InfraEnvironmentDetailsPage}
                                    />
                                    <Route path={NavigationPath.editCluster} component={EditAICluster} />
                                    <Route
                                        path={NavigationPath.clusterCreateProgress}
                                        component={ClusterCreateProgress}
                                    />
                                    <Route
                                        exact
                                        path={NavigationPath.ansibleAutomations}
                                        component={AnsibleAutomationsPage}
                                    />
                                    <Route
                                        exact
                                        path={NavigationPath.addAnsibleAutomation}
                                        component={AnsibleAutomationFormPage}
                                    />
                                    <Route
                                        exact
                                        path={NavigationPath.editAnsibleAutomation}
                                        component={AnsibleAutomationFormPage}
                                    />
                                    <Route
                                        exact
                                        path={NavigationPath.bareMetalAssets}
                                        component={BareMetalAssetsPage}
                                    />
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
                                    <Route exact path={NavigationPath.createDiscovery} component={DiscoveryConfig} />
                                    <Route exact path={NavigationPath.configureDiscovery} component={DiscoveryConfig} />
                                    {process.env.NODE_ENV === 'development' && (
                                        <Route exact path="/multicloud/example" component={ExampleForm} />
                                    )}
                                    <Route path={NavigationPath.console} component={ClusterManagementPage} />
                                    <Route exact path="*">
                                        <Redirect to={NavigationPath.console} />
                                    </Route>
                                </Switch>
                            </Suspense>
                        </AcmTablePaginationContextProvider>
                    </AcmToastProvider>
                </LoadData>
            </AcmHeader>
        </BrowserRouter>
    )
}
