/* Copyright Contributors to the Open Cluster Management project */

import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import {
  ManagedClusterSetBinding,
  ManagedClusterSetBindingApiVersion,
  ManagedClusterSetBindingKind,
} from '../managed-cluster-set-binding'
import { MulticlusterRoleAssignmentNamespace } from '../multicluster-role-assignment'
import { createResource, IRequestResult } from '../utils'

/**
 * Creates a new ManagedClusterSetBinding resource.
 *
 * @param managedClusterSetBinding - The ManagedClusterSetBinding to create
 * @returns IRequestResult containing the promise and abort function
 */
const create = (managedClusterSetBinding: ManagedClusterSetBinding): IRequestResult<ManagedClusterSetBinding> =>
  createResource<ManagedClusterSetBinding>(managedClusterSetBinding)

/**
 * Query parameters for filtering ManagedClusterSetBinding resources.
 */
interface ManagedClusterSetBindingQuery {
  /** Filter by cluster set names */
  clusterSets?: string[]
  /** Filter by namespaces */
  namespaces?: string[]
}

/**
 * Checks if a ManagedClusterSetBinding's clusterSet matches any of the query's clusterSets.
 *
 * @param managedClusterSetBinding - The binding to check
 * @param query - Query containing clusterSets to match against
 * @returns True if the binding's clusterSet is in the query's clusterSets
 */
const isManagedClusterSetBindingClustersMatch = (
  managedClusterSetBinding: ManagedClusterSetBinding,
  query: ManagedClusterSetBindingQuery
) => query.clusterSets?.length && query.clusterSets.includes(managedClusterSetBinding.spec.clusterSet)

/**
 * Checks if a ManagedClusterSetBinding's namespace matches any of the query's namespaces.
 *
 * @param managedClusterSetBinding - The binding to check
 * @param query - Query containing namespaces to match against
 * @returns True if the binding's namespace is in the query's namespaces
 */
const isManagedClusterSetBindingNamespacesMatch = (
  managedClusterSetBinding: ManagedClusterSetBinding,
  query: ManagedClusterSetBindingQuery
) => query.namespaces?.length && query.namespaces.includes(managedClusterSetBinding.metadata.namespace!)

/**
 * Filters ManagedClusterSetBindings by cluster set and namespace.
 * Both conditions must match (logical AND).
 *
 * @param managedClusterSetBindings - Array of bindings to filter
 * @param query - Query parameters for filtering
 * @returns Array of ManagedClusterSetBindings matching both clusterSets and namespaces
 */
export const findManagedClusterSetBinding = (
  managedClusterSetBindings: ManagedClusterSetBinding[],
  query: ManagedClusterSetBindingQuery
): ManagedClusterSetBinding[] =>
  managedClusterSetBindings?.filter(
    (managedClusterSetBinding) =>
      isManagedClusterSetBindingClustersMatch(managedClusterSetBinding, query) &&
      isManagedClusterSetBindingNamespacesMatch(managedClusterSetBinding, query)
  )

/**
 * React hook to find ManagedClusterSetBindings matching the query from global Recoil state.
 *
 * @param query - Query parameters for filtering bindings
 * @returns Array of ManagedClusterSetBindings matching the query
 */
export const useFindManagedClusterSetBinding = (query: ManagedClusterSetBindingQuery): ManagedClusterSetBinding[] => {
  const { managedClusterSetBindingsState } = useSharedAtoms()
  const managedClusterSetBindings = useRecoilValue(managedClusterSetBindingsState)

  return findManagedClusterSetBinding(managedClusterSetBindings, query)
}

/**
 * Creates a ManagedClusterSetBinding for a specific cluster set.
 * The binding name will be the same as the cluster set name.
 * Used when creating role assignments that target cluster sets.
 *
 * @param clusterSet - The cluster set name to bind
 * @param namespace - Namespace for the binding (defaults to MulticlusterRoleAssignmentNamespace)
 * @returns IRequestResult containing the promise and abort function
 */
export const createForClusterSets = (clusterSet: string, namespace = MulticlusterRoleAssignmentNamespace) => {
  const managedClusterSetBinding: ManagedClusterSetBinding = {
    apiVersion: ManagedClusterSetBindingApiVersion,
    kind: ManagedClusterSetBindingKind,
    metadata: { name: clusterSet, namespace },
    spec: {
      clusterSet,
    },
  }
  return create(managedClusterSetBinding)
}
