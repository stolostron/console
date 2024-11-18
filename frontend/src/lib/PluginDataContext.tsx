/* Copyright Contributors to the Open Cluster Management project */
import { Dispatch, createContext, useState, SetStateAction, useMemo } from 'react'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import * as atoms from '../atoms'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import * as recoil from 'recoil'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import * as selectors from '../selectors'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import * as reactQuery from '@tanstack/react-query'
import { getBackendUrl } from '../resources/utils'

export type PluginData = {
  recoil: typeof recoil
  atoms: typeof atoms
  selectors: typeof selectors
  reactQuery: typeof reactQuery
  backendUrl: string
  loaded: boolean
  receivedFirstPacket: boolean
  startLoading: boolean
  setLoaded: Dispatch<SetStateAction<boolean>>
  setReceivedFirstPacket: Dispatch<SetStateAction<boolean>>
  load: () => void
}

export const defaultContext = {
  recoil,
  atoms,
  selectors,
  reactQuery,
  backendUrl: '',
  loaded: false,
  receivedFirstPacket: false,
  startLoading: false,
  setLoaded: () => {},
  setReceivedFirstPacket: () => {},
  load: () => {},
}

export const PluginDataContext = createContext<PluginData>(defaultContext)

export const usePluginDataContextValue = () => {
  const [receivedFirstPacket, setReceivedFirstPacket] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [startLoading, setStartLoading] = useState(false)
  const backendUrl = getBackendUrl()

  const contextValue = useMemo(
    () => ({
      recoil,
      atoms,
      selectors,
      backendUrl,
      reactQuery,
      loaded,
      receivedFirstPacket,
      startLoading,
      setLoaded,
      setReceivedFirstPacket,
      load: () => setStartLoading(true),
    }),
    [backendUrl, receivedFirstPacket, loaded, startLoading]
  )
  return contextValue
}

usePluginDataContextValue.context = PluginDataContext
