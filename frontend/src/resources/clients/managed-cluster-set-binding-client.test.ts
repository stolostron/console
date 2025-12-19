/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import {
  ManagedClusterSetBinding,
  ManagedClusterSetBindingApiVersion,
  ManagedClusterSetBindingKind,
} from '../managed-cluster-set-binding'
import { MulticlusterRoleAssignmentNamespace } from '../multicluster-role-assignment'
import { createResource } from '../utils'
import {
  createForClusterSets,
  findManagedClusterSetBinding,
  useFindManagedClusterSetBinding,
} from './managed-cluster-set-binding-client'

jest.mock('../../shared-recoil', () => ({
  useRecoilValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

jest.mock('../utils', () => ({
  createResource: jest.fn(),
}))

const createResourceMock = createResource as jest.MockedFunction<typeof createResource>
const useSharedAtomsMock = useSharedAtoms as jest.Mock
const useRecoilValueMock = useRecoilValue as jest.Mock

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
          namespace: MulticlusterRoleAssignmentNamespace,
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
            namespace: MulticlusterRoleAssignmentNamespace,
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

  describe('findManagedClusterSetBinding', () => {
    const mockBindings: ManagedClusterSetBinding[] = [
      {
        apiVersion: ManagedClusterSetBindingApiVersion,
        kind: ManagedClusterSetBindingKind,
        metadata: { name: 'binding-1', namespace: 'namespace-a' },
        spec: { clusterSet: 'set-1' },
      },
      {
        apiVersion: ManagedClusterSetBindingApiVersion,
        kind: ManagedClusterSetBindingKind,
        metadata: { name: 'binding-2', namespace: 'namespace-b' },
        spec: { clusterSet: 'set-2' },
      },
      {
        apiVersion: ManagedClusterSetBindingApiVersion,
        kind: ManagedClusterSetBindingKind,
        metadata: { name: 'binding-3', namespace: 'namespace-a' },
        spec: { clusterSet: 'set-3' },
      },
    ]

    it('should return bindings matching both clusterSets and namespaces', () => {
      // Act
      const result = findManagedClusterSetBinding(mockBindings, {
        clusterSets: ['set-1'],
        namespaces: ['namespace-a'],
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].metadata.name).toBe('binding-1')
    })

    it('should return empty array when clusterSets do not match', () => {
      // Act
      const result = findManagedClusterSetBinding(mockBindings, {
        clusterSets: ['nonexistent-set'],
        namespaces: ['namespace-a'],
      })

      // Assert
      expect(result).toHaveLength(0)
    })

    it('should return empty array when namespaces do not match', () => {
      // Act
      const result = findManagedClusterSetBinding(mockBindings, {
        clusterSets: ['set-1'],
        namespaces: ['nonexistent-namespace'],
      })

      // Assert
      expect(result).toHaveLength(0)
    })

    it('should return empty array when clusterSets is empty', () => {
      // Act
      const result = findManagedClusterSetBinding(mockBindings, {
        clusterSets: [],
        namespaces: ['namespace-a'],
      })

      // Assert - empty clusterSets means no match
      expect(result).toHaveLength(0)
    })

    it('should return empty array when namespaces is empty', () => {
      // Act
      const result = findManagedClusterSetBinding(mockBindings, {
        clusterSets: ['set-1'],
        namespaces: [],
      })

      // Assert - empty namespaces means no match
      expect(result).toHaveLength(0)
    })

    it('should return multiple bindings when multiple match', () => {
      // Act
      const result = findManagedClusterSetBinding(mockBindings, {
        clusterSets: ['set-1', 'set-3'],
        namespaces: ['namespace-a'],
      })

      // Assert
      expect(result).toHaveLength(2)
      expect(result.map((b) => b.metadata.name)).toEqual(['binding-1', 'binding-3'])
    })

    it('should handle undefined bindings array', () => {
      // Act
      const result = findManagedClusterSetBinding(undefined as unknown as ManagedClusterSetBinding[], {
        clusterSets: ['set-1'],
        namespaces: ['namespace-a'],
      })

      // Assert
      expect(result).toBeUndefined()
    })
  })

  describe('useFindManagedClusterSetBinding', () => {
    const mockBindings: ManagedClusterSetBinding[] = [
      {
        apiVersion: ManagedClusterSetBindingApiVersion,
        kind: ManagedClusterSetBindingKind,
        metadata: { name: 'binding-1', namespace: MulticlusterRoleAssignmentNamespace },
        spec: { clusterSet: 'set-1' },
      },
      {
        apiVersion: ManagedClusterSetBindingApiVersion,
        kind: ManagedClusterSetBindingKind,
        metadata: { name: 'binding-2', namespace: 'other-namespace' },
        spec: { clusterSet: 'set-2' },
      },
    ]

    beforeEach(() => {
      useSharedAtomsMock.mockReturnValue({ managedClusterSetBindingsState: {} })
      useRecoilValueMock.mockReturnValue(mockBindings)
    })

    it('should return bindings from Recoil state matching the query', () => {
      // Act
      const { result } = renderHook(() =>
        useFindManagedClusterSetBinding({
          clusterSets: ['set-1'],
          namespaces: [MulticlusterRoleAssignmentNamespace],
        })
      )

      // Assert
      expect(result.current).toHaveLength(1)
      expect(result.current[0].metadata.name).toBe('binding-1')
    })

    it('should return empty array when no matches in Recoil state', () => {
      // Act
      const { result } = renderHook(() =>
        useFindManagedClusterSetBinding({
          clusterSets: ['nonexistent'],
          namespaces: [MulticlusterRoleAssignmentNamespace],
        })
      )

      // Assert
      expect(result.current).toHaveLength(0)
    })

    it('should call useSharedAtoms and useRecoilValue', () => {
      // Act
      renderHook(() =>
        useFindManagedClusterSetBinding({
          clusterSets: ['set-1'],
          namespaces: [MulticlusterRoleAssignmentNamespace],
        })
      )

      // Assert
      expect(useSharedAtomsMock).toHaveBeenCalled()
      expect(useRecoilValueMock).toHaveBeenCalled()
    })
  })
})
