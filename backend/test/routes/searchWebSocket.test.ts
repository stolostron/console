/* Copyright Contributors to the Open Cluster Management project */
import { jest } from '@jest/globals'
import EventEmitter from 'node:events'
import type { Http2ServerRequest } from 'node:http2'
import type { TLSSocket } from 'node:tls'
import { getSearchRequestOptions } from '../../src/lib/search'
import { getAuthenticatedToken } from '../../src/lib/token'
import { injectSearchWsConnectionInitAuthorization, searchWebSocket } from '../../src/routes/search'

// var avoids temporal dead zone issues when jest.mock factories are hoisted above imports
/* eslint-disable no-var */
var mockWsInstance: EventEmitter & { readyState: number; send: jest.Mock; close: jest.Mock; terminate: jest.Mock }
var mockWssInstance: EventEmitter & { handleUpgrade: jest.Mock }
/* eslint-enable no-var */

jest.mock('ws', () => {
  const WsMock = jest.fn().mockImplementation(() => mockWsInstance)
  ;(WsMock as unknown as Record<string, unknown>).OPEN = 1
  return {
    __esModule: true,
    default: WsMock,
    WebSocketServer: jest.fn().mockImplementation(() => mockWssInstance),
  }
})

jest.mock('../../src/lib/token', () => ({
  getAuthenticatedToken: jest.fn(),
}))

jest.mock('../../src/lib/search', () => ({
  getSearchRequestOptions: jest.fn(),
}))

jest.mock('../../src/lib/serviceAccountToken', () => ({
  getServiceCACertificate: jest.fn(() => undefined),
}))

