import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Capacity = {
  cpu?: Maybe<Scalars['String']>;
  memory?: Maybe<Scalars['String']>;
};

export type ClusterDeployment = {
  apiVersion: Scalars['String'];
  kind: Scalars['String'];
  metadata: Metadata;
};

export type ClusterDeploymentInput = {
  apiVip: Scalars['String'];
  baseDomain: Scalars['String'];
  clusterImageSetName: Scalars['String'];
  clusterName: Scalars['String'];
  clusterNetworkCidr: Scalars['String'];
  externalNetworkBridge: Scalars['String'];
  ingressVip: Scalars['String'];
  labels: Array<Scalars['String']>;
  machineCidr: Scalars['String'];
  networkHostPrefix: Scalars['String'];
  networkType: Scalars['String'];
  providerConnectionName: Scalars['String'];
  providerName: Scalars['String'];
  provisioningNetworkBridge: Scalars['String'];
  provisioningNetworkCidr: Scalars['String'];
  provisioningNetworkInterface: Scalars['String'];
  serviceNetworkCidr: Scalars['String'];
};

export type ClusterImageSet = {
  apiVersion: Scalars['String'];
  kind: Scalars['String'];
  metadata: Metadata;
};

export type Condition = {
  lastTransitionTime?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
  reason?: Maybe<Scalars['String']>;
  status: Scalars['String'];
  type: Scalars['String'];
};

export type ManagedCluster = {
  apiVersion: Scalars['String'];
  displayStatus: Scalars['String'];
  info?: Maybe<ManagedClusterInfo>;
  kind: Scalars['String'];
  metadata: Metadata;
  spec: ManagedClusterSpec;
  status?: Maybe<ManagedClusterStatus>;
};

export type ManagedClusterInfo = {
  apiVersion: Scalars['String'];
  kind: Scalars['String'];
  metadata: Metadata;
  status?: Maybe<ManagedClusterInfoStatus>;
};

export type ManagedClusterInfoStatus = {
  conditions: Array<Condition>;
  nodeList?: Maybe<Array<Node>>;
};

export type ManagedClusterSpec = {
  hubAcceptsClient: Scalars['String'];
  leaseDurationSeconds: Scalars['Float'];
};

export type ManagedClusterStatus = {
  allocatable?: Maybe<Capacity>;
  capacity?: Maybe<Capacity>;
  conditions: Array<Condition>;
  version: ManagedClusterVersion;
};

export type ManagedClusterVersion = {
  kubernetes?: Maybe<Scalars['String']>;
};

export type Metadata = {
  creationTimestamp: Scalars['String'];
  labels: Array<Scalars['String']>;
  name: Scalars['String'];
  namespace?: Maybe<Scalars['String']>;
  uid: Scalars['String'];
};

export type Mutation = {
  createClusterDeployment: Scalars['Boolean'];
  createProviderConnection?: Maybe<Scalars['Boolean']>;
  deleteProviderConnection?: Maybe<Scalars['Boolean']>;
  deleteSecret: Scalars['Boolean'];
};


export type MutationCreateClusterDeploymentArgs = {
  input: ClusterDeploymentInput;
};


export type MutationCreateProviderConnectionArgs = {
  input: ProviderConnectionInput;
};


export type MutationDeleteProviderConnectionArgs = {
  name: Scalars['String'];
  namespace: Scalars['String'];
};


export type MutationDeleteSecretArgs = {
  name: Scalars['String'];
  namespace: Scalars['String'];
};

export type Namespace = {
  apiVersion: Scalars['String'];
  kind: Scalars['String'];
  metadata: Metadata;
};

export type Node = {
  capacity: Capacity;
  conditions: Array<Condition>;
  name: Scalars['String'];
};

export type ProviderConnection = {
  apiVersion: Scalars['String'];
  data: ProviderConnectionData;
  kind: Scalars['String'];
  metadata: Metadata;
};

