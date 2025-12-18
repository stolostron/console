/* Copyright Contributors to the Open Cluster Management project */

import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import {
  ManagedClusterSetBinding,
  ManagedClusterSetBindingApiVersion,
  ManagedClusterSetBindingKind,
} from '../managed-cluster-set-binding'
import { MulticlusterRoleAssignmentNamespace } from '../multicluster-role-assignment'
import { createResource, IRequestResult } from '../utils'

const create = (managedClusterSetBinding: ManagedClusterSetBinding): IRequestResult<ManagedClusterSetBinding> =>
  createResource<ManagedClusterSetBinding>(managedClusterSetBinding)

interface ManagedClusterSetBindingQuery {
  clusterSets?: string[]
  namespaces?: string[]
}

const isManagedClusterSetBindingClustersMatch = (
  managedClusterSetBinding: ManagedClusterSetBinding,
  query: ManagedClusterSetBindingQuery
) => query.clusterSets?.length && query.clusterSets.includes(managedClusterSetBinding.spec.clusterSet)

const isManagedClusterSetBindingNamespacesMatch = (
  managedClusterSetBinding: ManagedClusterSetBinding,
  query: ManagedClusterSetBindingQuery
) => query.namespaces?.length && query.namespaces.includes(managedClusterSetBinding.metadata.namespace!)

export const findManagedClusterSetBinding = (
  managedClusterSetBindings: ManagedClusterSetBinding[],
  query: ManagedClusterSetBindingQuery
): ManagedClusterSetBinding[] =>
  managedClusterSetBindings?.filter(
    (managedClusterSetBinding) =>
      isManagedClusterSetBindingClustersMatch(managedClusterSetBinding, query) &&
      isManagedClusterSetBindingNamespacesMatch(managedClusterSetBinding, query)
  )

export const useFindManagedClusterSetBinding = (query: ManagedClusterSetBindingQuery): ManagedClusterSetBinding[] => {
  const { managedClusterSetBindingsState } = useSharedAtoms()
  const managedClusterSetBindings = useRecoilValue(managedClusterSetBindingsState)

  return findManagedClusterSetBinding(managedClusterSetBindings, query)
}

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
