/* Copyright Contributors to the Open Cluster Management project */
import { ReactNode, useContext, useEffect } from 'react'
import { PluginContext } from '../lib/PluginContext'
import { LoadingPage } from './LoadingPage'
import { LostChangesProvider } from './LostChanges'

export const LoadPluginData = (props: { children?: ReactNode }) => {
  const { dataContext } = useContext(PluginContext)
  const { loaded, load } = useContext(dataContext)
  useEffect(() => {
    if (!loaded) {
      load()
    }
  }, [load, loaded])
  return loaded ? <LostChangesProvider>{props.children}</LostChangesProvider> : <LoadingPage />
}