export type ProviderConnectionData = {
  awsAccessKeyID?: Maybe<Scalars['String']>;
  awsSecretAccessKeyID?: Maybe<Scalars['String']>;
  baseDomain: Scalars['String'];
  baseDomainResourceGroupName?: Maybe<Scalars['String']>;
  cacertificate?: Maybe<Scalars['String']>;
  clientId?: Maybe<Scalars['String']>;
  clientsecret?: Maybe<Scalars['String']>;
  datacenter?: Maybe<Scalars['String']>;
  datastore?: Maybe<Scalars['String']>;
  gcProjectID?: Maybe<Scalars['String']>;
  gcServiceAccountKey?: Maybe<Scalars['String']>;
  isOcp?: Maybe<Scalars['Boolean']>;
  libvirtURI?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
  pullSecret: Scalars['String'];
  sshPrivatekey: Scalars['String'];
  sshPublickey: Scalars['String'];
  subscriptionid?: Maybe<Scalars['String']>;
  tenantid?: Maybe<Scalars['String']>;
  username?: Maybe<Scalars['String']>;
  vcenter?: Maybe<Scalars['String']>;
  vmClusterName?: Maybe<Scalars['String']>;
};

export type ProviderConnectionDataInput = {
  awsAccessKeyID?: Maybe<Scalars['String']>;
  awsSecretAccessKeyID?: Maybe<Scalars['String']>;
  baseDomain: Scalars['String'];
  baseDomainResourceGroupName?: Maybe<Scalars['String']>;
  cacertificate?: Maybe<Scalars['String']>;
  clientId?: Maybe<Scalars['String']>;
  clientsecret?: Maybe<Scalars['String']>;
  datacenter?: Maybe<Scalars['String']>;
  datastore?: Maybe<Scalars['String']>;
  gcProjectID?: Maybe<Scalars['String']>;
  gcServiceAccountKey?: Maybe<Scalars['String']>;
  isOcp?: Maybe<Scalars['Boolean']>;
  libvirtURI?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
  pullSecret: Scalars['String'];
  sshPrivatekey: Scalars['String'];
  sshPublickey: Scalars['String'];
  subscriptionid?: Maybe<Scalars['String']>;
  tenantid?: Maybe<Scalars['String']>;
  username?: Maybe<Scalars['String']>;
  vcenter?: Maybe<Scalars['String']>;
  vmClusterName?: Maybe<Scalars['String']>;
};

export type ProviderConnectionInput = {
  data: ProviderConnectionDataInput;
  name: Scalars['String'];
  namespace: Scalars['String'];
  providerID: Scalars['String'];
};

export type Query = {
  clusterDeployments: Array<ClusterDeployment>;
  clusterImageSets: Array<ClusterImageSet>;
  managedClusters: Array<ManagedCluster>;
  namespaces: Array<Namespace>;
  providerConnections: Array<ProviderConnection>;
  secrets: Array<Secret>;
};


export type QueryClusterDeploymentsArgs = {
  fieldSelector?: Maybe<Scalars['String']>;
  labelSelector?: Maybe<Scalars['String']>;
};


export type QueryClusterImageSetsArgs = {
  fieldSelector?: Maybe<Scalars['String']>;
  labelSelector?: Maybe<Scalars['String']>;
};


export type QueryManagedClustersArgs = {
  fieldSelector?: Maybe<Scalars['String']>;
  labelSelector?: Maybe<Scalars['String']>;
};


export type QueryNamespacesArgs = {
  fieldSelector?: Maybe<Scalars['String']>;
  labelSelector?: Maybe<Scalars['String']>;
};


export type QuerySecretsArgs = {
  fieldSelector?: Maybe<Scalars['String']>;
  labelSelector?: Maybe<Scalars['String']>;
};

export type Secret = {
  apiVersion: Scalars['String'];
  kind: Scalars['String'];
  metadata: Metadata;
};

export type CreateClusterDeploymentMutationVariables = Exact<{
  input: ClusterDeploymentInput;
}>;


export type CreateClusterDeploymentMutation = Pick<Mutation, 'createClusterDeployment'>;

export type ClusterImageSetsQueryVariables = Exact<{
  labelSelector?: Maybe<Scalars['String']>;
}>;


export type ClusterImageSetsQuery = { clusterImageSets: Array<{ metadata: Pick<Metadata, 'uid' | 'name' | 'namespace' | 'labels'> }> };

export type ManagedClustersQueryVariables = Exact<{ [key: string]: never; }>;


