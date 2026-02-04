/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react-hooks'
import { GlobalPlacementName, GroupKind, UserKind } from '../../resources'
import { RoleAssignmentWizardFormData } from './types'
import { usePreselectedData } from './usePreselectedData'

// Mock managedClusterSets for Recoil
const mockManagedClusterSets = [
  {
    metadata: { name: 'cluster-set-1' },
    spec: {},
  },
  {
    metadata: { name: 'cluster-set-2' },
    spec: {},
  },
]

// Mock the useRoleAssignmentData hook
jest.mock('../../routes/UserManagement/RoleAssignments/hook/RoleAssignmentDataHook', () => ({
  useRoleAssignmentData: () => ({
    roleAssignmentData: {
      clusterSets: [
        {
          name: 'cluster-set-1',
          clusters: [
            { name: 'cluster-1', namespaces: ['ns1', 'ns2'] },
            { name: 'cluster-2', namespaces: ['ns3'] },
          ],
        },
        {
          name: 'cluster-set-2',
          clusters: [{ name: 'cluster-3', namespaces: [] }],
        },
      ],
    },
    isLoading: false,
  }),
}))

// Mock Recoil
jest.mock('../../shared-recoil', () => ({
  useSharedAtoms: () => ({
    managedClusterSetsState: 'managedClusterSetsState',
  }),
  useRecoilValue: () => mockManagedClusterSets,
}))

