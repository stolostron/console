/* Copyright Contributors to the Open Cluster Management project */
import React from 'react'
import { ResourceIcon, ResourceLink, useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk'
import { FleetResourceLinkProps } from '../types/fleet'
import classNames from 'classnames'
import { getURLSearchParam } from '../internal/search/searchPaths'
import { useHubClusterName } from '../api/useHubClusterName'
import { useIsFleetAvailable } from '../api/useIsFleetAvailable'
import { Link } from 'react-router-dom-v5-compat'
import { getExtensionResourcePath, isResourceRoute } from '../internal/resourceRouteUtils'

/**
 * Enhanced ResourceLink component for ACM fleet environments.
 *
 * Unlike the standard OpenShift ResourceLink which always links to the OpenShift console,
 * FleetResourceLink provides intelligent routing based on cluster context:
 * - First-class ACM resources (ManagedCluster) get direct links in all cases
 * - For hub clusters: Extension-based routing first, then fallback to OpenShift console
 * - For managed clusters: Extension-based routing first, then fallback to ACM search results
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
 * // Hub cluster VirtualMachine - routes to ACM VM page via extension system
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
  const [resourceRoutes, resourceRoutesResolved] = useResolvedExtensions(isResourceRoute)
  const isFleetAvailable = useIsFleetAvailable()

  if (!isFleetAvailable) {
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

  const value = displayName || name
  const classes = classNames('co-resource-item', className || '', {
    'co-resource-item--inline': inline,
    'co-resource-item--truncate': truncate,
  })

  // if cluster name is given but hub name is not loaded yet, show text
  if (cluster && !hubLoaded) {
    return (
      <span className={classes}>
        {!hideIcon && <ResourceIcon groupVersionKind={groupVersionKind} />}
        <span className="co-resource-item__resource-name">
          {value}
          {nameSuffix}
        </span>
        {children}
      </span>
    )
  }

  // determine if this is a hub cluster case (if no cluster or it matches hub name)
  const isHubCluster = !cluster || cluster === hubClusterName

  const getResourcePath = (): string | null => {
    if (!name || !groupVersionKind?.kind) {
      return null
    }

    // first-class ACM resources get special handling in all cases
    if (groupVersionKind.kind === 'ManagedCluster') {
      return `/multicloud/infrastructure/clusters/details/${name}/${name}/overview`
    }

    if (isHubCluster) {
      // hub cluster case, extension-based routing for hub cluster resources
      if (resourceRoutesResolved && resourceRoutes?.length) {
        const extensionPath = getExtensionResourcePath(
          resourceRoutes,
          groupVersionKind.group,
          groupVersionKind.kind,
          groupVersionKind.version,
          {
            cluster: cluster ?? hubClusterName ?? '',
            namespace,
            name,
            resource: { cluster: cluster ?? hubClusterName, namespace, name, ...groupVersionKind },
            model: {
              group: groupVersionKind.group,
              version: groupVersionKind.version,
              kind: groupVersionKind.kind,
            },
          }
        )

        if (extensionPath) {
          return extensionPath
        }
      }

      // for hub cluster resources without extension handlers, return null to fallback to ResourceLink
      return null
    } else {
      // managed cluster case, extensions first, then fallback to search
      if (resourceRoutesResolved && resourceRoutes?.length) {
        const extensionPath = getExtensionResourcePath(
          resourceRoutes,
          groupVersionKind.group,
          groupVersionKind.kind,
          groupVersionKind.version,
          {
            cluster,
            namespace,
            name,
            resource: { cluster, namespace, name, ...groupVersionKind },
            model: {
              group: groupVersionKind.group,
              version: groupVersionKind.version,
              kind: groupVersionKind.kind,
            },
          }
        )

        if (extensionPath) {
          return extensionPath
        }
      }

      // fallback to search results for managed cluster resources
      return `/multicloud/search/resources${getURLSearchParam({
        cluster,
        kind: groupVersionKind.kind,
        apigroup: groupVersionKind.group,
        apiversion: groupVersionKind.version,
        name,
        namespace,
      })}`
    }
  }

  const path = getResourcePath()

  if (!path) {
    return <ResourceLink {...resourceLinkProps} />
  }

  return (
    <span className={classes}>
      {!hideIcon && <ResourceIcon groupVersionKind={groupVersionKind} />}
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
      {children}
    </span>
  )
}
