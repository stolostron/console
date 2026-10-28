/* Copyright Contributors to the Open Cluster Management project */

import { renderHook, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PolicyReport, PolicyReportApiVersion, PolicyReportKind } from '../resources'
import { getClusterPolicyReport, listPolicyReports } from '../resources/policy-report'
import { ResourceError, ResourceErrorCode } from '../resources/utils'
import { useClusterPolicyReport, usePolicyReportsList, POLICY_REPORT_STALE_TIME_MS } from './usePolicyReports'

jest.mock('../resources/policy-report', () => {
  const actual = jest.requireActual('../resources/policy-report')
  return {
    ...actual,
    getClusterPolicyReport: jest.fn(),
    listPolicyReports: jest.fn(),
  }
})

const mockGetClusterPolicyReport = getClusterPolicyReport as jest.Mock
const mockListPolicyReports = listPolicyReports as jest.Mock

const mockReport: PolicyReport = {
  apiVersion: PolicyReportApiVersion,
  kind: PolicyReportKind,
  metadata: { name: 'test-cluster-policyreport', namespace: 'test-cluster' },
  results: [],
  scope: { kind: 'cluster', name: 'test-cluster', namespace: 'test-cluster' },
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useClusterPolicyReport', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('fetches PolicyReport by cluster name', async () => {
    mockGetClusterPolicyReport.mockResolvedValue(mockReport)
    const { result } = renderHook(() => useClusterPolicyReport('test-cluster'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.policyReport).toEqual(mockReport)
      expect(result.current.isLoading).toBe(false)
    })
    expect(mockGetClusterPolicyReport).toHaveBeenCalledWith('test-cluster')
  })

  test('skips fetch when cluster name is undefined', () => {
    const { result } = renderHook(() => useClusterPolicyReport(undefined), {
      wrapper: createWrapper(),
    })
    expect(result.current.policyReport).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
    expect(mockGetClusterPolicyReport).not.toHaveBeenCalled()
  })

  test('returns undefined when report is not found', async () => {
    mockGetClusterPolicyReport.mockResolvedValue(undefined)
    const { result } = renderHook(() => useClusterPolicyReport('missing'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.policyReport).toBeUndefined()
  })

  test('uses 5 minute staleTime', () => {
    expect(POLICY_REPORT_STALE_TIME_MS).toBe(5 * 60 * 1000)
  })
})

describe('usePolicyReportsList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('lists PolicyReports when enabled', async () => {
    mockListPolicyReports.mockResolvedValue([mockReport])
    const { result } = renderHook(() => usePolicyReportsList(true), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.policyReports).toEqual([mockReport])
      expect(result.current.isLoading).toBe(false)
    })
    expect(mockListPolicyReports).toHaveBeenCalledTimes(1)
  })

  test('does not fetch when disabled', () => {
    const { result } = renderHook(() => usePolicyReportsList(false), {
      wrapper: createWrapper(),
    })
    expect(result.current.policyReports).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(mockListPolicyReports).not.toHaveBeenCalled()
  })

  test('surfaces fetch errors', async () => {
    mockListPolicyReports.mockRejectedValue(new ResourceError(ResourceErrorCode.InternalServerError, 'boom'))
    const { result } = renderHook(() => usePolicyReportsList(true), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.policyReports).toEqual([])
  })
})
