/* Copyright Contributors to the Open Cluster Management project */

import { canUser } from '../../lib/rbac-util'
import { fireManagedClusterAction, ManagedClusterActionDefinition } from '../managedclusteraction'
import { fireManagedClusterView, ManagedClusterViewDefinition } from '../managedclusterview'
import { IResource } from '../resource'
import {
  SelfSubjectAccessReview,
  SelfSubjectAccessReviewApiVersion,
  SelfSubjectAccessReviewKind,
} from '../self-subject-access-review'
import { fleetResourceRequest } from './fleet-resource-request'
import { managedClusterProxyRequest } from './managed-cluster-proxy-request'

// Mock the dependencies
jest.mock('../../lib/rbac-util')
jest.mock('../managedclusteraction')
jest.mock('../managedclusterview')
jest.mock('./managed-cluster-proxy-request')

const mockedCanUser = canUser as jest.MockedFunction<typeof canUser>
const mockedFireManagedClusterView = fireManagedClusterView as jest.MockedFunction<typeof fireManagedClusterView>
const mockedFireManagedClusterAction = fireManagedClusterAction as jest.MockedFunction<typeof fireManagedClusterAction>
const mockedManagedClusterProxyRequest = managedClusterProxyRequest as jest.MockedFunction<
  typeof managedClusterProxyRequest
>

const getCanUserRes = (isAllowed: boolean): SelfSubjectAccessReview => {
  return {
    apiVersion: SelfSubjectAccessReviewApiVersion,
    kind: SelfSubjectAccessReviewKind,
    metadata: {},
    spec: {
      resourceAttributes: {
        resource: 'Pod',
        verb: 'create',
      },
    },
    status: {
      allowed: isAllowed,
    },
  }
}

