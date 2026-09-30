/* Copyright Contributors to the Open Cluster Management project */
import { useContext, useMemo } from 'react'
import type { PropsWithChildren } from 'react'
import { defaultContext, PluginDataContext } from './PluginDataContext'
import { defaultPlugin, PluginContext } from './PluginContext'
import { RecoilRoot } from '../shared-recoil'
import type { MutableSnapshot } from '../shared-recoil'

type StateProviderProps = PropsWithChildren<{
  initializeStore?: (store: MutableSnapshot) => void
}>

export function StateProvider({ children, initializeStore }: StateProviderProps) {
  const parentPluginContext = useContext(PluginContext)
  const parentContext = useContext(parentPluginContext.dataContext)
  const contextValue = useMemo(() => ({ ...defaultContext, ...parentContext }), [parentContext])
  const pluginContextValue = useMemo(
    () => ({ ...defaultPlugin, ...parentPluginContext, dataContext: PluginDataContext }),
    [parentPluginContext]
  )

  return (
    <PluginContext.Provider value={pluginContextValue}>
      <PluginDataContext.Provider value={contextValue}>
        <RecoilRoot initializeState={initializeStore}>{children}</RecoilRoot>
      </PluginDataContext.Provider>
    </PluginContext.Provider>
  )
}
