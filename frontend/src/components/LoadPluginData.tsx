/* Copyright Contributors to the Open Cluster Management project */
import { ReactNode, useContext, useEffect } from 'react'
import { PluginContext } from '../lib/PluginContext'
import { LostChangesProvider } from './LostChanges'
import { LoadStatusProvider } from './LoadStatusProvider'

export const LoadPluginData = (props: { children?: ReactNode }) => {
  const { dataContext } = useContext(PluginContext)
  const { load, loadStarted, loadCompleted } = useContext(dataContext)
  useEffect(() => {
    if (!loadStarted) {
      load()
    }
  }, [load, loadStarted])

  // LoadStatusProvider passes the dataContext to mce AND acm plugins
  return (
    <LostChangesProvider>
      <LoadStatusProvider
        value={{
          loadStarted,
          loadCompleted,
        }}
      >
        {props.children}
      </LoadStatusProvider>
    </LostChangesProvider>
  )
}
