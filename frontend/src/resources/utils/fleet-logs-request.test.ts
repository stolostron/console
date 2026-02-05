/* Copyright Contributors to the Open Cluster Management project */

import {
  createSubjectAccessReview,
  SelfSubjectAccessReview,
  SelfSubjectAccessReviewApiVersion,
  SelfSubjectAccessReviewKind,
} from '../self-subject-access-review'
import { fleetLogsRequest } from './fleet-logs-request'
import * as resourceRequestModule from './resource-request'

// Mock the dependencies
jest.mock('../self-subject-access-review')
jest.mock('./resource-request')

const mockedCreateSubjectAccessReview = createSubjectAccessReview as jest.MockedFunction<
  typeof createSubjectAccessReview
>
const mockedFetchRetry = resourceRequestModule.fetchRetry as jest.MockedFunction<
  typeof resourceRequestModule.fetchRetry
>
const mockedGetBackendUrl = resourceRequestModule.getBackendUrl as jest.MockedFunction<
  typeof resourceRequestModule.getBackendUrl
>

const getAccessReviewResult = (isAllowed: boolean): SelfSubjectAccessReview => {
  return {
    apiVersion: SelfSubjectAccessReviewApiVersion,
    kind: SelfSubjectAccessReviewKind,
    metadata: {},
    spec: {
      resourceAttributes: {
        resource: 'clusterstatuses',
        subresource: 'log',
        verb: 'get',
        group: 'proxy.open-cluster-management.io',
      },
    },
    status: {
      allowed: isAllowed,
    },
  }
}

