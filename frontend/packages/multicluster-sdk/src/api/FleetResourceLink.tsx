/* Copyright Contributors to the Open Cluster Management project */
import React from 'react'
import { ResourceIcon, ResourceLink } from '@openshift-console/dynamic-plugin-sdk'
import { FleetResourceLinkProps } from '../types/fleet'
import classNames from 'classnames'
import { getURLSearchParam } from './utils/searchPaths'
import { useHubClusterName } from './useHubClusterName'
import { useFleetClusterNames } from './useFleetClusterNames'
import { useLocation, Link } from 'react-router-dom-v5-compat'

// helper function to determine if a resource is a first-class ACM resource

/**
 * Determines if a resource is a first-class ACM resource that should link to dedicated ACM pages.
 *
 * First-class ACM resources include core management resources that have specialized
 * detail pages in the ACM console, providing richer functionality than generic search results.
 *
 * @param kind - The Kubernetes resource kind
 * @returns True if the resource is a first-class ACM resource
 *
 * @example
 * ```typescript
 * isFirstClassACMResource('ManagedCluster') // returns true
 * isFirstClassACMResource('Pod') // returns false
 * ```
 */
const isFirstClassACMResource = (kind: string | undefined): boolean => {
  if (!kind) return false

  const firstClassResources = [
    'ManagedCluster',
    'VirtualMachine',
    'VirtualMachineInstance',
    'Application',
    'Policy',
    'PolicyReport',
  ]

  return firstClassResources.includes(kind)
}

// helper function to extract the first-class page path for a resource
/**
 * Generates the URL path for first-class ACM resource detail pages.
 *
 * @param kind - The Kubernetes resource kind
 * @param cluster - The target cluster name
 * @param namespace - The resource namespace (required for namespaced resources)
 * @param name - The resource name
 * @returns The ACM console path for the resource, or null if not a first-class resource
 *
 * @example
 * ```typescript
 * getFirstClassResourcePath('ManagedCluster', 'prod-cluster', undefined, 'prod-cluster')
 * // returns '/multicloud/infrastructure/clusters/details/prod-cluster/prod-cluster/overview'
 *
 * getFirstClassResourcePath('VirtualMachine', 'dev-cluster', 'default', 'web-server')
 * // returns '/multicloud/infrastructure/virtualmachines/dev-cluster/default/web-server'
 * ```
 */

const getFirstClassResourcePath = (
  kind: string | undefined,
  cluster: string | undefined,
  namespace: string | undefined,
  name: string | undefined
): string | null => {
  if (!kind || !name) return null

  switch (kind) {
    case 'ManagedCluster':
      return `/multicloud/infrastructure/clusters/details/${name}/${name}/overview`
    case 'VirtualMachine':
    case 'VirtualMachineInstance':
      return cluster && namespace ? `/multicloud/infrastructure/virtualmachines/${cluster}/${namespace}/${name}` : null
    default:
      return null
  }
}

/**
 * Intelligent resource link component for ACM fleet environments that provides context-aware routing based on fleet availability, cluster context, resource types, and current page location.
 *
 * @param props - FleetResourceLinkProps extending ResourceLinkProps with cluster information
 * @param props.cluster - the target cluster name for the resource
 * @param props.groupVersionKind - K8s GroupVersionKind for the resource
 * @param props.name - the resource name
 * @param props.namespace - the resource namespace (required for namespaced resources)
 * @param props.displayName - optional display name override
 * @param props.className - additional CSS classes
 * @param props.inline - whether to display inline
 * @param props.hideIcon - whether to hide the resource icon
 * @param props.children - additional content to render
 *
 * @behavior
 * - **No Fleet**: Falls back to OpenShift console ResourceLink
 * - **Hub Cluster**: Context-aware routing (ACM pages on `/multicloud/` paths, OpenShift elsewhere)
 * - **Managed Cluster**: First-class resources → ACM pages, others → search page
 * - **Loading State**: Shows skeleton loader when hub cluster name is loading
 * - **First-class Resources**: ManagedCluster, VirtualMachine, VirtualMachineInstance, Application, Policy, PolicyReport
 *
 * @returns JSX.Element - Rendered resource link with appropriate routing based on fleet context
 *
 * @example
 * ```tsx
 * // Link to ACM cluster details for ManagedCluster
 * <FleetResourceLink
 *   cluster="prod-cluster"
 *   groupVersionKind={{ kind: 'ManagedCluster', version: 'v1', group: 'cluster.open-cluster-management.io' }}
 *   name="prod-cluster"
 * />
 *
 * // Link to ACM VM page for VirtualMachine on managed cluster
 * <FleetResourceLink
 *   cluster="managed-cluster"
 *   groupVersionKind={{ kind: 'VirtualMachine', version: 'v1', group: 'kubevirt.io' }}
 *   name="web-server"
 *   namespace="default"
 * />
 * ```
 */

