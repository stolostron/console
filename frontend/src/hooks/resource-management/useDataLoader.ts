/* Copyright Contributors to the Open Cluster Management project */
import { useContext, useEffect } from 'react'
import { PluginDataContext } from '../../lib/PluginDataContext'
import { useResourceStateRegistry } from './useResourceStateRegistry'
import { useServerSideEvents } from './useServerSideEvents'
import { useGlobalState } from './useGlobalState'
import { useAuthenticationCheck } from './useAuthenticationCheck'
import { EventProcessingOptions } from './types'

interface UseDataLoaderOptions {
  eventProcessing?: EventProcessingOptions
  authentication?: {
    enabled?: boolean
    checkInterval?: number
  }
}

/**
 * Combined hook that orchestrates all data loading concerns:
 * - Resource state management
 * - Server-side events processing
 * - Global state management
 * - Authentication checking
 */
export function useDataLoader(options: UseDataLoaderOptions = {}) {
  const { loadCompleted, setLoadCompleted } = useContext(PluginDataContext)

  // Set up resource state registry
  const registry = useResourceStateRegistry()

  // Handle server-side events
  const { eventsLoaded } = useServerSideEvents({
    registry,
    options: options.eventProcessing,
  })

  // Manage global state (async - doesn't block loading)
  useGlobalState()

  // Check authentication periodically
  useAuthenticationCheck(options.authentication)

  // Update load completed state when events are loaded
  // Global state updates happen asynchronously and don't block the UI
  useEffect(() => {
    if (!loadCompleted && eventsLoaded) {
      setLoadCompleted(true)
    }
  }, [loadCompleted, eventsLoaded, setLoadCompleted])
}
