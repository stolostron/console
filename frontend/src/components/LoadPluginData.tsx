/* Copyright Contributors to the Open Cluster Management project */
import { ReactNode, useContext, useEffect } from 'react'
import { PluginContext } from '../lib/PluginContext'
import { LostChangesProvider } from './LostChanges'

export const LoadPluginData = (props: { children?: ReactNode }) => {
  const { dataContext } = useContext(PluginContext)
  const { loaded, load } = useContext(dataContext)
  useEffect(() => {
    if (!loaded) {
      load()
    }
  }, [load, loaded])
  return <LostChangesProvider>{props.children}</LostChangesProvider>
}
