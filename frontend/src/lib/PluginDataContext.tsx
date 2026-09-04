/* Copyright Contributors to the Open Cluster Management project */
import { createContext, useState, useMemo, useCallback, Dispatch, SetStateAction } from 'react'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import * as atoms from '../atoms'

type FlappingEvent = atoms.FlappingEvent
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import * as recoil from 'recoil'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import * as selectors from '../selectors'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import * as reactQuery from '@tanstack/react-query'
import { getBackendUrl } from '../resources/utils'

// startLoading -- LoadPluginData is telling LoadData to make a call backend /events api to start sending resources
// loadStarted -- means at least one packet has been sent from backend; /events sends resouces in packets to the browser can start populating list
// loadCompleted -- means all packets have been sent; is a page doesn't get any data from packets it can show LoadingPage until this is sent
export type PluginData = {
  recoil: typeof recoil
  atoms: typeof atoms
  selectors: typeof selectors
  reactQuery: typeof reactQuery
  backendUrl: string
  loadCompleted: boolean
  loadStarted: boolean
  startLoading: boolean
  isStreamIdle: boolean
  isReconnecting: boolean
  flappingAlerts: FlappingEvent[]
  setLoadCompleted: Dispatch<SetStateAction<boolean>>
  setLoadStarted: Dispatch<SetStateAction<boolean>>
  setIsStreamIdle: Dispatch<SetStateAction<boolean>>
  setIsReconnecting: Dispatch<SetStateAction<boolean>>
  setFlappingAlerts: Dispatch<SetStateAction<FlappingEvent[]>>
  mounted: boolean
  mount: () => void
  unmount: () => void
  load: () => void
}

export const defaultContext = {
  recoil,
  atoms,
  selectors,
  reactQuery,
  backendUrl: '',
  loadCompleted: process.env.NODE_ENV === 'test',
  loadStarted: process.env.NODE_ENV === 'test',
  startLoading: false,
  isStreamIdle: false,
  isReconnecting: false,
  flappingAlerts: [],
  setLoadCompleted: () => {},
  setLoadStarted: () => {},
  setIsStreamIdle: () => {},
  setIsReconnecting: () => {},
  setFlappingAlerts: () => {},
  mounted: false,
  mount: () => {},
  unmount: () => {},
  load: () => {},
}

export const PluginDataContext = createContext<PluginData>(defaultContext)

export const usePluginDataContextValue = () => {
  const [loadStarted, setLoadStarted] = useState(process.env.NODE_ENV === 'test')
  const [loadCompleted, setLoadCompleted] = useState(process.env.NODE_ENV === 'test')
  const [startLoading, setStartLoading] = useState(false)
  const [isStreamIdle, setIsStreamIdle] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [flappingAlerts, setFlappingAlerts] = useState<FlappingEvent[]>([])
  const [mountCount, setMountCount] = useState(0)
  const backendUrl = getBackendUrl()

  const mount = useCallback(() => setMountCount((c) => c + 1), [])
  const unmount = useCallback(() => setMountCount((c) => Math.max(0, c - 1)), [])

  const contextValue = useMemo(
    () => ({
      recoil,
      atoms,
      selectors,
      backendUrl,
      reactQuery,
      loadCompleted,
      loadStarted,
      startLoading,
      isStreamIdle,
      isReconnecting,
      flappingAlerts,
      setLoadCompleted,
      setLoadStarted,
      setIsStreamIdle,
      setIsReconnecting,
      setFlappingAlerts,
      mounted: mountCount > 0,
      mount,
      unmount,
      load: () => setStartLoading(true),
    }),
    [
      backendUrl,
      loadStarted,
      loadCompleted,
      startLoading,
      isStreamIdle,
      isReconnecting,
      flappingAlerts,
      mountCount,
      mount,
      unmount,
    ]
  )
  return contextValue
}

usePluginDataContextValue.context = PluginDataContext
