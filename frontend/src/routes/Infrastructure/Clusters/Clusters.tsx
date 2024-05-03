/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */
import { Routes, Route } from 'react-router-dom-v5-compat'
import { CreateClusterPoolPage } from './ClusterPools/CreateClusterPoolPage'
import ClusterSetDetailsPage from './ClusterSets/ClusterSetDetails/ClusterSetDetails'
import { ClustersPage } from './ClustersPage'
import DiscoveryConfigPage from './DiscoveredClusters/DiscoveryConfig/DiscoveryConfig'
import ClusterDetailsPage from './ManagedClusters/ClusterDetails/ClusterDetails'
// import EditAICluster from './ManagedClusters/components/cim/EditAICluster'
import { HypershiftAWSCLI } from './ManagedClusters/CreateCluster/components/assisted-installer/hypershift/HypershiftAWSCLI'
import { CreateAWSControlPlane } from './ManagedClusters/CreateClusterCatalog/CreateAWSControlPlane'
import { CreateControlPlane } from './ManagedClusters/CreateClusterCatalog/CreateControlPlane'
import { CreateDiscoverHost } from './ManagedClusters/CreateClusterCatalog/CreateDiscoverHost'
import { CreateKubeVirtControlPlane } from './ManagedClusters/CreateClusterCatalog/CreateKubeVirtControlPlane'
import { CreateClusterPage } from './ManagedClusters/CreateClusterPage'
import ImportClusterPage from './ManagedClusters/ImportCluster/ImportCluster'

export default function Clusters() {
  return (
    <Routes>
      <Route path="/create/hostinventory/control-plane" element={<CreateControlPlane />} />
      <Route path="/create/aws/control-plane" element={<CreateAWSControlPlane />} />
      <Route path="/create/kubevirt/control-plane" element={<CreateKubeVirtControlPlane />} />
      <Route path="/create/aws/cli" element={<HypershiftAWSCLI />} />
      <Route path="/create/discover-host" element={<CreateDiscoverHost />} />
      <Route path="/create" element={<CreateClusterPage />} />
      <Route path="/import" element={<ImportClusterPage />} />
      <Route path="/details/:namespace/:name/*" element={<ClusterDetailsPage />} />
      <Route path="/sets/details/:id/*" element={<ClusterSetDetailsPage />} />
      <Route path="/pools/create" element={<CreateClusterPoolPage />} />
      {/* <Route path="/edit/:namespace/:name" element={<EditAICluster />} /> */}
      <Route path="/discovered/configure" element={<DiscoveryConfigPage />} />
      <Route path="/discovered/create" element={<DiscoveryConfigPage />} />
      <Route path="/*" element={<ClustersPage />} />
    </Routes>
  )
}
