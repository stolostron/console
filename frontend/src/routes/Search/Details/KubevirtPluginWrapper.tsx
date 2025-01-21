/* Copyright Contributors to the Open Cluster Management project */
import React, { useContext, createContext } from 'react'
import { PluginContext } from '../../../lib/PluginContext'
import { KubevirtPluginData } from '../../../plugin-extensions/extensions/KubevirtContext'
import { ResourceSearchLink } from './DetailsOverviewPage'
import { K8sGroupVersionKind, K8sModel, K8sResourceCommon, ResourceIcon } from '@openshift-console/dynamic-plugin-sdk'
import { useLocalHubName } from '../../../hooks/use-local-hub'
import { NavigationPath } from '../../../NavigationPath'
import { generatePath } from 'react-router-dom-v5-compat'
import { GetUrlSearchParam } from '../searchDefinitions'

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

const ALL_NAMESPACES_SESSION_KEY = '#ALL_NS#'

type ResourceUrlProps = {
  activeNamespace?: string
  model: K8sModel
  resource?: K8sResourceCommon
}

/**
 * function for getting a resource URL
 * @param {ResourceUrlProps} urlProps - object with model, resource to get the URL from (optional) and active namespace/project name (optional)
 * @returns {string} the URL for the resource
 */
export const getResourceUrl = (urlProps: ResourceUrlProps): string | null => {
  const { activeNamespace, model, resource } = urlProps

  if (!model) return null
  const { crd, namespaced, plural, kind, apiGroup, apiVersion } = model

  const namespace = resource?.metadata?.namespace || (activeNamespace !== ALL_NAMESPACES_SESSION_KEY && activeNamespace)
  const name = resource?.metadata?.name || ''
  // TODO - parameterize cluster
  const cluster = 'local-cluster'
  if (apiGroup === 'kubevirt.io' && apiVersion === 'v1' && kind == 'VirtualMachine') {
    if (name && namespace) {
      const searchParams = GetUrlSearchParam({
        cluster,
        kind,
        apigroup: apiGroup,
        apiversion: apiVersion,
        name,
        namespace,
      })
      return `${NavigationPath.resources}${searchParams}`
    } else if (namespace) {
      return generatePath(NavigationPath.virtualMachinesForNamespace, { cluster, namespace })
    } else {
      return NavigationPath.virtualMachines
    }
  }

  const namespaceUrl = namespace ? `ns/${namespace}` : 'all-namespaces'
  const ref = crd ? `${model.apiGroup || 'core'}~${model.apiVersion}~${model.kind}` : plural || ''

  return `/k8s/${namespaced ? namespaceUrl : 'cluster'}/${ref}/${name}`
}

const KubevirtPluginWrapper = (props: { children: React.ReactNode; clusterName?: string }) => {
  const { children, clusterName } = props
  const localHubName = useLocalHubName()

  const isLocalCluster = localHubName === clusterName
  const defaultClusterName = clusterName ?? localHubName ?? 'local-cluster'

  const { acmExtensions } = useContext(PluginContext)
  const KubevirtPluginContext = acmExtensions?.kubevirtContext?.[0].properties.context ?? DefaultKubevirtPluginContext
  const { dynamicPluginSDK, ...other } = useContext(KubevirtPluginContext)

  if (isLocalCluster) {
    return <>{children}</>
  }

  const ResourceLink = getResourceLinkOverride(defaultClusterName)
  const contextOverride = { dynamicPluginSDK: { ...dynamicPluginSDK, ResourceLink }, ...other, getResourceUrl }

  return <KubevirtPluginContext.Provider value={contextOverride}>{children}</KubevirtPluginContext.Provider>
}

export default KubevirtPluginWrapper
