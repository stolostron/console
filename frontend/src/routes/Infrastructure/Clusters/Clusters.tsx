/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */
import { Redirect, Route, Switch } from 'react-router-dom'
import { NavigationPath } from '../../../NavigationPath'
import CreateClusterPoolPage from './ClusterPools/CreateClusterPool/CreateClusterPool'
import ClusterSetDetailsPage from './ClusterSets/ClusterSetDetails/ClusterSetDetails'
import { ClustersPage } from './ClustersPage'
import DiscoveryConfigPage from './DiscoveredClusters/DiscoveryConfig/DiscoveryConfig'
import ClusterDetailsPage from './ManagedClusters/ClusterDetails/ClusterDetails'
import EditAICluster from './ManagedClusters/components/cim/EditAICluster'
import CreateClusterPage from './ManagedClusters/CreateCluster/CreateCluster'
import { CreateControlPlane } from './ManagedClusters/CreateInfrastructure/CreateControlPlane'
import { CreateInfrastructure } from './ManagedClusters/CreateInfrastructure/CreateInfrastructure'
import ImportClusterPage from './ManagedClusters/ImportCluster/ImportCluster'

export default function Clusters() {
    return (
        <Switch>
            <Route exact path={NavigationPath.createInfrastructure} component={CreateInfrastructure} />
            <Route exact path={NavigationPath.createControlPlane} component={CreateControlPlane} />
            <Route exact path={NavigationPath.createCluster} component={CreateClusterPage} />
            <Route exact path={NavigationPath.importCluster} component={ImportClusterPage} />
            <Route path={NavigationPath.clusterDetails} component={ClusterDetailsPage} />
            <Route path={NavigationPath.clusterSetDetails} component={ClusterSetDetailsPage} />
            <Route exact path={NavigationPath.createClusterPool} component={CreateClusterPoolPage} />
            <Route exact path={NavigationPath.editCluster} component={EditAICluster} />
            <Route exact path={NavigationPath.configureDiscovery} component={DiscoveryConfigPage} />
            <Route exact path={NavigationPath.createDiscovery} component={DiscoveryConfigPage} />
            <Route path={NavigationPath.clusters} component={ClustersPage} />
            <Route path="*">
                <Redirect to={NavigationPath.clusters} />
            </Route>
        </Switch>
    )
}