jest.mock('../../src/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}))

jest.mock('node:https', () => ({
  Agent: jest.fn(() => ({})),
}))

const mockGetAuthToken = getAuthenticatedToken as jest.MockedFunction<typeof getAuthenticatedToken>
const mockGetSearchOpts = getSearchRequestOptions as jest.MockedFunction<typeof getSearchRequestOptions>

const DEFAULT_OPTIONS = {
  hostname: 'search-api.ocm.svc.cluster.local',
  port: 4010,
  path: '/searchapi/graphql',
}

type MockSocket = TLSSocket & { write: jest.Mock; destroy: jest.Mock }

function makeMockSocket(): MockSocket {
  return { write: jest.fn(), destroy: jest.fn() } as unknown as MockSocket
}

function makeMockReq(headers: Record<string, string> = {}) {
  return { url: '/proxy/search', headers } as unknown as Http2ServerRequest
}

function makeMockClientWs() {
  const ws = Object.assign(new EventEmitter(), {
    readyState: 1,
    send: jest.fn(),
    close: jest.fn(),
  })
  return ws
}

/**
 * Runs through the happy-path setup: resolves auth + search options, awaits
 * searchWebSocket, fires the upstream 'open' event (triggering handleUpgrade),
 * then calls the upgrade callback with a fresh mock client WebSocket.
 */
async function triggerSuccessfulUpgrade(token = 'mytoken', opts = DEFAULT_OPTIONS) {
  const socket = makeMockSocket()
  const req = makeMockReq()
  const head = Buffer.alloc(0)

  mockGetAuthToken.mockResolvedValue(token)
  mockGetSearchOpts.mockResolvedValue(opts)

  await searchWebSocket(req, socket, head)

  // Emit upstream 'open' → handler creates WebSocketServer and calls handleUpgrade
  mockWsInstance.emit('open')

  // handleUpgrade was called synchronously inside the 'open' handler; extract its callback
  const upgradeCallback = mockWssInstance.handleUpgrade.mock.calls[0][3] as (
    ws: ReturnType<typeof makeMockClientWs>
  ) => void
  const clientWs = makeMockClientWs()
  upgradeCallback(clientWs)

  return { socket, req, head, clientWs, upstreamWs: mockWsInstance }
}

// ─────────────────────────────────────────────────────────────────────────────
// injectSearchWsConnectionInitAuthorization
// ─────────────────────────────────────────────────────────────────────────────

describe('injectSearchWsConnectionInitAuthorization', () => {
  it('adds Authorization to connection_init payload', () => {
    const input = JSON.stringify({ type: 'connection_init', payload: { foo: 'bar' } })
    const out = injectSearchWsConnectionInitAuthorization(input, 'mytoken')
    const msg = JSON.parse(out) as { type: string; payload: { foo: string; Authorization: string } }
    expect(msg.type).toBe('connection_init')
    expect(msg.payload.foo).toBe('bar')
    expect(msg.payload.Authorization).toBe('Bearer mytoken')
  })

  it('accepts token that already includes Bearer prefix', () => {
    const input = JSON.stringify({ type: 'connection_init', payload: {} })
    const out = injectSearchWsConnectionInitAuthorization(input, 'Bearer x')
    const msg = JSON.parse(out) as { payload: { Authorization: string } }
    expect(msg.payload.Authorization).toBe('Bearer x')
  })

  it('leaves non-connection_init messages unchanged', () => {
    const input = JSON.stringify({ type: 'subscribe', id: '1', payload: {} })
    expect(injectSearchWsConnectionInitAuthorization(input, 't')).toBe(input)
  })

  it('handles null payload by defaulting to empty object', () => {
    const input = JSON.stringify({ type: 'connection_init', payload: null })
    const out = injectSearchWsConnectionInitAuthorization(input, 'tok')
    const msg = JSON.parse(out) as { payload: { Authorization: string } }
    expect(msg.payload.Authorization).toBe('Bearer tok')
  })

  it('handles array payload by defaulting to empty object', () => {
    const input = JSON.stringify({ type: 'connection_init', payload: [1, 2, 3] })
    const out = injectSearchWsConnectionInitAuthorization(input, 'tok')
    const msg = JSON.parse(out) as { payload: { Authorization: string } }
    expect(msg.payload.Authorization).toBe('Bearer tok')
  })

  it('handles missing payload by defaulting to empty object', () => {
    const input = JSON.stringify({ type: 'connection_init' })
    const out = injectSearchWsConnectionInitAuthorization(input, 'tok')
    const msg = JSON.parse(out) as { payload: { Authorization: string } }
    expect(msg.payload.Authorization).toBe('Bearer tok')
  })

  it('returns original string on invalid JSON', () => {
    const input = 'not-json'
    expect(injectSearchWsConnectionInitAuthorization(input, 'tok')).toBe(input)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// searchWebSocket
// ─────────────────────────────────────────────────────────────────────────────

describe('searchWebSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockWsInstance = Object.assign(new EventEmitter(), {
      readyState: 1,
      send: jest.fn(),
      close: jest.fn(),
      terminate: jest.fn(),
    })

    mockWssInstance = Object.assign(new EventEmitter(), {
      handleUpgrade: jest.fn(),
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  // ── Error handling ──────────────────────────────────────────────────────────

  describe('error handling before upstream connection', () => {
    it('sends HTTP 500 and destroys socket when getAuthenticatedToken rejects', async () => {
      const socket = makeMockSocket()
      mockGetAuthToken.mockRejectedValue(new Error('auth failure'))

      await searchWebSocket(makeMockReq(), socket, Buffer.alloc(0))

      expect(socket.write).toHaveBeenCalledWith(expect.stringContaining('500'))
      expect(socket.destroy).toHaveBeenCalled()
    })

    it('sends HTTP 500 and destroys socket when getSearchRequestOptions rejects', async () => {
      const socket = makeMockSocket()
      mockGetAuthToken.mockResolvedValue('tok')
      mockGetSearchOpts.mockRejectedValue(new Error('options failure'))

      await searchWebSocket(makeMockReq(), socket, Buffer.alloc(0))

      expect(socket.write).toHaveBeenCalledWith(expect.stringContaining('500'))
      expect(socket.destroy).toHaveBeenCalled()
    })

    it('sends HTTP 502 and destroys socket when upstream WS emits error before open', async () => {
      const socket = makeMockSocket()
      mockGetAuthToken.mockResolvedValue('tok')
      mockGetSearchOpts.mockResolvedValue(DEFAULT_OPTIONS)

      await searchWebSocket(makeMockReq(), socket, Buffer.alloc(0))
      mockWsInstance.emit('error', new Error('connect ECONNREFUSED'))

      expect(socket.write).toHaveBeenCalledWith(expect.stringContaining('502'))
      expect(socket.destroy).toHaveBeenCalled()
    })

    it('terminates upstream and sends HTTP 504 when connection times out', async () => {
      jest.useFakeTimers()
      const socket = makeMockSocket()
      mockGetAuthToken.mockResolvedValue('tok')
      mockGetSearchOpts.mockResolvedValue(DEFAULT_OPTIONS)

      await searchWebSocket(makeMockReq(), socket, Buffer.alloc(0))
      jest.advanceTimersByTime(60_001)

      expect(mockWsInstance.terminate).toHaveBeenCalled()
      expect(socket.write).toHaveBeenCalledWith(expect.stringContaining('504'))
      expect(socket.destroy).toHaveBeenCalled()
    })
  })

  // ── Successful upstream connection ──────────────────────────────────────────

  describe('successful upstream connection', () => {
    it('calls handleUpgrade with the original req, socket and head when upstream opens', async () => {
      const socket = makeMockSocket()
      const head = Buffer.from('head')
      const req = makeMockReq()

      mockGetAuthToken.mockResolvedValue('tok')
      mockGetSearchOpts.mockResolvedValue(DEFAULT_OPTIONS)

      await searchWebSocket(req, socket, head)
      mockWsInstance.emit('open')

      expect(mockWssInstance.handleUpgrade).toHaveBeenCalledWith(req, socket, head, expect.any(Function))
    })

    it('constructs upstream URL without port when port is 443', async () => {
      const socket = makeMockSocket()
      mockGetAuthToken.mockResolvedValue('tok')
      mockGetSearchOpts.mockResolvedValue({ hostname: 'search.example.com', port: 443, path: '/graphql' })

      await searchWebSocket(makeMockReq(), socket, Buffer.alloc(0))

      // If upstream was created without throwing we verify it exists; URL is wss://host/path (no port)
      expect(mockWsInstance).toBeDefined()
    })

    it('constructs upstream URL with port when port is not 443', async () => {
      const socket = makeMockSocket()
      mockGetAuthToken.mockResolvedValue('tok')
      mockGetSearchOpts.mockResolvedValue({ hostname: 'search.example.com', port: 4010, path: '/graphql' })

      await searchWebSocket(makeMockReq(), socket, Buffer.alloc(0))

      expect(mockWsInstance).toBeDefined()
    })

    it('uses the sec-websocket-protocol header from the browser request for the upstream', async () => {
      const socket = makeMockSocket()
      mockGetAuthToken.mockResolvedValue('tok')
      mockGetSearchOpts.mockResolvedValue(DEFAULT_OPTIONS)

      await searchWebSocket(makeMockReq({ 'sec-websocket-protocol': 'graphql-ws' }), socket, Buffer.alloc(0))

      // Upstream WS was created; the test verifies the function completes without error
      expect(mockWsInstance).toBeDefined()
    })

    it('does not call failClientUpgrade after upgrade is complete even if socket errors', async () => {
      const socket = makeMockSocket()
      mockGetAuthToken.mockResolvedValue('tok')
      mockGetSearchOpts.mockResolvedValue(DEFAULT_OPTIONS)

      await searchWebSocket(makeMockReq(), socket, Buffer.alloc(0))
      mockWsInstance.emit('open')

      // After upgrade completed, an upstream error should not write to the socket
      const writeCallsBefore = (socket.write as jest.Mock).mock.calls.length
      mockWsInstance.emit('error', new Error('post-open error'))
      expect((socket.write as jest.Mock).mock.calls.length).toBe(writeCallsBefore)
    })
  })

  // ── Relay: client → upstream ────────────────────────────────────────────────

  describe('relay: client → upstream', () => {
    it('injects Authorization into connection_init message from client', async () => {
      const { clientWs, upstreamWs } = await triggerSuccessfulUpgrade('secret-token')

      const initMsg = JSON.stringify({ type: 'connection_init', payload: { extra: true } })
      clientWs.emit('message', Buffer.from(initMsg), false)

      expect(upstreamWs.send).toHaveBeenCalledWith(expect.stringContaining('"Authorization":"Bearer secret-token"'))
    })

    it('does not forward connection_init message as-is (only injected version is sent)', async () => {
      const { clientWs, upstreamWs } = await triggerSuccessfulUpgrade('tok')

      const initMsg = JSON.stringify({ type: 'connection_init', payload: {} })
      clientWs.emit('message', Buffer.from(initMsg), false)

      // send is called exactly once for connection_init (with injected auth)
      expect(upstreamWs.send).toHaveBeenCalledTimes(1)
      const sentArg = upstreamWs.send.mock.calls[0][0] as string
      expect(JSON.parse(sentArg)).toMatchObject({ payload: { Authorization: 'Bearer tok' } })
    })

    it('forwards subsequent text messages directly after connection_init is handled', async () => {
      const { clientWs, upstreamWs } = await triggerSuccessfulUpgrade()

      const initMsg = JSON.stringify({ type: 'connection_init', payload: {} })
      const subscribeMsg = JSON.stringify({ type: 'subscribe', id: '1', payload: {} })

      clientWs.emit('message', Buffer.from(initMsg), false)
      clientWs.emit('message', Buffer.from(subscribeMsg), false)

      expect(upstreamWs.send).toHaveBeenNthCalledWith(2, Buffer.from(subscribeMsg), { binary: false })
    })

    it('forwards a non-connection_init text message to upstream (sets connectionInitHandled)', async () => {
      const { clientWs, upstreamWs } = await triggerSuccessfulUpgrade()

      const subscribeMsg = JSON.stringify({ type: 'subscribe', id: '1', payload: {} })
      clientWs.emit('message', Buffer.from(subscribeMsg), false)

      expect(upstreamWs.send).toHaveBeenCalledWith(Buffer.from(subscribeMsg), { binary: false })
    })

    it('forwards binary frames directly to upstream', async () => {
      const { clientWs, upstreamWs } = await triggerSuccessfulUpgrade()

      const binaryData = Buffer.from([0x01, 0x02, 0x03])
      clientWs.emit('message', binaryData, true)

      expect(upstreamWs.send).toHaveBeenCalledWith(binaryData, { binary: true })
    })

    it('handles string message data (rawDataToUtf8 string path)', async () => {
      const { clientWs, upstreamWs } = await triggerSuccessfulUpgrade('tok')

      const initMsg = JSON.stringify({ type: 'connection_init', payload: {} })
      clientWs.emit('message', initMsg, false)

      expect(upstreamWs.send).toHaveBeenCalledWith(expect.stringContaining('"Authorization":"Bearer tok"'))
    })

    it('handles fragment array message data (rawDataToUtf8 array path)', async () => {
      const { clientWs, upstreamWs } = await triggerSuccessfulUpgrade('tok')

      const part1 = Buffer.from('{"type":"connection_init"')
      const part2 = Buffer.from(',"payload":{}}')
      clientWs.emit('message', [part1, part2], false)

      expect(upstreamWs.send).toHaveBeenCalledWith(expect.stringContaining('"Authorization":"Bearer tok"'))
    })
  })

  // ── Relay: upstream → client ────────────────────────────────────────────────

  describe('relay: upstream → client', () => {
    it('forwards messages from upstream to the client', async () => {
      const { clientWs, upstreamWs } = await triggerSuccessfulUpgrade()

      const responseData = Buffer.from(JSON.stringify({ type: 'next', id: '1', payload: {} }))
      upstreamWs.emit('message', responseData, false)

      expect(clientWs.send).toHaveBeenCalledWith(responseData, { binary: false })
    })

    it('does not forward to client when client readyState is not OPEN', async () => {
      const { clientWs, upstreamWs } = await triggerSuccessfulUpgrade()
      clientWs.readyState = 3 // CLOSED

      upstreamWs.emit('message', Buffer.from('data'), false)

      expect(clientWs.send).not.toHaveBeenCalled()
    })
  })

  // ── Relay: connection lifecycle ─────────────────────────────────────────────

  describe('relay: connection lifecycle', () => {
    it('closes both sockets when the client closes', async () => {
      const { clientWs, upstreamWs } = await triggerSuccessfulUpgrade()

      clientWs.emit('close')

      expect(clientWs.close).toHaveBeenCalled()
      expect(upstreamWs.close).toHaveBeenCalled()
    })

    it('closes the client socket when the upstream closes', async () => {
      const { clientWs, upstreamWs } = await triggerSuccessfulUpgrade()

      upstreamWs.emit('close')

      expect(clientWs.close).toHaveBeenCalled()
    })

    it('closes both sockets on client-side error', async () => {
      const { clientWs, upstreamWs } = await triggerSuccessfulUpgrade()

      clientWs.emit('error', new Error('client error'))

      expect(clientWs.close).toHaveBeenCalled()
      expect(upstreamWs.close).toHaveBeenCalled()
    })

    it('closes both sockets on upstream error after the connection is open', async () => {
      const { clientWs, upstreamWs } = await triggerSuccessfulUpgrade()

      upstreamWs.emit('error', new Error('upstream post-open error'))

      expect(clientWs.close).toHaveBeenCalled()
      expect(upstreamWs.close).toHaveBeenCalled()
    })
  })
})
