/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */
import { Redirect, Route, Switch } from 'react-router-dom'
import { NavigationPath } from '../../../NavigationPath'
import { CreateClusterPoolPage } from './ClusterPools/CreateClusterPoolPage'
import ClusterSetDetailsPage from './ClusterSets/ClusterSetDetails/ClusterSetDetails'
import { ClustersPage } from './ClustersPage'
import DiscoveryConfigPage from './DiscoveredClusters/DiscoveryConfig/DiscoveryConfig'
import ClusterDetailsPage from './ManagedClusters/ClusterDetails/ClusterDetails'
import EditAICluster from './ManagedClusters/components/cim/EditAICluster'
import { CreateClusterPage } from './ManagedClusters/CreateClusterPage'
import { CreateControlPlane } from './ManagedClusters/CreateClusterCatalog/CreateControlPlane'
import { CreateAWSControlPlane } from './ManagedClusters/CreateClusterCatalog/CreateAWSControlPlane'
import { CreateDiscoverHost } from './ManagedClusters/CreateClusterCatalog/CreateDiscoverHost'
import ImportClusterPage from './ManagedClusters/ImportCluster/ImportCluster'
import { HypershiftAWSCLI } from './ManagedClusters/CreateCluster/components/assisted-installer/hypershift/HypershiftAWSCLI'
import { CreateKubeVirtControlPlane } from './ManagedClusters/CreateClusterCatalog/CreateKubeVirtControlPlane'
import { HypershiftKubeVirtCLI } from './ManagedClusters/CreateCluster/components/assisted-installer/hypershift/HypershiftKubeVirtCLI'

export default function Clusters() {
  return (
    <Switch>
      <Route exact path={NavigationPath.createBMControlPlane} component={CreateControlPlane} />
      <Route exact path={NavigationPath.createAWSControlPlane} component={CreateAWSControlPlane} />
      <Route exact path={NavigationPath.createKubeVirtControlPlane} component={CreateKubeVirtControlPlane} />
      <Route exact path={NavigationPath.createAWSCLI} component={HypershiftAWSCLI} />
      <Route exact path={NavigationPath.createKubeVirtCLI} component={HypershiftKubeVirtCLI} />

      <Route exact path={NavigationPath.createDiscoverHost} component={CreateDiscoverHost} />
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
