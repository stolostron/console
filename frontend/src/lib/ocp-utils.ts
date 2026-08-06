/* Copyright Contributors to the Open Cluster Management project */
import { useSharedSelectors, useRecoilValue } from '../shared-recoil'
import { useOperatorCheck, SupportedOperator } from './operatorCheck'
import { CLUSTER_EXTENSION_SOURCE_LABEL } from '../resources/cluster-extension'

function api<T>(url: string, headers?: Record<string, unknown>): Promise<T> {
  return fetch(url, headers).then((response) => {
    if (!response.ok) {
      throw new Error(response.statusText)
    }
    return response.json() as Promise<T>
  })
}

export function launchToOCP(urlSuffix: string) {
  const normalizedPath = urlSuffix.startsWith('/') ? urlSuffix : `/${urlSuffix}`
  window.open(normalizedPath)
}

export function checkOCPVersion(switcherExists: (arg0: boolean) => void) {
  if (process.env.NODE_ENV === 'test') return
  api<{ gitVersion: string }>('/multicloud/version/')
    .then(({ gitVersion }) => {
      if (Number.parseFloat(gitVersion.substr(1, 4)) >= 1.2) {
        switcherExists(true)
      } else {
        switcherExists(false)
      }
    })
    .catch((error) => {
      console.error(error)
      switcherExists(false)
    })
}

export function useMultiClusterHubConsoleUrl(resourceName = 'multiclusterhub', view: 'yaml' | 'details' = 'yaml') {
  const { acmOperatorSubscriptionsValue } = useSharedSelectors()
  const acmOperatorSubscriptions = useRecoilValue(acmOperatorSubscriptionsValue)
  const acmOperator = useOperatorCheck(SupportedOperator.acm, acmOperatorSubscriptionsValue)

  if (!acmOperator.installed || !acmOperatorSubscriptions.length) {
    return null
  }

  const operatorResource = acmOperatorSubscriptions[0]
  const operatorNamespace = operatorResource?.metadata?.namespace || 'open-cluster-management'
  const fromClusterExtension =
    operatorResource?.metadata?.labels?.[CLUSTER_EXTENSION_SOURCE_LABEL] === 'ClusterExtension'

  // OLMv1 installs do not create a ClusterServiceVersion; link to the ClusterExtension instead.
  if (fromClusterExtension) {
    const clusterExtensionName = operatorResource.metadata?.name
    if (!clusterExtensionName) {
      return null
    }
    return `/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/${clusterExtensionName}`
  }

  if (!acmOperator.version) {
    return null
  }

  const baseUrl = `/k8s/ns/${operatorNamespace}/operators.coreos.com~v1alpha1~ClusterServiceVersion/${acmOperator.version}/operator.open-cluster-management.io~v1~MultiClusterHub`

  if (view === 'details') {
    return `${baseUrl}/${resourceName}`
  }

  return `${baseUrl}/${resourceName}/${view}`
}
