import { IResource } from '../../../src/common/resource'
import { IExpression } from './IMatchExpression'

export const PlacementApiGroup = 'cluster.open-cluster-management.io'
export const PlacementApiVersion = `${PlacementApiGroup}/v1beta1`
export const PlacementKind = 'Placement'
export const PlacementType = { apiVersion: PlacementApiVersion, kind: PlacementKind }

/**
Placement defines a rule to select a set of ManagedClusters from the ManagedClusterSets bound to the placement namespace. 
Here is how the placement policy combines with other selection methods to determine a matching list of ManagedClusters: 1) Kubernetes clusters are registered with hub as cluster-scoped ManagedClusters; 2) ManagedClusters are organized into cluster-scoped ManagedClusterSets; 3) ManagedClusterSets are bound to workload namespaces; 4) Namespace-scoped Placements specify a slice of ManagedClusterSets which select a working set    of potential ManagedClusters; 5) Then Placements subselect from that working set using label/claim selection. 
No ManagedCluster will be selected if no ManagedClusterSet is bound to the placement namespace. User is able to bind a ManagedClusterSet to a namespace by creating a ManagedClusterSetBinding in that namespace if they have a RBAC rule to CREATE on the virtual subresource of `managedclustersets/bind`. 
A slice of PlacementDecisions with label cluster.open-cluster-management.io/placement={placement name} will be created to represent the ManagedClusters selected by this placement. 
If a ManagedCluster is selected and added into the PlacementDecisions, other components may apply workload on it; once it is removed from the PlacementDecisions, the workload applied on this ManagedCluster should be evicted accordingly.
*/
export type IPlacement = IResource & {
    metadata?: { name?: string; namespace?: string }
    spec?: {
        /** 
        ClusterSets represent the ManagedClusterSets from which theManagedClusters are selected. If the slice is empty,
        ManagedClusters will be selected from the ManagedClusterSets bound to the placement namespace, otherwise 
        ManagedClusters will be selected from the intersection of this slice and the ManagedClusterSets bound to the placement namespace.
         */
        clusterSets?: string[]

        /**
            NumberOfClusters represents the desired number of
            ManagedClusters to be selected which meet the placement
            requirements. 1) If not specified, all ManagedClusters which
            meet the placement requirements (including ClusterSets,   
            and Predicates) will be selected; 2) Otherwise if the nubmer
            of ManagedClusters meet the placement requirements is larger
            than    NumberOfClusters, a random subset with desired
            number of ManagedClusters will be selected; 3) If the nubmer
            of ManagedClusters meet the placement requirements is equal
            to NumberOfClusters,    all of them will be selected; 4) If
            the nubmer of ManagedClusters meet the placement
            requirements is less than NumberOfClusters,    all of them
            will be selected, and the status of condition
            `PlacementConditionSatisfied` will be    set to false;
        */
        numberOfClusters?: number

        /**
        Predicates represent a slice of predicates to select ManagedClusters.
        The predicates are ORed.
         */
        predicates?: Predicate[]
    }
}

export interface Predicate {
    /** RequiredClusterSelector represents a selector of ManagedClusters by label and claim. */
    requiredClusterSelector?: {
        /** LabelSelector represents a selector of ManagedClusters by label */
        labelSelector?: {
            matchLabels?: { [key: string]: string }
            matchExpressions?: IExpression[]
        }
        /** ClaimSelector represents a selector of ManagedClusters by clusterClaims in status */
        claimSelector?: {
            matchExpressions?: IExpression[]
        }
    }
}
