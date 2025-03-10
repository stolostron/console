/* Copyright Contributors to the Open Cluster Management project */
import { ReactNode, useContext, useEffect } from 'react'
import { PluginContext } from '../lib/PluginContext'
import { LostChangesProvider } from './LostChanges'
import { LoadingPage } from './LoadingPage'
import { useLocation } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../NavigationPath'

export const LoadPluginData = (props: { children?: ReactNode }) => {
  const { dataContext } = useContext(PluginContext)
  const { load, loadStarted, loadCompleted } = useContext(dataContext)
  const location = useLocation()
  // some pages are loaded fast by sending it's events first
  // which means these pages can appear immediately
  // see backend/src/lib/server-side-events.ts #312 for what resources are fast loaded
  const fastLoadPage = (
    [
      // Home
      NavigationPath.home,
      NavigationPath.welcome,
      NavigationPath.overview,

      // Search
      NavigationPath.search,
      NavigationPath.resources,
      NavigationPath.resourceYAML,
      NavigationPath.resourceRelated,
      NavigationPath.resourceLogs,

      // Infrastructure
      NavigationPath.infrastructure,

      // Infrastructure - Clusters - Managed Clusters
      NavigationPath.clusters,
      NavigationPath.managedClusters,

      // Infrastructure - Clusters - Cluster Sets
      NavigationPath.clusterSets,
      NavigationPath.applications,
      NavigationPath.advancedConfiguration,
      NavigationPath.createApplicationArgo,
      NavigationPath.createApplicationArgoPullModel,
      NavigationPath.createApplicationSubscription,

      // Governance
      NavigationPath.governance,
      NavigationPath.policies,
      NavigationPath.policySets,

      // Credentials
      NavigationPath.credentials,
    ] as string[]
  ).includes(location.pathname.replace(/\/$/, ''))
  useEffect(() => {
    if (!loadStarted) {
      load()
    }
  }, [load, loadStarted])

  return (fastLoadPage && loadStarted) || loadCompleted ? (
    <LostChangesProvider>{props.children}</LostChangesProvider>
  ) : (
    <LoadingPage />
  )
}
