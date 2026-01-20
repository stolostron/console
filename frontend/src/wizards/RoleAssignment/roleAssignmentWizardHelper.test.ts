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
      selectedClusterSets: [{ name: 'cluster-set-1', metadata: { name: 'cluster-set-1' } }] as ManagedClusterSet[],
    })

    // Act
    const result = wizardDataToRoleAssignmentToSave(formData, allClusterNames)

    // Assert
    expect(result).toHaveLength(1)
    expect(result[0].clusterSetNames).toEqual(['cluster-set-1'])
  })
})
