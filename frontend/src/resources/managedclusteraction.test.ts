/* Copyright Contributors to the Open Cluster Management project */

import { v4 as uuidv4 } from 'uuid'
import { nockCreate, nockDelete, nockGet, nockIgnoreApiPaths } from '../lib/nock-util'
import { waitForNocks } from '../lib/test-util'
import {
  fireManagedClusterAction,
  fireManagedClusterActionCreate,
  ManagedClusterAction,
  ManagedClusterActionApiVersion,
  ManagedClusterActionKind,
  pollManagedClusterAction,
} from './managedclusteraction'

// Mock UUID v4 to return predictable values during testing
jest.mock('uuid', () => ({
  v4: jest.fn(),
}))

const mockUuidV4 = jest.mocked(uuidv4)
const MOCKED_UUID = 'test-action-uuid-12345'

// Test data
const clusterName = 'test-cluster'
const resourceKind = 'ConfigMap'
const resourceApiVersion = 'v1'
const resourceName = 'test-configmap'
const resourceNamespace = 'default'
const resourceBody = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: {
    name: resourceName,
    namespace: resourceNamespace,
  },
  data: {
    'test-key': 'test-value',
  },
}

const expectedManagedClusterAction: ManagedClusterAction = {
  apiVersion: ManagedClusterActionApiVersion,
  kind: ManagedClusterActionKind,
  metadata: {
    name: MOCKED_UUID,
    namespace: clusterName,
  },
  spec: {
    cluster: {
      name: clusterName,
    },
    type: 'Action',
    actionType: 'Update',
    scope: {
      resourceType: 'configmap',
      namespace: resourceNamespace,
    },
    kube: {
      resource: 'configmap',
      name: resourceName,
      namespace: resourceNamespace,
      template: resourceBody,
    },
  },
}

const completedManagedClusterAction: ManagedClusterAction = {
  ...expectedManagedClusterAction,
  status: {
    conditions: [
      {
        lastTransitionTime: '2023-01-01T00:00:00Z' as any,
        message: 'Action completed successfully',
        reason: 'ActionDone',
        status: 'True',
        type: 'Completed',
      },
    ],
    result: {
      success: true,
    },
  },
}

const failedManagedClusterAction: ManagedClusterAction = {
  ...expectedManagedClusterAction,
  status: {
    conditions: [
      {
        lastTransitionTime: '2023-01-01T00:00:00Z' as any,
        message: 'Action failed due to resource conflict',
        reason: 'ActionFailed',
        status: 'False',
        type: 'Completed',
      },
    ],
  },
}

