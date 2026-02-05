/* Copyright Contributors to the Open Cluster Management project */

import { canUser } from '../../lib/rbac-util'
import { ManagedClusterActionDefinition } from '../managedclusteraction'
import { ManagedClusterViewDefinition } from '../managedclusterview'
import { IResource } from '../resource'
import {
  createSubjectAccessReviewWithBaseUrl,
  SelfSubjectAccessReview,
  SelfSubjectAccessReviewApiVersion,
  SelfSubjectAccessReviewKind,
} from '../self-subject-access-review'
import { fleetCanUser } from './fleet-can-user'

// Mock the dependencies
jest.mock('../../lib/rbac-util')
jest.mock('../self-subject-access-review', () => {
  const originalModule = jest.requireActual('../self-subject-access-review')
  return {
    ...originalModule,
    createSubjectAccessReviewWithBaseUrl: jest.fn(),
  }
})

const mockedCanUser = canUser as jest.MockedFunction<typeof canUser>
const mockedCreateSubjectAccessReviewWithBaseUrl = createSubjectAccessReviewWithBaseUrl as jest.MockedFunction<
  typeof createSubjectAccessReviewWithBaseUrl
>

const getCanUserRes = (isAllowed: boolean): SelfSubjectAccessReview => {
  return {
    apiVersion: SelfSubjectAccessReviewApiVersion,
    kind: SelfSubjectAccessReviewKind,
    metadata: {},
    spec: {
      resourceAttributes: {
        resource: 'pods',
        verb: 'get',
      },
    },
    status: {
      allowed: isAllowed,
    },
  }
}

