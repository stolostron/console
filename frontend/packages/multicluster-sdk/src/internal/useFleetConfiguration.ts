/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useMemo, useRef, useState } from 'react'
import { FLEET_CONFIGURATION_URL, HUB_API_FAILED_ERROR, NO_FLEET_AVAILABLE_ERROR } from './constants'
import { getBackendUrl, useIsFleetAvailable } from '../api'
import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk'

let initializationPromise: Promise<FleetConfiguration> | null = null
export let cachedFleetConfiguration: FleetConfiguration | null = null
let isInitialized: boolean = false

export type FleetConfiguration = {
  isGlobalHub: boolean
  localHubName: string
  isHubSelfManaged: boolean
  isObservabilityInstalled: boolean
}

export type UseFleetConfiguration = () => [fleetConfiguration: FleetConfiguration | null, loaded: boolean, error: any]

/**
 * Initializes the Fleet SDK with global configurations.
 * This function is designed to be called only once during the application lifecycle.
 */
const initializeFleetConfiguration = async (): Promise<FleetConfiguration> => {
  if (cachedFleetConfiguration && isInitialized) {
    return cachedFleetConfiguration
  }

  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async () => {
    try {
      const result = await consoleFetchJSON(`${getBackendUrl()}${FLEET_CONFIGURATION_URL}`, 'GET')
      if (!result) {
        throw new Error(HUB_API_FAILED_ERROR)
      }
      cachedFleetConfiguration = result as FleetConfiguration
      isInitialized = true
      return cachedFleetConfiguration
    } catch (error) {
      initializationPromise = null
      isInitialized = false
      throw error
    }
  })()

  return initializationPromise
}

/**
 * Hook that initializes the Fleet SDK once and provides fleet configuration.
 * Subsequent calls to this hook will not trigger re-initialization.
 *
 * @returns Array with `fleetConfiguration`, `loaded` and `error` values.
 */
export const useFleetConfiguration: UseFleetConfiguration = () => {
  const hasInitialized = useRef(false)
  const [error, setError] = useState<Error | null>(null)
  const [loaded, setLoaded] = useState<boolean>(false)
  const [fleetConfiguration, setFleetConfiguration] = useState<FleetConfiguration | null>(null)

  const fleetAvailable = useIsFleetAvailable()

  useEffect(() => {
    if (!fleetAvailable) {
      setFleetConfiguration(null)
      setLoaded(false)
      setError(new Error(NO_FLEET_AVAILABLE_ERROR))
      return
    }

    if (hasInitialized.current) {
      return
    }

    hasInitialized.current = true

    initializeFleetConfiguration()
      .then((data) => {
        setFleetConfiguration(data)
        setLoaded(true)
      })
      .catch((err) => {
        setError(err)
        setLoaded(true)
        hasInitialized.current = false // Allow retry on error
      })
  }, [fleetAvailable])

  return useMemo(() => [fleetConfiguration, loaded, error], [fleetConfiguration, loaded, error])
}

/**
 * Direct function to get initialization status without using the hook.
 * Useful for non-React contexts.
 */
export const isFleetConfigurationInitialized = (): boolean => isInitialized

/**
 * Reset initialization state - primarily for testing purposes.
 */
export const resetFleetConfigurationInitialization = (): void => {
  isInitialized = false
  initializationPromise = null
  cachedFleetConfiguration = null
}
