/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { HeadersInit } from 'node-fetch'
import { getServiceAgent } from '../lib/agent'
import { fetchRetry } from '../lib/fetch-retry'
import { jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { getMultiClusterEngine } from '../lib/multi-cluster-engine'
import { respond, respondInternalServerError } from '../lib/respond'
import { getServiceAccountToken } from '../lib/serviceAccountToken'
import { getAuthenticatedToken, getManagedClusterToken } from '../lib/token'
import { canAccess } from './events'

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
    const serviceAccountToken = getServiceAccountToken()

    try {
      const chucks: string[] = []
      req.on('data', (chuck: string) => {
        chucks.push(chuck)
      })
      req.on('end', async () => {
        const body = JSON.parse(chucks.join()) as ActionBody

        // If user is not able to create an MCA in the managed cluster namespace -> they aren't authorized to trigger actions.
        const hasAuth = await canAccess(
          {
            kind: 'ManagedClusterAction',
            apiVersion: 'action.open-cluster-management.io/v1beta1',
            metadata: { namespace: body.managedCluster },
          },
          'create',
          token
        ).then((allowed) => allowed)

        if (hasAuth) {
          // console-mce ClusterRole does not allow for GET on secrets. Have to list in a namespace
          const managedClusterToken: string = await getManagedClusterToken(body.managedCluster, serviceAccountToken)

          const mce = await getMultiClusterEngine()
          const proxyService = `https://cluster-proxy-addon-user.${mce?.spec?.targetNamespace || 'multicluster-engine'}.svc.cluster.local:9092`
          const proxyURL = process.env.CLUSTER_PROXY_ADDON_USER_ROUTE || proxyService

          // req.url is one of:
          //    /virtualmachines/<action>
          //    /virtualmachineinstances/<action>
          //    /virtualmachinesnapshots
          const action = req.url.split('/')[2]
          let subResourceKind = ''
          let path = `${proxyURL}/${body.managedCluster}`
          let reqBody = undefined
          switch (req.url) {
            case '/virtualmachines/start':
            case '/virtualmachines/stop':
            case '/virtualmachines/restart':
              subResourceKind = 'virtualmachines'
              path = `${path}/apis/subresources.kubevirt.io/v1/namespaces/${body.vmNamespace}/${subResourceKind}/${body.vmName}/${action}`
              break
            case '/virtualmachineinstances/pause':
            case '/virtualmachineinstances/unpause':
              subResourceKind = 'virtualmachineinstances'
              path = `${path}/apis/subresources.kubevirt.io/v1/namespaces/${body.vmNamespace}/${subResourceKind}/${body.vmName}/${action}`
              break
            case '/virtualmachinesnapshots':
              subResourceKind = 'virtualmachinesnapshots'
              path = `${path}/apis/snapshot.kubevirt.io/v1beta1/namespaces/${body.vmNamespace}/${subResourceKind}`
              reqBody = JSON.stringify(body.reqBody)
              break
          }

          const headers: HeadersInit =
            req.method === 'POST'
              ? {
                  [HTTP2_HEADER_AUTHORIZATION]: `Bearer ${managedClusterToken}`,
                  [HTTP2_HEADER_ACCEPT]: 'application/json',
                  [HTTP2_HEADER_CONTENT_TYPE]: 'application/json',
                }
              : {
                  [HTTP2_HEADER_AUTHORIZATION]: `Bearer ${managedClusterToken}`,
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
        } else {
          logger.error({ msg: `Unauthorized request ${req.url.split('/')[2]} on VirtualMachine ${body.vmName}` })
          return respond(res, `Unauthorized request ${req.url.split('/')[2]} on VirtualMachine ${body.vmName}`, 401)
        }
      })
    } catch (err) {
      logger.error(err)
      respondInternalServerError(req, res)
    }
  }
}
