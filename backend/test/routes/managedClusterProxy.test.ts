/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { managedClusterProxy } from '../../src/routes/managedClusterProxy'
import proxy from 'http2-proxy'
import { jest } from '@jest/globals'
import { TLSSocket } from 'tls'
let isHttp2Response: boolean = true
const proxyWeb = proxy.web as jest.Mock
const proxyWs = proxy.ws as jest.Mock
jest.mock('http2-proxy', () => ({
  web: jest.fn((_req, _resOrSocket, _proxyOptions, proxyHandler: (err: Error | null) => void) =>
    process.nextTick(() => proxyHandler(null))
  ),
  ws: jest.fn((_req, _resOrSocket, _head, _proxyOptions, proxyHandler: (err: Error | null) => void) =>
    process.nextTick(() => proxyHandler(null))
  ),
}))
jest.mock('../../src/lib/token', () => ({
  isHttp2ServerResponse: jest.fn(() => isHttp2Response),
  getAuthenticatedToken: jest.fn(() => {
    return 'testtoken'
  }),
}))
describe('ManagedClusterProxy tests', () => {
  const req = { url: '/managedclusterproxy/testcluster/testapi/', headers: {} } as Http2ServerRequest
  const res = { destroy: jest.fn() } as unknown as Http2ServerResponse
  const socket = { destroy: jest.fn() } as unknown as TLSSocket
  const head = Buffer.from('')
  beforeEach(() => {
    jest.clearAllMocks()
    isHttp2Response = true
  })
  it('test proxy call to web server', async () => {
    isHttp2Response = true
    await managedClusterProxy(req, res)
    expect(proxyWeb).toHaveBeenCalled()
    expect(proxyWs).not.toHaveBeenCalled()
  })
  it('test proxy call to socket', async () => {
    isHttp2Response = false
    await managedClusterProxy(req, socket, head)
    expect(proxyWeb).not.toHaveBeenCalled()
    expect(proxyWs).toHaveBeenCalled()
  })
})
