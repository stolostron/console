/* Copyright Contributors to the Open Cluster Management project */
import { useContext, useMemo, PropsWithChildren } from 'react'
import {
  ConsoleFetch,
  consoleFetch as consoleFetchDefault,
  K8sModel,
  K8sResourceCommon,
  ResourceIcon,
  ResourceLink as ResourceLinkDefault,
  ResourceLinkProps,
  WatchK8sResource,
} from '@openshift-console/dynamic-plugin-sdk'
import * as DefaultDynamicPluginSDK from '@openshift-console/dynamic-plugin-sdk'
import { useIsLocalHub, useLocalHubName } from '../../../hooks/use-local-hub'
import { NavigationPath } from '../../../NavigationPath'
import { generatePath, Link } from 'react-router-dom-v5-compat'
import { GetUrlSearchParam } from '../searchDefinitions'
import { searchClient } from '../search-sdk/search-client'
import { convertStringToQuery } from '../search-helper'
import { useSearchResultItemsQuery } from '../search-sdk/search-sdk'
import { ClusterScope, ClusterScopeContext } from '../../../plugin-extensions/ClusterScopeContext'
import { useKubevirtPluginContext } from '../../../plugin-extensions/hooks/useKubevirtPluginContext'
import classNames from 'classnames'
import { useK8sWatchResource } from './useK8sWatchResource'
import { getBackendUrl } from '../../../resources/utils'
import { KubevirtPluginData, SearchResult } from '../../../plugin-extensions/extensions/KubevirtContext'

const KUBERNETES_API_PREFIX = '/api/kubernetes/'

const getWithCluster = (localHubName: string) => {
  return (cluster?: string) => {
    const isLocalHub = localHubName === cluster
    const consoleFetch: ConsoleFetch = isLocalHub
      ? consoleFetchDefault
      : async (url, options, timeout) => {
          const overrideUrl = url?.startsWith(KUBERNETES_API_PREFIX)
            ? `${getBackendUrl()}/managedclusterproxy/${cluster}/${url.substring(KUBERNETES_API_PREFIX.length)}`
            : url
          return consoleFetchDefault(overrideUrl, options, timeout)
        }
    return { ...DefaultDynamicPluginSDK, consoleFetch }
  }
}

const getK8sAPIPath = (localHubName: string, cluster: string) => {
  const isLocalHub = localHubName === cluster
  return isLocalHub ? '/api/kubernetes' : `${getBackendUrl()}/managedclusterproxy/${cluster}`
}

export const getGetStandaloneVMConsoleUrl = (cluster: string) => {
  return ({ name, namespace }: { name: string; namespace: string }) => {
    return generatePath(NavigationPath.virtualMachineConsole, { cluster, ns: namespace, name })
  }
}

