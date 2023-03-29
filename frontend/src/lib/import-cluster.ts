/* Copyright Contributors to the Open Cluster Management project */

import {
  createKlusterletAddonConfig,
  createManagedCluster,
  managedClusterSetLabel,
  ResourceError,
  ResourceErrorCode,
} from '../resources'

export const createImportResources = (clusterName: string, clusterSet?: string) => {
  const clusterLabels: Record<string, string> = {
    cloud: 'auto-detect',
    vendor: 'auto-detect',
    name: clusterName,
  }
  if (clusterSet) {
    clusterLabels[managedClusterSetLabel] = clusterSet
  }
  return {
    promise: createManagedCluster({ clusterName, clusterLabels }).promise.then((mc) =>
      createKlusterletAddonConfig({ clusterName, clusterLabels })
        .promise.catch((err) => {
          // ignore conflict if KlusterletAddonConfig already exists
          if (!(err instanceof ResourceError && err.code === ResourceErrorCode.Conflict)) {
            throw err
          }
        })
        .then(() => mc)
    ),
    abort: () => {},
  }
}
