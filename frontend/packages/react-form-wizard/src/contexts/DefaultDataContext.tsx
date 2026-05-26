/* Copyright Contributors to the Open Cluster Management project */
import { createContext, useContext } from 'react'

export const DefaultDataContext = createContext<object>({})
DefaultDataContext.displayName = 'DefaultDataContext'

export function useDefaultItem<T = object>(): T {
  return useContext(DefaultDataContext) as T
}
