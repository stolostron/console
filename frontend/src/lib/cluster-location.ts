/* Copyright Contributors to the Open Cluster Management project */

export type ClusterLocation = { readonly region?: string; readonly zone?: string; readonly datacenter?: string }

const LOCATION_LABELS = {
  region: 'region',
  zone: 'zone',
  datacenter: 'datacenter',
  topologyRegion: 'topology.kubernetes.io/region',
  topologyZone: 'topology.kubernetes.io/zone',
} as const

/**
 * Reads location from cluster labels. The short `region` and `zone` labels win over the
 * `topology.kubernetes.io/*` labels, even when they disagree. `datacenter` has no topology equivalent.
 * Empty values are treated as unset and omitted from the result.
 */
export function getClusterLocation(labels?: Record<string, string>): ClusterLocation {
  const region = labels?.[LOCATION_LABELS.region] || labels?.[LOCATION_LABELS.topologyRegion]
  const zone = labels?.[LOCATION_LABELS.zone] || labels?.[LOCATION_LABELS.topologyZone]
  const datacenter = labels?.[LOCATION_LABELS.datacenter]
  return {
    ...(region && { region }),
    ...(zone && { zone }),
    ...(datacenter && { datacenter }),
  }
}
