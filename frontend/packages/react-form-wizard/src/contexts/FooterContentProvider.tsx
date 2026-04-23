/* Copyright Contributors to the Open Cluster Management project */
import { createContext, ReactNode, useCallback, useContext, useState } from 'react'

const FooterContentContext = createContext<ReactNode>(undefined)
FooterContentContext.displayName = 'FooterContentContext'

const SetFooterContentContext = createContext<(content: ReactNode) => void>(() => null)
SetFooterContentContext.displayName = 'SetFooterContentContext'

export const useFooterContent = () => useContext(FooterContentContext)
export const useSetFooterContent = () => useContext(SetFooterContentContext)

export function FooterContentProvider(props: { children: ReactNode }) {
  const [footerContent, setFooterContentState] = useState<ReactNode>(undefined)
  const setFooterContent = useCallback((content: ReactNode) => {
    setFooterContentState(content)
  }, [])

  return (
    <SetFooterContentContext.Provider value={setFooterContent}>
      <FooterContentContext.Provider value={footerContent}>{props.children}</FooterContentContext.Provider>
    </SetFooterContentContext.Provider>
  )
}
