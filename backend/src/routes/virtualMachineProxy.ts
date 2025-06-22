/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { HeadersInit } from 'node-fetch'
import { getServiceAgent } from '../lib/agent'
import { fetchRetry } from '../lib/fetch-retry'
import { jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { getMultiClusterEngine } from '../lib/multi-cluster-engine'
import { getMultiClusterHub } from '../lib/multi-cluster-hub'
import { respondInternalServerError } from '../lib/respond'
import { getServiceAccountToken } from '../lib/serviceAccountToken'
import { getAuthenticatedToken } from '../lib/token'
import { ResourceList } from '../resources/resource-list'
import { Secret } from '../resources/secret'
import { canAccess } from './events'

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

const getKubeVirtAPI = (url: string, name: string, namespace: string, action?: string) => {
  let path = ''
  switch (url) {
    case '/virtualmachines/delete':
      path = `${path}/apis/kubevirt.io/v1/namespaces/${namespace}/virtualmachines/${name}`
      break
    case '/virtualmachines/start':
    case '/virtualmachines/stop':
    case '/virtualmachines/restart':
      path = `${path}/apis/subresources.kubevirt.io/v1/namespaces/${namespace}/virtualmachines/${name}/${action}`
      break
    case '/virtualmachineinstances/pause':
    case '/virtualmachineinstances/unpause':
      path = `${path}/apis/subresources.kubevirt.io/v1/namespaces/${namespace}/virtualmachineinstances/${name}/${action}`
      break
    case '/virtualmachinesnapshots/create':
      path = `${path}/apis/snapshot.kubevirt.io/v1beta1/namespaces/${namespace}/virtualmachinesnapshots`
      break
    case '/virtualmachinesnapshots/delete':
      path = `${path}/apis/snapshot.kubevirt.io/v1beta1/namespaces/${namespace}/virtualmachinesnapshots/${name}`
      break
    case '/virtualmachinerestores':
      path = `${path}/apis/snapshot.kubevirt.io/v1beta1/namespaces/${namespace}/virtualmachinerestores`
      break
  }
  return path
}

export async function virtualMachineGETProxy(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (token) {
    try {
      const mce = await getMultiClusterEngine()
      const proxyService = `https://cluster-proxy-addon-user.${mce?.spec?.targetNamespace || 'multicluster-engine'}.svc.cluster.local:9092`
      const proxyURL = process.env.CLUSTER_PROXY_ADDON_USER_ROUTE || proxyService
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
      const getResponse = await fetchRetry(path, {
        method: 'GET',
        headers: {
          [HTTP2_HEADER_AUTHORIZATION]: `Bearer ${token}`,
        },
        agent: getServiceAgent(),
        compress: true,
      })
        .then((response) => response.json() as unknown)
        .catch((err: Error): undefined => {
          logger.error({ msg: 'Error getting VM resource (fine grained RBAC)', error: err.message })
          return undefined
        })
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(getResponse))
    } catch (err) {
      logger.error(err)
      respondInternalServerError(req, res)
    }
  }
}

export async function virtualMachineProxy(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  let token = await getAuthenticatedToken(req, res)
  if (token) {
    try {
      const mch = await getMultiClusterHub()
      const isFineGrainedRbacEnabled =
        mch?.spec?.overrides?.components?.find(
          (e: { enabled: boolean; name: string }) => e.name === 'fine-grained-rbac-preview'
        )?.enabled ?? false
      const mce = await getMultiClusterEngine()
      const proxyService = `https://cluster-proxy-addon-user.${mce?.spec?.targetNamespace || 'multicluster-engine'}.svc.cluster.local:9092`
      const proxyURL = process.env.CLUSTER_PROXY_ADDON_USER_ROUTE || proxyService

      const chucks: string[] = []
      req.on('data', (chuck: string) => {
        chucks.push(chuck)
      })
      req.on('end', async () => {
        const body = JSON.parse(chucks.join()) as ActionBody
        const action = req.url.split('/')[2]
        const path = `${proxyURL}/${body.managedCluster}${getKubeVirtAPI(req.url, body.vmName, body.vmNamespace, action)}`
        const reqBody = JSON.stringify(body.reqBody)

        if (!isFineGrainedRbacEnabled) {
          // Fine grained RBAC not enabled - need to get managed cluster vm-actor token for proxy
          const serviceAccountToken = getServiceAccountToken()
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
            token = await jsonRequest(secretPath, serviceAccountToken)
              .then((response: ResourceList<Secret>) => {
                const secret = response.items.find((secret) => secret.metadata.name === 'vm-actor')
                const proxyToken = secret.data?.token ?? ''
                return Buffer.from(proxyToken, 'base64').toString('ascii')
              })
              .catch((err: Error): undefined => {
                logger.error({ msg: `Error getting secret in namespace ${body.managedCluster}`, error: err.message })
                return undefined
              })
          }
        }

        const headers: HeadersInit =
          req.method !== 'PUT'
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
                msg: 'Error in VirtualMachine action results (fine grained RBAC)',
                error: results,
              })
              res.setHeader('Content-Type', 'application/json')
              res.writeHead(results.status ?? HTTP_STATUS_INTERNAL_SERVER_ERROR)
              res.end(JSON.stringify(results))
              return 'Error in VirtualMachine action results (fine grained RBAC)'
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
            logger.error({ msg: 'Error in VirtualMachine action request (fine grained RBAC)', error: err.message })
            respondInternalServerError(req, res)
            return `Error in VirtualMachine action request (fine grained RBAC): ${err.message}`
          })
      })
    } catch (err) {
      logger.error(err)
      respondInternalServerError(req, res)
    }
  }
}
