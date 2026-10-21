/* Copyright Contributors to the Open Cluster Management project */

/** OCP Console host flags; absent in standalone ACM console and non-browser contexts. */
const serverFlags = typeof window !== 'undefined' ? window.SERVER_FLAGS : undefined

export const PROMETHEUS_BASE_PATH = serverFlags?.prometheusBaseURL
export const PROMETHEUS_TENANCY_BASE_PATH = serverFlags?.prometheusTenancyBaseURL
export const ALERTMANAGER_BASE_PATH = serverFlags?.alertManagerBaseURL
export const ALERTMANAGER_USER_WORKLOAD_BASE_PATH = serverFlags?.alertmanagerUserWorkloadBaseURL
export const ALERTMANAGER_TENANCY_BASE_PATH = 'api/alertmanager-tenancy' // remove it once it get added to SERVER_FLAGS
export const DEFAULT_PROMETHEUS_SAMPLES = 60
export const DEFAULT_PROMETHEUS_TIMESPAN = 1000 * 60 * 60

/**
 * Console backend base path.
 * Prefer `REACT_APP_BACKEND_PATH` when the host app defines it (standalone uses
 * `/multicloud`). In OpenShift Console plugin mode, prefix with `PLUGIN_PROXY_PATH`
 * so requests hit `/api/proxy/plugin/{acm|mce}/console/multicloud/...` (BRIDGE_PLUGIN_PROXY),
 * not bare `/multicloud/...` which the console serves as HTML. Fall back to the MCE
 * plugin proxy path for external consumers of the published SDK.
 */
export const BACKEND_URL = (() => {
  const backendPath = process.env.REACT_APP_BACKEND_PATH || '/api/proxy/plugin/mce/console/multicloud'
  if (process.env.MODE === 'plugin') {
    const proxyPath = process.env.PLUGIN_PROXY_PATH
    if (proxyPath && process.env.REACT_APP_BACKEND_PATH) {
      return `${proxyPath}${process.env.REACT_APP_BACKEND_PATH}`
    }
  }
  return backendPath
})()

export const BASE_K8S_API_PATH = '/api/kubernetes'
export const BASE_FLEET_SEARCH_PATH = '/multicloud/search/resources'

export const MANAGED_CLUSTER_API_PATH = 'managedclusterproxy'

export const NO_FLEET_AVAILABLE_ERROR =
  'A version of RHACM that is compatible with the multicluster SDK is not available'

export const MULTICLUSTER_OBSERVABILITY_NOT_INSTALLED = 'Multicluster observability is not installed on this cluster'
