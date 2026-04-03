/* Copyright Contributors to the Open Cluster Management project */
import { createContext, ReactNode, useContext, useMemo, useState } from 'react'

export const HighlightEditorPathContext = createContext<{
  highlightEditorPath: string
  setHighlightEditorPath: (path: string) => void
}>({
  highlightEditorPath: '',
  setHighlightEditorPath: () => void 0,
})
HighlightEditorPathContext.displayName = 'HighlightEditorPathContext'

export const useHighlightEditorPath = () => useContext(HighlightEditorPathContext)

export function HighlightEditorPathProvider(props: { children: ReactNode }) {
  const [highlightEditorPath, setHighlightEditorPath] = useState('')
  const value = useMemo(() => ({ highlightEditorPath, setHighlightEditorPath }), [highlightEditorPath])
  return <HighlightEditorPathContext.Provider value={value}>{props.children}</HighlightEditorPathContext.Provider>
}
