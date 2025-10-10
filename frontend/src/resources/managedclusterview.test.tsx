/* Copyright Contributors to the Open Cluster Management project */

import { v4 as uuidv4 } from 'uuid'
import { nockCreate, nockDelete, nockGet, nockIgnoreApiPaths } from '../lib/nock-util'
import { waitForNocks } from '../lib/test-util'
import {
  fireManagedClusterView,
  ManagedClusterView,
  ManagedClusterViewApiVersion,
  ManagedClusterViewKind,
  pollManagedClusterView,
} from './managedclusterview'

// Mock UUID v4 to return predictable values during testing
jest.mock('uuid', () => ({
  v4: jest.fn(),
}))

const mockUuidV4 = jest.mocked(uuidv4)
const MOCKED_UUID = 'test-view-uuid-12345'

// Test data
const clusterName = 'test-cluster'
const resourceKind = 'ConfigMap'
const resourceApiVersion = 'v1'
const resourceName = 'test-configmap'
const resourceNamespace = 'default'

const expectedManagedClusterView: ManagedClusterView = {
  apiVersion: ManagedClusterViewApiVersion,
  kind: ManagedClusterViewKind,
  metadata: {
    name: MOCKED_UUID,
    namespace: clusterName,
    labels: {
      viewName: MOCKED_UUID,
    },
  },
  spec: {
    scope: {
      resource: 'configmap',
      name: resourceName,
      namespace: resourceNamespace,
    },
  },
}

const completedManagedClusterView: ManagedClusterView = {
  ...expectedManagedClusterView,
  status: {
    conditions: [
      {
        lastTransitionTime: new Date('2023-01-01T00:00:00Z'),
        message: 'Resource retrieved successfully',
        reason: 'GetResourceProcessing',
        status: 'True',
        type: 'Processing',
      },
    ],
    result: {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: resourceName,
        namespace: resourceNamespace,
      },
      data: {
        'test-key': 'test-value',
      },
    },
  },
}

const failedManagedClusterView: ManagedClusterView = {
  ...expectedManagedClusterView,
  status: {
    conditions: [
      {
        lastTransitionTime: new Date('2023-01-01T00:00:00Z'),
        message: 'Resource not found on the managed cluster',
        reason: 'GetResourceFailed',
        status: 'False',
        type: 'Processing',
      },
    ],
  },
}

