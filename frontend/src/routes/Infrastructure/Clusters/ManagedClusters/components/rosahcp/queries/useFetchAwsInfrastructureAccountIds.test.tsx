/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react-hooks'
import { useFetchAwsAccountIDs } from './useFetchAwsInfrastructureAccountIds'
import { SelectedSecret } from '../constants/types'

const mockUseQuery = jest.fn()
jest.mock('~/hooks/shared-react-query', () => ({
  useSharedReactQuery: () => ({
    useQuery: mockUseQuery,
  }),
}))

jest.mock('~/lib/rosa-hcp-api', () => ({
  getWizardAWSAccountIds: jest.fn(),
}))

const mockSecret: SelectedSecret = {
  client_id: 'test-client-id',
  client_secret: 'test-client-secret',
}

const mockRefetch = jest.fn()

describe('useFetchAwsAccountIDs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should extract AWS account IDs from ARN labels', () => {
    mockUseQuery.mockReturnValue({
      data: {
        items: [
          {
            id: '1',
            internal: false,
            key: 'sts_ocm_role',
            organization_id: 'org-1',
            type: 'organization',
            value: 'arn:aws:iam::268733382466:role/ManagedOpenShift-OCM-Role-15212158',
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchAwsAccountIDs(mockSecret))

    expect(result.current.data).toEqual(['268733382466'])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  test('should extract multiple unique AWS account IDs from comma-separated ARNs', () => {
    mockUseQuery.mockReturnValue({
      data: {
        items: [
          {
            id: '1',
            internal: false,
            key: 'sts_ocm_role',
            organization_id: 'org-1',
            type: 'organization',
            value:
              'arn:aws:iam::111111111111:role/Role-A,arn:aws:iam::222222222222:role/Role-B,arn:aws:iam::111111111111:role/Role-C',
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchAwsAccountIDs(mockSecret))

    expect(result.current.data).toEqual(['111111111111', '222222222222'])
  })

  test('should return empty array when no items are present', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchAwsAccountIDs(mockSecret))

    expect(result.current.data).toEqual([])
  })

  test('should return empty array when sts_ocm_role label is missing', () => {
    mockUseQuery.mockReturnValue({
      data: {
        items: [
          {
            id: '1',
            internal: false,
            key: 'other_label',
            organization_id: 'org-1',
            type: 'organization',
            value: 'some-value',
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchAwsAccountIDs(mockSecret))

    expect(result.current.data).toEqual([])
  })

  test('should return empty array when sts_ocm_role value is empty', () => {
    mockUseQuery.mockReturnValue({
      data: {
        items: [
          {
            id: '1',
            internal: false,
            key: 'sts_ocm_role',
            organization_id: 'org-1',
            type: 'organization',
            value: '',
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchAwsAccountIDs(mockSecret))

    expect(result.current.data).toEqual([])
  })

  test('should pass correct query key and enabled flag', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: mockRefetch,
    })

    renderHook(() => useFetchAwsAccountIDs(mockSecret))

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['rosa-hcp-wizard-query-key', 'test-client-id', 'aws-account-ids'],
        enabled: true,
      })
    )
  })

  test('should forward loading state from useQuery', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchAwsAccountIDs(mockSecret))

    expect(result.current.isLoading).toBe(true)
  })

  test('should forward error state from useQuery', () => {
    const mockError = new Error('Network error')
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: mockError,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchAwsAccountIDs(mockSecret))

    expect(result.current.isError).toBe(true)
    expect(result.current.error).toBe(mockError)
  })

  test('should deduplicate AWS account IDs from multiple identical ARNs', () => {
    mockUseQuery.mockReturnValue({
      data: {
        items: [
          {
            id: '1',
            internal: false,
            key: 'sts_ocm_role',
            organization_id: 'org-1',
            type: 'organization',
            value: 'arn:aws:iam::123456789012:role/Role-A,arn:aws:iam::123456789012:role/Role-B',
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchAwsAccountIDs(mockSecret))

    expect(result.current.data).toEqual(['123456789012'])
  })
})
