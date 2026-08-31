/* Copyright Contributors to the Open Cluster Management project */

import { jsonRequest } from './json-request'
import { logger } from './logger'
import { getServiceAccountToken } from './serviceAccountToken'

export interface ManagedClusterAddOn {
  metadata: {
    name: string
  }
  status?: {
    conditions?: Array<{
      reason: string
      status: string
    }>
  }
}

interface ManagedClusterAddOnList {
  items: ManagedClusterAddOn[]
}

export async function getManagedClusterAddOns(
  namespace: string,
  throwErrors?: boolean
): Promise<ManagedClusterAddOn[]> {
  const serviceAccountToken = getServiceAccountToken()

  try {
    const response = await jsonRequest<ManagedClusterAddOnList>(
      process.env.CLUSTER_API_URL +
        `/apis/addon.open-cluster-management.io/v1alpha1/namespaces/${namespace}/managedclusteraddons`,
      serviceAccountToken
    )
    return response.items || []
  } catch (err) {
    if (throwErrors) {
      throw err
    }
    logger.error({
      msg: 'Error getting ManagedClusterAddOns',
      namespace,
      error: err instanceof Error ? err.message : String(err),
    })
    return []
  }
}

export async function getManagedClusterAddOn(
  namespace: string,
  name: string,
  throwErrors?: boolean
): Promise<ManagedClusterAddOn | undefined> {
  const addons = await getManagedClusterAddOns(namespace, throwErrors)
  return addons.find((addon) => addon.metadata.name === name)
}

export function isAddOnHealthy(addon: ManagedClusterAddOn): boolean {
  if (!addon.status?.conditions) {
    return false
  }

  return (
    addon.status.conditions.find((condition) => condition.reason === 'ManagedClusterAddOnLeaseUpdated')?.status ===
    'True'
  )
}
