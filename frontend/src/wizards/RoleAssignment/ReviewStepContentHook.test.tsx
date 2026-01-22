/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react-hooks'
import { useReviewStepContent } from './ReviewStepContentHook'

// Mock the translation hook
jest.mock('../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('useReviewStepContent', () => {
  describe('namespacesDisplay', () => {
    it('returns current namespaces when not editing', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: ['ns1', 'ns2'] },
          newData: { clusterNames: [], namespaces: ['ns3', 'ns4'] },
          isEditing: false,
        })
      )

      expect(result.current.namespacesDisplay).toBe('ns3, ns4')
    })

    it('returns "Full access" when no namespaces and not editing', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [] },
          newData: { clusterNames: [] },
          isEditing: false,
        })
      )

      expect(result.current.namespacesDisplay).toBe('Full access')
    })

    it('returns current namespaces when editing but unchanged', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: ['ns1', 'ns2'] },
          newData: { clusterNames: [], namespaces: ['ns1', 'ns2'] },
          isEditing: true,
        })
      )

      expect(result.current.namespacesDisplay).toBe('ns1, ns2')
    })

    it('returns diff JSX when editing and namespaces changed from specific to full access', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: ['ns1', 'ns2'] },
          newData: { clusterNames: [] },
          isEditing: true,
        })
      )

      const display = result.current.namespacesDisplay
      expect(display).toHaveProperty('type', 'div')
      expect(display).toHaveProperty('props.children')
    })

    it('returns diff JSX when editing and namespaces changed from full access to specific', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [] },
          newData: { clusterNames: [], namespaces: ['ns1', 'ns2'] },
          isEditing: true,
        })
      )

      const display = result.current.namespacesDisplay
      expect(display).toHaveProperty('type', 'div')
    })

    it('returns diff JSX when editing and namespaces changed between different values', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: ['ns1', 'ns2'] },
          newData: { clusterNames: [], namespaces: ['ns3', 'ns4'] },
          isEditing: true,
        })
      )

      const display = result.current.namespacesDisplay
      expect(display).toHaveProperty('type', 'div')
    })

    it('handles empty namespaces array in oldData', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [] },
          newData: { clusterNames: [], namespaces: ['ns1'] },
          isEditing: true,
        })
      )

      const display = result.current.namespacesDisplay
      expect(display).toHaveProperty('type', 'div')
    })

    it('handles empty namespaces array in newData', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: ['ns1'] },
          newData: { clusterNames: [], namespaces: [] },
          isEditing: true,
        })
      )

      const display = result.current.namespacesDisplay
      expect(display).toHaveProperty('type', 'div')
    })

    it('handles undefined namespaces in oldData', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [] },
          newData: { clusterNames: [], namespaces: ['ns1'] },
          isEditing: true,
        })
      )

      const display = result.current.namespacesDisplay
      expect(display).toHaveProperty('type', 'div')
    })

    it('handles undefined namespaces in newData', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: ['ns1'] },
          newData: { clusterNames: [] },
          isEditing: true,
        })
      )

      const display = result.current.namespacesDisplay
      expect(display).toHaveProperty('type', 'div')
    })

    it('sorts namespaces before comparing', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: ['ns2', 'ns1'] },
          newData: { clusterNames: [], namespaces: ['ns1', 'ns2'] },
          isEditing: true,
        })
      )

      // Should be treated as unchanged since sorted arrays are equal
      expect(result.current.namespacesDisplay).toBe('ns1, ns2')
    })
  })

  describe('clusterNames', () => {
    it('returns cluster names from selectedClusters with metadata.name', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [] },
          newData: {
            clusterNames: [{ metadata: { name: 'cluster-1' } }, { metadata: { name: 'cluster-2' } }],
          },
          isEditing: false,
        })
      )

      expect(result.current.clusterNames).toBe('cluster-1, cluster-2')
    })

    it('returns cluster names from selectedClusters with name property', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [] },
          newData: {
            clusterNames: [{ name: 'cluster-1' }, { name: 'cluster-2' }],
          },
          isEditing: false,
        })
      )

      expect(result.current.clusterNames).toBe('cluster-1, cluster-2')
    })

    it('returns cluster names from selectedClusters as strings', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [] },
          newData: {
            clusterNames: ['cluster-1', 'cluster-2'],
          },
          isEditing: false,
        })
      )

      expect(result.current.clusterNames).toBe('cluster-1, cluster-2')
    })

    it('returns cluster names from oldData.clusterNames when selectedClusters is empty', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: ['old-cluster-1', 'old-cluster-2'] },
          newData: { clusterNames: [] },
          isEditing: false,
        })
      )

      expect(result.current.clusterNames).toBe('old-cluster-1, old-cluster-2')
    })

    it('returns null when both selectedClusters and clusterNames are empty', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [] },
          newData: { clusterNames: [] },
          isEditing: false,
        })
      )

      expect(result.current.clusterNames).toBeNull()
    })

    it('returns null when both selectedClusters and clusterNames are undefined', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: undefined },
          newData: { clusterNames: undefined },
          isEditing: false,
        })
      )

      expect(result.current.clusterNames).toBeNull()
    })

    it('prioritizes selectedClusters over oldData.clusterNames', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: ['old-cluster'] },
          newData: {
            clusterNames: [{ metadata: { name: 'new-cluster' } }],
          },
          isEditing: false,
        })
      )

      expect(result.current.clusterNames).toBe('new-cluster')
    })

    it('handles mixed cluster formats', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [] },
          newData: {
            clusterNames: [{ metadata: { name: 'cluster-1' } }, { name: 'cluster-2' }, 'cluster-3'],
          },
          isEditing: false,
        })
      )

      expect(result.current.clusterNames).toBe('cluster-1, cluster-2, cluster-3')
    })
  })

  describe('clustersDisplay', () => {
    it('returns current cluster names when not editing', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: ['old-cluster'] },
          newData: {
            clusterNames: [{ metadata: { name: 'new-cluster' } }],
          },
          isEditing: false,
        })
      )

      expect(result.current.clustersDisplay).toBe('new-cluster')
    })

    it('returns "None selected" when no clusters and not editing', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [] },
          newData: { clusterNames: [] },
          isEditing: false,
        })
      )

      expect(result.current.clustersDisplay).toBe('None selected')
    })

    it('returns current clusters when editing but unchanged', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: ['cluster-1'] },
          newData: {
            clusterNames: [{ metadata: { name: 'cluster-1' } }],
          },
          isEditing: true,
        })
      )

      expect(result.current.clustersDisplay).toBe('cluster-1')
    })

    it('returns diff JSX when editing and clusters changed', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: ['old-cluster'] },
          newData: {
            clusterNames: [{ metadata: { name: 'new-cluster' } }],
          },
          isEditing: true,
        })
      )

      const display = result.current.clustersDisplay
      expect(display).toHaveProperty('type', 'div')
    })

    it('uses oldData.clusterNames as fallback for current when currentClusterNames is null', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: ['fallback-cluster'] },
          newData: { clusterNames: [] },
          isEditing: false,
        })
      )

      expect(result.current.clustersDisplay).toBe('fallback-cluster')
    })

    it('returns "None selected" when both original and current are empty', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [] },
          newData: { clusterNames: [] },
          isEditing: true,
        })
      )

      expect(result.current.clustersDisplay).toBe('None selected')
    })

    it('handles change from "None selected" to clusters', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [] },
          newData: {
            clusterNames: [{ metadata: { name: 'new-cluster' } }],
          },
          isEditing: true,
        })
      )

      const display = result.current.clustersDisplay
      expect(display).toHaveProperty('type', 'div')
    })

    it('handles change from clusters to "None selected" when oldData.clusterNames is empty', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: ['old-cluster'] },
          newData: { clusterNames: [] },
          isEditing: true,
        })
      )

      // When newData.clusterNames is empty and oldData.clusterNames exists,
      // the hook uses oldData.clusterNames as fallback for current value
      // So original and current will be equal, showing no diff
      expect(result.current.clustersDisplay).toBe('old-cluster')
    })

    it('shows diff when clusters change from one set to another', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: ['old-cluster-1'] },
          newData: {
            clusterNames: [{ metadata: { name: 'new-cluster-2' } }],
          },
          isEditing: true,
        })
      )

      const display = result.current.clustersDisplay
      expect(display).toHaveProperty('type', 'div')
    })
  })

  describe('roleDisplay', () => {
    it('returns current role when not editing', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], role: 'old-role' },
          newData: { clusterNames: [], role: 'new-role' },
          isEditing: false,
        })
      )

      expect(result.current.roleDisplay).toBe('new-role')
    })

    it('returns "No role selected" when no role and not editing', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [] },
          newData: { clusterNames: [] },
          isEditing: false,
        })
      )

      expect(result.current.roleDisplay).toBe('No role selected')
    })

    it('returns current role when editing but unchanged', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], role: 'admin-role' },
          newData: { clusterNames: [], role: 'admin-role' },
          isEditing: true,
        })
      )

      expect(result.current.roleDisplay).toBe('admin-role')
    })

    it('returns diff JSX when editing and role changed', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], role: 'old-role' },
          newData: { clusterNames: [], role: 'new-role' },
          isEditing: true,
        })
      )

      const display = result.current.roleDisplay
      expect(display).toHaveProperty('type', 'div')
    })

    it('handles change from "No role selected" to role', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [] },
          newData: { clusterNames: [], role: 'new-role' },
          isEditing: true,
        })
      )

      const display = result.current.roleDisplay
      expect(display).toHaveProperty('type', 'div')
    })

    it('handles change from role to "No role selected"', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], role: 'old-role' },
          newData: { clusterNames: [] },
          isEditing: true,
        })
      )

      const display = result.current.roleDisplay
      expect(display).toHaveProperty('type', 'div')
    })

    it('handles undefined role in oldData', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [] },
          newData: { clusterNames: [], role: 'new-role' },
          isEditing: true,
        })
      )

      const display = result.current.roleDisplay
      expect(display).toHaveProperty('type', 'div')
    })

    it('handles undefined role in newData', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], role: 'old-role' },
          newData: { clusterNames: [] },
          isEditing: true,
        })
      )

      const display = result.current.roleDisplay
      expect(display).toHaveProperty('type', 'div')
    })
  })

  describe('integration scenarios', () => {
    it('handles complete scenario with all fields changed during editing', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: {
            clusterNames: ['old-cluster'],
            namespaces: ['old-ns'],
            role: 'old-role',
          },
          newData: {
            clusterNames: [{ metadata: { name: 'new-cluster' } }],
            namespaces: ['new-ns'],
            role: 'new-role',
          },
          isEditing: true,
        })
      )

      expect(result.current.clusterNames).toBe('new-cluster')
      expect(result.current.clustersDisplay).toHaveProperty('type', 'div')
      expect(result.current.namespacesDisplay).toHaveProperty('type', 'div')
      expect(result.current.roleDisplay).toHaveProperty('type', 'div')
    })

    it('handles complete scenario with no changes during editing', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: {
            clusterNames: ['cluster-1'],
            namespaces: ['ns1'],
            role: 'admin',
          },
          newData: {
            clusterNames: [{ metadata: { name: 'cluster-1' } }],
            namespaces: ['ns1'],
            role: 'admin',
          },
          isEditing: true,
        })
      )

      expect(result.current.clusterNames).toBe('cluster-1')
      expect(result.current.clustersDisplay).toBe('cluster-1')
      expect(result.current.namespacesDisplay).toBe('ns1')
      expect(result.current.roleDisplay).toBe('admin')
    })

    it('handles new assignment scenario (not editing)', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: {
            clusterNames: [],
          },
          newData: {
            clusterNames: [{ metadata: { name: 'cluster-1' } }],
            namespaces: ['ns1', 'ns2'],
            role: 'viewer',
          },
          isEditing: false,
        })
      )

      expect(result.current.clusterNames).toBe('cluster-1')
      expect(result.current.clustersDisplay).toBe('cluster-1')
      expect(result.current.namespacesDisplay).toBe('ns1, ns2')
      expect(result.current.roleDisplay).toBe('viewer')
    })
  })
})
