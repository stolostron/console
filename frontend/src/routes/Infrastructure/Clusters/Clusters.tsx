/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */
import { Redirect, Route, Switch } from 'react-router-dom'
import { CompatRoute } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../../NavigationPath'
import { CreateClusterPoolPage } from './ClusterPools/CreateClusterPoolPage'
import ClusterSetDetailsPage from './ClusterSets/ClusterSetDetails/ClusterSetDetails'
import { ClustersPage } from './ClustersPage'
import DiscoveryConfigPage from './DiscoveredClusters/DiscoveryConfig/DiscoveryConfig'
import ClusterDetailsPage from './ManagedClusters/ClusterDetails/ClusterDetails'
import EditAICluster from './ManagedClusters/components/cim/EditAICluster'
import { HypershiftAWSCLI } from './ManagedClusters/CreateCluster/components/assisted-installer/hypershift/HypershiftAWSCLI'
import { CreateAWSControlPlane } from './ManagedClusters/CreateClusterCatalog/CreateAWSControlPlane'
import { CreateControlPlane } from './ManagedClusters/CreateClusterCatalog/CreateControlPlane'
import { CreateDiscoverHost } from './ManagedClusters/CreateClusterCatalog/CreateDiscoverHost'
import { CreateKubeVirtControlPlane } from './ManagedClusters/CreateClusterCatalog/CreateKubeVirtControlPlane'
import { CreateClusterPage } from './ManagedClusters/CreateClusterPage'
import ImportClusterPage from './ManagedClusters/ImportCluster/ImportCluster'

export default function Clusters() {
  return (
    <Switch>
      <CompatRoute exact path={NavigationPath.createBMControlPlane} component={CreateControlPlane} />
      <CompatRoute exact path={NavigationPath.createAWSControlPlane} component={CreateAWSControlPlane} />
      <CompatRoute exact path={NavigationPath.createKubeVirtControlPlane} component={CreateKubeVirtControlPlane} />
      <CompatRoute exact path={NavigationPath.createAWSCLI} component={HypershiftAWSCLI} />

      <CompatRoute exact path={NavigationPath.createDiscoverHost} component={CreateDiscoverHost} />
      <CompatRoute exact path={NavigationPath.createCluster} component={CreateClusterPage} />
      <CompatRoute exact path={NavigationPath.importCluster} component={ImportClusterPage} />
      <CompatRoute path={NavigationPath.clusterDetails} component={ClusterDetailsPage} />
      <CompatRoute path={NavigationPath.clusterSetDetails} component={ClusterSetDetailsPage} />
      <CompatRoute exact path={NavigationPath.createClusterPool} component={CreateClusterPoolPage} />
      <CompatRoute exact path={NavigationPath.editCluster} component={EditAICluster} />
      <CompatRoute exact path={NavigationPath.configureDiscovery} component={DiscoveryConfigPage} />
      <CompatRoute exact path={NavigationPath.createDiscovery} component={DiscoveryConfigPage} />
      <CompatRoute path={NavigationPath.clusters} component={ClustersPage} />
      <Route path="*">
        <Redirect to={NavigationPath.clusters} />
      </Route>
    </Switch>
  )
}
