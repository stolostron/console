/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest, Http2ServerResponse, OutgoingHttpHeaders } from 'http2'
import { jsonPut, jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { respond, respondInternalServerError } from '../lib/respond'
import { getServiceAccountToken } from '../lib/serviceAccountToken'
import { getAuthenticatedToken } from '../lib/token'
import { ResourceList } from '../resources/resource-list'
import { Secret } from '../resources/secret'
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
          const secretPath = process.env.CLUSTER_API_URL + `/api/v1/namespaces/${body.managedCluster}/secrets`
          const managedClusterToken: string = await jsonRequest(secretPath, serviceAccountToken)
            .then((response: ResourceList<Secret>) => {
              const secret = response.items.find((secret) => secret.metadata.name === 'vm-actor')
              const proxyToken = secret.data?.token ?? ''
              return Buffer.from(proxyToken, 'base64').toString('ascii')
            })
            .catch((err: Error): undefined => {
              logger.error({ msg: `Error getting secret in namespace ${body.managedCluster}`, error: err.message })
              return undefined
            })

          // req.url is one of: /virtualmachines/<action> OR /virtualmachineinstances/<action>
          // the VM name is needed between the kind and action for the correct api url.
          const splitURL = req.url.split('/')
          const joinedURL = `${splitURL[1]}/${body.vmName}/${splitURL[2]}`
          const proxyService = 'https://cluster-proxy-addon-user.multicluster-engine.svc.cluster.local:9092'
          const path = `${proxyService}/${body.managedCluster}/apis/subresources.kubevirt.io/v1/namespaces/${body.vmNamespace}/${joinedURL}`
          const headers: OutgoingHttpHeaders = { authorization: `Bearer ${managedClusterToken}` }
          for (const header of proxyHeaders) {
            if (req.headers[header]) headers[header] = req.headers[header]
          }

          await jsonPut(path, {}, managedClusterToken)
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
