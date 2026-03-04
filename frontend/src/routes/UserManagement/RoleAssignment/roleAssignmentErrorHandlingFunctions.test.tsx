/* Copyright Contributors to the Open Cluster Management project */

import { FlattenedRoleAssignment } from '../../../resources/clients/model/flattened-role-assignment'
import { MulticlusterRoleAssignment } from '../../../resources/multicluster-role-assignment'
import {
  getMissingNamespacesPerCluster,
  handleMissingNamespaces,
  type MultipleCallbackProgress,
} from './roleAssignmentErrorHandlingFunctions'

jest.mock('../../../resources', () => ({
  ...jest.requireActual('../../../resources'),
  fireManagedClusterActionCreate: jest.fn(),
}))

import { fireManagedClusterActionCreate } from '../../../resources'

const mockFireManagedClusterActionCreate = fireManagedClusterActionCreate as jest.MockedFunction<
  typeof fireManagedClusterActionCreate
>

const baseRoleAssignment: FlattenedRoleAssignment = {
  name: 'ra-1',
  clusterRole: 'admin',
  targetNamespaces: ['ns-a', 'ns-b'],
  clusterNames: ['cluster-1', 'cluster-2'],
  clusterSetNames: ['cs-1'],
  clusterSelection: { type: 'placements', placements: [] },
  relatedMulticlusterRoleAssignment: {} as MulticlusterRoleAssignment,
  subject: { name: 'user1', kind: 'User' },
  status: { name: 'ra-1', status: 'Error', reason: 'ApplicationFailed', message: 'namespaces "default" not found' },
}

const mockT = (key: string, opts?: Record<string, unknown>) => key + (opts ? JSON.stringify(opts) : '')

describe('getMissingNamespacesPerCluster', () => {
  it('includes cluster in clusterNamesSet with all target namespaces missing when cluster is not in clusterNamespaceMap', () => {
    const result = getMissingNamespacesPerCluster(
      { 'cluster-1': ['ns-a'], 'cluster-2': ['ns-b'] },
      ['ns-a', 'ns-b'],
      new Set(['cluster-3'])
    )
    expect(result).toEqual({ 'cluster-3': ['ns-a', 'ns-b'] })
  })

  it('returns only missing namespaces per cluster', () => {
    const result = getMissingNamespacesPerCluster(
      { 'cluster-1': ['ns-a'], 'cluster-2': ['ns-a', 'ns-b'] },
      ['ns-a', 'ns-b', 'ns-c'],
      new Set(['cluster-1', 'cluster-2'])
    )
    expect(result).toEqual({
      'cluster-1': ['ns-b', 'ns-c'],
      'cluster-2': ['ns-c'],
    })
  })

  it('excludes clusters not in clusterNamesSet', () => {
    const result = getMissingNamespacesPerCluster(
      { 'cluster-1': [], 'cluster-2': [], 'cluster-3': [] },
      ['ns-a'],
      new Set(['cluster-1', 'cluster-3'])
    )
    expect(result).toEqual({
      'cluster-1': ['ns-a'],
      'cluster-3': ['ns-a'],
    })
  })

  it('returns empty object when all namespaces exist on all clusters', () => {
    const result = getMissingNamespacesPerCluster(
      { 'cluster-1': ['ns-a', 'ns-b'], 'cluster-2': ['ns-a', 'ns-b'] },
      ['ns-a', 'ns-b'],
      new Set(['cluster-1', 'cluster-2'])
    )
    expect(result).toEqual({})
  })

  it('when targetNamespaces contains duplicates, returns each missing namespace only once per cluster (unique case)', () => {
    const result = getMissingNamespacesPerCluster(
      { 'cluster-1': [], 'cluster-2': ['ns-a'] },
      ['ns-a', 'ns-a', 'ns-b', 'ns-b', 'ns-c'],
      new Set(['cluster-1', 'cluster-2'])
    )
    expect(result).toEqual({
      'cluster-1': ['ns-a', 'ns-b', 'ns-c'],
      'cluster-2': ['ns-b', 'ns-c'],
    })
  })

  it('when clusterNamespaceMap has duplicate namespaces per cluster, treats them as existing (non-unique case)', () => {
    const result = getMissingNamespacesPerCluster(
      { 'cluster-1': ['ns-a', 'ns-a', 'ns-b'], 'cluster-2': ['ns-a'] },
      ['ns-a', 'ns-b', 'ns-c'],
      new Set(['cluster-1', 'cluster-2'])
    )
    expect(result).toEqual({
      'cluster-1': ['ns-c'],
      'cluster-2': ['ns-b', 'ns-c'],
    })
  })
})

