/* Copyright Contributors to the Open Cluster Management project */

import {
  clusterPolicyReportIdentity,
  clusterPolicyReportName,
  getClusterPolicyReport,
  listPolicyReports,
  PolicyReportApiVersion,
  PolicyReportKind,
} from './policy-report'
import { getResource, listResources, ResourceError, ResourceErrorCode } from './utils'

jest.mock('./utils', () => {
  const actual = jest.requireActual('./utils')
  return {
    ...actual,
    getResource: jest.fn(),
    listResources: jest.fn(),
  }
})

const mockGetResource = getResource as jest.Mock
const mockListResources = listResources as jest.Mock

describe('policy-report helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('clusterPolicyReportName appends -policyreport', () => {
    expect(clusterPolicyReportName('local-cluster')).toBe('local-cluster-policyreport')
  })

  test('clusterPolicyReportIdentity uses cluster name as namespace', () => {
    expect(clusterPolicyReportIdentity('local-cluster')).toEqual({
      apiVersion: PolicyReportApiVersion,
      kind: PolicyReportKind,
      metadata: { name: 'local-cluster-policyreport', namespace: 'local-cluster' },
      results: [],
    })
  })

  test('getClusterPolicyReport returns the resource', async () => {
    const report = clusterPolicyReportIdentity('c1')
    mockGetResource.mockReturnValue({ promise: Promise.resolve(report), abort: jest.fn() })
    await expect(getClusterPolicyReport('c1')).resolves.toEqual(report)
    expect(mockGetResource).toHaveBeenCalledWith(clusterPolicyReportIdentity('c1'))
  })

  test('getClusterPolicyReport returns undefined on NotFound', async () => {
    mockGetResource.mockReturnValue({
      promise: Promise.reject(new ResourceError(ResourceErrorCode.NotFound)),
      abort: jest.fn(),
    })
    await expect(getClusterPolicyReport('missing')).resolves.toBeUndefined()
  })

  test('getClusterPolicyReport rethrows non-NotFound errors', async () => {
    mockGetResource.mockReturnValue({
      promise: Promise.reject(new ResourceError(ResourceErrorCode.Forbidden, 'nope')),
      abort: jest.fn(),
    })
    await expect(getClusterPolicyReport('c1')).rejects.toMatchObject({
      code: ResourceErrorCode.Forbidden,
    })
  })

  test('listPolicyReports lists all PolicyReports', async () => {
    const reports = [clusterPolicyReportIdentity('c1')]
    mockListResources.mockReturnValue({ promise: Promise.resolve(reports), abort: jest.fn() })
    await expect(listPolicyReports()).resolves.toEqual(reports)
    expect(mockListResources).toHaveBeenCalledWith({
      apiVersion: PolicyReportApiVersion,
      kind: PolicyReportKind,
    })
  })
})
