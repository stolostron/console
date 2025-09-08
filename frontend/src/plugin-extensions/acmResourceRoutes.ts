/* Copyright Contributors to the Open Cluster Management project */

import { generatePath } from 'react-router-dom-v5-compat'
import queryString from 'query-string'
import { ResourceRouteHandler } from '@stolostron/multicluster-sdk'
import { NavigationPath } from '../NavigationPath'

/**
 * handles routing for acm first-class resources when using FleetResourceLink
 */
export const acmResourceRouteHandler: ResourceRouteHandler = ({ cluster, namespace, name, resource, model }) => {
  const { kind, group } = model

  // use kind.group format for precise matching like search
  const resourceKey = group ? `${kind}.${group}` : kind

  // use resource object for additional context if needed
  const resourceCluster = cluster || resource.cluster
  const resourceNamespace = namespace || resource.metadata?.namespace
  const resourceName = name || resource.metadata?.name

  // ensure we have required parameters
  if (!resourceName) {
    return undefined
  }

  switch (resourceKey.toLowerCase()) {
    case 'managedcluster.cluster.open-cluster-management.io':
      return generatePath(NavigationPath.clusterOverview, {
        namespace: resourceName,
        name: resourceName,
      })

    case 'application.app.k8s.io':
    case 'application.argoproj.io': {
      if (!resourceNamespace) {
        return undefined
      }
      // include cluster param so app page knows which cluster to fetch from
      const params = queryString.stringify({
        apiVersion: `${kind}.${group}`.toLowerCase(),
        cluster: resourceCluster,
      })
      const path = generatePath(NavigationPath.applicationOverview, {
        namespace: resourceNamespace,
        name: resourceName,
      })
      return `${path}?${params}`
    }

    case 'policy.policy.open-cluster-management.io': {
      if (!resourceNamespace) {
        return undefined
      }
      // route to policy details page
      return generatePath(NavigationPath.policyDetails, {
        namespace: resourceNamespace,
        name: resourceName,
      })
    }

    case 'policyreport.wgpolicyk8s.io': {
      if (!resourceNamespace) {
        return undefined
      }
      const path = generatePath(NavigationPath.clusterOverview, {
        namespace: resourceNamespace,
        name: resourceNamespace,
      })
      return `${path}?${encodeURIComponent('showClusterIssues=true')}`
    }
  }

  return undefined
}
