/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react-hooks'
import { useFetchRegions } from './useFetchRegions'
import { SelectedSecret } from '../constants/types'

const mockUseQuery = jest.fn()
jest.mock('~/hooks/shared-react-query', () => ({
  useSharedReactQuery: () => ({
    useQuery: mockUseQuery,
  }),
}))

jest.mock('~/lib/rosa-hcp-api', () => ({
  getWizardRegions: jest.fn(),
}))

const mockSecret: SelectedSecret = {
  client_id: 'test-client-id',
  client_secret: 'test-client-secret',
}

const mockRefetch = jest.fn()

function getSelectFn(): (data: unknown) => unknown {
  return mockUseQuery.mock.calls[0][0].select
}

describe('useFetchRegions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should pass correct query key and enabled flag', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: mockRefetch,
    })

    renderHook(() => useFetchRegions(mockSecret))

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['rosa-hcp-wizard-query-key', 'test-client-id', 'regions'],
        enabled: true,
      })
    )
  })

  test('should disable query when selectedSecret is falsy', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    })

    renderHook(() => useFetchRegions(undefined as unknown as SelectedSecret))

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
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

    const { result } = renderHook(() => useFetchRegions(mockSecret))

    expect(result.current.isLoading).toBe(true)
  })

  test('should return error string when isError is true', () => {
    const mockError = { message: 'Unknown error', status: 500 }
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: mockError,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchRegions(mockSecret))

    expect(result.current.isError).toBe(true)
    expect(result.current.error).toBe(mockError.message)
  })

  test('should return null error when isError is false', () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchRegions(mockSecret))

    expect(result.current.error).toBeNull()
  })

  test('should select only hypershift-supporting AWS regions', () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    })

    renderHook(() => useFetchRegions(mockSecret))

    const selectFn = getSelectFn()
    const result = selectFn({
      items: [
        {
          id: 'aws',
          name: 'AWS',
          regions: [
            { id: 'us-east-1', display_name: 'US East (N. Virginia)', supports_hypershift: true },
            { id: 'us-west-2', display_name: 'US West (Oregon)', supports_hypershift: true },
            { id: 'af-south-1', display_name: 'Africa (Cape Town)', supports_hypershift: false },
          ],
        },
      ],
    })

    expect(result).toEqual([
      { value: 'us-east-1', label: 'us-east-1, US East (N. Virginia)' },
      { value: 'us-west-2', label: 'us-west-2, US West (Oregon)' },
    ])
  })

  test('should return empty array when no AWS provider is present', () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    })

    renderHook(() => useFetchRegions(mockSecret))

    const selectFn = getSelectFn()
    const result = selectFn({
      items: [{ id: 'gcp', name: 'GCP', regions: [] }],
    })

    expect(result).toEqual([])
  })

  test('should return empty array when AWS provider has no regions', () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    })

    renderHook(() => useFetchRegions(mockSecret))

    const selectFn = getSelectFn()
    const result = selectFn({
      items: [{ id: 'aws', name: 'AWS' }],
    })

    expect(result).toEqual([])
  })

  test('should return empty array when items is undefined', () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    })

    renderHook(() => useFetchRegions(mockSecret))

    const selectFn = getSelectFn()
    const result = selectFn({})

    expect(result).toEqual([])
  })

  test('should use empty string for region value when id is undefined', () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    })

    renderHook(() => useFetchRegions(mockSecret))

    const selectFn = getSelectFn()
    const result = selectFn({
      items: [
        {
          id: 'aws',
          name: 'AWS',
          regions: [{ display_name: 'Unknown Region', supports_hypershift: true }],
        },
      ],
    })

    expect(result).toEqual([{ value: '', label: 'undefined, Unknown Region' }])
  })

  test('should forward refetch function from useQuery', () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useFetchRegions(mockSecret))

    expect(result.current.refetch).toBe(mockRefetch)
  })
})