describe('fireManagedClusterView', () => {
  beforeEach(() => {
    // Reset the mock before each test
    mockUuidV4.mockReset()
    mockUuidV4.mockReturnValue(MOCKED_UUID)
    nockIgnoreApiPaths()
  })

  describe('successful view execution', () => {
    it('should create and poll ManagedClusterView for a resource', async () => {
      // In test mode, fireManagedClusterView first tries to GET the view
      // Mock the initial GET to return 404 (not found)
      const getInitialNock = nockGet(
        {
          apiVersion: ManagedClusterViewApiVersion,
          kind: ManagedClusterViewKind,
          metadata: { name: MOCKED_UUID, namespace: clusterName },
        },
        {
          kind: 'Status',
          apiVersion: 'v1',
          metadata: {},
          status: 'Failure',
          message: 'managedclusterviews.view.open-cluster-management.io not found',
          reason: 'NotFound',
          code: 404,
        } as any,
        404,
        false
      )

      // Mock the CREATE operation
      const createNock = nockCreate(expectedManagedClusterView, expectedManagedClusterView)

      // Mock the poll operation - this returns the completed view
      const pollNock = nockGet(
        {
          apiVersion: ManagedClusterViewApiVersion,
          kind: ManagedClusterViewKind,
          metadata: { name: MOCKED_UUID, namespace: clusterName },
        },
        completedManagedClusterView
      )

      // Mock delete operation that happens during cleanup
      const deleteNock = nockDelete({
        apiVersion: ManagedClusterViewApiVersion,
        kind: ManagedClusterViewKind,
        metadata: { name: MOCKED_UUID, namespace: clusterName },
      })

      const result = await fireManagedClusterView(
        clusterName,
        resourceKind,
        resourceApiVersion,
        resourceName,
        resourceNamespace
      )

      expect(mockUuidV4).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        processing: 'Processing',
        reason: 'GetResourceProcessing',
        result: completedManagedClusterView.status?.result,
      })
      await waitForNocks([getInitialNock, createNock, pollNock, deleteNock])
    })

    it('should create ManagedClusterView without namespace for cluster-scoped resources', async () => {
      const expectedClusterScopedView = {
        apiVersion: ManagedClusterViewApiVersion,
        kind: ManagedClusterViewKind,
        metadata: {
          name: MOCKED_UUID,
          namespace: clusterName,
          labels: {
            viewName: MOCKED_UUID,
          },
        },
        spec: {
          scope: {
            resource: 'namespace',
            name: 'test-namespace',
          },
        },
      }

      // Mock the initial GET to return 404 (not found)
      const getInitialNock = nockGet(
        {
          apiVersion: ManagedClusterViewApiVersion,
          kind: ManagedClusterViewKind,
          metadata: { name: MOCKED_UUID, namespace: clusterName },
        },
        {
          kind: 'Status',
          apiVersion: 'v1',
          metadata: {},
          status: 'Failure',
          message: 'managedclusterviews.view.open-cluster-management.io not found',
          reason: 'NotFound',
          code: 404,
        } as any,
        404,
        false
      )

      // Mock the CREATE operation
      const createNock = nockCreate(expectedClusterScopedView, expectedClusterScopedView)

      const pollNock = nockGet(
        {
          apiVersion: ManagedClusterViewApiVersion,
          kind: ManagedClusterViewKind,
          metadata: { name: MOCKED_UUID, namespace: clusterName },
        },
        {
          ...expectedClusterScopedView,
          status: {
            conditions: [
              {
                lastTransitionTime: new Date('2023-01-01T00:00:00Z'),
                message: 'Resource retrieved successfully',
                reason: 'GetResourceProcessing',
                status: 'True',
                type: 'Processing',
              },
            ],
            result: {
              apiVersion: 'v1',
              kind: 'Namespace',
              metadata: {
                name: 'test-namespace',
              },
            },
          },
        }
      )

      const deleteNock = nockDelete({
        apiVersion: ManagedClusterViewApiVersion,
        kind: ManagedClusterViewKind,
        metadata: { name: MOCKED_UUID, namespace: clusterName },
      })

      const result = await fireManagedClusterView(clusterName, 'Namespace', 'v1', 'test-namespace')

      expect(result).toEqual({
        processing: 'Processing',
        reason: 'GetResourceProcessing',
        result: {
          apiVersion: 'v1',
          kind: 'Namespace',
          metadata: {
            name: 'test-namespace',
          },
        },
      })
      await waitForNocks([getInitialNock, createNock, pollNock, deleteNock])
    })

    it('should handle resource with apiGroup correctly', async () => {
      const resourceWithApiGroup = 'apps/v1'
      const expectedViewWithApiGroup = {
        ...expectedManagedClusterView,
        spec: {
          scope: {
            resource: 'configmap.v1.apps',
            name: resourceName,
            namespace: resourceNamespace,
          },
        },
      }

      // Mock the initial GET to return 404 (not found)
      const getInitialNock = nockGet(
        {
          apiVersion: ManagedClusterViewApiVersion,
          kind: ManagedClusterViewKind,
          metadata: { name: MOCKED_UUID, namespace: clusterName },
        },
        {
          kind: 'Status',
          apiVersion: 'v1',
          metadata: {},
          status: 'Failure',
          message: 'managedclusterviews.view.open-cluster-management.io not found',
          reason: 'NotFound',
          code: 404,
        } as any,
        404,
        false
      )

      // Mock the CREATE operation
      const createNock = nockCreate(expectedViewWithApiGroup, expectedViewWithApiGroup)

      const pollNock = nockGet(
        {
          apiVersion: ManagedClusterViewApiVersion,
          kind: ManagedClusterViewKind,
          metadata: { name: MOCKED_UUID, namespace: clusterName },
        },
        {
          ...expectedViewWithApiGroup,
          status: completedManagedClusterView.status,
        }
      )

      const deleteNock = nockDelete({
        apiVersion: ManagedClusterViewApiVersion,
        kind: ManagedClusterViewKind,
        metadata: { name: MOCKED_UUID, namespace: clusterName },
      })

      const result = await fireManagedClusterView(
        clusterName,
        resourceKind,
        resourceWithApiGroup,
        resourceName,
        resourceNamespace
      )

      expect(result).toEqual({
        processing: 'Processing',
        reason: 'GetResourceProcessing',
        result: completedManagedClusterView.status?.result,
      })
      await waitForNocks([getInitialNock, createNock, pollNock, deleteNock])
    })

    it('should reject viewing Secret resources for security reasons', async () => {
      const result = await fireManagedClusterView(clusterName, 'Secret', 'v1', 'test-secret', 'default')

      expect(result).toEqual({
        message:
          'Viewing Secrets is not allowed for security reasons. To view this secret, you must access it from the cluster directly.',
      })
    })

    it('should reject viewing Secrets resources (plural) for security reasons', async () => {
      const result = await fireManagedClusterView(clusterName, 'Secrets', 'v1', 'test-secret', 'default')

      expect(result).toEqual({
        message:
          'Viewing Secrets is not allowed for security reasons. To view this secret, you must access it from the cluster directly.',
      })
    })
  })

  describe('error scenarios', () => {
    it('should handle view already exists scenario', async () => {
      // Mock the initial GET to return an existing view with a completed status
      const getInitialNock = nockGet(
        {
          apiVersion: ManagedClusterViewApiVersion,
          kind: ManagedClusterViewKind,
          metadata: { name: MOCKED_UUID, namespace: clusterName },
        },
        completedManagedClusterView,
        200,
        false // No polling needed since view already exists
      )

      const result = await fireManagedClusterView(
        clusterName,
        resourceKind,
        resourceApiVersion,
        resourceName,
        resourceNamespace
      )

      // When the view already exists and is completed, it returns immediately
      expect(result).toEqual({
        processing: 'Processing',
        reason: 'GetResourceProcessing',
        result: completedManagedClusterView.status?.result,
      })
      await waitForNocks([getInitialNock])
    })

    it('should handle view failure during execution', async () => {
      // Mock the initial GET to return 404 (not found)
      const getInitialNock = nockGet(
        {
          apiVersion: ManagedClusterViewApiVersion,
          kind: ManagedClusterViewKind,
          metadata: { name: MOCKED_UUID, namespace: clusterName },
        },
        {
          kind: 'Status',
          apiVersion: 'v1',
          metadata: {},
          status: 'Failure',
          message: 'managedclusterviews.view.open-cluster-management.io not found',
          reason: 'NotFound',
          code: 404,
        } as any,
        404,
        false
      )

      // Mock the CREATE operation
      const createNock = nockCreate(expectedManagedClusterView, expectedManagedClusterView)

      const pollNock = nockGet(
        {
          apiVersion: ManagedClusterViewApiVersion,
          kind: ManagedClusterViewKind,
          metadata: { name: MOCKED_UUID, namespace: clusterName },
        },
        failedManagedClusterView
      )

      const deleteNock = nockDelete({
        apiVersion: ManagedClusterViewApiVersion,
        kind: ManagedClusterViewKind,
        metadata: { name: MOCKED_UUID, namespace: clusterName },
      })

      const result = await fireManagedClusterView(
        clusterName,
        resourceKind,
        resourceApiVersion,
        resourceName,
        resourceNamespace
      )

      expect(result).toEqual({ message: 'Resource not found on the managed cluster' })

      await waitForNocks([getInitialNock, createNock, pollNock, deleteNock])
    })
  })
})

