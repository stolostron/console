/* Copyright Contributors to the Open Cluster Management project */

import {
  ApplicationAction,
  ApplicationListColumn,
  OverviewTab,
  VirtualMachineAction,
  VirtualMachineListColumn,
} from './extensions'
import { useAcmExtension } from './handler'
import { renderHook } from '@testing-library/react-hooks'

let mockExtensions: (
  | ApplicationAction
  | VirtualMachineAction
  | ApplicationListColumn
  | VirtualMachineListColumn
  | OverviewTab
)[] = []

jest.mock('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions', () => ({
  useResolvedExtensions: (typeGuard: any) => [mockExtensions.filter(typeGuard), true],
}))

describe('useCatalogExtensions', () => {
  it('should return item-type extensions', () => {
    mockExtensions = [
      {
        type: 'acm.virtualmachine/action',
        properties: {
          id: 'appFailoverAction',
          title: 'FailOver',
          model: [
            {
              apiVersion: 'kubevirt.io/v1',
              kind: 'VirtualMachine',
            },
          ],
          component: jest.fn(),
        },
      },
      {
        type: 'acm.application/action',
        properties: {
          id: 'vmFailoverAction',
          title: 'FailOver',
          model: [
            {
              apiVersion: 'argoproj.io/v1alpha1',
              kind: 'ApplicationSet',
            },
          ],
          component: jest.fn(),
        },
      },
      {
        type: 'acm.virtualmachine/list/column',
        properties: {
          header: 'DR status',
          cell: jest.fn(),
        },
      },
      {
        type: 'acm.application/list/column',
        properties: {
          header: 'DR status',
          cell: jest.fn(),
        },
      },
      {
        type: 'acm.overview/tab',
        properties: {
          tabTitle: 'Test',
          component: jest.fn(),
        },
      },
    ]
    const { result } = renderHook(() => useAcmExtension())
    expect([
      result.current.virtualMachineAction,
      result.current.applicationAction,
      result.current.virtualMachineListColumn,
      result.current.applicationListColumn,
      [result.current.overviewTab?.[0].properties],
    ]).toEqual(mockExtensions.map((mockExtension) => [mockExtension.properties]))
  })
})