describe('handleMissingNamespaces', () => {
  const mockAddAlertCallback = jest.fn(() => ({ id: 'alert-1', title: 'Creating missing projects' }))
  const mockOnStartCallback = jest.fn()
  const mockOnProgressCallback = jest.fn()

  const defaultDeps = {
    clusterNamespaceMap: { 'cluster-1': ['ns-a'], 'cluster-2': [] as string[] },
    addAlertCallback: mockAddAlertCallback,
    t: mockT,
    onStartCallback: mockOnStartCallback,
    onProgressCallback: mockOnProgressCallback,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFireManagedClusterActionCreate.mockResolvedValue({ actionDone: 'ActionDone' })
  })

  describe('when totalCount is 0 (no missing namespaces)', () => {
    it('calls addAlertCallback with No missing projects and does not call onStart or onProgress', async () => {
      await handleMissingNamespaces(
        { ...baseRoleAssignment, clusterNames: ['cluster-1', 'cluster-2'], targetNamespaces: ['ns-a', 'ns-b'] },
        {
          ...defaultDeps,
          clusterNamespaceMap: { 'cluster-1': ['ns-a', 'ns-b'], 'cluster-2': ['ns-a', 'ns-b'] },
        }
      )

      expect(mockAddAlertCallback).toHaveBeenCalledTimes(1)
      expect(mockAddAlertCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'No missing projects',
          type: 'info',
          autoClose: true,
        })
      )
      expect(mockOnStartCallback).not.toHaveBeenCalled()
      expect(mockOnProgressCallback).not.toHaveBeenCalled()
      expect(mockFireManagedClusterActionCreate).not.toHaveBeenCalled()
    })
  })

  describe('when totalCount > 0 (missing namespaces exist)', () => {
    it('calls addAlertCallback with Creating missing projects, onStartCallback, onProgressCallback and fireManagedClusterActionCreate', async () => {
      await handleMissingNamespaces(baseRoleAssignment, defaultDeps)

      expect(mockAddAlertCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Creating missing projects',
          type: 'info',
          autoClose: false,
        })
      )
      expect(mockOnStartCallback).toHaveBeenCalledTimes(1)
      expect(mockOnStartCallback).toHaveBeenCalledWith(
        baseRoleAssignment,
        expect.objectContaining({ id: 'alert-1', title: 'Creating missing projects' })
      )
      expect(mockOnProgressCallback).toHaveBeenCalledWith({
        successCount: 0,
        errorCount: 0,
        totalCount: 3,
        errorClusterNamespacesMap: {},
      })
      expect(mockFireManagedClusterActionCreate).toHaveBeenCalledTimes(3)
      expect(mockFireManagedClusterActionCreate).toHaveBeenCalledWith(
        'cluster-1',
        expect.objectContaining({
          apiVersion: 'project.openshift.io/v1',
          kind: 'ProjectRequest',
          metadata: { name: 'ns-b' },
        })
      )
      expect(mockFireManagedClusterActionCreate).toHaveBeenCalledWith(
        'cluster-2',
        expect.objectContaining({
          metadata: { name: 'ns-a' },
        })
      )
      expect(mockFireManagedClusterActionCreate).toHaveBeenCalledWith(
        'cluster-2',
        expect.objectContaining({
          metadata: { name: 'ns-b' },
        })
      )
    })

    it('calls onProgressCallback with updated counts when all create calls succeed', async () => {
      await handleMissingNamespaces(baseRoleAssignment, defaultDeps)

      const progressCalls = mockOnProgressCallback.mock.calls as [MultipleCallbackProgress][]
      expect(progressCalls.length).toBeGreaterThanOrEqual(2)
      const lastCall = progressCalls[progressCalls.length - 1][0]
      expect(lastCall.successCount).toBe(3)
      expect(lastCall.errorCount).toBe(0)
      expect(lastCall.totalCount).toBe(3)
    })

    it('calls addAlertCallback with error when actionResponse is not ActionDone', async () => {
      mockFireManagedClusterActionCreate
        .mockResolvedValueOnce({ actionDone: 'ActionDone' })
        .mockResolvedValueOnce({ actionDone: 'Failed', message: 'Quota exceeded' })

      await handleMissingNamespaces(baseRoleAssignment, defaultDeps)

      expect(mockAddAlertCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error creating missing project',
          type: 'danger',
          autoClose: true,
        })
      )
      const errorCalls = (mockAddAlertCallback.mock.calls as unknown[][]).filter(
        (call) => (call[0] as unknown as { title?: string } | undefined)?.title === 'Error creating missing project'
      )
      expect(errorCalls.length).toBeGreaterThanOrEqual(1)
    })

    it('calls addAlertCallback with error when fireManagedClusterActionCreate rejects', async () => {
      mockFireManagedClusterActionCreate
        .mockResolvedValueOnce({ actionDone: 'ActionDone' })
        .mockRejectedValueOnce(new Error('Network error'))

      await handleMissingNamespaces(baseRoleAssignment, defaultDeps)

      expect(mockAddAlertCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error creating missing project',
          type: 'danger',
          autoClose: true,
        })
      )
    })

    it('calls onProgressCallback with errorClusterNamespacesMap when some fail', async () => {
      mockFireManagedClusterActionCreate
        .mockResolvedValueOnce({ actionDone: 'ActionDone' })
        .mockRejectedValueOnce(new Error('Failed'))

      await handleMissingNamespaces(baseRoleAssignment, defaultDeps)

      const progressCalls = mockOnProgressCallback.mock.calls as [MultipleCallbackProgress][]
      const lastCall = progressCalls[progressCalls.length - 1][0]
      expect(lastCall.errorCount).toBe(1)
      expect(Object.keys(lastCall.errorClusterNamespacesMap).length).toBeGreaterThanOrEqual(1)
    })

    it('processes more than 10 missing namespaces in batches and reports final counts correctly', async () => {
      const clusterNames = ['cluster-a', 'cluster-b', 'cluster-c']
      const targetNamespaces = ['ns-1', 'ns-2', 'ns-3', 'ns-4']
      const clusterNamespaceMap: Record<string, string[]> = {
        'cluster-a': [],
        'cluster-b': [],
        'cluster-c': [],
      }
      const ra = {
        ...baseRoleAssignment,
        clusterNames,
        targetNamespaces,
      }
      const deps = { ...defaultDeps, clusterNamespaceMap }

      await handleMissingNamespaces(ra, deps)

      const expectedTotal = clusterNames.length * targetNamespaces.length
      expect(mockFireManagedClusterActionCreate).toHaveBeenCalledTimes(expectedTotal)

      const progressCalls = mockOnProgressCallback.mock.calls as [MultipleCallbackProgress][]
      const lastCall = progressCalls[progressCalls.length - 1][0]
      expect(lastCall.totalCount).toBe(expectedTotal)
      expect(lastCall.successCount).toBe(expectedTotal)
      expect(lastCall.errorCount).toBe(0)
      expect(lastCall.errorClusterNamespacesMap).toEqual({})
    })
  })

  describe('edge cases', () => {
    it('handles roleAssignment with undefined targetNamespaces and clusterNames', async () => {
      const ra = {
        ...baseRoleAssignment,
        targetNamespaces: undefined,
        clusterNames: undefined,
      } as unknown as FlattenedRoleAssignment
      await handleMissingNamespaces(ra, defaultDeps)

      expect(mockAddAlertCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'No missing projects',
        })
      )
      expect(mockFireManagedClusterActionCreate).not.toHaveBeenCalled()
    })
  })
})
