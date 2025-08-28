/* Copyright Contributors to the Open Cluster Management project */

import { generatePath } from 'react-router-dom-v5-compat'
import queryString from 'query-string'
import { ResourceRouteHandler } from '@stolostron/multicluster-sdk'

/**
 * ACM resource route handler for first-class resource pages.
 * Routes resources to their dedicated ACM pages instead of generic search results.
 */
export const acmResourceRouteHandler: ResourceRouteHandler = ({ cluster, namespace, name, resource, model }) => {
  const { kind, group } = model

  switch (kind.toLowerCase()) {
    case 'cluster':
    case 'managedcluster':
      return generatePath('/multicloud/infrastructure/clusters/details/:namespace/:name/overview', {
        namespace: name,
        name,
      })

    case 'application': {
      if (group === 'app.k8s.io' || group === 'argoproj.io') {
        const params = queryString.stringify({
          apiVersion: `${kind}.${group}`.toLowerCase(),
          cluster: resource._hubClusterResource ? undefined : cluster,
          applicationset: resource.applicationSet ?? undefined,
        })
        const path = generatePath('/multicloud/applications/details/:namespace/:name/overview', {
          namespace: namespace!,
          name,
        })
        return `${path}?${params}`
      }
      break
    }

    case 'policy': {
      if (
        resource._hubClusterResource &&
        group === 'policy.open-cluster-management.io' &&
        !resource.label?.includes('policy.open-cluster-management.io/root-policy')
      ) {
        return generatePath('/multicloud/governance/policies/details/:namespace/:name', {
          namespace: namespace!,
          name,
        })
      }
      break
    }

    case 'policyreport': {
      const path = generatePath('/multicloud/infrastructure/clusters/details/:namespace/:name/overview', {
        namespace: namespace!,
        name: namespace!,
      })
      return `${path}?${encodeURIComponent('showClusterIssues=true')}`
    }
  }

  // fall back to null if no custom route found
  return null as any
}
