import { IncomingMessage } from 'http'
import { Agent, get } from 'https'
import { parseJsonBody } from './body-parser'

export function jsonRequest<T>(url: string): Promise<T> {
    return new Promise((resolve) =>
        get(url, { headers: { accept: 'application/json' }, agent: new Agent({ rejectUnauthorized: false }) }, resolve)
    ).then(async (res: IncomingMessage) => await parseJsonBody(res))
}
