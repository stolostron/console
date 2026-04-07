/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { renderHook, act } from '@testing-library/react-hooks'
import { useRoleAssignmentsStatusHook } from './useRoleAssignmentsStatusHook'
import { FlattenedRoleAssignment } from '../../../resources/clients/model/flattened-role-assignment'
import { MulticlusterRoleAssignment } from '../../../resources/multicluster-role-assignment'
import { AcmToastContext } from '../../../ui-components'

jest.mock('../../../lib/acm-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('../../../utils/useClusterNamespaceMap', () => ({
  useClusterNamespaceMap: jest.fn(),
}))

const mockAddAlert = jest.fn(() => ({ id: 'alert-1', title: 'Creating missing projects' }))
const mockRemoveAlert = jest.fn()
const mockModifyAlert = jest.fn((alert: any) => alert)

const mockToastContext = {
  addAlert: mockAddAlert,
  removeAlert: mockRemoveAlert,
  modifyAlert: mockModifyAlert,
  activeAlerts: [],
  alertInfos: [],
  removeVisibleAlert: jest.fn(),
  clearAlerts: jest.fn(),
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AcmToastContext.Provider value={mockToastContext as any}>{children}</AcmToastContext.Provider>
)

jest.mock('../../../resources', () => ({
  ...jest.requireActual('../../../resources'),
  fireManagedClusterActionCreate: jest.fn(() => Promise.resolve({ actionDone: 'ActionDone' })),
}))

import { useClusterNamespaceMap } from '../../../utils/useClusterNamespaceMap'
import { fireManagedClusterActionCreate } from '../../../resources'

const mockUseClusterNamespaceMap = useClusterNamespaceMap as jest.MockedFunction<typeof useClusterNamespaceMap>

const baseRoleAssignment: FlattenedRoleAssignment = {
  name: 'ra-1',
  clusterRole: 'admin',
  targetNamespaces: ['ns-a', 'ns-b'],
  clusterNames: ['cluster-1', 'cluster-2'],
  clusterSetNames: ['cs-1'],
  clusterSelection: { type: 'placements', placements: [] },
  relatedMulticlusterRoleAssignment: {} as MulticlusterRoleAssignment,
  subject: { name: 'user1', kind: 'User' },
  status: {
    name: 'ra-1',
    status: 'Error',
    reason: 'ApplicationFailed',
    message: 'namespaces "ns-a" not found',
  },
}

describe('useRoleAssignmentsStatusHook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseClusterNamespaceMap.mockReturnValue({
      clusterNamespaceMap: {
        'cluster-1': ['ns-a'],
        'cluster-2': [],
      },
      isLoading: false,
    })
  })

  it('returns callbackMap, isProcessingRoleAssignmentMap, isAnyRoleAssignmentProcessing', () => {
    const { result } = renderHook(() => useRoleAssignmentsStatusHook(), { wrapper })

    expect(result.current).toHaveProperty('callbackMap')
    expect(result.current).toHaveProperty('isProcessingRoleAssignmentMap')
    expect(result.current).toHaveProperty('isAnyRoleAssignmentProcessing')
    expect(typeof result.current.callbackMap?.MissingNamespaces).toBe('function')
    expect(typeof result.current.callbackMap?.ApplicationFailed).toBe('function')
    expect(result.current.isAnyRoleAssignmentProcessing).toBe(false)
    expect(result.current.isProcessingRoleAssignmentMap).toEqual({})
  })

  it('handleMissingNamespaces shows "No missing projects" toast when totalCount is 0', async () => {
    mockUseClusterNamespaceMap.mockReturnValue({
      clusterNamespaceMap: {
        'cluster-1': ['ns-a', 'ns-b'],
        'cluster-2': ['ns-a', 'ns-b'],
      },
      isLoading: false,
    })

    const { result } = renderHook(() => useRoleAssignmentsStatusHook(), { wrapper })
    const handleMissing = result.current.callbackMap?.MissingNamespaces
    expect(handleMissing).toBeDefined()

    await act(async () => {
      handleMissing!(baseRoleAssignment)
    })

    expect(mockAddAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'No missing projects',
        type: 'info',
        autoClose: true,
      })
    )
  })

  it('handleMissingNamespaces creates projects and shows creating toast when missing namespaces exist', async () => {
    const { result } = renderHook(() => useRoleAssignmentsStatusHook(), { wrapper })
    const handleMissing = result.current.callbackMap?.MissingNamespaces
    expect(handleMissing).toBeDefined()

    await act(async () => {
      handleMissing!(baseRoleAssignment)
    })

    expect(mockAddAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Creating missing projects',
        type: 'info',
        autoClose: false,
      })
    )
    expect(fireManagedClusterActionCreate).toHaveBeenCalled()
  })

  it('isAnyRoleAssignmentProcessing becomes true while handleMissingNamespaces is running', async () => {
    let resolveCreate: () => void
    const createPromise = new Promise<void>((r) => {
      resolveCreate = r
    })
    const fireManagedClusterActionCreateMock = fireManagedClusterActionCreate as jest.Mock
    fireManagedClusterActionCreateMock.mockReturnValue(createPromise)

    const { result } = renderHook(() => useRoleAssignmentsStatusHook(), { wrapper })
    const handleMissing = result.current.callbackMap?.MissingNamespaces

    expect(result.current.isAnyRoleAssignmentProcessing).toBe(false)

    act(() => {
      handleMissing!(baseRoleAssignment)
    })

    expect(result.current.isProcessingRoleAssignmentMap['ra-1']).toBe(true)
    expect(result.current.isAnyRoleAssignmentProcessing).toBe(true)

    await act(async () => {
      resolveCreate!()
    })
  })
})
