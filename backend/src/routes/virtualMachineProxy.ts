/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { HeadersInit } from 'node-fetch'
import { getServiceAgent } from '../lib/agent'
import { fetchRetry } from '../lib/fetch-retry'
import { logger } from '../lib/logger'
import { getMultiClusterEngine } from '../lib/multi-cluster-engine'
import { respondInternalServerError } from '../lib/respond'
import { getAuthenticatedToken } from '../lib/token'
import { jsonRequest } from '../lib/json-request'
import {
  PodMetricsList,
  convertNanocoresToMillicores,
  convertKibibytesToMebibytes,
  convertBytesToGibibytes,
  FilesystemlistType,
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
      const chucks: string[] = []
      req.on('data', (chuck: string) => {
        chucks.push(chuck)
      })
      req.on('end', async () => {
        const body = JSON.parse(chucks.join()) as ActionBody
        const mce = await getMultiClusterEngine()
        const proxyService = `https://cluster-proxy-addon-user.${mce?.spec?.targetNamespace || 'multicluster-engine'}.svc.cluster.local:9092`
        const proxyURL = process.env.CLUSTER_PROXY_ADDON_USER_ROUTE || proxyService

        // req.url is one of:
        //    /virtualmachines/<action>
        //    /virtualmachineinstances/<action>
        //    /virtualmachinesnapshots
        //    /virtualmachinerestores
        const action = req.url.split('/')[2]
        let path = `${proxyURL}/${body.managedCluster}`
        let reqBody = undefined
        switch (req.url) {
          case '/virtualmachines/start':
          case '/virtualmachines/stop':
          case '/virtualmachines/restart':
            path = `${path}/apis/subresources.kubevirt.io/v1/namespaces/${body.vmNamespace}/virtualmachines/${body.vmName}/${action}`
            break
          case '/virtualmachineinstances/pause':
          case '/virtualmachineinstances/unpause':
            path = `${path}/apis/subresources.kubevirt.io/v1/namespaces/${body.vmNamespace}/virtualmachineinstances/${body.vmName}/${action}`
            break
          case '/virtualmachinesnapshots':
            path = `${path}/apis/snapshot.kubevirt.io/v1beta1/namespaces/${body.vmNamespace}/virtualmachinesnapshots`
            reqBody = JSON.stringify(body.reqBody)
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
            logger.warn(response)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(response))
          })
          .catch((err: Error) => {
            logger.error({ msg: 'Error on VirtualMachine action request', error: err.message })
            respondInternalServerError(req, res)
            return `Error on VirtualMachine action request: ${err.message}`
          })
      })
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
 * - Returns the total CPU (millicores), memory (MiB), and storage (GiB) usage.
 *
 * @param req - The incoming HTTP/2 server request.
 * @param res - The HTTP/2 server response to write usage results or errors.
 * @param params - A record containing URL parameters; expects `cluster` and `namespace`.
 *
 * @throws Responds with 500 if token acquisition or any data fetch fails.
 */
export async function vmResourceUsageProxy(
  req: Http2ServerRequest,
  res: Http2ServerResponse,
  params: Record<string, string>
): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (!token) {
    respondInternalServerError(req, res)
    return
  }

  const clusterName = params.cluster
  const namespace = params.namespace

  if (!clusterName || !namespace) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Cluster name and namespace are required' }))
    return
  }

  const mce = await getMultiClusterEngine()
  const proxyService = `https://cluster-proxy-addon-user.${mce?.spec?.targetNamespace || 'multicluster-engine'}.svc.cluster.local:9092`
  const proxyURL = process.env.CLUSTER_PROXY_ADDON_USER_ROUTE || proxyService

  try {
    const podMetricsList = await jsonRequest<PodMetricsList>(
      `${proxyURL}/${clusterName}/apis/metrics.k8s.io/v1beta1/namespaces/${namespace}/pods?labelSelector=kubevirt.io=virt-launcher`,
      token
    )

    let sumCpuUsage = 0 // in millicores
    let sumMemoryUsage = 0 // in MiB

    const storagePromises: Promise<FilesystemlistType>[] = podMetricsList?.items?.map((item) => {
      // Add CPU and Memory usage from this pod
      item.containers.forEach((container) => {
        sumCpuUsage += convertNanocoresToMillicores(container.usage.cpu)
        sumMemoryUsage += convertKibibytesToMebibytes(container.usage.memory)
      })

      // Skip fetching filesystem metrics if the VM name label is missing
      const vmiName = item?.metadata?.labels['vm.kubevirt.io/name']
      if (!vmiName) {
        return Promise.resolve<FilesystemlistType>(null)
      }

      return jsonRequest<FilesystemlistType>(
        `${proxyURL}/${clusterName}/apis/subresources.kubevirt.io/v1/namespaces/${namespace}/virtualmachineinstances/${vmiName}/filesystemlist`,
        token
      )
    })

    const storageResults = await Promise.all(storagePromises)

    let sumStorageUsage = 0 // in GiB
    storageResults.forEach((response) => {
      // Ensure the response is not null (for cases we skipped) and has items
      if (response && response.items) {
        response.items.forEach((item) => {
          sumStorageUsage += convertBytesToGibibytes(item.usedBytes)
        })
      }
    })

    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        cpu: sumCpuUsage,
        memory: sumMemoryUsage,
        storage: sumStorageUsage,
      })
    )
  } catch (err: unknown) {
    logger.error({ msg: 'Failed to get aggregated VM usage', error: err })
    respondInternalServerError(req, res)
  }
}
