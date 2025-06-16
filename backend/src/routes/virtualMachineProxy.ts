/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { HeadersInit } from 'node-fetch'
import { getServiceAgent } from '../lib/agent'
import { fetchRetry } from '../lib/fetch-retry'
import { jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { getMultiClusterEngine } from '../lib/multi-cluster-engine'
import { respondInternalServerError } from '../lib/respond'
import { getAuthenticatedToken } from '../lib/token'
import {
  calUsagePercent,
  convertBytesToGibibytes,
  convertKibibytesToMebibytes,
  convertNanocoresToMillicores,
  FilesystemType,
  PodListType,
  PodMetric,
  PodMetricsList,
  PodType,
  toMebibytes,
  toMillicores,
  VmiUsageType,
} from '../lib/virtual-machine'

const {
  HTTP2_HEADER_CONTENT_TYPE,
  HTTP2_HEADER_AUTHORIZATION,
  HTTP2_HEADER_ACCEPT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} = constants

interface ActionBody {
  managedCluster: string
  vmName: string
  vmNamespace: string
  reqBody?: object
}

export async function virtualMachineProxy(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (token) {
    try {
      const mce = await getMultiClusterEngine()
      const proxyService = `https://cluster-proxy-addon-user.${mce?.spec?.targetNamespace || 'multicluster-engine'}.svc.cluster.local:9092`
      const proxyURL = process.env.CLUSTER_PROXY_ADDON_USER_ROUTE || proxyService

      if (req.method === 'GET') {
        const urlSplit = req.url.split('/')
        // vm get requests have url /virtualmachines/get/<managedCluster>/<name>/<namespace>
        const managedCluster = urlSplit[3]
        const vmName = urlSplit[4]
        const vmNamespace = urlSplit[5]
        let path = `${proxyURL}/${managedCluster}`
        if (req.url.startsWith('/virtualmachines/get')) {
          path = `${path}/apis/kubevirt.io/v1/namespaces/${vmNamespace}/virtualmachines/${vmName}`
        } else if (req.url.startsWith('/virtualmachinesnapshots/get')) {
          path = `${path}/apis/snapshot.kubevirt.io/v1beta1/namespaces/${vmNamespace}/virtualmachinesnapshots/${vmName}`
        }
        const getResponse = await jsonRequest(path, token)
          .then((response) => response)
          .catch((err: Error): undefined => {
            logger.error({ msg: 'Error getting VM resource', error: err.message })
            return undefined
          })
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(getResponse))
      } else {
        const chucks: string[] = []
        req.on('data', (chuck: string) => {
          chucks.push(chuck)
        })
        req.on('end', async () => {
          const body = JSON.parse(chucks.join()) as ActionBody
          const action = req.url.split('/')[2]
          let path = `${proxyURL}/${body.managedCluster}`
          let reqBody = undefined
          switch (req.url) {
            case '/virtualmachines/delete':
              path = `${path}/apis/kubevirt.io/v1/namespaces/${body.vmNamespace}/virtualmachines/${body.vmName}`
              break
            case '/virtualmachines/start':
            case '/virtualmachines/stop':
            case '/virtualmachines/restart':
              path = `${path}/apis/subresources.kubevirt.io/v1/namespaces/${body.vmNamespace}/virtualmachines/${body.vmName}/${action}`
              break
            case '/virtualmachineinstances/pause':
            case '/virtualmachineinstances/unpause':
              path = `${path}/apis/subresources.kubevirt.io/v1/namespaces/${body.vmNamespace}/virtualmachineinstances/${body.vmName}/${action}`
              break
            case '/virtualmachinesnapshots/create':
              path = `${path}/apis/snapshot.kubevirt.io/v1beta1/namespaces/${body.vmNamespace}/virtualmachinesnapshots`
              reqBody = JSON.stringify(body.reqBody)
              break
            case '/virtualmachinesnapshots/delete':
              path = `${path}/apis/snapshot.kubevirt.io/v1beta1/namespaces/${body.vmNamespace}/virtualmachinesnapshots/${body.vmName}`
              break
            case '/virtualmachinerestores':
              path = `${path}/apis/snapshot.kubevirt.io/v1beta1/namespaces/${body.vmNamespace}/virtualmachinerestores`
              reqBody = JSON.stringify(body.reqBody)
              break
          }

          const headers: HeadersInit =
            req.method === 'POST'
              ? {
                  [HTTP2_HEADER_AUTHORIZATION]: `Bearer ${token}`,
                  [HTTP2_HEADER_ACCEPT]: 'application/json',
                  [HTTP2_HEADER_CONTENT_TYPE]: 'application/json',
                }
              : {
                  [HTTP2_HEADER_AUTHORIZATION]: `Bearer ${token}`,
                }

          await fetchRetry(path, {
            method: req.method,
            headers,
            agent: getServiceAgent(),
            body: reqBody,
            compress: true,
          })
            .then(async (results) => {
              if (results?.status > 300) {
                logger.error({
                  msg: 'Error in VirtualMachine action response',
                  error: results,
                })
                res.setHeader('Content-Type', 'application/json')
                res.writeHead(results.status ?? HTTP_STATUS_INTERNAL_SERVER_ERROR)
                res.end(JSON.stringify(results))
                return 'Error on VirtualMachine action request'
              }
              let response = undefined
              if (req.method === 'POST') {
                response = (await results.json()) as unknown
              } else {
                response = { statusCode: results.status }
              }
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(response))
            })
            .catch((err: Error) => {
              logger.error({ msg: 'Error on VirtualMachine action request', error: err.message })
              respondInternalServerError(req, res)
              return `Error on VirtualMachine action request: ${err.message}`
            })
        })
      }
    } catch (err) {
      logger.error(err)
      respondInternalServerError(req, res)
    }
  }
}

