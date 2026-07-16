/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react-hooks'
import { useFetchRoleARNs, normalizeAWSAccountRoles } from './useFetchRolesARNs'
import { SelectedSecret } from '../constants/types'
import type { RoleARNsResponse, AccountRoleARN } from '~/resources'

const mockRefetch = jest.fn()
const mockUseQueries = jest.fn()

jest.mock('~/hooks/shared-react-query', () => ({
  useSharedReactQuery: () => ({
    useQueries: mockUseQueries,
  }),
}))

jest.mock('~/lib/rosa-hcp-api', () => ({
  getWizardRoleARNs: jest.fn(),
  getWizardOCMRoleARN: jest.fn(),
  getWizardUserRoleARN: jest.fn(),
}))

const mockSecret: SelectedSecret = {
  client_id: 'test-client-id',
  client_secret: 'test-client-secret',
}

const createAccountRoleARN = (overrides: Partial<AccountRoleARN> = {}): AccountRoleARN => ({
  arn: 'arn:aws:iam::123456789012:role/Test-Role',
  type: 'Installer',
  isAdmin: false,
  roleVersion: '4.14',
  managedPolicies: true,
  hcpManagedPolicies: true,
  ...overrides,
})

const createMockQueryResult = (overrides: Record<string, unknown> = {}) => ({
  data: undefined,
  isLoading: false,
  isError: false,
  error: null,
  refetch: mockRefetch,
  ...overrides,
})

describe('normalizeAWSAccountRoles', () => {
  test('should normalize account roles with managed and unmanaged policies', () => {
    const response: RoleARNsResponse = {
      kind: 'AccountRoleList',
      aws_account_id: '123456789012',
      items: [
        {
          prefix: 'ManagedOpenShift',
          kind: 'AccountRole',
          items: [
            createAccountRoleARN({
              type: 'Installer',
              arn: 'arn:aws:iam::123:role/Installer',
              managedPolicies: true,
              hcpManagedPolicies: true,
            }),
            createAccountRoleARN({
              type: 'Support',
              arn: 'arn:aws:iam::123:role/Support',
              managedPolicies: true,
              hcpManagedPolicies: true,
            }),
          ],
        },
      ],
      page: 1,
      size: 1,
      total: 1,
    }

    const result = normalizeAWSAccountRoles(response)

    expect(result).toHaveLength(1)
    expect(result[0].prefix).toBe('ManagedOpenShift')
    expect(result[0].Installer).toBe('arn:aws:iam::123:role/Installer')
    expect(result[0].Support).toBe('arn:aws:iam::123:role/Support')
  })

  test('should skip account roles with only 1 item', () => {
    const response: RoleARNsResponse = {
      kind: 'AccountRoleList',
      aws_account_id: '123456789012',
      items: [
        {
          prefix: 'ManagedOpenShift',
          kind: 'AccountRole',
          items: [createAccountRoleARN({ type: 'Installer', arn: 'arn:aws:iam::123:role/Installer' })],
        },
      ],
      page: 1,
      size: 1,
      total: 1,
    }

    const result = normalizeAWSAccountRoles(response)

    expect(result).toHaveLength(0)
  })

  test('should return empty array when items is undefined', () => {
    const response = { items: undefined } as unknown as RoleARNsResponse

    const result = normalizeAWSAccountRoles(response)

    expect(result).toEqual([])
  })

  test('should return empty array when items is empty', () => {
    const response: RoleARNsResponse = {
      kind: 'AccountRoleList',
      aws_account_id: '123456789012',
      items: [],
      page: 0,
      size: 0,
      total: 0,
    }

    const result = normalizeAWSAccountRoles(response)

    expect(result).toEqual([])
  })

  test('should split managed and unmanaged policy arns into separate normalized roles', () => {
    const response: RoleARNsResponse = {
      kind: 'AccountRoleList',
      aws_account_id: '123456789012',
      items: [
        {
          prefix: 'ManagedOpenShift',
          kind: 'AccountRole',
          items: [
            createAccountRoleARN({
              type: 'Installer',
              arn: 'arn:managed-installer',
              managedPolicies: true,
              hcpManagedPolicies: true,
            }),
            createAccountRoleARN({
              type: 'Support',
              arn: 'arn:unmanaged-support',
              managedPolicies: false,
              hcpManagedPolicies: false,
            }),
          ],
        },
      ],
      page: 1,
      size: 1,
      total: 1,
    }

    const result = normalizeAWSAccountRoles(response)

    expect(result).toHaveLength(2)
    expect(result[0].Installer).toBe('arn:managed-installer')
    expect(result[1].Support).toBe('arn:unmanaged-support')
  })

  test('should preserve roleVersion as version in normalized output', () => {
    const response: RoleARNsResponse = {
      kind: 'AccountRoleList',
      aws_account_id: '123456789012',
      items: [
        {
          prefix: 'ManagedOpenShift',
          kind: 'AccountRole',
          items: [
            createAccountRoleARN({
              type: 'Installer',
              roleVersion: '4.14',
              managedPolicies: true,
              hcpManagedPolicies: true,
            }),
            createAccountRoleARN({
              type: 'Worker',
              roleVersion: '4.14',
              managedPolicies: true,
              hcpManagedPolicies: true,
            }),
          ],
        },
      ],
      page: 1,
      size: 1,
      total: 1,
    }

    const result = normalizeAWSAccountRoles(response)

    expect(result[0].version).toBe('4.14')
  })

  test('should handle multiple account role groups', () => {
    const response: RoleARNsResponse = {
      kind: 'AccountRoleList',
      aws_account_id: '123456789012',
      items: [
        {
          prefix: 'Prefix-A',
          kind: 'AccountRole',
          items: [
            createAccountRoleARN({
              type: 'Installer',
              arn: 'arn:a-installer',
              managedPolicies: true,
              hcpManagedPolicies: true,
            }),
            createAccountRoleARN({
              type: 'Support',
              arn: 'arn:a-support',
              managedPolicies: true,
              hcpManagedPolicies: true,
            }),
          ],
        },
        {
          prefix: 'Prefix-B',
          kind: 'AccountRole',
          items: [
            createAccountRoleARN({
              type: 'Installer',
              arn: 'arn:b-installer',
              managedPolicies: true,
              hcpManagedPolicies: true,
            }),
            createAccountRoleARN({
              type: 'Worker',
              arn: 'arn:b-worker',
              managedPolicies: true,
              hcpManagedPolicies: true,
            }),
          ],
        },
      ],
      page: 1,
      size: 2,
      total: 2,
    }

    const result = normalizeAWSAccountRoles(response)

    expect(result).toHaveLength(2)
    expect(result[0].prefix).toBe('Prefix-A')
    expect(result[1].prefix).toBe('Prefix-B')
  })
})

