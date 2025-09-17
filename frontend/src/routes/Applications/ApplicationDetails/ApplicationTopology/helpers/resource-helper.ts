/* Copyright Contributors to the Open Cluster Management project */

import queryString from 'query-string'
import type { EditLinkParams } from './types'

/**
 * Build a Search YAML editor link for a Kubernetes resource.
 * Falls back to the hub cluster when a specific cluster is not provided.
 */
export const getEditLink = (
  { name, namespace, kind, apiVersion, cluster }: EditLinkParams,
  hubClusterName: string
): string => {
  const cls = cluster ? cluster : hubClusterName
  return `/multicloud/search/resources/yaml?${queryString.stringify({
    cluster: cls,
    name,
    namespace,
    kind,
    apiversion: apiVersion,
  })}`
}
