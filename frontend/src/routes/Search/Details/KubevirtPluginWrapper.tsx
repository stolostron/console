/* Copyright Contributors to the Open Cluster Management project */
import React, { useContext, createContext } from 'react'
import { PluginContext } from '../../../lib/PluginContext'
import { KubevirtPluginData } from '../../../plugin-extensions/extensions/KubevirtContext'
import { ResourceSearchLink } from './DetailsOverviewPage'
import { K8sGroupVersionKind, ResourceIcon } from '@openshift-console/dynamic-plugin-sdk'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'

// Define a default context
const DefaultKubevirtPluginContext = createContext<KubevirtPluginData>({} as KubevirtPluginData)

const getResourceLinkOverride = (clusterName: string) => {
  const ResourceLink = (props: { name?: string; groupVersionKind?: K8sGroupVersionKind }) => {
    const { name = '', groupVersionKind } = props
    if (!groupVersionKind) {
      return null
    }
    const { version, kind } = groupVersionKind
    return (
      <span className="co-resource-item">
        <ResourceIcon kind={groupVersionKind.kind} />
        <ResourceSearchLink
          className="co-resource-item__resource-name"
          cluster={clusterName}
          apiversion={version}
          kind={kind}
          name={name}
        />{' '}
      </span>
    )
  }

  return ResourceLink
}

const KubevirtPluginWrapper = (props: { children: React.ReactNode; clusterName: string }) => {
  const { children, clusterName } = props
  const { managedClustersState } = useSharedAtoms()
  const managedClusters = useRecoilValue(managedClustersState)

  const isLocalCluster =
    managedClusters.find((cls) => cls.metadata.name === clusterName)?.metadata.labels?.['local-cluster'] === 'true'

  const { acmExtensions } = useContext(PluginContext)
  const KubevirtPluginContext = acmExtensions?.kubevirtContext?.[0].properties.context ?? DefaultKubevirtPluginContext
  const { dynamicPluginSDK, ...other } = useContext(KubevirtPluginContext)
  const ResourceLink = getResourceLinkOverride(clusterName)
  const contextOverride = { dynamicPluginSDK: { ...dynamicPluginSDK, ResourceLink }, ...other }

  if (isLocalCluster) {
    return <>{children}</>
  }

  return <KubevirtPluginContext.Provider value={contextOverride}>{children}</KubevirtPluginContext.Provider>
}

export default KubevirtPluginWrapper
