/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { managedClusterProxy } from '../../src/routes/managedClusterProxy'
import proxy from 'http2-proxy'
import { TLSSocket } from 'tls'

let token: string | null = null
let isHttp2Response: boolean = true

jest.mock('../../src/lib/token', () => ({
  getAuthenticatedToken: jest.fn((_req, _resOrSocket) => Promise.resolve(token)),
  isHttp2ServerResponse: jest.fn(() => isHttp2Response),
}))

jest.mock('http2-proxy', () => ({
  web: jest.fn((_req, _resOrSocket, _proxyOptions, proxyHandler: (err: Error | null) => void) =>
    process.nextTick(() => proxyHandler(null))
  ),
  ws: jest.fn((_req, _resOrSocket, _head, _proxyOptions, proxyHandler: (err: Error | null) => void) =>
    process.nextTick(() => proxyHandler(null))
  ),
}))

const proxyWeb = proxy.web as jest.Mock
const proxyWs = proxy.ws as jest.Mock

describe('ManagedClusterProxy tests', () => {
  const req = { url: '/managedclusterproxy/testcluster/testapi/', headers: {} } as Http2ServerRequest
  const res = {} as Http2ServerResponse
  const socket = {} as TLSSocket
  const head = Buffer.from('')

  beforeEach(() => {
    jest.clearAllMocks()
    token = null
    isHttp2Response = true
  })

  it('return if token is null', async () => {
    token = null
    await managedClusterProxy(req, res)
    expect(proxyWeb).not.toHaveBeenCalled()
    expect(proxyWs).not.toHaveBeenCalled()
  })

  it('test proxy call to web server', async () => {
    token = 'testtoken'
    isHttp2Response = true
    await managedClusterProxy(req, res)
    expect(proxyWeb).toHaveBeenCalled()
    expect(proxyWs).not.toHaveBeenCalled()
  })
  it('test proxy call to socket', async () => {
    token = 'testtoken'
    isHttp2Response = false
    await managedClusterProxy(req, socket, head)
    expect(proxyWeb).not.toHaveBeenCalled()
    expect(proxyWs).toHaveBeenCalled()
  })
})
