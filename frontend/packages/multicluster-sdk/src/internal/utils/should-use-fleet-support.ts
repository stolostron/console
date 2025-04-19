/* Copyright Contributors to the Open Cluster Management project */

import { FleetSupport } from '../context/fleet-support'

export function shouldUseFleetSupport(
  fleetSupport: FleetSupport | undefined,
  cluster: string | undefined
): fleetSupport is FleetSupport {
  return !!fleetSupport && !!cluster && cluster !== fleetSupport.hubClusterName
}
