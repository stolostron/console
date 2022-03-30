/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest } from 'http2'
import { parseCookies } from '../lib/cookies'
import { jsonPost } from '../lib/json-request'
import { getServiceAcccountToken } from '../routes/liveness'

const { HTTP2_HEADER_AUTHORIZATION } = constants

export function getToken(req: Http2ServerRequest): string | undefined {
    let token = parseCookies(req)['acm-access-token-cookie']
    if (!token) {
        const authorizationHeader = req.headers[HTTP2_HEADER_AUTHORIZATION]
        if (typeof authorizationHeader === 'string' && authorizationHeader.startsWith('Bearer ')) {
            token = authorizationHeader.slice(7)
        }
    }
    return token
}

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

export function getUserFromTokenReview(req: Http2ServerRequest): Promise<TokenReview> {
    const token = getToken(req)
    const serviceAcccountToken = getServiceAcccountToken()

    const promise = jsonPost<TokenReview>(
        process.env.CLUSTER_API_URL + '/apis/authentication.k8s.io/v1/tokenreviews',
        {
            apiVersion: 'authentication.k8s.io/v1',
            kind: 'TokenReview',
            spec: {
                token,
            },
        },
        serviceAcccountToken
    ).then((result) => {
        return result.body
    })
    return promise
}

export function isKubeAdmin(userTokenReview: TokenReview) {
    return (
        userTokenReview.status &&
        userTokenReview.status.user &&
        userTokenReview.status.user.username &&
        userTokenReview.status.user.username == 'kube:admin'
    )
}
