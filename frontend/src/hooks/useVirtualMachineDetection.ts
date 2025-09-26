/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { useFleetSearchPoll } from '@stolostron/multicluster-sdk'

interface UseVirtualMachineDetectionOptions {
  /** Optional cluster name to scope the search to a specific cluster */
  clusterName?: string
  /** Polling interval in seconds. If undefined, polling is disabled */
  pollInterval?: number
}

interface UseVirtualMachineDetectionResult {
  /** Whether any VirtualMachine resources were found */
  hasVirtualMachines: boolean
  /** Whether the search is currently loading */
  isLoading: boolean
  /** Any error that occurred during the search */
  error?: Error
  /** Virtual machines data */
  virtualMachines?: any[]
}

/**
 * Custom hook to detect VirtualMachine resources in the cluster(s).
 *
 * @param options - Configuration options for the VM detection
 * @returns Object containing detection results and loading state
 *
 * @example
 * // Detect VMs across all clusters
 * const { hasVirtualMachines, isLoading } = useVirtualMachineDetection()
 *
 * @example
 * // Detect VMs on a specific cluster
 * const { hasVirtualMachines } = useVirtualMachineDetection({
 *   clusterName: 'my-cluster'
 * })
 */
export function useVirtualMachineDetection(
  options: UseVirtualMachineDetectionOptions = {}
): UseVirtualMachineDetectionResult {
  const { clusterName, pollInterval } = options

  // Build advanced search filters for cluster scoping
  const advancedFilters = useMemo(() => {
    if (!clusterName) {
      return undefined
    }
    return [
      {
        property: 'cluster',
        values: [clusterName],
      },
    ]
  }, [clusterName])

  // Search for VirtualMachine resources
  const [virtualMachines, isLoading, vmSearchError] = useFleetSearchPoll(
    {
      groupVersionKind: {
        group: 'kubevirt.io',
        version: 'v1',
        kind: 'VirtualMachine',
      },
      isList: true,
      limit: 1, // Only need to know if at least one exists
    },
    advancedFilters,
    pollInterval ?? false
  )

  const hasVirtualMachines = useMemo(() => {
    // Don't show positive result if there's an error searching
    if (vmSearchError) {
      return false
    }
    return Array.isArray(virtualMachines) && virtualMachines.length > 0
  }, [virtualMachines, vmSearchError])

  return {
    hasVirtualMachines,
    isLoading,
    error: vmSearchError,
    virtualMachines,
  }
}