describe('fireManagedClusterAction', () => {
  beforeEach(() => {
    // Reset the mock before each test
    mockUuidV4.mockReset()
    mockUuidV4.mockReturnValue(MOCKED_UUID)
    nockIgnoreApiPaths()
  })

  describe('successful action execution', () => {
    it('should create and poll ManagedClusterAction for Update action', async () => {
      // Mock the create operation
      const createNock = nockCreate(expectedManagedClusterAction, expectedManagedClusterAction)

      // Mock delete operation that may happen during error cleanup
      const deleteNock = nockDelete({
        apiVersion: ManagedClusterActionApiVersion,
        kind: ManagedClusterActionKind,
        metadata: { name: MOCKED_UUID, namespace: clusterName },
      })

      // Mock the poll operation
      const pollNock = nockGet(
        {
          apiVersion: ManagedClusterActionApiVersion,
          kind: ManagedClusterActionKind,
          metadata: { name: MOCKED_UUID, namespace: clusterName },
        },
        completedManagedClusterAction
      )

      const result = await fireManagedClusterAction(
        'Update',
        clusterName,
        resourceKind,
        resourceApiVersion,
        resourceName,
        resourceNamespace,
        resourceBody
      )

      expect(mockUuidV4).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        complete: 'Completed',
        actionDone: 'ActionDone',
        message: 'Action completed successfully',
        result: { success: true },
      })
      await waitForNocks([createNock, pollNock, deleteNock])
    })

    it('should create and poll ManagedClusterAction for Delete action without resourceBody', async () => {
      const expectedDeleteAction = {
        apiVersion: ManagedClusterActionApiVersion,
        kind: ManagedClusterActionKind,
        metadata: {
          name: MOCKED_UUID,
          namespace: clusterName,
        },
        spec: {
          cluster: {
            name: clusterName,
          },
          type: 'Action',
          actionType: 'Delete',
          scope: {
            resourceType: 'configmap',
            namespace: resourceNamespace,
          },
          kube: {
            resource: 'configmap',
            name: resourceName,
            namespace: resourceNamespace,
          },
        },
      }

      const createNock = nockCreate(expectedDeleteAction, expectedDeleteAction)
      const pollNock = nockGet(
        {
          apiVersion: ManagedClusterActionApiVersion,
          kind: ManagedClusterActionKind,
          metadata: { name: MOCKED_UUID, namespace: clusterName },
        },
        completedManagedClusterAction
      )

      // Mock the delete operation that happens in cleanup
      const deleteNock = nockDelete({
        apiVersion: ManagedClusterActionApiVersion,
        kind: ManagedClusterActionKind,
        metadata: { name: MOCKED_UUID, namespace: clusterName },
      })

      const result = await fireManagedClusterAction(
        'Delete',
        clusterName,
        resourceKind,
        resourceApiVersion,
        resourceName,
        resourceNamespace
      )

      expect(result).toEqual({
        complete: 'Completed',
        actionDone: 'ActionDone',
        message: 'Action completed successfully',
        result: { success: true },
      })
      await waitForNocks([createNock, pollNock, deleteNock])
    })

    it('should handle resource with apiGroup correctly', async () => {
      const resourceWithApiGroup = 'apps/v1'
      const expectedActionWithApiGroup = {
        ...expectedManagedClusterAction,
        spec: {
          ...expectedManagedClusterAction.spec,
          scope: {
            resourceType: 'configmap.v1.apps',
            namespace: resourceNamespace,
          },
          kube: {
            resource: 'configmap.v1.apps',
            name: resourceName,
            namespace: resourceNamespace,
            template: resourceBody,
          },
        },
      }

      const createNock = nockCreate(expectedActionWithApiGroup, expectedActionWithApiGroup)
      const pollNock = nockGet(
        {
          apiVersion: ManagedClusterActionApiVersion,
          kind: ManagedClusterActionKind,
          metadata: { name: MOCKED_UUID, namespace: clusterName },
        },
        completedManagedClusterAction
      )

      // Mock the delete operation that happens in cleanup
      const deleteNock = nockDelete({
        apiVersion: ManagedClusterActionApiVersion,
        kind: ManagedClusterActionKind,
        metadata: { name: MOCKED_UUID, namespace: clusterName },
      })

      const result = await fireManagedClusterAction(
        'Update',
        clusterName,
        resourceKind,
        resourceWithApiGroup,
        resourceName,
        resourceNamespace,
        resourceBody
      )

      expect(result).toEqual({
        complete: 'Completed',
        actionDone: 'ActionDone',
        message: 'Action completed successfully',
        result: { success: true },
      })
      await waitForNocks([createNock, pollNock, deleteNock])
    })
  })

  describe('error scenarios', () => {
    it('should handle action creation failure', async () => {
      const createNock = nockCreate(expectedManagedClusterAction, expectedManagedClusterAction, 500)

      const result = await fireManagedClusterAction(
        'Update',
        clusterName,
        resourceKind,
        resourceApiVersion,
        resourceName,
        resourceNamespace,
        resourceBody
      )

      // The function catches and returns the error
      expect(result).toBeDefined()
      expect(result).toHaveProperty('message')
      await waitForNocks([createNock])
    })

    it('should handle action failure during execution', async () => {
      const createNock = nockCreate(expectedManagedClusterAction, expectedManagedClusterAction)
      const pollNock = nockGet(
        {
          apiVersion: ManagedClusterActionApiVersion,
          kind: ManagedClusterActionKind,
          metadata: { name: MOCKED_UUID, namespace: clusterName },
        },
        failedManagedClusterAction
      )

      // Mock the delete operation that happens during cleanup
      const deleteNock = nockDelete({
        apiVersion: ManagedClusterActionApiVersion,
        kind: ManagedClusterActionKind,
        metadata: { name: MOCKED_UUID, namespace: clusterName },
      })

      const result = await fireManagedClusterAction(
        'Update',
        clusterName,
        resourceKind,
        resourceApiVersion,
        resourceName,
        resourceNamespace,
        resourceBody
      )

      expect(result).toEqual({ message: 'Action failed due to resource conflict' })

      await waitForNocks([createNock, pollNock, deleteNock])
    })
  })
})