export type ManagedClustersQuery = { managedClusters: Array<(
    Pick<ManagedCluster, 'displayStatus'>
    & { metadata: Pick<Metadata, 'uid' | 'name' | 'namespace' | 'labels'>, spec: Pick<ManagedClusterSpec, 'hubAcceptsClient' | 'leaseDurationSeconds'>, status?: Maybe<{ allocatable?: Maybe<Pick<Capacity, 'memory' | 'cpu'>>, capacity?: Maybe<Pick<Capacity, 'memory' | 'cpu'>>, conditions: Array<Pick<Condition, 'lastTransitionTime' | 'reason' | 'status' | 'type' | 'message'>>, version: Pick<ManagedClusterVersion, 'kubernetes'> }>, info?: Maybe<{ metadata: Pick<Metadata, 'uid' | 'name' | 'namespace' | 'labels'>, status?: Maybe<{ nodeList?: Maybe<Array<(
          Pick<Node, 'name'>
          & { capacity: Pick<Capacity, 'memory' | 'cpu'>, conditions: Array<Pick<Condition, 'type' | 'status'>> }
        )>>, conditions: Array<Pick<Condition, 'lastTransitionTime' | 'reason' | 'status' | 'type' | 'message'>> }> }> }
  )> };

export type NamespacesQueryVariables = Exact<{
  labelSelector?: Maybe<Scalars['String']>;
}>;


export type NamespacesQuery = { namespaces: Array<{ metadata: Pick<Metadata, 'uid' | 'name' | 'namespace' | 'labels'> }> };

export type ProviderConnectionsQueryVariables = Exact<{ [key: string]: never; }>;


export type ProviderConnectionsQuery = { providerConnections: Array<{ metadata: Pick<Metadata, 'uid' | 'name' | 'namespace' | 'labels'>, data: Pick<ProviderConnectionData, 'baseDomain'> }> };

export type CreateProviderConnectionMutationVariables = Exact<{
  input: ProviderConnectionInput;
}>;


export type CreateProviderConnectionMutation = Pick<Mutation, 'createProviderConnection'>;

export type DeleteProviderConnectionMutationVariables = Exact<{
  name: Scalars['String'];
  namespace: Scalars['String'];
}>;


export type DeleteProviderConnectionMutation = Pick<Mutation, 'deleteProviderConnection'>;


export const CreateClusterDeploymentDocument = gql`
    mutation createClusterDeployment($input: ClusterDeploymentInput!) {
  createClusterDeployment(input: $input)
}
    `;
export type CreateClusterDeploymentMutationFn = Apollo.MutationFunction<CreateClusterDeploymentMutation, CreateClusterDeploymentMutationVariables>;

/**
 * __useCreateClusterDeploymentMutation__
 *
 * To run a mutation, you first call `useCreateClusterDeploymentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateClusterDeploymentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createClusterDeploymentMutation, { data, loading, error }] = useCreateClusterDeploymentMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateClusterDeploymentMutation(baseOptions?: Apollo.MutationHookOptions<CreateClusterDeploymentMutation, CreateClusterDeploymentMutationVariables>) {
        return Apollo.useMutation<CreateClusterDeploymentMutation, CreateClusterDeploymentMutationVariables>(CreateClusterDeploymentDocument, baseOptions);
      }
export type CreateClusterDeploymentMutationHookResult = ReturnType<typeof useCreateClusterDeploymentMutation>;
export type CreateClusterDeploymentMutationResult = Apollo.MutationResult<CreateClusterDeploymentMutation>;
export type CreateClusterDeploymentMutationOptions = Apollo.BaseMutationOptions<CreateClusterDeploymentMutation, CreateClusterDeploymentMutationVariables>;
export const ClusterImageSetsDocument = gql`
    query clusterImageSets($labelSelector: String) {
  clusterImageSets(labelSelector: $labelSelector) {
    metadata {
      uid
      name
      namespace
      labels
    }
  }
}
    `;

/**
 * __useClusterImageSetsQuery__
 *
 * To run a query within a React component, call `useClusterImageSetsQuery` and pass it any options that fit your needs.
 * When your component renders, `useClusterImageSetsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useClusterImageSetsQuery({
 *   variables: {
 *      labelSelector: // value for 'labelSelector'
 *   },
 * });
 */