describe('fleet-resource-request', () => {
  const mockCluster = 'test-cluster'
  const mockResource = {
    apiVersion: 'v1',
    kind: 'Pod',
    namespace: 'test-namespace',
    name: 'test-pod',
  }
  const mockPodResource: IResource = {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      name: 'test-pod',
      namespace: 'test-namespace',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console.error to avoid noise in test output
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should use ManagedClusterView when user is authorized to create MCV for GET request', async () => {
    // Mock canUser to return authorized
    mockedCanUser.mockReturnValue({
      promise: Promise.resolve(getCanUserRes(true)),
      abort: jest.fn(),
    })

    // Mock fireManagedClusterView to return successful result
    mockedFireManagedClusterView.mockResolvedValue({
      result: mockPodResource,
    })

    const result = await fleetResourceRequest('GET', mockCluster, mockResource)

    expect(mockedCanUser).toHaveBeenCalledWith('create', ManagedClusterViewDefinition)
    expect(mockedFireManagedClusterView).toHaveBeenCalledWith(
      mockCluster,
      mockResource.kind,
      mockResource.apiVersion,
      mockResource.name,
      mockResource.namespace
    )
    expect(mockedFireManagedClusterAction).not.toHaveBeenCalled()
    expect(mockedManagedClusterProxyRequest).not.toHaveBeenCalled()
    expect(result).toEqual(mockPodResource)
  })

  it('should use ManagedClusterAction when user is authorized to create MCA for DELETE request', async () => {
    // Mock canUser to return authorized
    mockedCanUser.mockReturnValue({
      promise: Promise.resolve(getCanUserRes(true)),
      abort: jest.fn(),
    })

    // Mock fireManagedClusterAction to return successful result
    mockedFireManagedClusterAction.mockResolvedValue({
      actionDone: 'ActionDone',
      result: mockPodResource,
    })

    const result = await fleetResourceRequest('DELETE', mockCluster, mockResource)

    expect(mockedCanUser).toHaveBeenCalledWith('create', ManagedClusterActionDefinition)
    expect(mockedFireManagedClusterAction).toHaveBeenCalledWith(
      'Delete',
      mockCluster,
      mockResource.kind,
      mockResource.apiVersion,
      mockResource.name,
      mockResource.namespace,
      undefined
    )
    expect(mockedFireManagedClusterView).not.toHaveBeenCalled()
    expect(mockedManagedClusterProxyRequest).not.toHaveBeenCalled()
    expect(result).toEqual({
      actionDone: 'ActionDone',
      result: mockPodResource,
    })
  })

  it('should use ManagedClusterAction when user is authorized to create MCA for PUT request', async () => {
    // Mock canUser to return authorized
    mockedCanUser.mockReturnValue({
      promise: Promise.resolve(getCanUserRes(true)),
      abort: jest.fn(),
    })

    // Mock fireManagedClusterAction to return successful result
    mockedFireManagedClusterAction.mockResolvedValue({
      actionDone: 'ActionDone',
      result: mockPodResource,
    })

    const result = await fleetResourceRequest('PUT', mockCluster, mockResource)

    expect(mockedCanUser).toHaveBeenCalledWith('create', ManagedClusterActionDefinition)
    expect(mockedFireManagedClusterAction).toHaveBeenCalledWith(
      'Update',
      mockCluster,
      mockResource.kind,
      mockResource.apiVersion,
      mockResource.name,
      mockResource.namespace,
      undefined
    )
    expect(mockedFireManagedClusterView).not.toHaveBeenCalled()
    expect(mockedManagedClusterProxyRequest).not.toHaveBeenCalled()
    expect(result).toEqual({
      actionDone: 'ActionDone',
      result: mockPodResource,
    })
  })

  it('should use ManagedClusterAction when user is authorized to create MCA for POST request', async () => {
    // Mock canUser to return authorized
    mockedCanUser.mockReturnValue({
      promise: Promise.resolve(getCanUserRes(true)),
      abort: jest.fn(),
    })

    // Mock fireManagedClusterAction to return successful result
    mockedFireManagedClusterAction.mockResolvedValue({
      actionDone: 'ActionDone',
      result: mockPodResource,
    })

    const result = await fleetResourceRequest('POST', mockCluster, mockResource)

    expect(mockedCanUser).toHaveBeenCalledWith('create', ManagedClusterActionDefinition)
    expect(mockedFireManagedClusterAction).toHaveBeenCalledWith(
      'Create',
      mockCluster,
      mockResource.kind,
      mockResource.apiVersion,
      mockResource.name,
      mockResource.namespace,
      undefined
    )
    expect(mockedFireManagedClusterView).not.toHaveBeenCalled()
    expect(mockedManagedClusterProxyRequest).not.toHaveBeenCalled()
    expect(result).toEqual({
      actionDone: 'ActionDone',
      result: mockPodResource,
    })
  })

  it('should fallback to managedClusterProxyRequest when user is not authorized to create MCA for DELETE request', async () => {
    // Mock canUser to return not authorized
    mockedCanUser.mockReturnValue({
      promise: Promise.resolve(getCanUserRes(false)),
      abort: jest.fn(),
    })

    // Mock managedClusterProxyRequest to return successful result
    mockedManagedClusterProxyRequest.mockResolvedValue(mockPodResource)

    const result = await fleetResourceRequest('DELETE', mockCluster, mockResource)

    expect(mockedCanUser).toHaveBeenCalledWith('create', ManagedClusterActionDefinition)
    expect(mockedFireManagedClusterAction).not.toHaveBeenCalled()
    expect(mockedFireManagedClusterView).not.toHaveBeenCalled()
    expect(mockedManagedClusterProxyRequest).toHaveBeenCalledWith(
      'DELETE',
      mockCluster,
      {
        apiVersion: mockResource.apiVersion,
        kind: mockResource.kind,
        namespace: mockResource.namespace,
        name: mockResource.name,
      },
      undefined
    )
    expect(result).toEqual(mockPodResource)
  })

  it('should fallback to managedClusterProxyRequest when user is not authorized to create MCV for GET request', async () => {
    // Mock canUser to return not authorized
    mockedCanUser.mockReturnValue({
      promise: Promise.resolve(getCanUserRes(false)),
      abort: jest.fn(),
    })

    // Mock managedClusterProxyRequest to return successful result
    mockedManagedClusterProxyRequest.mockResolvedValue(mockPodResource)

    const result = await fleetResourceRequest('GET', mockCluster, mockResource)

    expect(mockedCanUser).toHaveBeenCalledWith('create', ManagedClusterViewDefinition)
    expect(mockedFireManagedClusterView).not.toHaveBeenCalled()
    expect(mockedFireManagedClusterAction).not.toHaveBeenCalled()
    expect(mockedManagedClusterProxyRequest).toHaveBeenCalledWith(
      'GET',
      mockCluster,
      {
        apiVersion: mockResource.apiVersion,
        kind: mockResource.kind,
        namespace: mockResource.namespace,
        name: mockResource.name,
      },
      undefined
    )
    expect(result).toEqual(mockPodResource)
  })

  it('should catch and return error message when canUser promise rejects', async () => {
    const mockError = new Error('RBAC check failed')
    mockedCanUser.mockReturnValue({
      promise: Promise.reject(mockError),
      abort: jest.fn(),
    })

    const result = await fleetResourceRequest('GET', mockCluster, mockResource)

    expect(result).toEqual({ errorMessage: 'RBAC check failed' })
    expect(console.error).toHaveBeenCalledWith(`Error performing GET request for Pod test-pod: `, mockError)
  })

  it('should return error message for invalid request parameters', async () => {
    const res = await fleetResourceRequest('GET', '', mockResource)
    expect(res).toEqual({ errorMessage: 'Invalid request parameters' })
  })
})