describe('pollManagedClusterView', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
  })

  it('should resolve when view is completed successfully', async () => {
    const pollNock = nockGet(
      {
        apiVersion: ManagedClusterViewApiVersion,
        kind: ManagedClusterViewKind,
        metadata: { name: MOCKED_UUID, namespace: clusterName },
      },
      completedManagedClusterView
    )

    const deleteNock = nockDelete({
      apiVersion: ManagedClusterViewApiVersion,
      kind: ManagedClusterViewKind,
      metadata: { name: MOCKED_UUID, namespace: clusterName },
    })

    const result = await pollManagedClusterView(MOCKED_UUID, clusterName)

    expect(result).toEqual({
      processing: 'Processing',
      reason: 'GetResourceProcessing',
      result: completedManagedClusterView.status?.result,
    })
    await waitForNocks([pollNock, deleteNock])
  })

  it('should reject when view fails', async () => {
    const pollNock = nockGet(
      {
        apiVersion: ManagedClusterViewApiVersion,
        kind: ManagedClusterViewKind,
        metadata: { name: MOCKED_UUID, namespace: clusterName },
      },
      failedManagedClusterView
    )

    const deleteNock = nockDelete({
      apiVersion: ManagedClusterViewApiVersion,
      kind: ManagedClusterViewKind,
      metadata: { name: MOCKED_UUID, namespace: clusterName },
    })

    await expect(pollManagedClusterView(MOCKED_UUID, clusterName)).rejects.toEqual({
      message: 'Resource not found on the managed cluster',
    })

    await waitForNocks([pollNock, deleteNock])
  })

  it('should reject when no status is returned', async () => {
    const viewWithoutStatus = {
      ...expectedManagedClusterView,
      status: undefined,
    }

    const pollNock = nockGet(
      {
        apiVersion: ManagedClusterViewApiVersion,
        kind: ManagedClusterViewKind,
        metadata: { name: MOCKED_UUID, namespace: clusterName },
      },
      viewWithoutStatus
    )

    const deleteNock = nockDelete({
      apiVersion: ManagedClusterViewApiVersion,
      kind: ManagedClusterViewKind,
      metadata: { name: MOCKED_UUID, namespace: clusterName },
    })

    await expect(pollManagedClusterView(MOCKED_UUID, clusterName)).rejects.toEqual({
      message: `Request for ManagedClusterView: ${MOCKED_UUID} on cluster: ${clusterName} timed out after 20 retries. The resource may not exist on the managed cluster, or the work-manager pod in namespace open-cluster-management-agent-addon may be unhealthy.`,
      code: 'MCV_TIMEOUT',
    })

    await waitForNocks([pollNock, deleteNock])
  })

  it('should handle MCV deletion gracefully when NotFound error occurs', async () => {
    // Mock the get operation to return a 404 NotFound error with proper body
    const notFoundResponse = {
      kind: 'Status',
      apiVersion: 'v1',
      metadata: {},
      status: 'Failure',
      message: 'managedclusterviews.view.open-cluster-management.io "test-view-uuid-12345" not found',
      reason: 'NotFound',
      details: {
        name: MOCKED_UUID,
        group: 'view.open-cluster-management.io',
        kind: 'managedclusterviews',
      },
      code: 404,
    }

    const pollNock = nockGet(
      {
        apiVersion: ManagedClusterViewApiVersion,
        kind: ManagedClusterViewKind,
        metadata: { name: MOCKED_UUID, namespace: clusterName },
      },
      notFoundResponse as any,
      404,
      false // disable polling
    )

    await expect(pollManagedClusterView(MOCKED_UUID, clusterName)).rejects.toEqual({
      message: `ManagedClusterView ${MOCKED_UUID} was deleted or does not exist on cluster ${clusterName}.`,
      code: 'MCV_NOT_FOUND',
    })

    await waitForNocks([pollNock])
  })

  it('should handle timeout with MCV_TIMEOUT code and prevent phantom polling', async () => {
    const viewWithoutStatus = {
      ...expectedManagedClusterView,
      status: undefined,
    }

    // Mock get to return response without status
    const pollNock = nockGet(
      {
        apiVersion: ManagedClusterViewApiVersion,
        kind: ManagedClusterViewKind,
        metadata: { name: MOCKED_UUID, namespace: clusterName },
      },
      viewWithoutStatus
    )

    const deleteNock = nockDelete({
      apiVersion: ManagedClusterViewApiVersion,
      kind: ManagedClusterViewKind,
      metadata: { name: MOCKED_UUID, namespace: clusterName },
    })

    await expect(pollManagedClusterView(MOCKED_UUID, clusterName)).rejects.toEqual({
      message: `Request for ManagedClusterView: ${MOCKED_UUID} on cluster: ${clusterName} timed out after 20 retries. The resource may not exist on the managed cluster, or the work-manager pod in namespace open-cluster-management-agent-addon may be unhealthy.`,
      code: 'MCV_TIMEOUT',
    })

    await waitForNocks([pollNock, deleteNock])
  })

  it('should handle error condition when status has no proper processing state', async () => {
    const viewWithErrorStatus: ManagedClusterView = {
      ...expectedManagedClusterView,
      status: {
        conditions: [
          {
            lastTransitionTime: new Date('2023-01-01T00:00:00Z'),
            message: 'Unknown error occurred',
            reason: 'UnknownError',
            status: 'False',
            type: 'Unknown',
          },
        ],
      },
    }

    const pollNock = nockGet(
      {
        apiVersion: ManagedClusterViewApiVersion,
        kind: ManagedClusterViewKind,
        metadata: { name: MOCKED_UUID, namespace: clusterName },
      },
      viewWithErrorStatus
    )

    const deleteNock = nockDelete({
      apiVersion: ManagedClusterViewApiVersion,
      kind: ManagedClusterViewKind,
      metadata: { name: MOCKED_UUID, namespace: clusterName },
    })

    await expect(pollManagedClusterView(MOCKED_UUID, clusterName)).rejects.toEqual({
      message:
        'There was an error while getting the managed resource. Make sure the managed cluster is online and healthy, and the work manager pod in namespace open-cluster-management-agent-addon is healthy.',
    })

    await waitForNocks([pollNock, deleteNock])
  })

  it('should propagate non-NotFound errors during polling', async () => {
    // Mock the get operation to throw a different error (e.g., 500 Internal Server Error)
    const pollNock = nockGet(
      {
        apiVersion: ManagedClusterViewApiVersion,
        kind: ManagedClusterViewKind,
        metadata: { name: MOCKED_UUID, namespace: clusterName },
      },
      undefined,
      500
    )

    // The error should be propagated
    await expect(pollManagedClusterView(MOCKED_UUID, clusterName)).rejects.toBeDefined()

    await waitForNocks([pollNock])
  })
})
