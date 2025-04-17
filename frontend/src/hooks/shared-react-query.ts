/* Copyright Contributors to the Open Cluster Management project */

import { PluginContext } from '../lib/PluginContext'
import { useContext } from 'react'

export function useSharedReactQuery() {
  const { dataContext } = useContext(PluginContext)
  const { reactQuery } = useContext(dataContext)

  return reactQuery
}