describe('useFetchRoleARNs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return empty roles when queries have no data', () => {
    mockUseQueries.mockReturnValue([createMockQueryResult(), createMockQueryResult(), createMockQueryResult()])

    const { result } = renderHook(() => useFetchRoleARNs(mockSecret))

    expect(result.current.data).toEqual([])
    expect(result.current.ocmRole).toBeNull()
    expect(result.current.userRole).toBeNull()
  })

  test('should forward loading state from queries', () => {
    mockUseQueries.mockReturnValue([
      createMockQueryResult({ isLoading: true }),
      createMockQueryResult({ isLoading: true }),
      createMockQueryResult(),
    ])

    const { result } = renderHook(() => useFetchRoleARNs(mockSecret))

    expect(result.current.isLoading).toBe(true)
  })

  test('should return isLoading false when no queries are loading', () => {
    mockUseQueries.mockReturnValue([
      createMockQueryResult({ isLoading: false }),
      createMockQueryResult({ isLoading: false }),
      createMockQueryResult({ isLoading: false }),
    ])

    const { result } = renderHook(() => useFetchRoleARNs(mockSecret))

    expect(result.current.isLoading).toBe(false)
  })

  test('should return roles data when roles query succeeds', () => {
    const mockRoles = [
      {
        installerRole: { label: 'arn:installer', value: 'arn:installer', roleVersion: '4.14' },
        supportRole: [{ label: 'arn:support', value: 'arn:support' }],
        workerRole: [],
      },
    ]

    mockUseQueries.mockReturnValue([
      createMockQueryResult({ data: { roles: mockRoles, error: null } }),
      createMockQueryResult(),
      createMockQueryResult(),
    ])

    const { result } = renderHook(() => useFetchRoleARNs(mockSecret))

    expect(result.current.data).toEqual(mockRoles)
  })

  test('should return ocmRole data when ocm role query succeeds', () => {
    const mockOcmRole = {
      arn: 'arn:aws:iam::123:role/OCM-Role',
      type: 'OCM',
      isAdmin: true,
      profile: 'default',
      roleVersion: '4.14',
      managedPolicies: true,
      hcpManagedPolicies: true,
    }

    mockUseQueries.mockReturnValue([
      createMockQueryResult(),
      createMockQueryResult({ data: mockOcmRole }),
      createMockQueryResult(),
    ])

    const { result } = renderHook(() => useFetchRoleARNs(mockSecret))

    expect(result.current.ocmRole).toEqual(mockOcmRole)
  })

  test('should return userRole data when user role query succeeds', () => {
    const mockUserRole = {
      account_id: 'account-1',
      id: 'label-1',
      internal: false,
      key: 'sts_user_role',
      kind: 'AccountLabel',
      value: 'arn:aws:iam::123:role/User-Role',
    }

    mockUseQueries.mockReturnValue([
      createMockQueryResult(),
      createMockQueryResult(),
      createMockQueryResult({ data: mockUserRole }),
    ])

    const { result } = renderHook(() => useFetchRoleARNs(mockSecret))

    expect(result.current.userRole).toEqual(mockUserRole)
  })

  test('should extract roles error from query data error field', () => {
    mockUseQueries.mockReturnValue([
      createMockQueryResult({ data: { roles: [], error: 'Failed to fetch role ARNs' } }),
      createMockQueryResult(),
      createMockQueryResult(),
    ])

    const { result } = renderHook(() => useFetchRoleARNs(mockSecret))

    expect(result.current.error).toBe('Failed to fetch role ARNs')
  })

  test('should extract roles error from query error when data has no error', () => {
    mockUseQueries.mockReturnValue([
      createMockQueryResult({ error: new Error('Network failure') }),
      createMockQueryResult(),
      createMockQueryResult(),
    ])

    const { result } = renderHook(() => useFetchRoleARNs(mockSecret))

    expect(result.current.error).toBe('Network failure')
  })

  test('should return ocmRoleError from ocm query error', () => {
    mockUseQueries.mockReturnValue([
      createMockQueryResult(),
      createMockQueryResult({ error: new Error('OCM role fetch failed') }),
      createMockQueryResult(),
    ])

    const { result } = renderHook(() => useFetchRoleARNs(mockSecret))

    expect(result.current.ocmRoleError).toBe('OCM role fetch failed')
  })

  test('should return user-friendly message when user role is not found', () => {
    mockUseQueries.mockReturnValue([
      createMockQueryResult(),
      createMockQueryResult(),
      createMockQueryResult({ error: new Error("AccountLabel with key='sts_user_role' not found") }),
    ])

    const { result } = renderHook(() => useFetchRoleARNs(mockSecret))

    expect(result.current.userRoleError).toBe('User role was not found')
  })

  test('should return null userRoleError for non-matching error messages', () => {
    mockUseQueries.mockReturnValue([
      createMockQueryResult(),
      createMockQueryResult(),
      createMockQueryResult({ error: new Error('Some other error') }),
    ])

    const { result } = renderHook(() => useFetchRoleARNs(mockSecret))

    expect(result.current.userRoleError).toBeNull()
  })

  test('should return null for all errors when queries succeed without errors', () => {
    mockUseQueries.mockReturnValue([
      createMockQueryResult({ data: { roles: [], error: null } }),
      createMockQueryResult({ data: { arn: 'arn:ocm' } }),
      createMockQueryResult({ data: { value: 'arn:user' } }),
    ])

    const { result } = renderHook(() => useFetchRoleARNs(mockSecret))

    expect(result.current.error).toBeNull()
    expect(result.current.ocmRoleError).toBeNull()
    expect(result.current.userRoleError).toBeNull()
  })

  test('should expose fetch and refetch callbacks', () => {
    mockUseQueries.mockReturnValue([createMockQueryResult(), createMockQueryResult(), createMockQueryResult()])

    const { result } = renderHook(() => useFetchRoleARNs(mockSecret))

    expect(typeof result.current.fetch).toBe('function')
    expect(typeof result.current.refetch).toBe('function')
  })

  test('should pass correct query configuration to useQueries', () => {
    mockUseQueries.mockReturnValue([createMockQueryResult(), createMockQueryResult(), createMockQueryResult()])

    renderHook(() => useFetchRoleARNs(mockSecret))

    expect(mockUseQueries).toHaveBeenCalledWith(
      expect.objectContaining({
        queries: expect.arrayContaining([
          expect.objectContaining({
            queryKey: ['rosa-hcp-wizard-query-key', 'test-client-id', undefined, 'roles-arns'],
            enabled: false,
            retry: false,
          }),
          expect.objectContaining({
            queryKey: ['rosa-hcp-wizard-query-key', 'test-client-id', undefined, 'ocm-role-arn'],
            enabled: false,
            retry: false,
          }),
          expect.objectContaining({
            queryKey: ['rosa-hcp-wizard-query-key', 'test-client-id', 'user-role-arn'],
            enabled: false,
            retry: false,
          }),
        ]),
      })
    )
  })
})