describe('fleetLogsRequest', () => {
  const mockCluster = 'test-cluster'
  const mockNamespace = 'test-namespace'
  const mockPodName = 'test-pod'
  const mockContainer = 'test-container'
  const mockLogs = 'line1\nline2\nline3'

  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetBackendUrl.mockReturnValue('')
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return error message for missing cluster parameter', async () => {
    const result = await fleetLogsRequest({
      cluster: '',
      namespace: mockNamespace,
      podName: mockPodName,
      container: mockContainer,
    })

    expect(result).toEqual({
      data: '',
      errorMessage: 'Invalid request parameters: cluster, namespace, podName, and container are required',
    })
    expect(mockedCreateSubjectAccessReview).not.toHaveBeenCalled()
    expect(mockedFetchRetry).not.toHaveBeenCalled()
  })

  it('should return error message for missing namespace parameter', async () => {
    const result = await fleetLogsRequest({
      cluster: mockCluster,
      namespace: '',
      podName: mockPodName,
      container: mockContainer,
    })

    expect(result).toEqual({
      data: '',
      errorMessage: 'Invalid request parameters: cluster, namespace, podName, and container are required',
    })
  })

  it('should return error message for missing podName parameter', async () => {
    const result = await fleetLogsRequest({
      cluster: mockCluster,
      namespace: mockNamespace,
      podName: '',
      container: mockContainer,
    })

    expect(result).toEqual({
      data: '',
      errorMessage: 'Invalid request parameters: cluster, namespace, podName, and container are required',
    })
  })

  it('should return error message for missing container parameter', async () => {
    const result = await fleetLogsRequest({
      cluster: mockCluster,
      namespace: mockNamespace,
      podName: mockPodName,
      container: '',
    })

    expect(result).toEqual({
      data: '',
      errorMessage: 'Invalid request parameters: cluster, namespace, podName, and container are required',
    })
  })

  it('should use clusterstatuses/logs API when user has permission', async () => {
    mockedCreateSubjectAccessReview.mockReturnValue({
      promise: Promise.resolve(getAccessReviewResult(true)),
      abort: jest.fn(),
    })

    mockedFetchRetry.mockResolvedValue({
      headers: new Headers(),
      status: 200,
      data: mockLogs,
    })

    const result = await fleetLogsRequest({
      cluster: mockCluster,
      namespace: mockNamespace,
      podName: mockPodName,
      container: mockContainer,
    })

    expect(mockedCreateSubjectAccessReview).toHaveBeenCalledWith({
      resource: 'clusterstatuses',
      subresource: 'log',
      verb: 'get',
      group: 'proxy.open-cluster-management.io',
      version: 'v1beta1',
      namespace: mockCluster,
      name: mockCluster,
    })

    expect(mockedFetchRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: `/apis/proxy.open-cluster-management.io/v1beta1/namespaces/${mockCluster}/clusterstatuses/${mockCluster}/log/${mockNamespace}/${mockPodName}/${mockContainer}?tailLines=1000`,
        headers: { Accept: '*/*' },
      })
    )

    expect(result).toEqual({ data: mockLogs })
  })

  it('should use managed cluster proxy when user does not have clusterstatuses permission', async () => {
    mockedCreateSubjectAccessReview.mockReturnValue({
      promise: Promise.resolve(getAccessReviewResult(false)),
      abort: jest.fn(),
    })

    mockedFetchRetry.mockResolvedValue({
      headers: new Headers(),
      status: 200,
      data: mockLogs,
    })

    const result = await fleetLogsRequest({
      cluster: mockCluster,
      namespace: mockNamespace,
      podName: mockPodName,
      container: mockContainer,
    })

    expect(mockedCreateSubjectAccessReview).toHaveBeenCalledWith({
      resource: 'clusterstatuses',
      subresource: 'log',
      verb: 'get',
      group: 'proxy.open-cluster-management.io',
      version: 'v1beta1',
      namespace: mockCluster,
      name: mockCluster,
    })

    expect(mockedFetchRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: `/managedclusterproxy/${mockCluster}/api/v1/namespaces/${mockNamespace}/pods/${mockPodName}/log?container=${mockContainer}&tailLines=1000`,
        headers: { Accept: '*/*' },
        disableRedirectUnauthorizedLogin: true,
      })
    )

    expect(result).toEqual({ data: mockLogs })
  })

  it('should include previous parameter when fetching previous logs via clusterstatuses API', async () => {
    mockedCreateSubjectAccessReview.mockReturnValue({
      promise: Promise.resolve(getAccessReviewResult(true)),
      abort: jest.fn(),
    })

    mockedFetchRetry.mockResolvedValue({
      headers: new Headers(),
      status: 200,
      data: mockLogs,
    })

    const result = await fleetLogsRequest({
      cluster: mockCluster,
      namespace: mockNamespace,
      podName: mockPodName,
      container: mockContainer,
      previous: true,
    })

    expect(mockedFetchRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `/apis/proxy.open-cluster-management.io/v1beta1/namespaces/${mockCluster}/clusterstatuses/${mockCluster}/log/${mockNamespace}/${mockPodName}/${mockContainer}?tailLines=1000&previous=true`,
      })
    )

    expect(result).toEqual({ data: mockLogs })
  })

  it('should include previous parameter when fetching previous logs via managed cluster proxy', async () => {
    mockedCreateSubjectAccessReview.mockReturnValue({
      promise: Promise.resolve(getAccessReviewResult(false)),
      abort: jest.fn(),
    })

    mockedFetchRetry.mockResolvedValue({
      headers: new Headers(),
      status: 200,
      data: mockLogs,
    })

    const result = await fleetLogsRequest({
      cluster: mockCluster,
      namespace: mockNamespace,
      podName: mockPodName,
      container: mockContainer,
      previous: true,
    })

    expect(mockedFetchRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `/managedclusterproxy/${mockCluster}/api/v1/namespaces/${mockNamespace}/pods/${mockPodName}/log?container=${mockContainer}&tailLines=1000&previous=true`,
      })
    )

    expect(result).toEqual({ data: mockLogs })
  })

  it('should use custom tailLines value when provided', async () => {
    mockedCreateSubjectAccessReview.mockReturnValue({
      promise: Promise.resolve(getAccessReviewResult(true)),
      abort: jest.fn(),
    })

    mockedFetchRetry.mockResolvedValue({
      headers: new Headers(),
      status: 200,
      data: mockLogs,
    })

    const result = await fleetLogsRequest({
      cluster: mockCluster,
      namespace: mockNamespace,
      podName: mockPodName,
      container: mockContainer,
      tailLines: 500,
    })

    expect(mockedFetchRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `/apis/proxy.open-cluster-management.io/v1beta1/namespaces/${mockCluster}/clusterstatuses/${mockCluster}/log/${mockNamespace}/${mockPodName}/${mockContainer}?tailLines=500`,
      })
    )

    expect(result).toEqual({ data: mockLogs })
  })

  it('should catch and return error message when access review promise rejects', async () => {
    const mockError = new Error('RBAC check failed')
    mockedCreateSubjectAccessReview.mockReturnValue({
      promise: Promise.reject(mockError),
      abort: jest.fn(),
    })

    const result = await fleetLogsRequest({
      cluster: mockCluster,
      namespace: mockNamespace,
      podName: mockPodName,
      container: mockContainer,
    })

    expect(result).toEqual({ data: '', errorMessage: 'RBAC check failed' })
    expect(console.error).toHaveBeenCalledWith(
      `Error fetching logs for pod ${mockPodName} in namespace ${mockNamespace} on cluster ${mockCluster}: `,
      mockError
    )
  })

  it('should catch and return error message when fetchRetry throws an error', async () => {
    const mockError = new Error('Network request failed')
    mockedCreateSubjectAccessReview.mockReturnValue({
      promise: Promise.resolve(getAccessReviewResult(true)),
      abort: jest.fn(),
    })

    mockedFetchRetry.mockRejectedValue(mockError)

    const result = await fleetLogsRequest({
      cluster: mockCluster,
      namespace: mockNamespace,
      podName: mockPodName,
      container: mockContainer,
    })

    expect(result).toEqual({ data: '', errorMessage: 'Network request failed' })
    expect(console.error).toHaveBeenCalledWith(
      `Error fetching logs for pod ${mockPodName} in namespace ${mockNamespace} on cluster ${mockCluster}: `,
      mockError
    )
  })

  it('should return empty string for logs data when response data is undefined', async () => {
    mockedCreateSubjectAccessReview.mockReturnValue({
      promise: Promise.resolve(getAccessReviewResult(true)),
      abort: jest.fn(),
    })

    mockedFetchRetry.mockResolvedValue({
      headers: new Headers(),
      status: 200,
      data: undefined,
    })

    const result = await fleetLogsRequest({
      cluster: mockCluster,
      namespace: mockNamespace,
      podName: mockPodName,
      container: mockContainer,
    })

    expect(result).toEqual({ data: '' })
  })
})
