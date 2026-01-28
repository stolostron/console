/* Copyright Contributors to the Open Cluster Management project */
import { ManagedClusterSet, UserKind } from '../../resources'
import { wizardDataToRoleAssignmentToSave } from './roleAssignmentWizardHelper'
import { RoleAssignmentWizardFormData } from './types'

describe('wizardDataToRoleAssignmentToSave', () => {
  const allClusterNames = ['cluster-1', 'cluster-2', 'cluster-3']

  const createFormData = (overrides: Partial<RoleAssignmentWizardFormData> = {}): RoleAssignmentWizardFormData => ({
    subject: {
      kind: UserKind,
      user: ['test-user'],
    },
    roles: ['admin'],
    scope: {
      kind: 'all',
      clusterNames: [],
    },
    scopeType: 'Global access',
    selectedClusters: [],
    selectedClusterSets: [],
    ...overrides,
  })

  it('should handle selected clusters and return undefined for clusterSetNames', () => {
    // Arrange
    const formData = createFormData({
      scope: { kind: 'specific', clusterNames: ['cluster-1'] },
      scopeType: 'Select clusters',
      selectedClusters: [{ name: 'cluster-1', metadata: { name: 'cluster-1' } }],
    })

    // Act
    const result = wizardDataToRoleAssignmentToSave(formData, allClusterNames)

    // Assert
    expect(result).toHaveLength(1)
    expect(result[0].clusterNames).toEqual(['cluster-1'])
    expect(result[0].clusterSetNames).toBeUndefined()
  })

  it('should return clusterSetNames when no clusters are selected', () => {
    // Arrange
    const formData = createFormData({
      scope: { kind: 'specific', clusterNames: [] },
      scopeType: 'Select cluster sets',
      selectedClusterSets: [
        { name: 'cluster-set-1', metadata: { name: 'cluster-set-1' } },
      ] as any as ManagedClusterSet[],
    })

    // Act
    const result = wizardDataToRoleAssignmentToSave(formData, allClusterNames)

    // Assert
    expect(result).toHaveLength(1)
    expect(result[0].clusterSetNames).toEqual(['cluster-set-1'])
  })

  describe('targetNamespaces handling', () => {
    it('should set targetNamespaces to empty array when scope.namespaces is undefined', () => {
      // Arrange - Regression case: namespaces can be undefined (e.g., when scope.kind changes to 'all')
      const formData = createFormData({
        scope: { kind: 'all', clusterNames: [], namespaces: undefined },
        scopeType: 'Global access',
      })

      // Act
      const result = wizardDataToRoleAssignmentToSave(formData, allClusterNames)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].targetNamespaces).toEqual([])
      expect(result[0].targetNamespaces).toBeInstanceOf(Array)
    })

    it('should set targetNamespaces to empty array when scope.namespaces is not provided', () => {
      // Arrange - namespaces property is missing from scope
      const formData = createFormData({
        scope: { kind: 'all', clusterNames: [] },
        scopeType: 'Global access',
      })

      // Act
      const result = wizardDataToRoleAssignmentToSave(formData, allClusterNames)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].targetNamespaces).toEqual([])
      expect(result[0].targetNamespaces).toBeInstanceOf(Array)
    })

    it('should preserve targetNamespaces when scope.namespaces is provided', () => {
      // Arrange
      const formData = createFormData({
        scope: { kind: 'specific', clusterNames: ['cluster-1'], namespaces: ['namespace-1', 'namespace-2'] },
        scopeType: 'Select clusters',
        selectedClusters: [{ name: 'cluster-1', metadata: { name: 'cluster-1' } }],
      })

      // Act
      const result = wizardDataToRoleAssignmentToSave(formData, allClusterNames)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].targetNamespaces).toEqual(['namespace-1', 'namespace-2'])
    })

    it('should set targetNamespaces to empty array when scope.namespaces is empty array', () => {
      // Arrange
      const formData = createFormData({
        scope: { kind: 'specific', clusterNames: ['cluster-1'], namespaces: [] },
        scopeType: 'Select clusters',
        selectedClusters: [{ name: 'cluster-1', metadata: { name: 'cluster-1' } }],
      })

      // Act
      const result = wizardDataToRoleAssignmentToSave(formData, allClusterNames)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].targetNamespaces).toEqual([])
      expect(result[0].targetNamespaces).toBeInstanceOf(Array)
    })

    it('should set targetNamespaces to empty array when scope.namespaces is null', () => {
      // Arrange - defensive test for null values
      const formData = createFormData({
        scope: { kind: 'all', clusterNames: [], namespaces: null as any },
        scopeType: 'Global access',
      })

      // Act
      const result = wizardDataToRoleAssignmentToSave(formData, allClusterNames)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].targetNamespaces).toEqual([])
      expect(result[0].targetNamespaces).toBeInstanceOf(Array)
    })

    it('should ensure targetNamespaces is always an array for all roles and subjects', () => {
      // Arrange - multiple roles and subjects with undefined namespaces
      const formData = createFormData({
        subject: {
          kind: UserKind,
          user: ['user-1', 'user-2'],
        },
        roles: ['admin', 'viewer'],
        scope: { kind: 'all', clusterNames: [], namespaces: undefined },
        scopeType: 'Global access',
      })

      // Act
      const result = wizardDataToRoleAssignmentToSave(formData, allClusterNames)

      // Assert - should create 4 entries (2 roles × 2 users)
      expect(result).toHaveLength(4)
      result.forEach((entry) => {
        expect(entry.targetNamespaces).toEqual([])
        expect(entry.targetNamespaces).toBeInstanceOf(Array)
      })
    })
  })
})
