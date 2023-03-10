/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { request, RequestOptions } from 'https'
import ProxyAgent from 'proxy-agent'
import { pipeline } from 'stream'
import { URL } from 'url'
import { logger } from '../lib/logger'
import { notFound, respondBadRequest } from '../lib/respond'
import { getAuthenticatedToken } from '../lib/token'

interface AnsibleCredential {
    towerHost: string
    token: string
}

// must match ansiblePaths in frontend/src/resources/utils/resource-request.ts
export const ansiblePaths = ['/api/v2/job_templates/']

export async function ansibleTower(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
    if (await getAuthenticatedToken(req, res)) {
        const chucks: string[] = []
        let ansibleCredential: AnsibleCredential

        req.on('data', (chuck: string) => {
            chucks.push(chuck)
        })
        req.on('end', () => {
            const body = chucks.join()
            ansibleCredential = JSON.parse(body) as AnsibleCredential
            let towerUrl = null
            try {
                towerUrl = new URL(ansibleCredential.towerHost.toString())
            } catch (err) {
                return respondBadRequest(req, res)
            }

            // allow list of apis our ui calls
            if (!ansiblePaths.includes(towerUrl.pathname)) {
                return respondBadRequest(req, res)
            }

            const options: RequestOptions = {
                protocol: towerUrl.protocol,
                hostname: towerUrl.hostname,
                path: `${towerUrl.pathname}${towerUrl.search ? towerUrl.search : ''}`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${ansibleCredential.token}`,
                },
                rejectUnauthorized: false,
            }
            if (process.env.HTTPS_PROXY) {
                options.agent = new ProxyAgent()
            }

            pipeline(
                req,
                request(options, (response) => {
                    if (!response) return notFound(req, res)
                    res.writeHead(response.statusCode ?? 500, response.headers)
                    pipeline(response, res as unknown as NodeJS.WritableStream, () => logger.error)
                }),
                (err) => {
                    if (err) logger.error(err)
                }
            )
        })
    }
}
