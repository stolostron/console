/* Copyright Contributors to the Open Cluster Management project */
import { createContext, useState, useMemo, Dispatch, SetStateAction } from 'react'
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
  loadCompleted: boolean
  loadStarted: boolean
  startLoading: boolean
  setLoadCompleted: Dispatch<SetStateAction<boolean>>
  setLoadStarted: Dispatch<SetStateAction<boolean>>
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
  setLoadCompleted: () => {},
  setLoadStarted: () => {},
  load: () => {},
}

export const PluginDataContext = createContext<PluginData>(defaultContext)

export const usePluginDataContextValue = () => {
  const [loadStarted, setLoadStarted] = useState(process.env.NODE_ENV === 'test')
  const [loadCompleted, setLoadCompleted] = useState(process.env.NODE_ENV === 'test')
  const [startLoading, setStartLoading] = useState(false)
  const backendUrl = getBackendUrl()

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
      setLoadCompleted,
      setLoadStarted,
      load: () => setStartLoading(true),
    }),
    [backendUrl, loadStarted, loadCompleted, startLoading]
  )
  return contextValue
}

usePluginDataContextValue.context = PluginDataContext