const ResourceLink: React.FC<ResourceLinkProps> = (props) => {
  const {
    className,
    displayName,
    inline = false,
    kind,
    groupVersionKind,
    linkTo = true,
    name,
    nameSuffix,
    namespace,
    hideIcon,
    title,
    children,
    dataTest,
    onClick,
    truncate,
  } = props
  const localCluster = useLocalHubName()
  const { cluster = localCluster, localHubOverride } = useContext(ClusterScopeContext)

  if (useIsLocalHub(cluster) && !localHubOverride) {
    return <ResourceLinkDefault {...props} />
  }

  if (!kind && !groupVersionKind) {
    return null
  }

  let apigroup, apiversion, apikind
  if (groupVersionKind) {
    ;({ group: apigroup, version: apiversion, kind: apikind } = groupVersionKind)
  } else if (kind) {
    const parts = kind.split('~')
    apikind = parts.pop()
    apiversion = parts.pop() ?? 'v1'
    apigroup = parts.pop() ?? ''
    if (apigroup === 'core') {
      apigroup = ''
    }
  }
  let path = undefined
  if (linkTo) {
    if (apigroup === 'cluster.open-cluster-management.io' && apikind === 'ManagedCluster') {
      path = generatePath(NavigationPath.clusterDetails, { namespace: name ?? null, name: name ?? null })
    } else {
      path = `${NavigationPath.resources}${GetUrlSearchParam({
        cluster,
        kind: apikind,
        apigroup,
        apiversion,
        name,
        namespace,
      })}`
    }
  }

  const value = displayName ? displayName : name
  const classes = classNames('co-resource-item', className, {
    'co-resource-item--inline': inline,
    'co-resource-item--truncate': truncate,
  })

  return (
    <span className={classes}>
      {!hideIcon && <ResourceIcon kind={kind} groupVersionKind={groupVersionKind} />}
      {path ? (
        <Link
          to={path}
          title={title}
          className="co-resource-item__resource-name"
          data-test-id={value}
          data-test={dataTest ?? value}
          onClick={onClick}
        >
          {value}
          {nameSuffix}
        </Link>
      ) : (
        <span className="co-resource-item__resource-name" data-test-id={value} data-test={dataTest ?? value}>
          {value}
          {nameSuffix}
        </span>
      )}
      {children}
    </span>
  )
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

const useMulticlusterSearchWatch: KubevirtPluginData['useMulticlusterSearchWatch'] = (
  watchOptions: WatchK8sResource
) => {
  const { groupVersionKind, limit, namespace, namespaced } = watchOptions
  const { group, version, kind } = groupVersionKind ?? {}
  const {
    data: result,
    loading,
    error,
  } = useSearchResultItemsQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: {
      input: [
        convertStringToQuery(
          `apigroup:${group} apiversion:${version} kind:${kind}${namespaced && namespace ? ` ${namespace}` : ''}`,
          limit ?? -1
        ),
      ],
    },
  })
  const data = useMemo(
    () =>
      result?.searchResult?.[0]?.items?.map((item) => {
        const resource: any = {
          cluster: item.cluster,
          apiVersion: `${item.apigroup ? `${item.apigroup}/` : ''}${item.apiversion}`,
          kind: item.kind,
          metadata: {
            creationTimestamp: item.created,
            name: item.name,
            namespace: item.namespace,
          },
        }
        // Reverse the flattening of specific resources by the search-collector
        // See https://github.com/stolostron/search-collector/blob/main/pkg/transforms/genericResourceConfig.go
        switch (kind) {
          case 'VirtualMachine':
            resource.spec = {
              running: item._specRunning,
              runStrategy: item._specRunStrategy,
              template: { spec: { domain: { cpu: { cores: item.cpu }, memory: { guest: item.memory } } } },
            }
            resource.status = { conditions: [{ type: 'Ready', status: item.ready }], printableStatus: item.status }
            break
          case 'VirtualMachineInstance':
            resource.status = {
              conditions: [
                { type: 'LiveMigratable', status: item.liveMigratable },
                { type: 'Ready', status: item.ready },
              ],
              interfaces: [{ ipAddress: item.ipaddress, name: 'default' }],
              nodeName: item.node,
              phase: item.phase,
            }
        }
        return resource
      }),
    [kind, result]
  )
  return [data as SearchResult<any>, !loading, error]
}

const KubevirtPluginWrapper = ({
  children,
  currentCluster,
  currentNamespace,
}: PropsWithChildren<{
  currentCluster?: string
  currentNamespace?: string
}>) => {
  const localHubName = useLocalHubName()
  const defaultClusterName = currentCluster ?? localHubName
  const isLocalHub = useIsLocalHub(defaultClusterName)

  const KubevirtPluginContext = useKubevirtPluginContext()
  const { getStandaloneVMConsoleUrl } = useContext(KubevirtPluginContext)
  const contextValue = useMemo(() => {
    const withCluster = getWithCluster(localHubName)
    return {
      clusterScope: { ClusterScope, withCluster },
      currentCluster,
      currentNamespace,
      dynamicPluginSDK: { ...withCluster(defaultClusterName), ResourceLink, useK8sWatchResource },
      getResourceUrl,
      getStandaloneVMConsoleUrl: isLocalHub
        ? getStandaloneVMConsoleUrl
        : getGetStandaloneVMConsoleUrl(defaultClusterName),
      k8sAPIPath: getK8sAPIPath(localHubName, defaultClusterName),
      supportsMulticluster: true,
      useMulticlusterSearchWatch,
    }
  }, [currentCluster, currentNamespace, defaultClusterName, getStandaloneVMConsoleUrl, isLocalHub, localHubName])

  return (
    <KubevirtPluginContext.Provider value={contextValue}>
      <ClusterScope cluster={defaultClusterName}>{children}</ClusterScope>
    </KubevirtPluginContext.Provider>
  )
}

export default KubevirtPluginWrapper