export const FleetResourceLink: React.FC<FleetResourceLinkProps> = ({ cluster, ...resourceLinkProps }) => {
  const [hubClusterName, hubLoaded] = useHubClusterName()
  const [clusterNames, clustersLoaded] = useFleetClusterNames()
  const location = useLocation()

  // checks if fleet is available (has managed clusters)
  const isFleetAvailable = clustersLoaded && clusterNames.length > 0

  if (!isFleetAvailable) {
    // will fallback to default ResourceLink from OCP
    return <ResourceLink {...resourceLinkProps} />
  }

  if (!cluster) {
    // if no cluster specified, fallback to default ResourceLink from OCP
    return <ResourceLink {...resourceLinkProps} />
  }

  const {
    className,
    displayName,
    inline = false,
    groupVersionKind,
    name,
    nameSuffix,
    namespace,
    hideIcon,
    title,
    children,
    dataTest,
    onClick,
    truncate,
  } = resourceLinkProps

  const value = displayName ? displayName : name
  const classes = classNames('co-resource-item', className || '', {
    'co-resource-item--inline': inline,
    'co-resource-item--truncate': truncate,
  })

  // if the cluster name is given but hub name is not loaded yet, show skeleton
  if (!hubLoaded) {
    return (
      <span className={classes}>
        {!hideIcon && <ResourceIcon groupVersionKind={groupVersionKind} />}
        <span
          className="co-resource-item__resource-name pf-v5-c-skeleton pf-v5-c-skeleton--text-md"
          style={{ width: '100px' }}
        >
          {value}
          {nameSuffix}
        </span>
        {children}
      </span>
    )
  }

  const isHubCluster = cluster === hubClusterName
  const isFirstClassResource = isFirstClassACMResource(groupVersionKind?.kind)
  const isMulticloudPath = location.pathname.startsWith('/multicloud/')

  let path: string | null = null
  let shouldFallbackToResourceLink = false

  if (isHubCluster) {
    // Hub cluster case
    if (isFirstClassResource) {
      if (groupVersionKind?.kind === 'ManagedCluster' || isMulticloudPath) {
        // links always to cluster details for ManagedCluster, or first-class page for other resources when on multicloud path
        path = getFirstClassResourcePath(groupVersionKind?.kind, cluster, namespace, name)
      }
    }
    // if no first-class path or not in multicloud, fallback to OCP ResourceLink
    if (!path) {
      shouldFallbackToResourceLink = true
    }
  } else {
    // Managed cluster case
    if (isFirstClassResource) {
      // links to the first-class page for that resource
      path = getFirstClassResourcePath(groupVersionKind?.kind, cluster, namespace, name)
    }

    if (!path) {
      // links to /multicloud/search/resources
      path = `/multicloud/search/resources${getURLSearchParam({
        cluster,
        kind: groupVersionKind?.kind,
        apigroup: groupVersionKind?.group,
        apiversion: groupVersionKind?.version,
        name,
        namespace,
      })}`
    }
  }

  if (shouldFallbackToResourceLink) {
    return <ResourceLink {...resourceLinkProps} />
  }

  return (
    <span className={classes}>
      {!hideIcon && <ResourceIcon groupVersionKind={groupVersionKind} />}
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