describe('fireManagedClusterActionCreate', () => {
  beforeEach(() => {
    // Reset the mock before each test
    mockUuidV4.mockReset()
    mockUuidV4.mockReturnValue(MOCKED_UUID)
    nockIgnoreApiPaths()
  })

  const projectTemplate = {
    apiVersion: 'project.openshift.io/v1',
    kind: 'ProjectRequest',
    metadata: { name: 'test-project' },
    displayName: 'Test Project',
    description: 'Test Description',
  }

  const expectedCreateAction: ManagedClusterAction = {
    apiVersion: ManagedClusterActionApiVersion,
    kind: ManagedClusterActionKind,
    metadata: {
      name: MOCKED_UUID,
      namespace: clusterName,
    },
    spec: {
      actionType: 'Create',
      kube: {
        template: projectTemplate,
      },
    },
  }

  const completedCreateAction: ManagedClusterAction = {
    ...expectedCreateAction,
    status: {
      conditions: [
        {
          lastTransitionTime: '2023-01-01T00:00:00Z' as any,
          message: 'Action completed successfully',
          reason: 'ActionDone',
          status: 'True',
          type: 'Completed',
        },
      ],
      result: {
        apiVersion: 'project.openshift.io/v1',
        kind: 'Project',
        metadata: { name: 'test-project' },
      },
    },
  }

  describe('successful action execution', () => {
    it('should create and poll ManagedClusterAction for Create action', async () => {
      // Mock the create operation
      const createNock = nockCreate(expectedCreateAction, expectedCreateAction)

      // Mock delete operation that happens during cleanup
      const deleteNock = nockDelete({
        apiVersion: ManagedClusterActionApiVersion,
        kind: ManagedClusterActionKind,
        metadata: { name: MOCKED_UUID, namespace: clusterName },
      })

      // Mock the poll operation
      const pollNock = nockGet(
        {
          apiVersion: ManagedClusterActionApiVersion,
          kind: ManagedClusterActionKind,
          metadata: { name: MOCKED_UUID, namespace: clusterName },
        },
        completedCreateAction
      )

      const result = await fireManagedClusterActionCreate(clusterName, projectTemplate)

      expect(mockUuidV4).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        complete: 'Completed',
        actionDone: 'ActionDone',
        message: 'Action completed successfully',
        result: {
          apiVersion: 'project.openshift.io/v1',
          kind: 'Project',
          metadata: { name: 'test-project' },
        },
      })
      await waitForNocks([createNock, pollNock, deleteNock])
    })

    it('should create ManagedClusterAction with minimal template', async () => {
      const minimalTemplate = {
        apiVersion: 'v1',
        kind: 'ConfigMap',
        metadata: { name: 'test-configmap', namespace: 'default' },
      }

      const expectedMinimalAction: ManagedClusterAction = {
        apiVersion: ManagedClusterActionApiVersion,
        kind: ManagedClusterActionKind,
        metadata: {
          name: MOCKED_UUID,
          namespace: clusterName,
        },
        spec: {
          actionType: 'Create',
          kube: {
            template: minimalTemplate,
          },
        },
      }

      const completedMinimalAction: ManagedClusterAction = {
        ...expectedMinimalAction,
        status: {
          conditions: [
            {
              lastTransitionTime: '2023-01-01T00:00:00Z' as any,
              message: 'ConfigMap created',
              reason: 'ActionDone',
              status: 'True',
              type: 'Completed',
            },
          ],
          result: minimalTemplate,
        },
      }

      const createNock = nockCreate(expectedMinimalAction, expectedMinimalAction)
      const deleteNock = nockDelete({
        apiVersion: ManagedClusterActionApiVersion,
        kind: ManagedClusterActionKind,
        metadata: { name: MOCKED_UUID, namespace: clusterName },
      })
      const pollNock = nockGet(
        {
          apiVersion: ManagedClusterActionApiVersion,
          kind: ManagedClusterActionKind,
          metadata: { name: MOCKED_UUID, namespace: clusterName },
        },
        completedMinimalAction
      )

      const result = await fireManagedClusterActionCreate(clusterName, minimalTemplate)

      expect(result).toEqual({
        complete: 'Completed',
        actionDone: 'ActionDone',
        message: 'ConfigMap created',
        result: minimalTemplate,
      })
      await waitForNocks([createNock, pollNock, deleteNock])
    })
  })

  describe('error scenarios', () => {
    it('should handle action creation failure', async () => {
      const createNock = nockCreate(expectedCreateAction, expectedCreateAction, 500)

      const result = await fireManagedClusterActionCreate(clusterName, projectTemplate)

      // The function catches and returns the error
      expect(result).toBeDefined()
      expect(result).toHaveProperty('message')
      await waitForNocks([createNock])
    })

    it('should handle action failure during execution', async () => {
      const failedCreateAction: ManagedClusterAction = {
        ...expectedCreateAction,
        status: {
          conditions: [
            {
              lastTransitionTime: '2023-01-01T00:00:00Z' as any,
              message: 'Project already exists',
              reason: 'ActionFailed',
              status: 'False',
              type: 'Completed',
            },
          ],
        },
      }

      const createNock = nockCreate(expectedCreateAction, expectedCreateAction)
      const pollNock = nockGet(
        {
          apiVersion: ManagedClusterActionApiVersion,
          kind: ManagedClusterActionKind,
          metadata: { name: MOCKED_UUID, namespace: clusterName },
        },
        failedCreateAction
      )

      // Mock the delete operation that happens during cleanup
      const deleteNock = nockDelete({
        apiVersion: ManagedClusterActionApiVersion,
        kind: ManagedClusterActionKind,
        metadata: { name: MOCKED_UUID, namespace: clusterName },
      })

      const result = await fireManagedClusterActionCreate(clusterName, projectTemplate)

      expect(result).toEqual({ message: 'Project already exists' })

      await waitForNocks([createNock, pollNock, deleteNock])
    })
  })
})