export function useClusterImageSetsQuery(baseOptions?: Apollo.QueryHookOptions<ClusterImageSetsQuery, ClusterImageSetsQueryVariables>) {
        return Apollo.useQuery<ClusterImageSetsQuery, ClusterImageSetsQueryVariables>(ClusterImageSetsDocument, baseOptions);
      }
export function useClusterImageSetsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ClusterImageSetsQuery, ClusterImageSetsQueryVariables>) {
          return Apollo.useLazyQuery<ClusterImageSetsQuery, ClusterImageSetsQueryVariables>(ClusterImageSetsDocument, baseOptions);
        }
export type ClusterImageSetsQueryHookResult = ReturnType<typeof useClusterImageSetsQuery>;
export type ClusterImageSetsLazyQueryHookResult = ReturnType<typeof useClusterImageSetsLazyQuery>;
export type ClusterImageSetsQueryResult = Apollo.QueryResult<ClusterImageSetsQuery, ClusterImageSetsQueryVariables>;
export const ManagedClustersDocument = gql`
    query managedClusters {
  managedClusters {
    metadata {
      uid
      name
      namespace
      labels
    }
    spec {
      hubAcceptsClient
      leaseDurationSeconds
    }
    status {
      allocatable {
        memory
        cpu
      }
      capacity {
        memory
        cpu
      }
      conditions {
        lastTransitionTime
        reason
        status
        type
        message
      }
      version {
        kubernetes
      }
    }
    info {
      metadata {
        uid
        name
        namespace
        labels
      }
      status {
        nodeList {
          name
          capacity {
            memory
            cpu
          }
          conditions {
            type
            status
          }
        }
        conditions {
          lastTransitionTime
          reason
          status
          type
          message
        }
      }
    }
    displayStatus
  }
}
    `;

/**
 * __useManagedClustersQuery__
 *
 * To run a query within a React component, call `useManagedClustersQuery` and pass it any options that fit your needs.
 * When your component renders, `useManagedClustersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useManagedClustersQuery({
 *   variables: {
 *   },
 * });
 */
export function useManagedClustersQuery(baseOptions?: Apollo.QueryHookOptions<ManagedClustersQuery, ManagedClustersQueryVariables>) {
        return Apollo.useQuery<ManagedClustersQuery, ManagedClustersQueryVariables>(ManagedClustersDocument, baseOptions);
      }
export function useManagedClustersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ManagedClustersQuery, ManagedClustersQueryVariables>) {
          return Apollo.useLazyQuery<ManagedClustersQuery, ManagedClustersQueryVariables>(ManagedClustersDocument, baseOptions);
        }
export type ManagedClustersQueryHookResult = ReturnType<typeof useManagedClustersQuery>;
export type ManagedClustersLazyQueryHookResult = ReturnType<typeof useManagedClustersLazyQuery>;
export type ManagedClustersQueryResult = Apollo.QueryResult<ManagedClustersQuery, ManagedClustersQueryVariables>;
export const NamespacesDocument = gql`
    query namespaces($labelSelector: String) {
  namespaces(labelSelector: $labelSelector) {
    metadata {
      uid
      name
      namespace
      labels
    }
  }
}
    `;

/**
 * __useNamespacesQuery__
 *
 * To run a query within a React component, call `useNamespacesQuery` and pass it any options that fit your needs.
 * When your component renders, `useNamespacesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNamespacesQuery({
 *   variables: {
 *      labelSelector: // value for 'labelSelector'
 *   },
 * });
 */
export function useNamespacesQuery(baseOptions?: Apollo.QueryHookOptions<NamespacesQuery, NamespacesQueryVariables>) {
        return Apollo.useQuery<NamespacesQuery, NamespacesQueryVariables>(NamespacesDocument, baseOptions);
      }
export function useNamespacesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<NamespacesQuery, NamespacesQueryVariables>) {
          return Apollo.useLazyQuery<NamespacesQuery, NamespacesQueryVariables>(NamespacesDocument, baseOptions);
        }
export type NamespacesQueryHookResult = ReturnType<typeof useNamespacesQuery>;
export type NamespacesLazyQueryHookResult = ReturnType<typeof useNamespacesLazyQuery>;
export type NamespacesQueryResult = Apollo.QueryResult<NamespacesQuery, NamespacesQueryVariables>;
export const ProviderConnectionsDocument = gql`
    query providerConnections {
  providerConnections {
    metadata {
      uid
      name
      namespace
      labels
    }
    data {
      baseDomain
    }
  }
}
    `;

