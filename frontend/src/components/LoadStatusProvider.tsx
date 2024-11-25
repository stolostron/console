/* Copyright Contributors to the Open Cluster Management project */

import { createContext, Dispatch, ReactNode, SetStateAction, useState } from 'react'

export type LoadStatusType = {
  loadStarted: boolean
  loadCompleted: boolean
  setLoadStarted: Dispatch<SetStateAction<boolean>>
  setLoadCompleted: Dispatch<SetStateAction<boolean>>
}

export const defaultContext = {
  loadStarted: false,
  loadCompleted: false,
  setLoadStarted: () => {},
  setLoadCompleted: () => {},
}

export const LoadStatusContext = createContext<LoadStatusType>(defaultContext)

export function LoadStatusProvider(props: { children: ReactNode }) {
  const [loadStarted, setLoadStarted] = useState(false)
  const [loadCompleted, setLoadCompleted] = useState(false)

  return (
    <LoadStatusContext.Provider
      value={{
        loadStarted,
        loadCompleted,
        setLoadStarted,
        setLoadCompleted,
      }}
    >
      {props.children}
    </LoadStatusContext.Provider>
  )
}