/**
 * Handles a request to retrieve aggregated CPU, memory, and storage usage
 * for all KubeVirt virtual machines (VMs) in a given namespace and cluster.
 *
 * This function:
 * - Authenticates the request and retrieves the token.
 * - Uses the token to proxy requests to the cluster via the Cluster Proxy Addon.
 * - Fetches pod metrics (CPU and memory) from `metrics.k8s.io`.
 * - Fetches filesystem usage data from the KubeVirt `filesystemlist` subresource.
 * - Aggregates usage data across all matched pods (virt-launchers).
 * - Returns the total CPU (millicores), memory (MiB), and storage (GiB) usage in the namespace.
 
 *
 * @param req - The incoming HTTP/2 server request.
 * @param res - The HTTP/2 server response to write usage results or errors.
 * @param params - A record containing URL parameters; expects `cluster` and `namespace`.
* On success, it sends a 200 OK with a JSON body like:
 * ```json
 * {
 * "cpu": number,
 * "memory": number,
 * "storage": number,
 * "vmisUsage": [{
 * "cpu": {
 * "requested": number, / millicores
 * "usage": number, // millicores
 * "usagePercent": number // ex: 20
 * },
 * "memory": {
 * "requested": 0, // MiB
 * "usage": 0, // MiB
 * "usagePercent": 0 // ex: 20
 * },
 * "storage": {
 * "requested": 0, // GiB
 * "usage": 0, // GiB
 * "usagePercent": 0 ex: 20
 * },
 * "podName": string,
 * "vmiName": string,
 * "clusterName": string,
 * "namespace": string
 * }]
 * }
 * ```
 * On failure, it sends an error response (e.g., 500 Internal Server Error).
 * @throws Responds with 500 if token acquisition or any data fetch fails.
 */
export async function vmResourceUsageProxy(
  req: Http2ServerRequest,
  res: Http2ServerResponse,
  params: Record<string, string>
): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (!token) {
    respondInternalServerError(req, res) // Or a 401 Unauthorized error
    return
  }

  const { cluster: clusterName, namespace } = params
  if (!clusterName || !namespace) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Cluster name and namespace are required' }))
    return
  }

  try {
    const proxyURL = await getProxyUrl()
    const { podMetricsList, podList } = await fetchVmData(proxyURL, clusterName, namespace, token)

    const usageData = await calculateAllVmiUsage(podMetricsList, podList, {
      proxyURL,
      clusterName,
      namespace,
      token,
    })

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(usageData))
  } catch (err: unknown) {
    // A single catch block for any failure during the process
    logger.error({ msg: 'Failed to get aggregated VM usage', error: err })
    respondInternalServerError(req, res)
  }
}

/**
 * @description Determines the correct proxy URL for making API requests.
 * It prefers the environment variable and falls back to a constructed SVC URL.
 * @returns {Promise<string>} The resolved proxy URL.
 */
async function getProxyUrl(): Promise<string> {
  if (process.env.CLUSTER_PROXY_ADDON_USER_ROUTE) {
    return process.env.CLUSTER_PROXY_ADDON_USER_ROUTE
  }
  const mce = await getMultiClusterEngine()
  const targetNamespace = mce?.spec?.targetNamespace || 'multicluster-engine'
  return `https://cluster-proxy-addon-user.${targetNamespace}.svc.cluster.local:9092`
}

/**
 * @description Fetches the initial Pod and PodMetrics lists from the proxied cluster.
 * @param {string} proxyURL The base URL of the cluster proxy.
 * @param {string} clusterName The name of the target cluster.
 * @param {string} namespace The namespace to query within the target cluster.
 * @param {string} token The authentication token.
 * @returns {Promise<{podMetricsList: PodMetricsList, podList: PodListType}>} The fetched data.
 */
async function fetchVmData(proxyURL: string, clusterName: string, namespace: string, token: string) {
  const labelSelector = 'kubevirt.io=virt-launcher'
  const podMetricsListUrl = `${proxyURL}/${clusterName}/apis/metrics.k8s.io/v1beta1/namespaces/${namespace}/pods?labelSelector=${labelSelector}`
  const podListUrl = `${proxyURL}/${clusterName}/api/v1/namespaces/${namespace}/pods?labelSelector=${labelSelector}`

  // Fetch initial data in parallel
  const [podMetricsList, podList] = await Promise.all([
    jsonRequest<PodMetricsList>(podMetricsListUrl, token),
    jsonRequest<PodListType>(podListUrl, token),
  ])

  return { podMetricsList, podList }
}

