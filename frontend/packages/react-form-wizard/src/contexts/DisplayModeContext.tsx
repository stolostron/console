import { createContext, useContext } from 'react'

export enum DisplayMode {
    Details,
    Step,
    StepsHidden,
}

export const DisplayModeContext = createContext<DisplayMode>(DisplayMode.Step)
DisplayModeContext.displayName = 'DisplayModeContext'

export function useDisplayMode() {
    return useContext(DisplayModeContext)
}
