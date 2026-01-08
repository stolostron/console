/* Copyright Contributors to the Open Cluster Management project */
import { Cluster } from '../../routes/UserManagement/RoleAssignments/hook/RoleAssignmentDataHook'

export const isClusterInClusters = (clusters: Cluster[], cluster: Cluster) =>
  clusters.some((selectedCluster) => selectedCluster.name?.toString().trim() === cluster.name?.toString().trim())