/**
 * @description Processes raw pod and metrics data to calculate detailed usage for each VM
 * and aggregates the totals for the entire namespace.
 *
 * @param {PodMetricsList} podMetricsList The list of pod metrics.
 * @param {PodListType} podList The list of pod specs.
 * @param {object} context Context object containing necessary parameters for sub-requests.
 * @returns {Promise<object>} An object containing aggregated totals and a list of per-VMI usage.
 */
async function calculateAllVmiUsage(
  podMetricsList: PodMetricsList,
  podList: PodListType,
  context: {
    proxyURL: string
    clusterName: string
    namespace: string
    token: string
  }
) {
  // Use a Map for efficient O(1) lookups of pods by their name.
  const podMap = new Map(podList.items.map((pod) => [pod.metadata.name, pod]))

  // Map each pod metric to a promise that resolves with its full usage details.
  const usagePromises = podMetricsList.items.map((metric) =>
    calculateSingleVmiUsage(metric, podMap.get(metric.metadata.name), context)
  )

  const results = await Promise.allSettled(usagePromises)

  // --- Aggregate the results ---
  const vmisUsage: VmiUsageType[] = []
  let sumCpuUsageInNs = 0 // in millicores
  let sumMemoryUsageInNs = 0 // in MiB
  let sumStorageUsageInNs = 0 // in GiB (Note: your original was in GiB)

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      const vmiUsage = result.value
      vmisUsage.push(vmiUsage)
      sumCpuUsageInNs += vmiUsage.cpu.usage
      sumMemoryUsageInNs += vmiUsage.memory.usage
      sumStorageUsageInNs += vmiUsage.storage.usage
    } else if (result.status === 'rejected') {
      logger.error({ msg: 'Failed to process a VM metric', error: result.reason as unknown })
    }
  }

  return {
    cpu: sumCpuUsageInNs,
    memory: sumMemoryUsageInNs,
    storage: sumStorageUsageInNs,
    vmisUsage,
  }
}

/**
 * @description Calculates the resource usage for a single Virtual Machine Instance.
 * This function is designed to be called concurrently.
 * @param {PodMetrics} metric The metrics for a single virt-launcher pod.
 * @param {Pod | undefined} pod The full pod spec, if found.
 * @param {object} context Context object for making further API calls.
 * @returns {Promise<VmiUsageType | null>} A promise that resolves to the VMI's usage data, or null if it cannot be processed.
 */
async function calculateSingleVmiUsage(
  metric: PodMetric,
  pod: PodType | undefined,
  context: {
    proxyURL: string
    clusterName: string
    namespace: string
    token: string
  }
): Promise<VmiUsageType | null> {
  const vmiName = metric?.metadata?.labels['vm.kubevirt.io/name']
  // If the pod spec is missing or it's not a VM pod, skip it.
  if (!pod || !vmiName) {
    return null
  }

  // --- Calculate CPU and Memory Usage ---
  let podRequestedCPU = 0
  let podRequestedMemory = 0
  pod.spec.containers.forEach((c) => {
    // Assuming these helper functions handle undefined/null inputs gracefully (e.g., return 0)
    podRequestedCPU += toMillicores(c.resources?.requests?.cpu)
    podRequestedMemory += toMebibytes(c.resources?.requests?.memory)
  })

  let podCpuUsage = 0
  let podMemoryUsage = 0
  metric.containers.forEach((container) => {
    podCpuUsage += convertNanocoresToMillicores(container.usage.cpu)
    podMemoryUsage += convertKibibytesToMebibytes(container.usage.memory)
  })

  // --- Fetch and Calculate Storage Usage ---
  const { proxyURL, clusterName, namespace, token } = context
  const filesystemUrl = `${proxyURL}/${clusterName}/apis/subresources.kubevirt.io/v1/namespaces/${namespace}/virtualmachineinstances/${vmiName}/filesystemlist`
  const filesystem = await jsonRequest<FilesystemType>(filesystemUrl, token)

  let podStorageUsage = 0
  let podStorageTotal = 0
  if (filesystem?.items) {
    filesystem.items.forEach((item) => {
      // Assuming these helpers convert bytes to GiB as in the original code
      podStorageUsage += convertBytesToGibibytes(item.usedBytes)
      podStorageTotal += convertBytesToGibibytes(item.totalBytes)
    })
  }

  // --- Assemble final VMI usage object ---
  return {
    podName: pod.metadata.name,
    vmiName: vmiName,
    clusterName,
    namespace,
    cpu: {
      requested: Math.round(podRequestedCPU),
      usage: Math.round(podCpuUsage),
      usagePercent: calUsagePercent(podCpuUsage, podRequestedCPU),
    },
    memory: {
      requested: Math.round(podRequestedMemory),
      usage: Math.round(podMemoryUsage),
      usagePercent: calUsagePercent(podMemoryUsage, podRequestedMemory),
    },
    storage: {
      requested: Math.round(podStorageTotal),
      usage: Math.round(podStorageUsage),
      usagePercent: calUsagePercent(podStorageUsage, podStorageTotal),
    },
  }
}
