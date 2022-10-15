/* Copyright Contributors to the Open Cluster Management project */

import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { respondInternalServerError, unauthorized } from '../lib/respond'
import { getToken, isAuthenticated } from '../lib/token'
import { getServiceAccountToken } from './liveness'

export async function apiPaths(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
    const token = getToken(req)
    if (!token) return unauthorized(req, res)
    const serviceAccountToken = getServiceAccountToken()

    try {
        const authResponse = await isAuthenticated(token)
        if (authResponse.status === constants.HTTP_STATUS_OK) {
            const paths = await jsonRequest<unknown>(process.env.CLUSTER_API_URL + '/', serviceAccountToken).then(
                async (response) => {
                    // /api/<VERSION>
                    // /apis/<GROUP>
                    // /apis/<GROUP>/<VERSION>

                    const apiResourceLists = await Promise.all(
                        response.paths
                            .filter((path) => {
                                const pathArray = path.substring(1).split('/')
                                return (
                                    pathArray.length &&
                                    ((pathArray[0] === 'api' && pathArray.length === 2) ||
                                        (pathArray[0] === 'apis' && pathArray.length === 3))
                                )
                            })
                            .map(async (path) => {
                                return jsonRequest<unknown>(process.env.CLUSTER_API_URL + path, serviceAccountToken)
                            })
                    )
                    // return apiResourceLists
                    return buildPathObject(apiResourceLists)
                }
            )

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(paths))
        } else {
            res.writeHead(authResponse.status).end()
            void authResponse.blob()
        }
    } catch (err) {
        logger.error(err)
        console.log(err)
        respondInternalServerError(req, res)
    }
}

function buildPathObject(jsonResponse: unknown) {
    // TODO: handle sub-resources
    const jsonBody = {}
    jsonResponse.forEach((resourceList) => {
        const groupVersion = resourceList['groupVersion']
        resourceList['resources'].forEach((resource) => {
            const singularName = resource['singularName']
            const name = resource['name']
            const kind = resource['kind']
            jsonBody[kind] = {
                groupVersion,
                apiVersion,
                name,
                singularName,
            }
        })
    })

    /* 
    Kind: {
      groupVersion,
      name, 
      singularName,
    }
    Example: 
    "OperatorPKI": {
    "groupVersion": "network.operator.openshift.io/v1",
    "name": "operatorpkis",
    "singularName": "operatorpki"
  },
    */
    return jsonBody
}
