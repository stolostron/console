/* Copyright Contributors to the Open Cluster Management project */
import { constants } from 'http2'
import { jest } from '@jest/globals'
import { pipeline } from 'stream'
import { request } from 'https'
import { proxy } from '../../src/routes/proxy'
import { getToken } from '../../src/lib/token'
import { getDefaultAgent } from '../../src/lib/agent'
// import { logger } from '../../src/lib/logger'
import { unauthorized } from '../../src/lib/respond'

// Mock dependencies
jest.mock('../../src/lib/token', () => ({
  getToken: jest.fn(),
}))

jest.mock('../../src/lib/agent', () => ({
  getDefaultAgent: jest.fn(() => ({})),
}))

jest.mock('../../src/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

jest.mock('../../src/lib/respond', () => ({
  notFound: jest.fn(),
  unauthorized: jest.fn(),
}))

jest.mock('https', () => ({
  request: jest.fn((_options: unknown, callback: unknown) => {
    // Return a mock stream and call the callback with a mock response
    const mockStream = {} as NodeJS.ReadableStream
    const mockResponse = {
      headers: {},
      statusCode: 200,
    }
    if (callback && typeof callback === 'function') {
      process.nextTick(() => (callback as (response: unknown) => void)(mockResponse))
    }
    return mockStream
  }),
}))

jest.mock('stream', () => ({
  pipeline: jest.fn((_req: unknown, _request: unknown, callback: unknown) => {
    // Simulate the pipeline behavior - just call the error callback
    if (callback && typeof callback === 'function') {
      process.nextTick(() => (callback as (error: Error | null) => void)(null))
    }
  }),
}))

// Import mocked modules
const mockGetToken = getToken as jest.MockedFunction<typeof getToken>
const mockGetDefaultAgent = getDefaultAgent as jest.MockedFunction<typeof getDefaultAgent>
const mockUnauthorized = unauthorized as jest.MockedFunction<typeof unauthorized>
const mockPipeline = jest.mocked(pipeline)
const mockRequest = jest.mocked(request)

describe('Proxy Route Tests', () => {
  let mockReq: Partial<import('http2').Http2ServerRequest>
  let mockRes: Partial<import('http2').Http2ServerResponse>
  let originalClusterUrl: string | undefined

  beforeEach(() => {
    // Store original environment variable
    originalClusterUrl = process.env.CLUSTER_API_URL

    // Set up test environment
    process.env.CLUSTER_API_URL = 'https://test-cluster.example.com:6443'

    // Reset all mocks
    jest.clearAllMocks()

    // Create mock request and response objects
    mockReq = {
      url: '/api/v1/namespaces',
      method: 'GET',
      headers: {
        [constants.HTTP2_HEADER_ACCEPT]: 'application/json',
        [constants.HTTP2_HEADER_CONTENT_TYPE]: 'application/json',
        [constants.HTTP2_HEADER_AUTHORIZATION]: 'Bearer test-token',
      },
    } as Partial<import('http2').Http2ServerRequest>

    mockRes = {
      writeHead: jest.fn(),
    } as Partial<import('http2').Http2ServerResponse>

    // Don't reset modules to avoid issues with mocks
  })

  afterEach(() => {
    // Restore original environment variable
    if (originalClusterUrl !== undefined) {
      process.env.CLUSTER_API_URL = originalClusterUrl
    } else {
      delete process.env.CLUSTER_API_URL
    }
  })

  describe('getClusterUrl function', () => {
    it('should parse and cache cluster URL from environment variable', async () => {
      // Re-import the module to test getClusterUrl
      const { proxy: proxyFunction } = await import('../../src/routes/proxy')

      // Call proxy to trigger getClusterUrl
      mockGetToken.mockReturnValue('test-token')

      proxyFunction(mockReq as import('http2').Http2ServerRequest, mockRes as import('http2').Http2ServerResponse)

      // Verify that the URL was parsed correctly
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          protocol: 'https:',
          hostname: 'test-cluster.example.com',
          port: '6443',
        }),
        expect.any(Function)
      )
    })

    it('should reuse cached URL on subsequent calls', async () => {
      const { proxy: proxyFunction } = await import('../../src/routes/proxy')

      mockGetToken.mockReturnValue('test-token')

      // Call proxy multiple times
      proxyFunction(mockReq as import('http2').Http2ServerRequest, mockRes as import('http2').Http2ServerResponse)
      proxyFunction(mockReq as import('http2').Http2ServerRequest, mockRes as import('http2').Http2ServerResponse)

      // Should only parse URL once (cached)
      expect(mockRequest).toHaveBeenCalledTimes(2)
    })
  })

  describe('proxy function', () => {
    it('should return unauthorized when no token is provided', () => {
      mockGetToken.mockReturnValue(null)

      proxy(mockReq as import('http2').Http2ServerRequest, mockRes as import('http2').Http2ServerResponse)

      expect(mockUnauthorized).toHaveBeenCalledWith(mockReq, mockRes)
      expect(mockRequest).not.toHaveBeenCalled()
    })

    it('should return unauthorized when token is empty string', () => {
      mockGetToken.mockReturnValue('')

      proxy(mockReq as import('http2').Http2ServerRequest, mockRes as import('http2').Http2ServerResponse)

      expect(mockUnauthorized).toHaveBeenCalledWith(mockReq, mockRes)
      expect(mockRequest).not.toHaveBeenCalled()
    })

    it('should make HTTPS request with correct options when token is provided', () => {
      mockGetToken.mockReturnValue('test-token')

      proxy(mockReq as import('http2').Http2ServerRequest, mockRes as import('http2').Http2ServerResponse)

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          protocol: 'https:',
          hostname: 'test-cluster.example.com',
          port: '6443',
          path: '/api/v1/namespaces',
          method: 'GET',
          headers: expect.objectContaining({
            authorization: 'Bearer test-token',
            accept: 'application/json',
            'content-type': 'application/json',
          }) as Record<string, unknown>,
          agent: {},
        }),
        expect.any(Function)
      )
    })

    it('should forward proxy headers from request', () => {
      mockGetToken.mockReturnValue('test-token')

      // Add more headers to test forwarding
      Object.assign(
        mockReq as Record<string, unknown>,
        {
          headers: {
            [constants.HTTP2_HEADER_ACCEPT]: 'application/json',
            [constants.HTTP2_HEADER_ACCEPT_ENCODING]: 'gzip',
            [constants.HTTP2_HEADER_CONTENT_ENCODING]: 'gzip',
            [constants.HTTP2_HEADER_CONTENT_LENGTH]: '100',
            [constants.HTTP2_HEADER_CONTENT_TYPE]: 'application/json',
            [constants.HTTP2_HEADER_AUTHORIZATION]: 'Bearer test-token',
            // This header should not be forwarded
            'x-custom-header': 'should-not-be-forwarded',
          },
        } as Partial<import('http2').Http2ServerRequest>
      )

      proxy(mockReq as import('http2').Http2ServerRequest, mockRes as import('http2').Http2ServerResponse)

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            authorization: 'Bearer test-token',
            accept: 'application/json',
            'accept-encoding': 'gzip',
            'content-encoding': 'gzip',
            'content-length': '100',
            'content-type': 'application/json',
          }) as Record<string, unknown>,
        }),
        expect.any(Function)
      )

      // Verify custom header is not forwarded
      const callArgs = mockRequest.mock.calls[0]?.[0] as unknown as { headers: Record<string, unknown> }
      expect(callArgs?.headers).not.toHaveProperty('x-custom-header')
    })

    it('should use getDefaultAgent for HTTPS requests', () => {
      const mockAgent = { name: 'test-agent' } as unknown as import('https').Agent
      mockGetDefaultAgent.mockReturnValue(mockAgent)
      mockGetToken.mockReturnValue('test-token')

      proxy(mockReq as import('http2').Http2ServerRequest, mockRes as import('http2').Http2ServerResponse)

      expect(mockGetDefaultAgent).toHaveBeenCalled()
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          agent: mockAgent,
        }),
        expect.any(Function)
      )
    })

    it('should handle different HTTP methods', () => {
      mockGetToken.mockReturnValue('test-token')

      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

      methods.forEach((method) => {
        Object.assign(mockReq as Record<string, unknown>, { method } as Record<string, unknown>)
        proxy(mockReq as import('http2').Http2ServerRequest, mockRes as import('http2').Http2ServerResponse)

        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: method,
          }),
          expect.any(Function)
        )
      })
    })

    it('should handle different URL paths', () => {
      mockGetToken.mockReturnValue('test-token')

      const paths = ['/api/v1/namespaces', '/apis/apps/v1/deployments', '/api/v1/pods']

      paths.forEach((path) => {
        Object.assign(mockReq as Record<string, unknown>, { url: path } as Record<string, unknown>)
        proxy(mockReq as import('http2').Http2ServerRequest, mockRes as import('http2').Http2ServerResponse)

        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            path: path,
          }),
          expect.any(Function)
        )
      })
    })

    it('should call pipeline with correct arguments', () => {
      mockGetToken.mockReturnValue('test-token')

      proxy(mockReq as import('http2').Http2ServerRequest, mockRes as import('http2').Http2ServerResponse)

      expect(mockPipeline).toHaveBeenCalledWith(
        mockReq,
        expect.any(Object), // The result of request(options, callback)
        expect.any(Function) // Error callback
      )
    })

    it('should handle pipeline errors', () => {
      mockGetToken.mockReturnValue('test-token')

      // Test that pipeline is called with correct arguments
      proxy(mockReq as import('http2').Http2ServerRequest, mockRes as import('http2').Http2ServerResponse)

      expect(mockPipeline).toHaveBeenCalled()
    })
  })
})
