/* Copyright Contributors to the Open Cluster Management project */
import { ReactNode, useContext, useEffect } from 'react'
import { PluginContext } from '../lib/PluginContext'
import { LostChangesProvider } from './LostChanges'
import { LoadStatusContext } from './LoadStatusProvider'

export const LoadPluginData = (props: { children?: ReactNode }) => {
  const { dataContext } = useContext(PluginContext)
  const { load } = useContext(dataContext)
  const { loadStarted } = useContext(LoadStatusContext)
  useEffect(() => {
    if (!loadStarted) {
      load()
    }
  }, [load, loadStarted])
  return <LostChangesProvider>{props.children}</LostChangesProvider>
}
