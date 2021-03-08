import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { Agent } from 'https'
import { URL } from 'url'
import { parseJsonBody } from '../lib/body-parser'
import { parseCookies } from '../lib/cookies'
import { logger } from '../lib/logger'
import { respond, respondOK, unauthorized } from '../lib/respond'
import { getRemoteResource, requestException, updateRemoteResource } from '../lib/utils'

export async function upgrade(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
    const token = parseCookies(req)['acm-access-token-cookie']
    if (!token) return unauthorized(req, res)

    req.setTimeout(2 * 60 * 1000)

    const reqBody: { clusterName: string; version: string } = await parseJsonBody(req)
    if (!reqBody || !reqBody.clusterName || !reqBody.version) {
        logger.info('wrong body for the upgrade request')
        return respond(res, { message: 'requires clusterName and version' }, 400)
    }

    const url = new URL(process.env.CLUSTER_API_URL)

    try {
        const remoteVersion = await getRemoteResource<{
            status: { availableUpdates: Record<string, unknown>[] }
            spec: { desiredUpdate: Record<string, unknown> }
        }>(
            url.host,
            token,
            new Agent({ rejectUnauthorized: false }),
            reqBody.clusterName,
            'config.openshift.io',
            'v1',
            'clusterversions',
            'ClusterVersion',
            'version',
            '',
            2000,
            10
        )
        const desiredUpdates = remoteVersion?.status?.availableUpdates.filter(
            (u) => u.version && u.version == reqBody.version
        )
        if (!desiredUpdates || desiredUpdates.length === 0) {
            console.debug('cannot find version')
            throw { code: 400, msg: '{"message":"selected version is not available"}' } as requestException
        }
        const desiredUpdate = desiredUpdates[0]
        remoteVersion.spec.desiredUpdate = desiredUpdate
        await updateRemoteResource(
            url.host,
            token,
            new Agent({ rejectUnauthorized: false }),
            reqBody.clusterName,
            'clusterversions',
            'version',
            '',
            remoteVersion,
            2000,
            10
        )
        return respondOK(req, res)
    } catch (err) {
        // handle error messages
        let code = 500
        let msg = '{"message":"failed to upgrade"}'
        const formattedErr = err as requestException
        if (formattedErr.code > 0 && (formattedErr.code >= 300 || formattedErr.code < 200)) {
            code = formattedErr.code
        }
        if (formattedErr.msg) {
            msg = formattedErr.msg
        }
        logger.error('failed to upgrade:', err)
        res.writeHead(code)
        return res.end(msg)
    }
}
