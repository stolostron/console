/* Copyright Contributors to the Open Cluster Management project */
import { useContext } from 'react'
import { FleetSupportContext } from '../context/fleet-support'

export function useFleetSupport() {
  return useContext(FleetSupportContext)
}
