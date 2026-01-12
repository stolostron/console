/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react-hooks'
import { GroupKind, UserKind } from '../../resources'
import { RoleAssignmentWizardFormData } from './types'
import { usePreselectedData } from './usePreselectedData'

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
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: false,
        preselected: { subject: { kind: UserKind, value: 'testuser' } },
        setFormData,
        setSelectedClusters,
      })
    )

    expect(setFormData).not.toHaveBeenCalled()
  })

  it('updates form data with preselected user subject', () => {
    const { mockFn: setFormData, calls } = createMockSetFormData()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: { subject: { kind: UserKind, value: 'testuser' } },
        setFormData,
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
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: { subject: { kind: GroupKind, value: 'testgroup' } },
        setFormData,
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
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: { roles: ['admin-role', 'viewer-role'] },
        setFormData,
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
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: { clusterNames: ['cluster-1', 'cluster-2'] },
        setFormData,
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
        selectedClusters: ['cluster-1', 'cluster-2'],
      })
    )
  })

  it('calls setSelectedClusters with cluster objects when cluster names are preselected', () => {
    const { mockFn: setFormData } = createMockSetFormData()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: { clusterNames: ['cluster-1'] },
        setFormData,
        setSelectedClusters,
      })
    )

    expect(setSelectedClusters).toHaveBeenCalledWith([{ name: 'cluster-1', namespaces: ['ns1', 'ns2'] }])
  })

  it('handles multiple preselected values at once', () => {
    const { mockFn: setFormData, calls } = createMockSetFormData()
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
        selectedClusters: ['cluster-1'],
      })
    )
  })

  it('does not update form data when preselected is undefined', () => {
    const { mockFn: setFormData, calls } = createMockSetFormData()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: undefined,
        setFormData,
        setSelectedClusters,
      })
    )

    expect(setFormData).toHaveBeenCalled()
    // The form data should remain largely unchanged (just merged with empty updates)
    expect(calls[0]).toEqual(createInitialFormData())
  })

  it('does not set user when subject kind is User but value is empty', () => {
    const { mockFn: setFormData, calls } = createMockSetFormData()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: { subject: { kind: UserKind, value: '' } },
        setFormData,
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
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: { subject: { kind: GroupKind, value: '' } },
        setFormData,
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
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: { roles: [] },
        setFormData,
        setSelectedClusters,
      })
    )

    expect(setFormData).toHaveBeenCalled()
    expect(calls[0].roles).toEqual([])
  })

  it('does not update clusters when preselected clusterNames is empty array', () => {
    const { mockFn: setFormData, calls } = createMockSetFormData()
    const setSelectedClusters = jest.fn()

    renderHook(() =>
      usePreselectedData({
        isOpen: true,
        preselected: { clusterNames: [] },
        setFormData,
        setSelectedClusters,
      })
    )

    expect(setFormData).toHaveBeenCalled()
    expect(calls[0].scopeType).toBe('Global access')
    expect(setSelectedClusters).not.toHaveBeenCalled()
  })
})
