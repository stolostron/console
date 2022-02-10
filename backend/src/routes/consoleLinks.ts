/* Copyright Contributors to the Open Cluster Management project */

import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { Agent } from 'https'
import { readFileSync } from 'fs'
import { jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { respondInternalServerError, unauthorized } from '../lib/respond'
import { getToken } from '../lib/token'

// Type of ApplicationMenu in a ConsoleLink object
interface ApplicationMenu {
    imageURL: string
    section: string
}
// Type returned by /apis/console.openshift.io/v1/consolelinks
interface ConsoleLink {
    spec: {
        applicationMenu: ApplicationMenu
        href: string
        location: string
        text: string
    }
}
interface FormatedConsoleLink {
    url: string
    name: string
    icon: string
}

const { HTTP2_HEADER_AUTHORIZATION } = constants
const agent = new Agent({ rejectUnauthorized: false })

export async function consoleLinks(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
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
        const body = await jsonRequest<{ items: ConsoleLink[] }>(
            process.env.CLUSTER_API_URL + '/apis/console.openshift.io/v1/consolelinks',
            serviceaccountToken
        )
        const consoleLinks = body.items ? body.items : []
        const formattedLinks: Record<string, [FormatedConsoleLink]> = {}
        for (let i = 0; i < consoleLinks.length; i++) {
            const link = consoleLinks[i]
            if (
                link.spec.location === 'ApplicationMenu' &&
                link.spec.text !== 'Red Hat Advanced Cluster Management for Kubernetes'
            ) {
                // link.spec.applicationMenu may be missing entirely so default to section with an empty string title
                const section = link.spec.applicationMenu ? link.spec.applicationMenu.section + '' : ''
                if (formattedLinks[section]) {
                    formattedLinks[section].push({
                        url: link.spec.href,
                        name: link.spec.text,
                        icon:
                            link.spec.applicationMenu && link.spec.applicationMenu.imageURL
                                ? link.spec.applicationMenu.imageURL
                                : undefined,
                    })
                } else {
                    formattedLinks[section] = [
                        {
                            url: link.spec.href,
                            name: link.spec.text,
                            icon:
                                link.spec.applicationMenu && link.spec.applicationMenu.imageURL
                                    ? link.spec.applicationMenu.imageURL
                                    : undefined,
                        },
                    ]
                }
            }
        }

        const responsePayload = {
            data: formattedLinks,
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(responsePayload))
    } catch (err) {
        logger.error(err)
        respondInternalServerError(req, res)
    }
}
