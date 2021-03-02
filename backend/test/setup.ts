/* Copyright Contributors to the Open Cluster Management project */

import * as axios from 'axios'
import * as nock from 'nock'
import { AddressInfo } from 'net'
import { start, stop } from '../src/app'
import { Http2Server } from 'http2'
import { Agent } from 'https'

let server: Http2Server

export let request: axios.AxiosInstance

export async function setupBeforeAll(): Promise<void> {
    nock.disableNetConnect()
    nock.enableNetConnect('127.0.0.1')
    nock.enableNetConnect('localhost')

    nock(process.env.CLUSTER_API_URL).get('/.well-known/oauth-authorization-server').optionally().reply(200, {
        authorization_endpoint: 'https://example.com/auth',
        token_endpoint: 'https://example.com/token',
    })

    server = await start()

    const port = (server.address() as AddressInfo).port
    request = axios.default.create({
        baseURL: `https://localhost:${port}`,
        validateStatus: () => true,
        headers: { cookie: 'acm-access-token-cookie=123' },
        httpsAgent: new Agent({ rejectUnauthorized: false }),
    })
}

export function setupAfterEach(): void {
    expect(nock.isDone()).toBeTruthy()
    nock.cleanAll()
}

export async function setupAfterAll(): Promise<void> {
    await stop()
    nock.enableNetConnect()
    nock.restore()
}

beforeAll(setupBeforeAll, 30 * 1000)
afterEach(setupAfterEach)
afterAll(setupAfterAll)
