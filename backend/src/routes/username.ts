/* Copyright Contributors to the Open Cluster Management project */

import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { Agent } from 'https'
import { readFileSync } from 'fs'
import { jsonPost } from '../lib/json-request'
import { logger } from '../lib/logger'
import { respondInternalServerError, unauthorized } from '../lib/respond'
import { getToken } from '../lib/token'

const { HTTP2_HEADER_AUTHORIZATION } = constants
const agent = new Agent({ rejectUnauthorized: false })

// Type returned by /apis/authentication.k8s.io/v1/tokenreviews
interface TokenReview {
    spec: {
        token: string
    }
    status: {
        authenticated: boolean
        error: string
        user: {
            username: string
        }
    }
}

export async function username(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
    const serviceAccountPath = '/var/run/secrets/kubernetes.io/serviceaccount'
    const token = getToken(req)
    if (!token) return unauthorized(req, res)

    let serviceaccountToken = null
    try {
        if (process.env.NODE_ENV === 'production') {
            serviceaccountToken = readFileSync(`${serviceAccountPath}/token`, 'utf8')
        } else {
            serviceaccountToken = process.env.TOKEN || ''
        }
    } catch (err: unknown) {
        if (err instanceof Error) {
            logger.error('Error reading service account token', err && err.message)
        } else {
            logger.error({ msg: 'Error reading service account token', err: err })
        }
    }

    try {
        const response = await jsonPost<TokenReview>(
            process.env.CLUSTER_API_URL + '/apis/authentication.k8s.io/v1/tokenreviews',
            {
                apiVersion: 'authentication.k8s.io/v1',
                kind: 'TokenReview',
                spec: {
                    token,
                },
            },
            serviceaccountToken
        )
        const name =
            response.body && response.body.status && response.body.status.user && response.body.status.user.username
                ? response.body.status.user.username
                : ''
        const responsePayload = {
            statusCode: response.statusCode,
            body: { username: name },
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(responsePayload))
    } catch (err) {
        logger.error(err)
        respondInternalServerError(req, res)
    }
}
