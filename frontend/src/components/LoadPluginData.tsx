/* Copyright Contributors to the Open Cluster Management project */
import { ReactNode, useContext, useEffect } from 'react'
import { PluginContext } from '../lib/PluginContext'
import { LostChangesProvider } from './LostChanges'
import { LoadingPage } from './LoadingPage'

export const LoadPluginData = (props: { children?: ReactNode }) => {
  const { dataContext } = useContext(PluginContext)
  const { load, loadStarted } = useContext(dataContext)
  useEffect(() => {
    if (!loadStarted) {
      load()
    }
  }, [load, loadStarted])

  return loadStarted ? <LostChangesProvider>{props.children}</LostChangesProvider> : <LoadingPage />
}
