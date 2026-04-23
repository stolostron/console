/* Copyright Contributors to the Open Cluster Management project */
import { createContext, useContext } from 'react'

export enum DisplayMode {
  Step,
  StepsHidden,
  Details,
}

export const DisplayModeContext = createContext<DisplayMode>(DisplayMode.Step)
DisplayModeContext.displayName = 'DisplayModeContext'

export function useDisplayMode() {
  return useContext(DisplayModeContext)
}