describe('usePreselectedData', () => {
  const createInitialFormData = (): RoleAssignmentWizardFormData => ({
    subject: { kind: UserKind },
    scope: { kind: 'all', clusterNames: [] },
    roles: [],
    scopeType: 'Global access',
  })

  const createMockSetFormData = () => {
    const calls: any[] = []
    const mockFn = jest.fn((updater) => {
      if (typeof updater === 'function') {
        const prevState = createInitialFormData()
        const newState = updater(prevState)
        calls.push(newState)
      } else {
        calls.push(updater)
      }
    })
    return { mockFn, calls }
  }

  it('does nothing when isOpen is false', () => {
    const { mockFn: setFormData } = createMockSetFormData()
    const setSelectedClusterSets = jest.fn()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: false,
        preselected: { subject: { kind: UserKind, value: 'testuser' } },
        setFormData,
        setSelectedClusterSets,
        setSelectedClusters,
      })
    )

    expect(setFormData).not.toHaveBeenCalled()
  })

  it('updates form data with preselected user subject', () => {
    const { mockFn: setFormData, calls } = createMockSetFormData()
    const setSelectedClusterSets = jest.fn()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: { subject: { kind: UserKind, value: 'testuser' } },
        setFormData,
        setSelectedClusterSets,
        setSelectedClusters,
      })
    )

    expect(setFormData).toHaveBeenCalled()
    expect(calls[0]).toEqual(
      expect.objectContaining({
        subject: {
          kind: UserKind,
          user: ['testuser'],
          group: undefined,
        },
      })
    )
  })

  it('updates form data with preselected group subject', () => {
    const { mockFn: setFormData, calls } = createMockSetFormData()
    const setSelectedClusterSets = jest.fn()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: { subject: { kind: GroupKind, value: 'testgroup' } },
        setFormData,
        setSelectedClusterSets,
        setSelectedClusters,
      })
    )

    expect(setFormData).toHaveBeenCalled()
    expect(calls[0]).toEqual(
      expect.objectContaining({
        subject: {
          kind: GroupKind,
          user: undefined,
          group: ['testgroup'],
        },
      })
    )
  })

  it('updates form data with preselected roles', () => {
    const { mockFn: setFormData, calls } = createMockSetFormData()
    const setSelectedClusterSets = jest.fn()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: { roles: ['admin-role', 'viewer-role'] },
        setFormData,
        setSelectedClusterSets,
        setSelectedClusters,
      })
    )

    expect(setFormData).toHaveBeenCalled()
    expect(calls[0]).toEqual(
      expect.objectContaining({
        roles: ['admin-role', 'viewer-role'],
      })
    )
  })

  it('updates form data with preselected cluster names', () => {
    const { mockFn: setFormData, calls } = createMockSetFormData()
    const setSelectedClusterSets = jest.fn()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: { clusterNames: ['cluster-1', 'cluster-2'] },
        setFormData,
        setSelectedClusterSets,
        setSelectedClusters,
      })
    )

    expect(setFormData).toHaveBeenCalled()
    expect(calls[0]).toEqual(
      expect.objectContaining({
        scopeType: 'Select clusters',
        scope: {
          kind: 'specific',
          clusterNames: ['cluster-1', 'cluster-2'],
        },
        selectedClusters: [
          { name: 'cluster-1', namespaces: ['ns1', 'ns2'] },
          { name: 'cluster-2', namespaces: ['ns3'] },
        ],
      })
    )
  })

  it('updates form data with preselected cluster names and namespaces', () => {
    const { mockFn: setFormData, calls } = createMockSetFormData()
    const setSelectedClusterSets = jest.fn()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: {
          clusterNames: ['cluster-1'],
          namespaces: ['namespace-1', 'namespace-2'],
        },
        setFormData,
        setSelectedClusterSets,
        setSelectedClusters,
      })
    )

    expect(setFormData).toHaveBeenCalled()
    expect(calls[0]).toEqual(
      expect.objectContaining({
        scopeType: 'Select clusters',
        scope: {
          kind: 'specific',
          namespaces: ['namespace-1', 'namespace-2'],
        },
        selectedClusters: [{ name: 'cluster-1', namespaces: ['ns1', 'ns2'] }],
        clustersAccessLevel: 'Project role assignment',
      })
    )
  })

  it('calls setSelectedClusters with cluster objects when cluster names are preselected', () => {
    const { mockFn: setFormData } = createMockSetFormData()
    const setSelectedClusterSets = jest.fn()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: { clusterNames: ['cluster-1'] },
        setFormData,
        setSelectedClusterSets,
        setSelectedClusters,
      })
    )

    expect(setSelectedClusters).toHaveBeenCalledWith([{ name: 'cluster-1', namespaces: ['ns1', 'ns2'] }])
  })

  it('handles multiple preselected values at once', () => {
    const { mockFn: setFormData, calls } = createMockSetFormData()
    const setSelectedClusterSets = jest.fn()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: {
          subject: { kind: UserKind, value: 'testuser' },
          roles: ['admin-role'],
          clusterNames: ['cluster-1'],
        },
        setFormData,
        setSelectedClusterSets,
        setSelectedClusters,
      })
    )

    expect(setFormData).toHaveBeenCalled()
    expect(calls[0]).toEqual(
      expect.objectContaining({
        subject: {
          kind: UserKind,
          user: ['testuser'],
          group: undefined,
        },
        roles: ['admin-role'],
        scopeType: 'Select clusters',
        scope: {
          kind: 'specific',
          clusterNames: ['cluster-1'],
        },
        selectedClusters: [{ name: 'cluster-1', namespaces: ['ns1', 'ns2'] }],
      })
    )
  })

  it('handles multiple preselected values with namespaces', () => {
    const { mockFn: setFormData, calls } = createMockSetFormData()
    const setSelectedClusterSets = jest.fn()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: {
          subject: { kind: UserKind, value: 'testuser' },
          roles: ['admin-role'],
          clusterNames: ['cluster-1'],
          namespaces: ['namespace-1'],
        },
        setFormData,
        setSelectedClusterSets,
        setSelectedClusters,
      })
    )

    expect(setFormData).toHaveBeenCalled()
    expect(calls[0]).toEqual(
      expect.objectContaining({
        subject: {
          kind: UserKind,
          user: ['testuser'],
          group: undefined,
        },
        roles: ['admin-role'],
        scopeType: 'Select clusters',
        scope: {
          kind: 'specific',
          namespaces: ['namespace-1'],
        },
        selectedClusters: [{ name: 'cluster-1', namespaces: ['ns1', 'ns2'] }],
        clustersAccessLevel: 'Project role assignment',
      })
    )
  })

  it('does not update form data when preselected is undefined', () => {
    const { mockFn: setFormData, calls } = createMockSetFormData()
    const setSelectedClusterSets = jest.fn()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: undefined,
        setFormData,
        setSelectedClusterSets,
        setSelectedClusters,
      })
    )

    expect(setFormData).toHaveBeenCalled()
    // The form data should remain largely unchanged (just merged with empty updates)
    expect(calls[0]).toEqual(createInitialFormData())
  })

  it('does not set user when subject kind is User but value is empty', () => {
    const { mockFn: setFormData, calls } = createMockSetFormData()
    const setSelectedClusterSets = jest.fn()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: { subject: { kind: UserKind, value: '' } },
        setFormData,
        setSelectedClusterSets,
        setSelectedClusters,
      })
    )

    expect(setFormData).toHaveBeenCalled()
    expect(calls[0].subject).toEqual({
      kind: UserKind,
      user: undefined,
      group: undefined,
    })
  })

  it('does not set group when subject kind is Group but value is empty', () => {
    const { mockFn: setFormData, calls } = createMockSetFormData()
    const setSelectedClusterSets = jest.fn()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: { subject: { kind: GroupKind, value: '' } },
        setFormData,
        setSelectedClusterSets,
        setSelectedClusters,
      })
    )

    expect(setFormData).toHaveBeenCalled()
    expect(calls[0].subject).toEqual({
      kind: GroupKind,
      user: undefined,
      group: undefined,
    })
  })

  it('does not update roles when preselected roles is empty array', () => {
    const { mockFn: setFormData, calls } = createMockSetFormData()
    const setSelectedClusterSets = jest.fn()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: { roles: [] },
        setFormData,
        setSelectedClusterSets,
        setSelectedClusters,
      })
    )

    expect(setFormData).toHaveBeenCalled()
    expect(calls[0].roles).toEqual([])
  })

  it('does not update clusters when preselected clusterNames is empty array', () => {
    const { mockFn: setFormData, calls } = createMockSetFormData()
    const setSelectedClusterSets = jest.fn()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: { clusterNames: [] },
        setFormData,
        setSelectedClusterSets,
        setSelectedClusters,
      })
    )

    expect(setFormData).toHaveBeenCalled()
    expect(calls[0].scopeType).toBe('Global access')
    expect(setSelectedClusters).not.toHaveBeenCalled()
  })

  it('updates form data with preselected cluster set names', () => {
    const { mockFn: setFormData, calls } = createMockSetFormData()
    const setSelectedClusterSets = jest.fn()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: { clusterSetNames: ['cluster-set-1', 'cluster-set-2'] },
        setFormData,
        setSelectedClusterSets,
        setSelectedClusters,
      })
    )

    expect(setFormData).toHaveBeenCalled()
    expect(calls[0]).toEqual(
      expect.objectContaining({
        scopeType: 'Select cluster sets',
        scope: {
          kind: 'all',
        },
        selectedClusterSets: ['cluster-set-1', 'cluster-set-2'],
      })
    )
  })

  it('calls setSelectedClusterSets with cluster set objects when cluster set names are preselected', () => {
    const { mockFn: setFormData } = createMockSetFormData()
    const setSelectedClusterSets = jest.fn()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: { clusterSetNames: ['cluster-set-1'] },
        setFormData,
        setSelectedClusterSets,
        setSelectedClusters,
      })
    )

    expect(setSelectedClusterSets).toHaveBeenCalledWith([{ metadata: { name: 'cluster-set-1' }, spec: {} }])
  })

  it('filters out non-existent cluster set names', () => {
    const { mockFn: setFormData, calls } = createMockSetFormData()
    const setSelectedClusterSets = jest.fn()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: { clusterSetNames: ['cluster-set-1', 'non-existent-cluster-set'] },
        setFormData,
        setSelectedClusterSets,
        setSelectedClusters,
      })
    )

    expect(setFormData).toHaveBeenCalled()
    expect(calls[0].selectedClusterSets).toEqual(['cluster-set-1'])
    expect(setSelectedClusterSets).toHaveBeenCalledWith([{ metadata: { name: 'cluster-set-1' }, spec: {} }])
  })

  it('does not update cluster sets when preselected clusterSetNames is empty array', () => {
    const { mockFn: setFormData, calls } = createMockSetFormData()
    const setSelectedClusterSets = jest.fn()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: { clusterSetNames: [] },
        setFormData,
        setSelectedClusterSets,
        setSelectedClusters,
      })
    )

    expect(setFormData).toHaveBeenCalled()
    expect(calls[0].scopeType).toBe('Global access')
    expect(setSelectedClusterSets).not.toHaveBeenCalled()
  })

  it('handles preselected cluster sets with multiple values at once', () => {
    const { mockFn: setFormData, calls } = createMockSetFormData()
    const setSelectedClusterSets = jest.fn()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: {
          subject: { kind: UserKind, value: 'testuser' },
          roles: ['admin-role'],
          clusterSetNames: ['cluster-set-1', 'cluster-set-2'],
        },
        setFormData,
        setSelectedClusterSets,
        setSelectedClusters,
      })
    )

    expect(setFormData).toHaveBeenCalled()
    expect(calls[0]).toEqual(
      expect.objectContaining({
        subject: {
          kind: UserKind,
          user: ['testuser'],
          group: undefined,
        },
        roles: ['admin-role'],
        scopeType: 'Select cluster sets',
        scope: {
          kind: 'all',
        },
        selectedClusterSets: ['cluster-set-1', 'cluster-set-2'],
      })
    )
    expect(setSelectedClusterSets).toHaveBeenCalledWith(mockManagedClusterSets)
  })

  describe('precedence logic', () => {
    it('sets Global access when clusterSetNames includes global, ignoring cluster names', () => {
      const { mockFn: setFormData, calls } = createMockSetFormData()
      const setSelectedClusterSets = jest.fn()
      const setSelectedClusters = jest.fn()

      renderHook(() =>
        usePreselectedData({
          isOpen: true,
          preselected: {
            clusterSetNames: [GlobalPlacementName],
            clusterNames: ['cluster-1', 'cluster-2'],
          },
          setFormData,
          setSelectedClusterSets,
          setSelectedClusters,
        })
      )

      expect(setFormData).toHaveBeenCalled()
      expect(calls[0]).toEqual(
        expect.objectContaining({
          scopeType: 'Global access',
          scope: {
            kind: 'all',
          },
        })
      )
      // Cluster names should be ignored
      expect(calls[0].scope.clusterNames).toBeUndefined()
      expect(setSelectedClusters).not.toHaveBeenCalled()
    })

    it('sets Global access when clusterSetNames includes global, ignoring cluster set names', () => {
      const { mockFn: setFormData, calls } = createMockSetFormData()
      const setSelectedClusterSets = jest.fn()
      const setSelectedClusters = jest.fn()

      renderHook(() =>
        usePreselectedData({
          isOpen: true,
          preselected: {
            clusterSetNames: [GlobalPlacementName, 'cluster-set-1'],
          },
          setFormData,
          setSelectedClusterSets,
          setSelectedClusters,
        })
      )

      expect(setFormData).toHaveBeenCalled()
      expect(calls[0]).toEqual(
        expect.objectContaining({
          scopeType: 'Global access',
          scope: {
            kind: 'all',
          },
        })
      )
      // Other cluster set names should be ignored
      expect(calls[0].selectedClusterSets).toBeUndefined()
      expect(setSelectedClusterSets).not.toHaveBeenCalled()
    })

    it('applies namespaces when Global access is set (namespaces always applied)', () => {
      const { mockFn: setFormData, calls } = createMockSetFormData()
      const setSelectedClusterSets = jest.fn()
      const setSelectedClusters = jest.fn()

      renderHook(() =>
        usePreselectedData({
          isOpen: true,
          preselected: {
            clusterSetNames: [GlobalPlacementName],
            namespaces: ['namespace-1', 'namespace-2'],
          },
          setFormData,
          setSelectedClusterSets,
          setSelectedClusters,
        })
      )

      expect(setFormData).toHaveBeenCalled()
      expect(calls[0]).toEqual(
        expect.objectContaining({
          scopeType: 'Global access',
          scope: {
            kind: 'all',
            namespaces: ['namespace-1', 'namespace-2'],
          },
        })
      )
      expect(calls[0].clustersetsAccessLevel).toBeUndefined()
    })

    it('sets cluster sets when clusterSetNames exist, ignoring cluster names', () => {
      const { mockFn: setFormData, calls } = createMockSetFormData()
      const setSelectedClusterSets = jest.fn()
      const setSelectedClusters = jest.fn()

      renderHook(() =>
        usePreselectedData({
          isOpen: true,
          preselected: {
            clusterSetNames: ['cluster-set-1'],
            clusterNames: ['cluster-1', 'cluster-2'],
          },
          setFormData,
          setSelectedClusterSets,
          setSelectedClusters,
        })
      )

      expect(setFormData).toHaveBeenCalled()
      expect(calls[0]).toEqual(
        expect.objectContaining({
          scopeType: 'Select cluster sets',
          scope: {
            kind: 'all',
          },
          selectedClusterSets: ['cluster-set-1'],
        })
      )
      // Cluster names should be ignored
      expect(calls[0].scope.clusterNames).toBeUndefined()
      expect(setSelectedClusters).not.toHaveBeenCalled()
    })

    it('applies namespaces when cluster sets are selected (not global access)', () => {
      const { mockFn: setFormData, calls } = createMockSetFormData()
      const setSelectedClusterSets = jest.fn()
      const setSelectedClusters = jest.fn()

      renderHook(() =>
        usePreselectedData({
          isOpen: true,
          preselected: {
            clusterSetNames: ['cluster-set-1'],
            namespaces: ['namespace-1', 'namespace-2'],
          },
          setFormData,
          setSelectedClusterSets,
          setSelectedClusters,
        })
      )

      expect(setFormData).toHaveBeenCalled()
      expect(calls[0]).toEqual(
        expect.objectContaining({
          scopeType: 'Select cluster sets',
          scope: {
            kind: 'all',
            namespaces: ['namespace-1', 'namespace-2'],
          },
          selectedClusterSets: ['cluster-set-1'],
          clustersetsAccessLevel: 'Project role assignment',
        })
      )
    })

    it('applies namespaces when clusters are selected (not global access)', () => {
      const { mockFn: setFormData, calls } = createMockSetFormData()
      const setSelectedClusterSets = jest.fn()
      const setSelectedClusters = jest.fn()

      renderHook(() =>
        usePreselectedData({
          isOpen: true,
          preselected: {
            clusterNames: ['cluster-1'],
            namespaces: ['namespace-1'],
          },
          setFormData,
          setSelectedClusterSets,
          setSelectedClusters,
        })
      )

      expect(setFormData).toHaveBeenCalled()
      expect(calls[0]).toEqual(
        expect.objectContaining({
          scopeType: 'Select clusters',
          scope: {
            kind: 'specific',
            namespaces: ['namespace-1'],
          },
          selectedClusters: [{ name: 'cluster-1', namespaces: ['ns1', 'ns2'] }],
          clustersAccessLevel: 'Project role assignment',
        })
      )
    })

    it('applies namespaces even when only namespaces are preselected (no clusters or cluster sets)', () => {
      const { mockFn: setFormData, calls } = createMockSetFormData()
      const setSelectedClusterSets = jest.fn()
      const setSelectedClusters = jest.fn()

      renderHook(() =>
        usePreselectedData({
          isOpen: true,
          preselected: {
            namespaces: ['namespace-1', 'namespace-2'],
          },
          setFormData,
          setSelectedClusterSets,
          setSelectedClusters,
        })
      )

      expect(setFormData).toHaveBeenCalled()
      expect(calls[0]).toEqual(
        expect.objectContaining({
          scope: {
            kind: 'specific',
            namespaces: ['namespace-1', 'namespace-2'],
          },
        })
      )
    })

    it('handles all precedence conditions: global access takes precedence over everything, but namespaces are always applied', () => {
      const { mockFn: setFormData, calls } = createMockSetFormData()
      const setSelectedClusterSets = jest.fn()
      const setSelectedClusters = jest.fn()

      renderHook(() =>
        usePreselectedData({
          isOpen: true,
          preselected: {
            clusterSetNames: [GlobalPlacementName, 'cluster-set-1'],
            clusterNames: ['cluster-1'],
            namespaces: ['namespace-1'],
          },
          setFormData,
          setSelectedClusterSets,
          setSelectedClusters,
        })
      )

      expect(setFormData).toHaveBeenCalled()
      expect(calls[0]).toEqual(
        expect.objectContaining({
          scopeType: 'Global access',
          scope: {
            kind: 'all',
            namespaces: ['namespace-1'],
          },
        })
      )
      // Cluster names and cluster sets should be ignored
      expect(calls[0].scope.clusterNames).toBeUndefined()
      expect(calls[0].selectedClusterSets).toBeUndefined()
      expect(setSelectedClusterSets).not.toHaveBeenCalled()
      expect(setSelectedClusters).not.toHaveBeenCalled()
    })

    it('handles precedence: cluster sets take precedence over clusters', () => {
      const { mockFn: setFormData, calls } = createMockSetFormData()
      const setSelectedClusterSets = jest.fn()
      const setSelectedClusters = jest.fn()

      renderHook(() =>
        usePreselectedData({
          isOpen: true,
          preselected: {
            clusterSetNames: ['cluster-set-1'],
            clusterNames: ['cluster-1'],
            namespaces: ['namespace-1'],
          },
          setFormData,
          setSelectedClusterSets,
          setSelectedClusters,
        })
      )

      expect(setFormData).toHaveBeenCalled()
      expect(calls[0]).toEqual(
        expect.objectContaining({
          scopeType: 'Select cluster sets',
          scope: {
            kind: 'all',
            namespaces: ['namespace-1'],
          },
          selectedClusterSets: ['cluster-set-1'],
        })
      )
      // Cluster names should be ignored
      expect(calls[0].scope.clusterNames).toBeUndefined()
      expect(setSelectedClusters).not.toHaveBeenCalled()
    })
  })
})
