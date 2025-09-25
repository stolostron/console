/* Copyright Contributors to the Open Cluster Management project */
import { useSharedSelectors, useRecoilValue } from '../shared-recoil'
import { useOperatorCheck, SupportedOperator } from './operatorCheck'

function api<T>(url: string, headers?: Record<string, unknown>): Promise<T> {
  return fetch(url, headers).then((response) => {
    if (!response.ok) {
      throw new Error(response.statusText)
    }
    return response.json() as Promise<T>
  })
}

export function launchToOCP(urlSuffix: string) {
  window.open(`/${urlSuffix}`)
}

export function checkOCPVersion(switcherExists: (arg0: boolean) => void) {
  if (process.env.NODE_ENV === 'test') return
  api<{ gitVersion: string }>('/multicloud/version/')
    .then(({ gitVersion }) => {
      if (parseFloat(gitVersion.substr(1, 4)) >= 1.2) {
        switcherExists(true)
      } else {
        switcherExists(false)
      }
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error(error)
      switcherExists(false)
    })
}

export function useMultiClusterHubConsoleUrl(resourceName = 'multiclusterhub', view: 'yaml' | 'details' = 'yaml') {
  const { acmOperatorSubscriptionsValue } = useSharedSelectors()
  const acmOperatorSubscriptions = useRecoilValue(acmOperatorSubscriptionsValue)
  const acmOperator = useOperatorCheck(SupportedOperator.acm, acmOperatorSubscriptionsValue)

  if (!acmOperator.installed || !acmOperator.version || !acmOperatorSubscriptions.length) {
    return null
  }

  // Get the namespace from the ACM operator subscription
  const operatorNamespace = acmOperatorSubscriptions[0]?.metadata?.namespace || 'open-cluster-management'

  const baseUrl = `/k8s/ns/${operatorNamespace}/operators.coreos.com~v1alpha1~ClusterServiceVersion/${acmOperator.version}/operator.open-cluster-management.io~v1~MultiClusterHub`

  if (view === 'details') {
    return `${baseUrl}/${resourceName}`
  }

  return `${baseUrl}/${resourceName}/${view}`
}
