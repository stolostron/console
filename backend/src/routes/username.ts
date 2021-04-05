/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'node:http2'
import { parseCookies } from '../lib/cookies'
import { jsonPost } from '../lib/json-request'
import { respond, unauthorized } from '../lib/respond'

export async function username(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
    const token = parseCookies(req)['acm-access-token-cookie']
    if (!token) return unauthorized(req, res)

    try {
        const tokenStatus = await tokenReview(token)
        respond(res, tokenStatus.status.user)
    } catch {
        unauthorized(req, res)
    }
}

export function tokenReview(token: string): Promise<ITokenReview> {
    return jsonPost<ITokenReview>(
        '/apis/authentication.k8s.io/v1/tokenreviews',
        {
            apiVersion: 'authentication.k8s.io/v1',
            kind: 'TokenReview',
            spec: { token },
        },
        token
    ).then((tokenReview) => tokenReview)
}

export interface ITokenReviewStatus {
    authenticated: boolean
    user: { username: string; groups: string[]; extra: Record<string, string[]> }
    audiences: string[]
}

export interface ITokenReview {
    kind: 'TokenReview'
    apiVersion: 'authentication.k8s.io/v1'
    spec: { token: string }
    status: {
        authenticated: boolean
        user: { username: string; groups: string[]; extra: Record<string, string[]> }
        audiences: string[]
    }
}
