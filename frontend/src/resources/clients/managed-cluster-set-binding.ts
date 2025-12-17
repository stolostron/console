/* Copyright Contributors to the Open Cluster Management project */

import {
  ManagedClusterSetBinding,
  ManagedClusterSetBindingApiVersion,
  ManagedClusterSetBindingKind,
} from '../managed-cluster-set-binding'
import { createResource, IRequestResult } from '../utils'

const create = (managedClusterSetBinding: ManagedClusterSetBinding): IRequestResult<ManagedClusterSetBinding> =>
  createResource<ManagedClusterSetBinding>(managedClusterSetBinding)

export const createForClusterSets = (clusterSet: string, namespace = 'open-cluster-management-global-set') => {
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
