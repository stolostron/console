/* Copyright Contributors to the Open Cluster Management project */

import { createContext, ProviderProps } from 'react'

export type LoadStatusType = {
  loadStarted: boolean
  loadCompleted: boolean
}

export const defaultContext = {
  loadStarted: process.env.NODE_ENV === 'test',
  loadCompleted: process.env.NODE_ENV === 'test',
}

export const LoadStatusContext = createContext<LoadStatusType>(defaultContext)

export function LoadStatusProvider(props: ProviderProps<LoadStatusType>) {
  return <LoadStatusContext.Provider value={props.value}>{props.children}</LoadStatusContext.Provider>
}
