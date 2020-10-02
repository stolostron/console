import * as axios from 'axios'
import * as nock from 'nock'
import { AddressInfo } from 'net'
import { FastifyInstance } from 'fastify'
import { startServer } from '../src/server'

let instance: FastifyInstance

export let request: axios.AxiosInstance

export async function setupBeforeAll(): Promise<void> {
    nock.disableNetConnect()
    nock.enableNetConnect('127.0.0.1')
    nock.enableNetConnect('localhost')

    nock(process.env.CLUSTER_API_URL).get('/.well-known/oauth-authorization-server').reply(200, {
        authorization_endpoint: 'https://example.com/auth',
        token_endpoint: 'https://example.com/token',
    })

    instance = await startServer()

    const port = (instance.server.address() as AddressInfo).port
    request = axios.default.create({
        baseURL: `http://localhost:${port}`,
        validateStatus: () => true,
        headers: { cookie: 'acm-access-token-cookie=123' },
    })
}

export function setupAfterEach(): void {
    expect(nock.isDone()).toBeTruthy()
    nock.cleanAll()
}

export async function setupAfterAll(): Promise<void> {
    await instance.close()
    nock.enableNetConnect()
    nock.restore()
}

export function setup(): void {
    beforeAll(setupBeforeAll, 30 * 1000)
    afterEach(setupAfterEach)
    afterAll(setupAfterAll)
}
