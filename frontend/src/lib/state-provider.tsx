/* Copyright Contributors to the Open Cluster Management project */
import { useContext, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { createStore, Provider as JotaiProvider } from 'jotai'
import type { Store } from 'jotai/vanilla/store'
import { defaultContext, PluginDataContext } from './PluginDataContext'
import { defaultPlugin, PluginContext } from './PluginContext'

type StateProviderProps = PropsWithChildren<{
  initializeStore?: (store: Store) => void
}>

export function StateProvider({ children, initializeStore }: StateProviderProps) {
  const parentPluginContext = useContext(PluginContext)
  const parentContext = useContext(PluginDataContext)
  const [store] = useState(() => {
    const store = createStore()
    initializeStore?.(store)
    return store
  })
  const contextValue = useMemo(() => ({ ...defaultContext, ...parentContext, store }), [parentContext, store])
  const pluginContextValue = useMemo(
    () => ({ ...defaultPlugin, ...parentPluginContext, dataContext: PluginDataContext }),
    [parentPluginContext]
  )

  return (
    <PluginContext.Provider value={pluginContextValue}>
      <PluginDataContext.Provider value={contextValue}>
        <JotaiProvider store={store}>{children}</JotaiProvider>
      </PluginDataContext.Provider>
    </PluginContext.Provider>
  )
}
