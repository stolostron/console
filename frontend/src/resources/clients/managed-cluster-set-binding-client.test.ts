/* Copyright Contributors to the Open Cluster Management project */
import { ManagedClusterSetBindingApiVersion, ManagedClusterSetBindingKind } from '../managed-cluster-set-binding'
import { createResource } from '../utils'
import { createForClusterSets } from './managed-cluster-set-binding-client'

jest.mock('../utils', () => ({
  createResource: jest.fn(),
}))

const createResourceMock = createResource as jest.MockedFunction<typeof createResource>

describe('managed-cluster-set-binding-client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createForClusterSets', () => {
    it('should create a ManagedClusterSetBinding with the provided clusterSet name', () => {
      // Arrange
      const clusterSet = 'my-cluster-set'
      const mockResult = {
        promise: Promise.resolve({} as any),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      createForClusterSets(clusterSet)

      // Assert
      expect(createResourceMock).toHaveBeenCalledTimes(1)
      expect(createResourceMock).toHaveBeenCalledWith({
        apiVersion: ManagedClusterSetBindingApiVersion,
        kind: ManagedClusterSetBindingKind,
        metadata: {
          name: clusterSet,
          namespace: 'open-cluster-management-global-set',
        },
        spec: {
          clusterSet,
        },
      })
    })

    it('should use default namespace when not provided', () => {
      // Arrange
      const clusterSet = 'test-cluster-set'
      const mockResult = {
        promise: Promise.resolve({} as any),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      createForClusterSets(clusterSet)

      // Assert
      expect(createResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            namespace: 'open-cluster-management-global-set',
          }),
        })
      )
    })

    it('should use custom namespace when provided', () => {
      // Arrange
      const clusterSet = 'custom-cluster-set'
      const namespace = 'custom-namespace'
      const mockResult = {
        promise: Promise.resolve({} as any),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      createForClusterSets(clusterSet, namespace)

      // Assert
      expect(createResourceMock).toHaveBeenCalledWith({
        apiVersion: ManagedClusterSetBindingApiVersion,
        kind: ManagedClusterSetBindingKind,
        metadata: {
          name: clusterSet,
          namespace,
        },
        spec: {
          clusterSet,
        },
      })
    })

    it('should set the binding name to match the clusterSet', () => {
      // Arrange
      const clusterSet = 'binding-name-test'
      const mockResult = {
        promise: Promise.resolve({} as any),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      createForClusterSets(clusterSet)

      // Assert
      expect(createResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            name: clusterSet,
          }),
        })
      )
    })

    it('should return the IRequestResult from createResource', () => {
      // Arrange
      const clusterSet = 'result-test'
      const expectedResult = {
        promise: Promise.resolve({} as any),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(expectedResult)

      // Act
      const result = createForClusterSets(clusterSet)

      // Assert
      expect(result).toBe(expectedResult)
      expect(result.promise).toBe(expectedResult.promise)
      expect(result.abort).toBe(expectedResult.abort)
    })
  })
})
