/* Copyright Contributors to the Open Cluster Management project */

export type ClusterLocation = { region?: string; zone?: string; datacenter?: string }

export function getClusterLocation(labels?: Record<string, string>): ClusterLocation {
  const location: ClusterLocation = {}
  const region = labels?.['region'] || labels?.['topology.kubernetes.io/region']
  const zone = labels?.['zone'] || labels?.['topology.kubernetes.io/zone']
  const datacenter = labels?.['datacenter']
  if (region) location.region = region
  if (zone) location.zone = zone
  if (datacenter) location.datacenter = datacenter
  return location
}
