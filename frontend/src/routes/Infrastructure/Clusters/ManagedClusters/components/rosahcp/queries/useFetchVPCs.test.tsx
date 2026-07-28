/* Copyright Contributors to the Open Cluster Management project */

import { renderHook, act } from '@testing-library/react-hooks'
import { useFetchVPCs } from './useFetchVPCs'

const mockUseQuery = jest.fn()
jest.mock('@tanstack/react-query', () => ({
  useQuery: (options: unknown) => mockUseQuery(options),
}))

const mockGetWizardVPCs = jest.fn()
jest.mock('~/lib/rosa-hcp-api', () => ({
  getWizardVPCs: (...args: unknown[]) => mockGetWizardVPCs(...args),
}))

const mockSecret = {
  client_id: 'test-client-id',
  client_secret: 'test-client-secret',
}

const mockRefetch = jest.fn()

describe('useFetchVPCs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })
  })

  test('should pass correct query key with client_id', () => {
    renderHook(() => useFetchVPCs(mockSecret))

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['rosa-hcp-wizard-query-key', 'test-client-id', undefined, undefined, undefined, 'vpc'],
      })
    )
  })

  test('should disable query when state params are not set', () => {
    renderHook(() => useFetchVPCs(mockSecret))

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    )
  })

  test('should set retry to false', () => {
    renderHook(() => useFetchVPCs(mockSecret))

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        retry: false,
      })
    )
  })

  test('should return empty array when data is undefined', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchVPCs(mockSecret))

    expect(result.current.data).toEqual([])
  })

  test('should return items from data', () => {
    const vpcs = [
      { vpc_id: 'vpc-123', name: 'my-vpc' },
      { vpc_id: 'vpc-456', name: 'other-vpc' },
    ]
    mockUseQuery.mockReturnValue({
      data: { items: vpcs },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchVPCs(mockSecret))

    expect(result.current.data).toEqual(vpcs)
  })

  test('should forward loading state from useQuery', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchVPCs(mockSecret))

    expect(result.current.isLoading).toBe(true)
  })

  test('should return error string when error is present', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('The role ARN is not valid'),
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchVPCs(mockSecret))

    expect(result.current.error).toBe('Error: The role ARN is not valid')
  })

  test('should return null error when no error', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchVPCs(mockSecret))

    expect(result.current.error).toBeNull()
  })

  test('fetch should set state params and call refetch', async () => {
    mockRefetch.mockResolvedValue({ data: { items: [] } })

    const { result } = renderHook(() => useFetchVPCs(mockSecret))

    await act(async () => {
      await result.current.fetch({
        account_id: '720424066366',
        role_arn: 'arn:aws:iam::720424066366:role/Installer',
        region: 'us-east-2',
      })
    })

    expect(mockRefetch).toHaveBeenCalled()
  })

  test('queryFn should call getWizardVPCs with correct params when all state is set', async () => {
    const vpcsResponse = {
      body: { items: [{ vpc_id: 'vpc-123' }] },
    }
    mockGetWizardVPCs.mockResolvedValue(vpcsResponse)
    mockRefetch.mockResolvedValue({ data: vpcsResponse.body })

    const { result, rerender } = renderHook(() => useFetchVPCs(mockSecret))

    await act(async () => {
      await result.current.fetch({
        account_id: '720424066366',
        role_arn: 'arn:aws:iam::720424066366:role/Installer',
        region: 'us-east-2',
      })
    })

    rerender()

    const queryOptions = mockUseQuery.mock.calls[mockUseQuery.mock.calls.length - 1][0]
    const signal = new AbortController().signal
    const queryResult = await queryOptions.queryFn({ signal })

    expect(mockGetWizardVPCs).toHaveBeenCalledWith('test-client-id', 'test-client-secret', signal, {
      aws: { account_id: '720424066366', sts: { role_arn: 'arn:aws:iam::720424066366:role/Installer' } },
      region: { id: 'us-east-2' },
    })
    expect(queryResult).toEqual(vpcsResponse.body)
  })
})
