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
import { useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk'

let mockExtensions: (
  | ApplicationAction
  | VirtualMachineAction
  | ApplicationListColumn
  | VirtualMachineListColumn
  | OverviewTab
)[] = []

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useResolvedExtensions: jest.fn(),
}))

describe('useCatalogExtensions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

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

    // mock the useResolvedExtensions calls to return appropriate extensions
    const mockUseResolvedExtensions = useResolvedExtensions as jest.MockedFunction<typeof useResolvedExtensions>
    mockUseResolvedExtensions
      .mockReturnValueOnce([mockExtensions.filter((ext) => ext.type === 'acm.application/action') as any, true, []])
      .mockReturnValueOnce([
        mockExtensions.filter((ext) => ext.type === 'acm.application/list/column') as any,
        true,
        [],
      ])
      .mockReturnValueOnce([mockExtensions.filter((ext) => ext.type === 'acm.overview/tab') as any, true, []])
      .mockReturnValueOnce([mockExtensions.filter((ext) => ext.type === 'acm.virtualmachine/action') as any, true, []])
      .mockReturnValueOnce([
        mockExtensions.filter((ext) => ext.type === 'acm.virtualmachine/list/column') as any,
        true,
        [],
      ])
      .mockReturnValueOnce([[], true, []]) // for resource routes

    const { result } = renderHook(() => useAcmExtension())

    expect(result.current.virtualMachineAction).toBeDefined()
    expect(result.current.applicationAction).toBeDefined()
    expect(result.current.virtualMachineListColumn).toBeDefined()
    expect(result.current.applicationListColumn).toBeDefined()
    expect(result.current.overviewTab).toBeDefined()
  })
})
