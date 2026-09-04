import { searchClient } from '../routes/Search/search-sdk/search-client'
/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { useSearchResultCountQuery } from '../routes/Search/search-sdk/search-sdk'

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

  // Build search filters
  const searchFilters = useMemo(() => {
    const filters = [
      {
        property: 'kind',
        values: ['virtualmachine'],
      },
    ]

    if (clusterName) {
      filters.push({
        property: 'cluster',
        values: [clusterName],
      })
    }

    return filters
  }, [clusterName])

  // Use count query — only need to know if VMs exist, not fetch all items
  const {
    data,
    loading: isLoading,
    error: vmSearchError,
  } = useSearchResultCountQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: {
      input: [
        {
          filters: searchFilters,
        },
      ],
    },
    pollInterval: pollInterval ? pollInterval * 1000 : undefined, // Convert seconds to milliseconds
  })

  const hasVirtualMachines = useMemo(() => {
    // Don't show positive result if there's an error searching
    if (vmSearchError) {
      return false
    }
    // Check if we have any VirtualMachine resources in the search results
    const count = data?.searchResult?.[0]?.count ?? 0
    return count > 0
  }, [data, vmSearchError])

  return {
    hasVirtualMachines,
    isLoading,
    error: vmSearchError,
  }
}
