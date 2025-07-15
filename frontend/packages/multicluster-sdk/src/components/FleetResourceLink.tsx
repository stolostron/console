/* Copyright Contributors to the Open Cluster Management project */
import React from 'react'
import { ResourceIcon, ResourceLink, useFlag } from '@openshift-console/dynamic-plugin-sdk'
import { Skeleton } from '@patternfly/react-core'
import { FleetResourceLinkProps } from '../types/fleet'
import classNames from 'classnames'
import { getURLSearchParam } from '../api/utils/searchPaths'
import { useHubClusterName } from '../api/useHubClusterName'
import { useLocation, Link } from 'react-router-dom-v5-compat'
import { getFirstClassResourceRoute } from '../internal/fleetResourceHelpers'

/**
 * Enhanced ResourceLink component for ACM fleet environments.
 *
 * Unlike the standard OpenShift ResourceLink which always links to the OpenShift console,
 * FleetResourceLink provides intelligent routing based on cluster context:
 * - For managed clusters: Links to ACM search results or specialized ACM pages
 * - For hub clusters: Context-aware routing based on current page location
 * - For first-class ACM resources: Direct links to rich management interfaces
 *
 * This prevents users from having to jump between different consoles when managing
 * multi-cluster resources.
 *
 * @see https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#resourcelink
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
 * @example
 * ```typescript
 * // Hub cluster VirtualMachine - routes to ACM VM page on multicloud paths
 * <FleetResourceLink
 *   name="my-vm"
 *   namespace="default"
 *   groupVersionKind={{ group: 'kubevirt.io', version: 'v1', kind: 'VirtualMachine' }}
 * />
 *
 * // Managed cluster VirtualMachine - routes to ACM search results
 * <FleetResourceLink
 *   name="remote-vm"
 *   namespace="default"
 *   cluster="prod-cluster"
 *   groupVersionKind={{ group: 'kubevirt.io', version: 'v1', kind: 'VirtualMachine' }}
 * />
 *
 * // ManagedCluster resource (lives on hub) - cluster prop omitted
 * <FleetResourceLink
 *   name="prod-cluster"
 *   groupVersionKind={{ group: 'cluster.open-cluster-management.io', version: 'v1', kind: 'ManagedCluster' }}
 * />
 * ```
 */
export const FleetResourceLink: React.FC<FleetResourceLinkProps> = ({ cluster, ...resourceLinkProps }) => {
  const [hubClusterName, hubLoaded] = useHubClusterName()
  const location = useLocation()
  const kubevirtEnabled = useFlag('KUBEVIRT_DYNAMIC_ACM')

  // check if fleet is available (has managed clusters)
  const isFleetAvailable = hubLoaded

  if (!isFleetAvailable) {
    // fallback to default ResourceLink from OCP
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

  // if cluster name is given but hub name is not loaded yet, show skeleton
  if (cluster && !hubLoaded) {
    return (
      <span className={classes}>
        {!hideIcon && <ResourceIcon groupVersionKind={groupVersionKind} />}
        <Skeleton width="100px" />
        {children}
      </span>
    )
  }

  // determine if this is a hub cluster case (no cluster or it matches hub name)
  const isHubCluster = !cluster || cluster === hubClusterName
  const isMulticloudPath = location.pathname.startsWith('/multicloud/')

  const getResourcePath = (): { path: string | null; shouldFallback: boolean } => {
    const { isFirstClass, path: firstClassPath } = getFirstClassResourceRoute(
      groupVersionKind?.kind,
      cluster || hubClusterName,
      namespace,
      name,
      kubevirtEnabled
    )

    if (isHubCluster) {
      // hub cluster case
      if (isFirstClass && isMulticloudPath) {
        // if this is a first-class ACM resource and on multicloud path, link to the first-class page
        return { path: firstClassPath, shouldFallback: !firstClassPath }
      }
      // if no first-class path or not in multicloud, fallback to OCP ResourceLink
      return { path: null, shouldFallback: true }
    } else {
      // managed cluster case
      if (isFirstClass && firstClassPath) {
        // links to the first-class page for that resource
        return { path: firstClassPath, shouldFallback: false }
      }

      // links to /multicloud/search/resources
      const searchPath = `/multicloud/search/resources${getURLSearchParam({
        cluster,
        kind: groupVersionKind?.kind,
        apigroup: groupVersionKind?.group,
        apiversion: groupVersionKind?.version,
        name,
        namespace,
      })}`
      return { path: searchPath, shouldFallback: false }
    }
  }

  const { path, shouldFallback } = getResourcePath()

  if (shouldFallback) {
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
        <span className="co-resource-item__resource-name">
          {value}
          {nameSuffix}
        </span>
      )}
      {children}
    </span>
  )
}