/**
 * __useProviderConnectionsQuery__
 *
 * To run a query within a React component, call `useProviderConnectionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useProviderConnectionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useProviderConnectionsQuery({
 *   variables: {
 *   },
 * });
 */
export function useProviderConnectionsQuery(baseOptions?: Apollo.QueryHookOptions<ProviderConnectionsQuery, ProviderConnectionsQueryVariables>) {
        return Apollo.useQuery<ProviderConnectionsQuery, ProviderConnectionsQueryVariables>(ProviderConnectionsDocument, baseOptions);
      }
export function useProviderConnectionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ProviderConnectionsQuery, ProviderConnectionsQueryVariables>) {
          return Apollo.useLazyQuery<ProviderConnectionsQuery, ProviderConnectionsQueryVariables>(ProviderConnectionsDocument, baseOptions);
        }
export type ProviderConnectionsQueryHookResult = ReturnType<typeof useProviderConnectionsQuery>;
export type ProviderConnectionsLazyQueryHookResult = ReturnType<typeof useProviderConnectionsLazyQuery>;
export type ProviderConnectionsQueryResult = Apollo.QueryResult<ProviderConnectionsQuery, ProviderConnectionsQueryVariables>;
export const CreateProviderConnectionDocument = gql`
    mutation createProviderConnection($input: ProviderConnectionInput!) {
  createProviderConnection(input: $input)
}
    `;
export type CreateProviderConnectionMutationFn = Apollo.MutationFunction<CreateProviderConnectionMutation, CreateProviderConnectionMutationVariables>;

/**
 * __useCreateProviderConnectionMutation__
 *
 * To run a mutation, you first call `useCreateProviderConnectionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateProviderConnectionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createProviderConnectionMutation, { data, loading, error }] = useCreateProviderConnectionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateProviderConnectionMutation(baseOptions?: Apollo.MutationHookOptions<CreateProviderConnectionMutation, CreateProviderConnectionMutationVariables>) {
        return Apollo.useMutation<CreateProviderConnectionMutation, CreateProviderConnectionMutationVariables>(CreateProviderConnectionDocument, baseOptions);
      }
export type CreateProviderConnectionMutationHookResult = ReturnType<typeof useCreateProviderConnectionMutation>;
export type CreateProviderConnectionMutationResult = Apollo.MutationResult<CreateProviderConnectionMutation>;
export type CreateProviderConnectionMutationOptions = Apollo.BaseMutationOptions<CreateProviderConnectionMutation, CreateProviderConnectionMutationVariables>;
export const DeleteProviderConnectionDocument = gql`
    mutation deleteProviderConnection($name: String!, $namespace: String!) {
  deleteProviderConnection(name: $name, namespace: $namespace)
}
    `;
export type DeleteProviderConnectionMutationFn = Apollo.MutationFunction<DeleteProviderConnectionMutation, DeleteProviderConnectionMutationVariables>;

/**
 * __useDeleteProviderConnectionMutation__
 *
 * To run a mutation, you first call `useDeleteProviderConnectionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteProviderConnectionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteProviderConnectionMutation, { data, loading, error }] = useDeleteProviderConnectionMutation({
 *   variables: {
 *      name: // value for 'name'
 *      namespace: // value for 'namespace'
 *   },
 * });
 */
export function useDeleteProviderConnectionMutation(baseOptions?: Apollo.MutationHookOptions<DeleteProviderConnectionMutation, DeleteProviderConnectionMutationVariables>) {
        return Apollo.useMutation<DeleteProviderConnectionMutation, DeleteProviderConnectionMutationVariables>(DeleteProviderConnectionDocument, baseOptions);
      }
export type DeleteProviderConnectionMutationHookResult = ReturnType<typeof useDeleteProviderConnectionMutation>;
export type DeleteProviderConnectionMutationResult = Apollo.MutationResult<DeleteProviderConnectionMutation>;
export type DeleteProviderConnectionMutationOptions = Apollo.BaseMutationOptions<DeleteProviderConnectionMutation, DeleteProviderConnectionMutationVariables>;