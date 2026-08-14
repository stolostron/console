/* Copyright Contributors to the Open Cluster Management project */
import type { Http2ServerRequest, Http2ServerResponse } from 'node:http2'
import { constants } from 'node:http2'
import type { RequestOptions } from 'node:https'
import { request } from 'node:https'
import { pipeline } from 'node:stream'
import { URL } from 'node:url'
import { jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { catchInternalServerError, notFound, respond, respondBadRequest } from '../lib/respond'
import { getAuthenticatedToken } from '../lib/token'

interface AnsibleTowerRequest {
  // Reference to the Ansible credential Secret. The backend reads it with the
  // caller's bearer token so kube-apiserver enforces RBAC; the tower host and
  // token are derived server-side and never accepted from the request body.
  secretNamespace: string
  secretName: string
  // Allow-listed AAP API path (optionally with query string for pagination).
  ansiblePath: string
}

interface AnsibleSecret {
  data?: { host?: string; token?: string }
}

// must match ansiblePaths in frontend/src/resources/utils/resource-request.ts
// 2.5 and later ansible operator version only support Gateway URL. Gateway URL need below paths.
// '/api/controller/v2/job_templates/', '/api/controller/v2/workflow_job_templates/', '/api/controller/v2/inventories/''
export const ansiblePaths = [
  '/api/v2/job_templates/',
  '/api/v2/workflow_job_templates/',
  '/api/v2/inventories/',
  '/api/controller/v2/job_templates/',
  '/api/controller/v2/workflow_job_templates/',
  '/api/controller/v2/inventories/',
]

export function ansibleTower(req: Http2ServerRequest, res: Http2ServerResponse): void {
  getAuthenticatedToken(req, res)
    .then((userToken) => {
      const chucks: string[] = []
      req.on('data', (chuck: string) => {
        chucks.push(chuck)
      })
      req.on('end', () => {
        let body: AnsibleTowerRequest
        try {
          body = JSON.parse(chucks.join('')) as AnsibleTowerRequest
        } catch (err) {
          return respondBadRequest(req, res)
        }
        if (
          typeof body.secretNamespace !== 'string' ||
          typeof body.secretName !== 'string' ||
          typeof body.ansiblePath !== 'string'
        ) {
          return respondBadRequest(req, res)
        }

        // Resolve the tower host + token from the credential Secret using the
        // caller's own token. A 401/403 from kube-apiserver means the caller
        // is not authorized for this credential; never proxy in that case.
        const secretPath =
          process.env.CLUSTER_API_URL +
          `/api/v1/namespaces/${encodeURIComponent(body.secretNamespace)}/secrets/${encodeURIComponent(body.secretName)}`
        jsonRequest<AnsibleSecret>(secretPath, userToken, 0)
          .then((secret) => {
            const host = secret?.data?.host ? Buffer.from(secret.data.host, 'base64').toString('utf8') : ''
            const token = secret?.data?.token ? Buffer.from(secret.data.token, 'base64').toString('utf8') : ''
            if (!host || !token) {
              return respondBadRequest(req, res)
            }

            let hostUrl: URL
            let towerUrl: URL
            try {
              hostUrl = new URL(host)
              towerUrl = new URL(body.ansiblePath, hostUrl)
            } catch (err) {
              return respondBadRequest(req, res)
            }

            // The ansiblePath is caller-supplied and only meant to be a relative
            // API path. Reject absolute or network-path references that would
            // point the proxy (and the Secret-derived token) at any origin other
            // than the host configured in the credential Secret.
            if (towerUrl.origin !== hostUrl.origin) {
              return respondBadRequest(req, res)
            }

            // allow list of apis our ui calls
            if (!ansiblePaths.includes(towerUrl.pathname)) {
              return respondBadRequest(req, res)
            }

            const options: RequestOptions = {
              protocol: towerUrl.protocol,
              hostname: towerUrl.hostname,
              port: towerUrl.port,
              path: `${towerUrl.pathname}${towerUrl.search ? towerUrl.search : ''}`,
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
              },
              rejectUnauthorized: false, // NOSONAR - AAP connects insecurely by default
            }

            const towerReq = request(options, (response) => {
              if (!response) return notFound(req, res)
              res.writeHead(response.statusCode ?? 500, response.headers)
              pipeline(response, res as unknown as NodeJS.WritableStream, (err) => {
                if (err) {
                  logger.error(err)
                }
              })
            })
            towerReq.on('error', (e) => {
              logger.error(e)
              respond(res, JSON.stringify(e.message), constants.HTTP_STATUS_INTERNAL_SERVER_ERROR)
            })
            towerReq.end()
          })
          .catch(catchInternalServerError(res))
      })
    })
    .catch(catchInternalServerError(res))
}