describe('fleet-can-user', () => {
  const mockCluster = 'test-cluster'
  const mockResource: IResource = {
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

  describe('fleetCanUser with GET verb', () => {
    it('should return allowed=true when user can create ManagedClusterView', async () => {
      // Mock canUser to return authorized
      mockedCanUser.mockReturnValue({
        promise: Promise.resolve(getCanUserRes(true)),
        abort: jest.fn(),
      })

      const result = await fleetCanUser('get', mockCluster, mockResource, 'test-namespace', 'test-pod').promise

      expect(mockedCanUser).toHaveBeenCalledWith('create', ManagedClusterViewDefinition)
      expect(mockedCreateSubjectAccessReviewWithBaseUrl).not.toHaveBeenCalled()
      expect(result.status?.allowed).toBe(true)
    })

    it('should fall back to cluster proxy when user cannot create ManagedClusterView', async () => {
      // Mock canUser to return not authorized
      mockedCanUser.mockReturnValue({
        promise: Promise.resolve(getCanUserRes(false)),
        abort: jest.fn(),
      })

      // Mock the proxy access review
      const proxyResult = getCanUserRes(true)
      mockedCreateSubjectAccessReviewWithBaseUrl.mockReturnValue({
        promise: Promise.resolve(proxyResult),
        abort: jest.fn(),
      })

      const result = await fleetCanUser('get', mockCluster, mockResource, 'test-namespace', 'test-pod').promise

      expect(mockedCanUser).toHaveBeenCalledWith('create', ManagedClusterViewDefinition)
      expect(mockedCreateSubjectAccessReviewWithBaseUrl).toHaveBeenCalled()
      // Verify the base URL contains the cluster proxy path
      expect(mockedCreateSubjectAccessReviewWithBaseUrl.mock.calls[0][1]).toContain(
        `/managedclusterproxy/${mockCluster}`
      )
      expect(result.status?.allowed).toBe(true)
    })

    it('should return not allowed when neither MCV nor proxy allows access', async () => {
      // Mock canUser to return not authorized
      mockedCanUser.mockReturnValue({
        promise: Promise.resolve(getCanUserRes(false)),
        abort: jest.fn(),
      })

      // Mock the proxy access review to return not authorized
      const proxyResult = getCanUserRes(false)
      mockedCreateSubjectAccessReviewWithBaseUrl.mockReturnValue({
        promise: Promise.resolve(proxyResult),
        abort: jest.fn(),
      })

      const result = await fleetCanUser('get', mockCluster, mockResource, 'test-namespace', 'test-pod').promise

      expect(result.status?.allowed).toBe(false)
    })
  })

  describe('fleetCanUser with update verb', () => {
    it('should return allowed=true when user can create ManagedClusterAction', async () => {
      // Mock canUser to return authorized
      mockedCanUser.mockReturnValue({
        promise: Promise.resolve(getCanUserRes(true)),
        abort: jest.fn(),
      })

      const result = await fleetCanUser('update', mockCluster, mockResource, 'test-namespace', 'test-pod').promise

      expect(mockedCanUser).toHaveBeenCalledWith('create', ManagedClusterActionDefinition)
      expect(mockedCreateSubjectAccessReviewWithBaseUrl).not.toHaveBeenCalled()
      expect(result.status?.allowed).toBe(true)
    })

    it('should fall back to cluster proxy when user cannot create ManagedClusterAction', async () => {
      // Mock canUser to return not authorized
      mockedCanUser.mockReturnValue({
        promise: Promise.resolve(getCanUserRes(false)),
        abort: jest.fn(),
      })

      // Mock the proxy access review
      const proxyResult = getCanUserRes(true)
      mockedCreateSubjectAccessReviewWithBaseUrl.mockReturnValue({
        promise: Promise.resolve(proxyResult),
        abort: jest.fn(),
      })

      const result = await fleetCanUser('update', mockCluster, mockResource, 'test-namespace', 'test-pod').promise

      expect(mockedCanUser).toHaveBeenCalledWith('create', ManagedClusterActionDefinition)
      expect(mockedCreateSubjectAccessReviewWithBaseUrl).toHaveBeenCalled()
      expect(result.status?.allowed).toBe(true)
    })
  })

  describe('fleetCanUser with delete verb', () => {
    it('should check ManagedClusterAction permission for delete verb', async () => {
      mockedCanUser.mockReturnValue({
        promise: Promise.resolve(getCanUserRes(true)),
        abort: jest.fn(),
      })

      const result = await fleetCanUser('delete', mockCluster, mockResource, 'test-namespace', 'test-pod').promise

      expect(mockedCanUser).toHaveBeenCalledWith('create', ManagedClusterActionDefinition)
      expect(result.status?.allowed).toBe(true)
    })
  })

  describe('fleetCanUser with create verb', () => {
    it('should check ManagedClusterAction permission for create verb', async () => {
      mockedCanUser.mockReturnValue({
        promise: Promise.resolve(getCanUserRes(true)),
        abort: jest.fn(),
      })

      const result = await fleetCanUser('create', mockCluster, mockResource, 'test-namespace', 'test-pod').promise

      expect(mockedCanUser).toHaveBeenCalledWith('create', ManagedClusterActionDefinition)
      expect(result.status?.allowed).toBe(true)
    })
  })

  describe('fleetCanUser with patch verb', () => {
    it('should check ManagedClusterAction permission for patch verb', async () => {
      mockedCanUser.mockReturnValue({
        promise: Promise.resolve(getCanUserRes(true)),
        abort: jest.fn(),
      })

      const result = await fleetCanUser('patch', mockCluster, mockResource, 'test-namespace', 'test-pod').promise

      expect(mockedCanUser).toHaveBeenCalledWith('create', ManagedClusterActionDefinition)
      expect(result.status?.allowed).toBe(true)
    })
  })

  describe('abort functionality', () => {
    it('should call abort on MCV/MCA check when abort is called early', () => {
      const mockAbort = jest.fn()
      mockedCanUser.mockReturnValue({
        promise: new Promise(() => {}), // Never resolves
        abort: mockAbort,
      })

      const request = fleetCanUser('get', mockCluster, mockResource, 'test-namespace', 'test-pod')
      request.abort()

      expect(mockAbort).toHaveBeenCalled()
    })

    it('should call abort on proxy request when abort is called during fallback', async () => {
      // Mock canUser to return not authorized
      mockedCanUser.mockReturnValue({
        promise: Promise.resolve(getCanUserRes(false)),
        abort: jest.fn(),
      })

      const mockProxyAbort = jest.fn()
      mockedCreateSubjectAccessReviewWithBaseUrl.mockReturnValue({
        promise: new Promise(() => {}), // Never resolves
        abort: mockProxyAbort,
      })

      const request = fleetCanUser('get', mockCluster, mockResource, 'test-namespace', 'test-pod')

      // Wait a bit for the MCV check to complete and fallback to start
      await new Promise((resolve) => setTimeout(resolve, 10))

      request.abort()

      expect(mockProxyAbort).toHaveBeenCalled()
    })
  })
})
