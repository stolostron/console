/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest, Http2ServerResponse, OutgoingHttpHeaders } from 'http2'
import { jsonPut, jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { getMultiClusterEngine } from '../lib/multi-cluster-engine'
import { respond, respondInternalServerError } from '../lib/respond'
import { getServiceAccountToken } from '../lib/serviceAccountToken'
import { getServiceAgent } from '../lib/agent'
import { getAuthenticatedToken, getManagedClusterToken } from '../lib/token'
import { canAccess } from './events'

const { HTTP_STATUS_INTERNAL_SERVER_ERROR } = constants
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

          // req.url is one of: /virtualmachines/<action> OR /virtualmachineinstances/<action>
          // the VM name is needed between the kind and action for the correct api url.
          const splitURL = req.url.split('/')
          const joinedURL = `${splitURL[1]}/${body.vmName}/${splitURL[2]}`
          const mce = await getMultiClusterEngine()
          const proxyService = `https://cluster-proxy-addon-user.${mce?.spec?.targetNamespace || 'multicluster-engine'}.svc.cluster.local:9092`
          const proxyURL = process.env.CLUSTER_PROXY_ADDON_USER_ROUTE || proxyService
          const path = `${proxyURL}/${body.managedCluster}/apis/subresources.kubevirt.io/v1/namespaces/${body.vmNamespace}/${joinedURL}`
          const headers: OutgoingHttpHeaders = { authorization: `Bearer ${managedClusterToken}` }
          for (const header of proxyHeaders) {
            if (req.headers[header]) headers[header] = req.headers[header]
          }

          await jsonPut(path, {}, managedClusterToken, getServiceAgent())
            .then((results) => {
              if (results?.statusCode >= 200 && results?.statusCode < 300) {
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify(results))
              } else {
                logger.error({
                  msg: 'Error in VirtualMachine action response',
                  error: results.body?.message ?? '',
                })
                res.setHeader('Content-Type', 'application/json')
                res.writeHead(results.statusCode ?? HTTP_STATUS_INTERNAL_SERVER_ERROR)
                delete results.body?.code // code is added via writeHead
                res.end(JSON.stringify(results.body ?? ''))
              }
            })
            .catch((err: Error) => {
              logger.error({ msg: 'Error on VirtualMachine action request', error: err.message })
              respondInternalServerError(req, res)
              return undefined
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
