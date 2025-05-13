/* Copyright Contributors to the Open Cluster Management project */
import { useContext } from 'react'
import { FleetSupportContext } from '../context/FleetSupportContext'

export function useFleetSupport() {
  return useContext(FleetSupportContext)
}
