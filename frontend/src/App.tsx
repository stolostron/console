/* istanbul ignore file */

import '@patternfly/react-core/dist/styles/base.css'
import React, { lazy, useState, useEffect } from 'react'
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom'
import './lib/i18n'
import { NavigationPath } from './NavigationPath'
import { FeatureGate, listFeatureGates } from './resources/feature-gate'
import { ClusterManagementAddOn, listClusterManagementAddOns } from './resources/cluster-management-add-on'

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
        <Router>
            <Switch>
                <AppContextContainer>
                    <Route path={NavigationPath.clusterDetails} component={ClusterDetailsPage} />
                    <Route exact path={NavigationPath.createCluster} component={CreateClusterPage} />
                    <Route exact path={NavigationPath.importCluster} component={ImportClusterPage} />
                    <Route exact path={NavigationPath.addConnection} component={AddConnectionPage} />
                    <Route exact path={NavigationPath.editConnection} component={AddConnectionPage} />
                    <Route exact path={NavigationPath.bareMetalAssets} component={BareMetalAssetsPage} />
                    <Route exact path={NavigationPath.editBareMetalAssets} component={EditBareMetalAssetPage} />
                    <Route exact path={NavigationPath.createBareMetalAssets} component={CreateBareMetalAssetPage} />
                    <Route path={NavigationPath.clusterManagement} component={ClusterManagementPage} />
                    <Route exact path="*">
                        <Redirect to={NavigationPath.clusterManagement} />
                    </Route>
                </AppContextContainer>
            </Switch>
        </Router>
    )
}

export const AppContext = React.createContext<{
    readonly featureGates: Record<string, FeatureGate>
    readonly clusterManagementAddons: ClusterManagementAddOn[]
}>({
    featureGates: {},
    clusterManagementAddons: [],
})

function AppContextContainer(props: { children: React.ReactNode[] }) {
    const [featureGates, setFeatureGates] = useState<Record<string, FeatureGate>>({})
    const [clusterManagementAddons, setClusterManagementAddons] = useState<ClusterManagementAddOn[]>([])

    useEffect(() => {
        try {
            listClusterManagementAddOns().promise.then((items) =>{
                setClusterManagementAddons(items)
            })
        } catch(err) {
            console.error(err)
        }
        // TODO change discovery FG to use a label
        // i.e. console.open-cluster-management.io/feature-gate
        try {
            listFeatureGates().promise.then((items) => {
                const discoveryFeature = items.find((item: FeatureGate) => item.metadata.name === 'open-cluster-management-discovery')
                discoveryFeature && setFeatureGates({ 'open-cluster-management-discovery': discoveryFeature })
            })
        } catch(err) {
            console.error(err)
        }
    }, [])

    return (
        <AppContext.Provider value={{ featureGates, clusterManagementAddons }}>
            {props.children}
        </AppContext.Provider>
    )
}