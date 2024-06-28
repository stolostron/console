/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */
import { Routes, Route, Navigate } from 'react-router-dom-v5-compat'
import { MatchType, NavigationPath, SubRoutesRedirect, createRoutePathFunction } from '../../../NavigationPath'
import { CreateClusterPoolPage } from './ClusterPools/CreateClusterPoolPage'
import ClusterSetDetails from './ClusterSets/ClusterSetDetails/ClusterSetDetails'
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
import ManagedClusters from './ManagedClusters/ManagedClusters'
import ClusterSetsPage from './ClusterSets/ClusterSets'
import ClusterPoolsPage from './ClusterPools/ClusterPools'
import DiscoveredClustersPage from './DiscoveredClusters/DiscoveredClusters'
import { ClusterSetManageResourcesPage } from './ClusterSets/ClusterSetDetails/ClusterSetManageResources/ClusterSetManageResources'
import ClusterSetDetailsPage from './ClusterSets/ClusterSetDetails/ClusterSetDetailsPage'
import { InstallSubmarinerFormPage } from './ClusterSets/ClusterSetDetails/ClusterSetInstallSubmariner/InstallSubmarinerForm'
import { ClusterSetOverviewPageContent } from './ClusterSets/ClusterSetDetails/ClusterSetOverview/ClusterSetOverview'
import { ClusterSetSubmarinerPageContent } from './ClusterSets/ClusterSetDetails/ClusterSetSubmariner/ClusterSetSubmariner'
import { ClusterSetClustersPageContent } from './ClusterSets/ClusterSetDetails/ClusterSetClusters/ClusterSetClusters'
import { ClusterSetClusterPoolsPageContent } from './ClusterSets/ClusterSetDetails/ClusterSetClusterPools/ClusterSetClusterPools'
import { ClusterSetAccessManagement } from './ClusterSets/ClusterSetDetails/ClusterSetAccessManagement/ClusterSetAccessManagement'
import { ClusterOverviewPageContent } from './ManagedClusters/ClusterDetails/ClusterOverview/ClusterOverview'
import { NodePoolsPageContent } from './ManagedClusters/ClusterDetails/ClusterNodes/ClusterNodes'
import { MachinePoolsPageContent } from './ManagedClusters/ClusterDetails/ClusterMachinePools/ClusterMachinePools'
import { ClustersSettingsPageContent } from './ManagedClusters/ClusterDetails/ClusterSettings/ClusterSettings'

const clustersChildPath = createRoutePathFunction(NavigationPath.clusters)

export default function Clusters() {
  return (
    <Routes>
      <Route path={clustersChildPath(NavigationPath.createBMControlPlane)} element={<CreateControlPlane />} />
      <Route path={clustersChildPath(NavigationPath.createAWSControlPlane)} element={<CreateAWSControlPlane />} />
      <Route
        path={clustersChildPath(NavigationPath.createKubeVirtControlPlane)}
        element={<CreateKubeVirtControlPlane />}
      />
      <Route path={clustersChildPath(NavigationPath.createAWSCLI)} element={<HypershiftAWSCLI />} />
      <Route path={clustersChildPath(NavigationPath.createDiscoverHost)} element={<CreateDiscoverHost />} />
      <Route path={clustersChildPath(NavigationPath.createCluster)} element={<CreateClusterPage />} />
      <Route path={clustersChildPath(NavigationPath.importCluster)} element={<ImportClusterPage />} />
      <Route element={<ClusterDetailsPage />}>
        <Route path={clustersChildPath(NavigationPath.clusterOverview)} element={<ClusterOverviewPageContent />} />
        <Route path={clustersChildPath(NavigationPath.clusterNodes)} element={<NodePoolsPageContent />} />
        <Route path={clustersChildPath(NavigationPath.clusterMachinePools)} element={<MachinePoolsPageContent />} />
        <Route path={clustersChildPath(NavigationPath.clusterSettings)} element={<ClustersSettingsPageContent />} />
      </Route>
      <Route
        path={clustersChildPath(NavigationPath.clusterDetails, MatchType.SubRoutes)}
        element={
          <SubRoutesRedirect matchPath={NavigationPath.clusterDetails} targetPath={NavigationPath.clusterOverview} />
        }
      />
      <Route element={<ClusterSetDetails />}>
        <Route element={<ClusterSetDetailsPage />}>
          <Route
            path={clustersChildPath(NavigationPath.clusterSetOverview)}
            element={<ClusterSetOverviewPageContent />}
          />
          <Route
            path={clustersChildPath(NavigationPath.clusterSetSubmariner)}
            element={<ClusterSetSubmarinerPageContent />}
          />
          <Route
            path={clustersChildPath(NavigationPath.clusterSetClusters)}
            element={<ClusterSetClustersPageContent />}
          />
          <Route
            path={clustersChildPath(NavigationPath.clusterSetClusterPools)}
            element={<ClusterSetClusterPoolsPageContent />}
          />
          <Route path={clustersChildPath(NavigationPath.clusterSetAccess)} element={<ClusterSetAccessManagement />} />
        </Route>
        <Route path={clustersChildPath(NavigationPath.clusterSetManage)} element={<ClusterSetManageResourcesPage />} />
        <Route
          path={clustersChildPath(NavigationPath.clusterSetSubmarinerInstall)}
          element={<InstallSubmarinerFormPage />}
        />
      </Route>
      <Route
        path={clustersChildPath(NavigationPath.clusterSetDetails, MatchType.SubRoutes)}
        element={
          <SubRoutesRedirect
            matchPath={NavigationPath.clusterSetDetails}
            targetPath={NavigationPath.clusterSetOverview}
          />
        }
      />
      <Route path={clustersChildPath(NavigationPath.createClusterPool)} element={<CreateClusterPoolPage />} />
      <Route path={clustersChildPath(NavigationPath.editCluster)} element={<EditAICluster />} />
      <Route path={clustersChildPath(NavigationPath.configureDiscovery)} element={<DiscoveryConfigPage />} />
      <Route path={clustersChildPath(NavigationPath.createDiscovery)} element={<DiscoveryConfigPage />} />
      <Route element={<ClustersPage />}>
        <Route path={clustersChildPath(NavigationPath.managedClusters)} element={<ManagedClusters />} />
        <Route path={clustersChildPath(NavigationPath.clusterSets)} element={<ClusterSetsPage />} />
        <Route path={clustersChildPath(NavigationPath.clusterPools)} element={<ClusterPoolsPage />} />
        <Route path={clustersChildPath(NavigationPath.discoveredClusters)} element={<DiscoveredClustersPage />} />
      </Route>
      <Route path="*" element={<Navigate to={NavigationPath.managedClusters} replace />} />
    </Routes>
  )
}
