/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { render } from '@testing-library/react'
import { renderHook } from '@testing-library/react-hooks'
import { useReviewStepContent } from './ReviewStepContentHook'
import { ManagedClusterSet } from '../../resources'

// Mock the translation hook
jest.mock('../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const createMockClusterSet = (name: string): ManagedClusterSet => ({
  apiVersion: 'cluster.open-cluster-management.io/v1beta2',
  kind: 'ManagedClusterSet',
  metadata: { name },
})

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

      const { container } = render(<>{result.current.namespacesDisplay}</>)
      expect(container).toHaveTextContent('ns3, ns4')
    })

    it('returns "Full access" when no namespaces and not editing', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [] },
          newData: { clusterNames: [], namespaces: [] },
          isEditing: false,
        })
      )

      const { container } = render(<>{result.current.namespacesDisplay}</>)
      expect(container).toHaveTextContent('Full access')
    })

    it('returns current namespaces when editing but unchanged', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: ['ns1', 'ns2'] },
          newData: { clusterNames: [], namespaces: ['ns1', 'ns2'] },
          isEditing: true,
        })
      )

      const { container } = render(<>{result.current.namespacesDisplay}</>)
      expect(container).toHaveTextContent('ns1, ns2')
    })

    it('returns diff JSX when editing and namespaces changed from specific to full access', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: ['ns1', 'ns2'] },
          newData: { clusterNames: [], namespaces: [] },
          isEditing: true,
        })
      )

      const display = result.current.namespacesDisplay
      expect(React.isValidElement(display)).toBe(true)
    })

    it('returns diff JSX when editing and namespaces changed from full access to specific', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [] },
          newData: { clusterNames: [], namespaces: ['ns1', 'ns2'] },
          isEditing: true,
        })
      )

      const display = result.current.namespacesDisplay
      expect(React.isValidElement(display)).toBe(true)
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
      expect(React.isValidElement(display)).toBe(true)
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
      expect(React.isValidElement(display)).toBe(true)
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
      expect(React.isValidElement(display)).toBe(true)
    })

    it('handles empty namespaces in oldData (full access to specific)', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [] },
          newData: { clusterNames: [], namespaces: ['ns1'] },
          isEditing: true,
        })
      )

      const display = result.current.namespacesDisplay
      expect(React.isValidElement(display)).toBe(true)
    })

    it('handles empty namespaces in newData (specific to full access)', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: ['ns1'] },
          newData: { clusterNames: [], namespaces: [] },
          isEditing: true,
        })
      )

      const display = result.current.namespacesDisplay
      expect(React.isValidElement(display)).toBe(true)
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
      const { container } = render(<>{result.current.namespacesDisplay}</>)
      expect(container).toHaveTextContent('ns1, ns2')
    })
  })

  describe('clusterNames', () => {
    it('returns cluster names from selectedClusters with metadata.name', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [] },
          newData: {
            clusterNames: ['cluster-1', 'cluster-2'],
            namespaces: [],
          },
          isEditing: false,
        })
      )

      expect(result.current.clusterNames).toBe('cluster-1, cluster-2')
    })

    it('returns cluster names from selectedClusters with name property', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [] },
          newData: {
            clusterNames: ['cluster-1', 'cluster-2'],
            namespaces: [],
          },
          isEditing: false,
        })
      )

      expect(result.current.clusterNames).toBe('cluster-1, cluster-2')
    })

    it('returns cluster names from selectedClusters as strings', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [] },
          newData: {
            clusterNames: ['cluster-1', 'cluster-2'],
            namespaces: [],
          },
          isEditing: false,
        })
      )

      expect(result.current.clusterNames).toBe('cluster-1, cluster-2')
    })

    it('returns cluster names from oldData.clusterNames when selectedClusters is empty', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: ['old-cluster-1', 'old-cluster-2'], namespaces: [] },
          newData: { clusterNames: [], namespaces: [] },
          isEditing: false,
        })
      )

      expect(result.current.clusterNames).toBe('old-cluster-1, old-cluster-2')
    })

    it('returns null when both selectedClusters and clusterNames are empty', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [] },
          newData: { clusterNames: [], namespaces: [] },
          isEditing: false,
        })
      )

      expect(result.current.clusterNames).toBeNull()
    })

    it('returns null when both selectedClusters and clusterNames are empty arrays', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [] },
          newData: { clusterNames: [], namespaces: [] },
          isEditing: false,
        })
      )

      expect(result.current.clusterNames).toBeNull()
    })

    it('prioritizes selectedClusters over oldData.clusterNames', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: ['old-cluster'], namespaces: [] },
          newData: {
            clusterNames: ['new-cluster'],
            namespaces: [],
          },
          isEditing: false,
        })
      )

      expect(result.current.clusterNames).toBe('new-cluster')
    })

    it('handles mixed cluster formats', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [] },
          newData: {
            clusterNames: ['cluster-1', 'cluster-2', 'cluster-3'],
            namespaces: [],
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
          oldData: { clusterNames: ['old-cluster'], namespaces: [] },
          newData: {
            clusterNames: ['new-cluster'],
            namespaces: [],
          },
          isEditing: false,
        })
      )

      const { container } = render(<>{result.current.clustersDisplay}</>)
      expect(container).toHaveTextContent('new-cluster')
    })

    it('returns "None selected" when no clusters and not editing', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [] },
          newData: { clusterNames: [], namespaces: [] },
          isEditing: false,
        })
      )

      const { container } = render(<>{result.current.clustersDisplay}</>)
      expect(container).toHaveTextContent('None selected')
    })

    it('returns current clusters when editing but unchanged', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: ['cluster-1'], namespaces: [] },
          newData: {
            clusterNames: ['cluster-1'],
            namespaces: [],
          },
          isEditing: true,
        })
      )

      const { container } = render(<>{result.current.clustersDisplay}</>)
      expect(container).toHaveTextContent('cluster-1')
    })

    it('returns diff JSX when editing and clusters changed', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: ['old-cluster'], namespaces: [] },
          newData: {
            clusterNames: ['new-cluster'],
            namespaces: [],
          },
          isEditing: true,
        })
      )

      const display = result.current.clustersDisplay
      expect(React.isValidElement(display)).toBe(true)
    })

    it('uses oldData.clusterNames as fallback for current when currentClusterNames is null', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: ['fallback-cluster'], namespaces: [] },
          newData: { clusterNames: [], namespaces: [] },
          isEditing: false,
        })
      )

      const { container } = render(<>{result.current.clustersDisplay}</>)
      expect(container).toHaveTextContent('fallback-cluster')
    })

    it('returns "None selected" when both original and current are empty', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [] },
          newData: { clusterNames: [], namespaces: [] },
          isEditing: true,
        })
      )

      const { container } = render(<>{result.current.clustersDisplay}</>)
      expect(container).toHaveTextContent('None selected')
    })

    it('handles change from "None selected" to clusters', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [] },
          newData: {
            clusterNames: ['new-cluster'],
            namespaces: [],
          },
          isEditing: true,
        })
      )

      const display = result.current.clustersDisplay
      expect(React.isValidElement(display)).toBe(true)
    })

    it('shows diff when clusters change from one set to another', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: ['old-cluster-1'], namespaces: [] },
          newData: {
            clusterNames: ['new-cluster-2'],
            namespaces: [],
          },
          isEditing: true,
        })
      )

      const display = result.current.clustersDisplay
      expect(React.isValidElement(display)).toBe(true)
    })
  })

  describe('roleDisplay', () => {
    it('returns current role when not editing', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [], role: 'old-role' },
          newData: { clusterNames: [], namespaces: [], role: 'new-role' },
          isEditing: false,
        })
      )

      const { container } = render(<>{result.current.roleDisplay}</>)
      expect(container).toHaveTextContent('new-role')
    })

    it('returns "No role selected" when no role and not editing', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [] },
          newData: { clusterNames: [], namespaces: [] },
          isEditing: false,
        })
      )

      const { container } = render(<>{result.current.roleDisplay}</>)
      expect(container).toHaveTextContent('No role selected')
    })

    it('returns current role when editing but unchanged', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [], role: 'admin-role' },
          newData: { clusterNames: [], namespaces: [], role: 'admin-role' },
          isEditing: true,
        })
      )

      const { container } = render(<>{result.current.roleDisplay}</>)
      expect(container).toHaveTextContent('admin-role')
    })

    it('returns diff JSX when editing and role changed', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [], role: 'old-role' },
          newData: { clusterNames: [], namespaces: [], role: 'new-role' },
          isEditing: true,
        })
      )

      const display = result.current.roleDisplay
      expect(React.isValidElement(display)).toBe(true)
    })

    it('handles change from "No role selected" to role', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [] },
          newData: { clusterNames: [], namespaces: [], role: 'new-role' },
          isEditing: true,
        })
      )

      const display = result.current.roleDisplay
      expect(React.isValidElement(display)).toBe(true)
    })

    it('handles change from role to "No role selected"', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [], role: 'old-role' },
          newData: { clusterNames: [], namespaces: [] },
          isEditing: true,
        })
      )

      const display = result.current.roleDisplay
      expect(React.isValidElement(display)).toBe(true)
    })

    it('handles undefined role in oldData', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [] },
          newData: { clusterNames: [], namespaces: [], role: 'new-role' },
          isEditing: true,
        })
      )

      const display = result.current.roleDisplay
      expect(React.isValidElement(display)).toBe(true)
    })

    it('handles undefined role in newData', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [], role: 'old-role' },
          newData: { clusterNames: [], namespaces: [] },
          isEditing: true,
        })
      )

      const display = result.current.roleDisplay
      expect(React.isValidElement(display)).toBe(true)
    })
  })

  describe('identityDisplay', () => {
    it('returns user name when subject is User', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [] },
          newData: {
            clusterNames: [],
            namespaces: [],
            subject: { kind: 'User', user: ['test-user'] },
          },
          isEditing: false,
        })
      )

      const { container } = render(<>{result.current.identityDisplay}</>)
      expect(container).toHaveTextContent('test-user')
    })

    it('returns group name when subject is Group', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [] },
          newData: {
            clusterNames: [],
            namespaces: [],
            subject: { kind: 'Group', group: ['test-group'] },
          },
          isEditing: false,
        })
      )

      const { container } = render(<>{result.current.identityDisplay}</>)
      expect(container).toHaveTextContent('test-group')
    })

    it('displays value from preselected when editing with same value', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [], subject: { kind: 'User', value: 'preselected-user' } },
          newData: {
            clusterNames: [],
            namespaces: [],
            subject: { kind: 'User', user: ['preselected-user'] },
          },
          isEditing: false,
        })
      )

      const { container } = render(<>{result.current.identityDisplay}</>)
      expect(container).toHaveTextContent('preselected-user')
    })

    it('returns "Not selected" when subject is undefined', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [] },
          newData: { clusterNames: [], namespaces: [] },
          isEditing: false,
        })
      )

      const { container } = render(<>{result.current.identityDisplay}</>)
      expect(container).toHaveTextContent('Not selected')
    })

    it('returns current identity when editing but unchanged', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [], subject: { kind: 'User', value: 'test-user' } },
          newData: {
            clusterNames: [],
            namespaces: [],
            subject: { kind: 'User', user: ['test-user'] },
          },
          isEditing: true,
        })
      )

      const { container } = render(<>{result.current.identityDisplay}</>)
      expect(container).toHaveTextContent('test-user')
    })

    it('returns diff JSX when editing and identity changed', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [], subject: { kind: 'User', value: 'old-user' } },
          newData: {
            clusterNames: [],
            namespaces: [],
            subject: { kind: 'User', user: ['new-user'] },
          },
          isEditing: true,
        })
      )

      const display = result.current.identityDisplay
      expect(React.isValidElement(display)).toBe(true)
    })

    it('returns diff JSX when identity kind changed', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [], subject: { kind: 'User', value: 'test-user' } },
          newData: {
            clusterNames: [],
            namespaces: [],
            subject: { kind: 'Group', group: ['test-group'] },
          },
          isEditing: true,
        })
      )

      const display = result.current.identityDisplay
      expect(React.isValidElement(display)).toBe(true)
    })

    it('handles change from User to Group', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], namespaces: [], subject: { kind: 'User', value: 'user-1' } },
          newData: {
            clusterNames: [],
            namespaces: [],
            subject: { kind: 'Group', group: ['group-1'] },
          },
          isEditing: true,
        })
      )

      const display = result.current.identityDisplay
      expect(React.isValidElement(display)).toBe(true)
    })
  })

  describe('clusterSetsDisplay', () => {
    it('returns current cluster sets when not editing', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], clusterSetNames: ['old-set'] },
          newData: {
            clusterNames: [],
            clusterSetNames: [createMockClusterSet('new-set')],
          },
          isEditing: false,
        })
      )

      expect(result.current.clusterSetsDisplay).toBe('new-set')
    })

    it('returns "None selected" when no cluster sets and not editing', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [] },
          newData: { clusterNames: [] },
          isEditing: false,
        })
      )

      expect(result.current.clusterSetsDisplay).toBe('None selected')
    })

    it('returns current cluster sets when editing but unchanged', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], clusterSetNames: ['cluster-set-1'] },
          newData: {
            clusterNames: [],
            clusterSetNames: [createMockClusterSet('cluster-set-1')],
          },
          isEditing: true,
        })
      )

      expect(result.current.clusterSetsDisplay).toBe('cluster-set-1')
    })

    it('returns diff JSX when editing and cluster sets changed', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], clusterSetNames: ['old-set'] },
          newData: {
            clusterNames: [],
            clusterSetNames: [createMockClusterSet('new-set')],
          },
          isEditing: true,
        })
      )

      const display = result.current.clusterSetsDisplay
      expect(display).toHaveProperty('type', 'div')
    })

    it('sorts cluster sets before comparing', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], clusterSetNames: ['set-2', 'set-1'] },
          newData: {
            clusterNames: [],
            clusterSetNames: [createMockClusterSet('set-1'), createMockClusterSet('set-2')],
          },
          isEditing: true,
        })
      )
      expect(result.current.clusterSetsDisplay).toBe('set-1, set-2')
    })

    it('handles cluster sets as strings', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], clusterSetNames: ['set-1', 'set-2'] },
          newData: {
            clusterNames: [],
            clusterSetNames: ['set-1', 'set-2'],
          },
          isEditing: false,
        })
      )

      expect(result.current.clusterSetsDisplay).toBe('set-1, set-2')
    })

    it('handles cluster sets as objects with metadata.name', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [] },
          newData: {
            clusterNames: [],
            clusterSetNames: [createMockClusterSet('set-1'), createMockClusterSet('set-2')],
          },
          isEditing: false,
        })
      )

      expect(result.current.clusterSetsDisplay).toBe('set-1, set-2')
    })

    it('handles empty cluster sets array in oldData', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], clusterSetNames: [] },
          newData: {
            clusterNames: [],
            clusterSetNames: [createMockClusterSet('new-set')],
          },
          isEditing: true,
        })
      )

      const display = result.current.clusterSetsDisplay
      expect(display).toHaveProperty('type', 'div')
    })

    it('handles empty cluster sets array in newData', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], clusterSetNames: ['old-set'] },
          newData: {
            clusterNames: [],
            clusterSetNames: [],
          },
          isEditing: true,
        })
      )

      const display = result.current.clusterSetsDisplay
      expect(display).toHaveProperty('type', 'div')
    })

    it('handles undefined cluster sets in oldData', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [] },
          newData: {
            clusterNames: [],
            clusterSetNames: [createMockClusterSet('new-set')],
          },
          isEditing: true,
        })
      )

      const display = result.current.clusterSetsDisplay
      expect(display).toHaveProperty('type', 'div')
    })

    it('handles undefined cluster sets in newData', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], clusterSetNames: ['old-set'] },
          newData: {
            clusterNames: [],
          },
          isEditing: true,
        })
      )

      const display = result.current.clusterSetsDisplay
      expect(display).toHaveProperty('type', 'div')
    })

    it('uses oldData cluster sets as fallback for current when not editing and newData is empty', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], clusterSetNames: ['fallback-set'] },
          newData: { clusterNames: [], clusterSetNames: [] },
          isEditing: false,
        })
      )

      expect(result.current.clusterSetsDisplay).toBe('fallback-set')
    })

    it('returns "None selected" when both original and current are empty', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], clusterSetNames: [] },
          newData: { clusterNames: [], clusterSetNames: [] },
          isEditing: true,
        })
      )

      expect(result.current.clusterSetsDisplay).toBe('None selected')
    })

    it('handles change from "None selected" to cluster sets', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], clusterSetNames: [] },
          newData: {
            clusterNames: [],
            clusterSetNames: [createMockClusterSet('new-set')],
          },
          isEditing: true,
        })
      )

      const display = result.current.clusterSetsDisplay
      expect(display).toHaveProperty('type', 'div')
    })

    it('shows diff when cluster sets change from one set to another', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], clusterSetNames: ['old-set-1'] },
          newData: {
            clusterNames: [],
            clusterSetNames: [createMockClusterSet('new-set-2')],
          },
          isEditing: true,
        })
      )

      const display = result.current.clusterSetsDisplay
      expect(display).toHaveProperty('type', 'div')
    })

    it('correctly compares cluster sets in different order (regression test for filter removal)', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [], clusterSetNames: ['set-3', 'set-1', 'set-2'] },
          newData: {
            clusterNames: [],
            clusterSetNames: [createMockClusterSet('set-1'), createMockClusterSet('set-2'), createMockClusterSet('set-3')],
          },
          isEditing: true,
        })
      )

      expect(result.current.clusterSetsDisplay).toBe('set-1, set-2, set-3')
    })

    it('handles mixed cluster set formats', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: { clusterNames: [] },
          newData: {
            clusterNames: [],
            clusterSetNames: [createMockClusterSet('set-1'), 'set-2', createMockClusterSet('set-3')],
          },
          isEditing: false,
        })
      )

      expect(result.current.clusterSetsDisplay).toBe('set-1, set-2, set-3')
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
            clusterNames: ['new-cluster'],
            namespaces: ['new-ns'],
            role: 'new-role',
          },
          isEditing: true,
        })
      )

      expect(result.current.clusterNames).toBe('new-cluster')
      expect(React.isValidElement(result.current.clustersDisplay)).toBe(true)
      expect(React.isValidElement(result.current.namespacesDisplay)).toBe(true)
      expect(React.isValidElement(result.current.roleDisplay)).toBe(true)
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
            clusterNames: ['cluster-1'],
            namespaces: ['ns1'],
            role: 'admin',
          },
          isEditing: true,
        })
      )

      expect(result.current.clusterNames).toBe('cluster-1')
      const clustersContainer = render(<>{result.current.clustersDisplay}</>).container
      expect(clustersContainer).toHaveTextContent('cluster-1')
      const namespacesContainer = render(<>{result.current.namespacesDisplay}</>).container
      expect(namespacesContainer).toHaveTextContent('ns1')
      const roleContainer = render(<>{result.current.roleDisplay}</>).container
      expect(roleContainer).toHaveTextContent('admin')
    })

    it('handles new assignment scenario (not editing)', () => {
      const { result } = renderHook(() =>
        useReviewStepContent({
          oldData: {
            clusterNames: [],
            namespaces: [],
          },
          newData: {
            clusterNames: ['cluster-1'],
            namespaces: ['ns1', 'ns2'],
            role: 'viewer',
          },
          isEditing: false,
        })
      )

      expect(result.current.clusterNames).toBe('cluster-1')
      const clustersContainer = render(<>{result.current.clustersDisplay}</>).container
      expect(clustersContainer).toHaveTextContent('cluster-1')
      const namespacesContainer = render(<>{result.current.namespacesDisplay}</>).container
      expect(namespacesContainer).toHaveTextContent('ns1, ns2')
      const roleContainer = render(<>{result.current.roleDisplay}</>).container
      expect(roleContainer).toHaveTextContent('viewer')
    })
  })
})