describe('pollManagedClusterAction', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
  })

  it('should resolve when action is completed successfully', async () => {
    const pollNock = nockGet(
      {
        apiVersion: ManagedClusterActionApiVersion,
        kind: ManagedClusterActionKind,
        metadata: { name: MOCKED_UUID, namespace: clusterName },
      },
      completedManagedClusterAction
    )

    // Mock the delete operation that happens in cleanup
    const deleteNock = nockDelete({
      apiVersion: ManagedClusterActionApiVersion,
      kind: ManagedClusterActionKind,
      metadata: { name: MOCKED_UUID, namespace: clusterName },
    })

    const result = await pollManagedClusterAction(MOCKED_UUID, clusterName)

    expect(result).toEqual({
      complete: 'Completed',
      actionDone: 'ActionDone',
      message: 'Action completed successfully',
      result: { success: true },
    })
    await waitForNocks([pollNock, deleteNock])
  })

  it('should reject when action fails', async () => {
    const pollNock = nockGet(
      {
        apiVersion: ManagedClusterActionApiVersion,
        kind: ManagedClusterActionKind,
        metadata: { name: MOCKED_UUID, namespace: clusterName },
      },
      failedManagedClusterAction
    )

    // Mock the delete operation that happens in cleanup
    const deleteNock = nockDelete({
      apiVersion: ManagedClusterActionApiVersion,
      kind: ManagedClusterActionKind,
      metadata: { name: MOCKED_UUID, namespace: clusterName },
    })

    await expect(pollManagedClusterAction(MOCKED_UUID, clusterName)).rejects.toEqual({
      message: 'Action failed due to resource conflict',
    })

    await waitForNocks([pollNock, deleteNock])
  })

  it('should reject when no status is returned', async () => {
    const actionWithoutStatus = {
      ...expectedManagedClusterAction,
      status: undefined,
    }

    const pollNock = nockGet(
      {
        apiVersion: ManagedClusterActionApiVersion,
        kind: ManagedClusterActionKind,
        metadata: { name: MOCKED_UUID, namespace: clusterName },
      },
      actionWithoutStatus
    )

    // Mock the delete operation that happens in cleanup
    const deleteNock = nockDelete({
      apiVersion: ManagedClusterActionApiVersion,
      kind: ManagedClusterActionKind,
      metadata: { name: MOCKED_UUID, namespace: clusterName },
    })

    await expect(pollManagedClusterAction(MOCKED_UUID, clusterName)).rejects.toEqual({
      message: `Request for ManagedClusterAction: ${MOCKED_UUID} on cluster: ${clusterName} failed due to too many requests. Make sure the work manager pod in namespace open-cluster-management-agent-addon is healthy.`,
    })

    await waitForNocks([pollNock, deleteNock])
  })
})
