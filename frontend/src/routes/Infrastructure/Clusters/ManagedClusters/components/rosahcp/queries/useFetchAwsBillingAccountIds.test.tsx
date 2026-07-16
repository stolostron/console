/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react-hooks'
import { useFetchOrganizationQuota } from './useFetchAwsBillingAccountIds'
import { SelectedSecret } from '../constants/types'

const mockUseQuery = jest.fn()
jest.mock('~/hooks/shared-react-query', () => ({
  useSharedReactQuery: () => ({
    useQuery: mockUseQuery,
  }),
}))

jest.mock('~/lib/rosa-hcp-api', () => ({
  getWizardAwsBillingAccounts: jest.fn(),
}))

const mockSecret: SelectedSecret = {
  client_id: 'test-client-id',
  client_secret: 'test-client-secret',
}

const mockRefetch = jest.fn()

describe('useFetchOrganizationQuota', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should extract AWS billing accounts from quota data', () => {
    mockUseQuery.mockReturnValue({
      data: {
        items: [
          {
            quota_id: 'cluster|byoc|moa|marketplace',
            cloud_accounts: [
              { cloud_account_id: '111111111111', cloud_provider_id: 'aws' },
              { cloud_account_id: '222222222222', cloud_provider_id: 'aws' },
            ],
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchOrganizationQuota(mockSecret))

    expect(result.current.data).toEqual([
      { value: '111111111111', label: '111111111111' },
      { value: '222222222222', label: '222222222222' },
    ])
  })

  test('should filter out non-AWS cloud accounts', () => {
    mockUseQuery.mockReturnValue({
      data: {
        items: [
          {
            quota_id: 'cluster|byoc|moa|marketplace',
            cloud_accounts: [
              { cloud_account_id: '111111111111', cloud_provider_id: 'aws' },
              { cloud_account_id: 'gcp-account-1', cloud_provider_id: 'gcp' },
            ],
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchOrganizationQuota(mockSecret))

    expect(result.current.data).toEqual([{ value: '111111111111', label: '111111111111' }])
  })

  test('should return empty array when no matching quota_id exists', () => {
    mockUseQuery.mockReturnValue({
      data: {
        items: [
          {
            quota_id: 'some-other-quota',
            cloud_accounts: [{ cloud_account_id: '111111111111', cloud_provider_id: 'aws' }],
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchOrganizationQuota(mockSecret))

    expect(result.current.data).toEqual([])
  })

  test('should return empty array when data is undefined', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchOrganizationQuota(mockSecret))

    expect(result.current.data).toEqual([])
  })

  test('should return empty array when items is empty', () => {
    mockUseQuery.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchOrganizationQuota(mockSecret))

    expect(result.current.data).toEqual([])
  })

  test('should pass correct query key and enabled flag', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      isFetching: true,
      refetch: mockRefetch,
    })

    renderHook(() => useFetchOrganizationQuota(mockSecret))

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['rosa-hcp-wizard-query-key', 'test-client-id', 'aws-billing-ids'],
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
      isFetching: true,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchOrganizationQuota(mockSecret))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isFetching).toBe(true)
  })

  test('should forward error state from useQuery', () => {
    const mockError = new Error('API failure')
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: mockError,
      isFetching: false,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchOrganizationQuota(mockSecret))

    expect(result.current.isError).toBe(true)
    expect(result.current.error).toBe(mockError)
  })

  test('should return empty array when quota has no cloud_accounts', () => {
    mockUseQuery.mockReturnValue({
      data: {
        items: [
          {
            quota_id: 'cluster|byoc|moa|marketplace',
            cloud_accounts: [],
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchOrganizationQuota(mockSecret))

    expect(result.current.data).toEqual([])
  })
})
