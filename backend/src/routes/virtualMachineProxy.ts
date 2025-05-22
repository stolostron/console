/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { HeadersInit } from 'node-fetch'
import { getServiceAgent } from '../lib/agent'
import { fetchRetry } from '../lib/fetch-retry'
import { logger } from '../lib/logger'
import { getMultiClusterEngine } from '../lib/multi-cluster-engine'
import { respondInternalServerError } from '../lib/respond'
import { getAuthenticatedToken } from '../lib/token'

const {
  HTTP2_HEADER_CONTENT_TYPE,
  HTTP2_HEADER_AUTHORIZATION,
  HTTP2_HEADER_ACCEPT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} = constants
const proxyHeaders = [
  constants.HTTP2_HEADER_ACCEPT,
  constants.HTTP2_HEADER_ACCEPT_ENCODING,
  constants.HTTP2_HEADER_CONTENT_ENCODING,
  constants.HTTP2_HEADER_CONTENT_LENGTH,
  constants.HTTP2_HEADER_CONTENT_TYPE,
]

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
