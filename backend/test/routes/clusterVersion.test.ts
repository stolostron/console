/* Copyright Contributors to the Open Cluster Management project */

import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { clusterVersion, ClusterVersion } from '../../src/routes/clusterVersion'
import * as jsonRequestModule from '../../src/lib/json-request'
import * as tokenModule from '../../src/lib/token'
import * as serviceAccountTokenModule from '../../src/lib/serviceAccountToken'
import * as respondModule from '../../src/lib/respond'

// Mock modules
jest.mock('../../src/lib/json-request')
jest.mock('../../src/lib/token')
jest.mock('../../src/lib/serviceAccountToken')
jest.mock('../../src/lib/respond')
jest.mock('../../src/lib/logger')

const mockedJsonRequest = jsonRequestModule.jsonRequest as jest.MockedFunction<typeof jsonRequestModule.jsonRequest>
const mockedGetAuthenticatedToken = tokenModule.getAuthenticatedToken as jest.MockedFunction<
  typeof tokenModule.getAuthenticatedToken
>
const mockedGetServiceAccountToken = serviceAccountTokenModule.getServiceAccountToken as jest.MockedFunction<
  typeof serviceAccountTokenModule.getServiceAccountToken
>
const mockedRespondInternalServerError = respondModule.respondInternalServerError as jest.MockedFunction<
  typeof respondModule.respondInternalServerError
>

describe('clusterVersion', () => {
  let mockReq: Partial<Http2ServerRequest>
  let mockRes: Partial<Http2ServerResponse>
  let mockSetHeader: jest.Mock
  let mockEnd: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    mockSetHeader = jest.fn()
    mockEnd = jest.fn()

    mockReq = {}
    mockRes = {
      setHeader: mockSetHeader,
      end: mockEnd,
    }

    // Set up environment variable
    process.env.CLUSTER_API_URL = 'https://api.test-cluster.com:6443'
  })

  afterEach(() => {
    delete process.env.CLUSTER_API_URL
  })

  it('should return cluster version when API call succeeds', async () => {
    const mockToken = 'mock-token'
    const mockServiceAccountToken = 'mock-service-account-token'
    const mockClusterVersion: ClusterVersion = {
      apiVersion: 'config.openshift.io/v1',
      kind: 'ClusterVersion',
      status: {
        desired: {
          version: '4.21.0',
        },
      },
    }

    mockedGetAuthenticatedToken.mockResolvedValue(mockToken)
    mockedGetServiceAccountToken.mockReturnValue(mockServiceAccountToken)
    mockedJsonRequest.mockResolvedValue(mockClusterVersion)

    await clusterVersion(mockReq as Http2ServerRequest, mockRes as Http2ServerResponse)

    expect(mockedGetAuthenticatedToken).toHaveBeenCalledWith(mockReq, mockRes)
    expect(mockedGetServiceAccountToken).toHaveBeenCalled()
    expect(mockedJsonRequest).toHaveBeenCalledWith(
      'https://api.test-cluster.com:6443/apis/config.openshift.io/v1/clusterversions/version',
      mockServiceAccountToken
    )
    expect(mockSetHeader).toHaveBeenCalledWith('Content-Type', 'application/json')
    expect(mockEnd).toHaveBeenCalledWith(JSON.stringify({ version: '4.21.0' }))
  })

  it('should return error when cluster version is not available', async () => {
    const mockToken = 'mock-token'
    const mockServiceAccountToken = 'mock-service-account-token'
    const mockClusterVersion: ClusterVersion = {
      apiVersion: 'config.openshift.io/v1',
      kind: 'ClusterVersion',
      status: {
        desired: {
          version: '',
        },
      },
    }

    mockedGetAuthenticatedToken.mockResolvedValue(mockToken)
    mockedGetServiceAccountToken.mockReturnValue(mockServiceAccountToken)
    mockedJsonRequest.mockResolvedValue(mockClusterVersion)

    await clusterVersion(mockReq as Http2ServerRequest, mockRes as Http2ServerResponse)

    expect(mockSetHeader).toHaveBeenCalledWith('Content-Type', 'application/json')
    expect(mockEnd).toHaveBeenCalledWith(JSON.stringify({ version: undefined }))
  })

  it('should handle API errors gracefully', async () => {
    const mockToken = 'mock-token'
    const mockServiceAccountToken = 'mock-service-account-token'
    const mockError = new Error('API request failed')

    mockedGetAuthenticatedToken.mockResolvedValue(mockToken)
    mockedGetServiceAccountToken.mockReturnValue(mockServiceAccountToken)
    mockedJsonRequest.mockRejectedValue(mockError)

    await clusterVersion(mockReq as Http2ServerRequest, mockRes as Http2ServerResponse)

    expect(mockSetHeader).toHaveBeenCalledWith('Content-Type', 'application/json')
    expect(mockEnd).toHaveBeenCalledWith(JSON.stringify({ error: 'Failed to get cluster version: API request failed' }))
  })

  it('should not process request when authentication fails', async () => {
    mockedGetAuthenticatedToken.mockResolvedValue(null)

    await clusterVersion(mockReq as Http2ServerRequest, mockRes as Http2ServerResponse)

    expect(mockedGetServiceAccountToken).not.toHaveBeenCalled()
    expect(mockedJsonRequest).not.toHaveBeenCalled()
    expect(mockSetHeader).not.toHaveBeenCalled()
    expect(mockEnd).not.toHaveBeenCalled()
  })

  it('should handle unexpected errors', async () => {
    const mockToken = 'mock-token'
    const mockServiceAccountToken = 'mock-service-account-token'

    mockedGetAuthenticatedToken.mockResolvedValue(mockToken)
    mockedGetServiceAccountToken.mockReturnValue(mockServiceAccountToken)
    // Mock jsonRequest to throw an error that will be caught in the catch block
    mockedJsonRequest.mockImplementation(() => {
      throw new Error('Unexpected error')
    })

    await clusterVersion(mockReq as Http2ServerRequest, mockRes as Http2ServerResponse)

    expect(mockedRespondInternalServerError).toHaveBeenCalledWith(mockReq, mockRes)
  })
})
