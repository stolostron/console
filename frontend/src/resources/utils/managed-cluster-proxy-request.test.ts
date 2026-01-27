/* Copyright Contributors to the Open Cluster Management project */

import * as resourceModule from '../resource'
import { managedClusterProxyRequest } from './managed-cluster-proxy-request'
import * as resourceRequestModule from './resource-request'
import { getBackendUrl } from './resource-request'

// Mock the dependencies
jest.mock('../resource')
jest.mock('./resource-request')

const mockedGetResourceNameApiPath = resourceModule.getResourceNameApiPath as jest.MockedFunction<
  typeof resourceModule.getResourceNameApiPath
>
const mockedFetchRetry = resourceRequestModule.fetchRetry as jest.MockedFunction<
  typeof resourceRequestModule.fetchRetry
>

describe('managedClusterProxyRequest', () => {
  const mockCluster = 'test-cluster'
  const mockResource = {
    apiVersion: 'v1',
    kind: 'Pod',
    namespace: 'test-namespace',
    name: 'test-pod',
  }
  const mockResourceAPIPath = '/api/v1/namespaces/test-namespace/pods/test-pod'

  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetResourceNameApiPath.mockResolvedValue(mockResourceAPIPath)
  })

  it('should return error message for invalid request parameters', async () => {
    const result = await managedClusterProxyRequest('GET', '', mockResource)

    expect(result).toEqual({ errorMessage: 'Invalid request parameters' })
    expect(mockedGetResourceNameApiPath).not.toHaveBeenCalled()
    expect(mockedFetchRetry).not.toHaveBeenCalled()
  })

  it('should return error message when fetchRetry throws an error', async () => {
    const mockError = new Error('Network request failed')
    mockedFetchRetry.mockRejectedValue(mockError)

    const result = await managedClusterProxyRequest('GET', mockCluster, mockResource)

    expect(result).toEqual({ errorMessage: 'Network request failed' })
    expect(mockedGetResourceNameApiPath).toHaveBeenCalledWith({
      apiVersion: mockResource.apiVersion,
      kind: mockResource.kind,
      metadata: { namespace: mockResource.namespace, name: mockResource.name },
    })
    expect(mockedFetchRetry).toHaveBeenCalled()
  })

  it('should return resource data on successful request', async () => {
    const mockResponse = {
      headers: new Headers(),
      status: 200,
      data: {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { name: 'test-pod', namespace: 'test-namespace' },
      },
    }

    mockedFetchRetry.mockResolvedValue(mockResponse)

    const result = await managedClusterProxyRequest('GET', mockCluster, mockResource)

    expect(result).toEqual(mockResponse.data)
    expect(mockedGetResourceNameApiPath).toHaveBeenCalledWith({
      apiVersion: mockResource.apiVersion,
      kind: mockResource.kind,
      metadata: { namespace: mockResource.namespace, name: mockResource.name },
    })
    expect(mockedFetchRetry).toHaveBeenCalledWith({
      method: 'GET',
      url: `${getBackendUrl()}/managedclusterproxy/${mockCluster}${mockResourceAPIPath}`,
      signal: new AbortController().signal,
      retries: 0,
      headers: { Accept: '*/*' },
      disableRedirectUnauthorizedLogin: true,
      data: undefined,
    })
  })
})
