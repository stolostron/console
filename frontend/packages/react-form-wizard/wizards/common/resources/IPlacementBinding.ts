import { IResource } from '../../../src/common/resource'

export const PlacementBindingApiGroup = 'policy.open-cluster-management.io'
export const PlacementBindingApiVersion = `${PlacementBindingApiGroup}/v1`
export const PlacementBindingKind = 'PlacementBinding'
export const PlacementBindingType = { apiVersion: PlacementBindingApiVersion, kind: PlacementBindingKind }

/**
Placement defines a rule to select a set of ManagedClusters from the ManagedClusterSets bound to the placement namespace. 
Here is how the placement policy combines with other selection methods to determine a matching list of ManagedClusters: 1) Kubernetes clusters are registered with hub as cluster-scoped ManagedClusters; 2) ManagedClusters are organized into cluster-scoped ManagedClusterSets; 3) ManagedClusterSets are bound to workload namespaces; 4) Namespace-scoped Placements specify a slice of ManagedClusterSets which select a working set    of potential ManagedClusters; 5) Then Placements subselect from that working set using label/claim selection. 
No ManagedCluster will be selected if no ManagedClusterSet is bound to the placement namespace. User is able to bind a ManagedClusterSet to a namespace by creating a ManagedClusterSetBinding in that namespace if they have a RBAC rule to CREATE on the virtual subresource of `managedclustersets/bind`. 
A slice of PlacementDecisions with label cluster.open-cluster-management.io/placement={placement name} will be created to represent the ManagedClusters selected by this placement. 
If a ManagedCluster is selected and added into the PlacementDecisions, other components may apply workload on it; once it is removed from the PlacementDecisions, the workload applied on this ManagedCluster should be evicted accordingly.
*/
export type IPlacementBinding = IResource & {
    // spec?: {}
}

export interface IPlacementSubject {
    name?: string
    kind?: string
    apiGroup?: string
}
