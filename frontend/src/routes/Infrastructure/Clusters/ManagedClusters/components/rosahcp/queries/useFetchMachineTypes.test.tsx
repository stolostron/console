/* Copyright Contributors to the Open Cluster Management project */

import { renderHook, act } from '@testing-library/react-hooks'
import { buildMachineTypeOptions, useFetchMachineTypes } from './useFetchMachineTypes'
import { SelectedSecret } from '../constants/types'
import type { MachineTypesResponse } from '~/resources'

const mockUseQuery = jest.fn()
jest.mock('~/hooks/shared-react-query', () => ({
  useSharedReactQuery: () => ({
    useQuery: mockUseQuery,
  }),
}))

jest.mock('~/lib/rosa-hcp-api', () => ({
  getWizardMachineTypes: jest.fn(),
}))

const mockSecret: SelectedSecret = {
  client_id: 'test-client-id',
  client_secret: 'test-client-secret',
}

const mockFetchArgs = {
  region: 'us-east-1',
  role_arn: 'arn:aws:iam::123456789012:role/Installer',
  availability_zones: ['us-east-1a', 'us-east-1b'],
}

describe('buildMachineTypeOptions', () => {
  test('should map machine type items to dropdown options using the OCM-provided name as description', () => {
    const response: MachineTypesResponse = {
      items: [
        {
          id: 'm5.xlarge',
          name: 'm5.xlarge - General Purpose',
          category: 'general_purpose',
          cpu: { value: 4 },
          memory: { value: 17179869184 },
        },
      ],
    }

    const result = buildMachineTypeOptions(response)

    expect(result).toEqual([
      { id: 'm5.xlarge', value: 'm5.xlarge', label: 'm5.xlarge', description: 'm5.xlarge - General Purpose' },
    ])
  })

  test('should return empty array when items is undefined', () => {
    const result = buildMachineTypeOptions({} as MachineTypesResponse)
    expect(result).toEqual([])
  })

  test('should fall back to generic_name when name is missing', () => {
    const response: MachineTypesResponse = {
      items: [
        {
          id: 'm5.xlarge',
          name: undefined as unknown as string,
          generic_name: 'm5.xlarge',
          category: 'general_purpose',
        },
      ],
    }

    const result = buildMachineTypeOptions(response)

    expect(result[0].description).toBe('m5.xlarge')
  })

  test('should default description to empty string when name and generic_name are missing', () => {
    const response: MachineTypesResponse = {
      items: [{ id: 'm5.xlarge', name: undefined as unknown as string, category: 'general_purpose' }],
    }

    const result = buildMachineTypeOptions(response)

    expect(result[0].description).toBe('')
  })
})

describe('useFetchMachineTypes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should be disabled until fetch is called', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null })

    renderHook(() => useFetchMachineTypes(mockSecret))

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['rosa-hcp-wizard-query-key', 'test-client-id', undefined, undefined, '', 'machine-types'],
        enabled: false,
      })
    )
  })

  test('should enable the query after fetch is called with region and role_arn', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null })

    const { result, rerender } = renderHook(() => useFetchMachineTypes(mockSecret))
    act(() => {
      void result.current.fetch(mockFetchArgs)
    })
    rerender()

    expect(mockUseQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        queryKey: [
          'rosa-hcp-wizard-query-key',
          'test-client-id',
          'us-east-1',
          'arn:aws:iam::123456789012:role/Installer',
          'us-east-1a,us-east-1b',
          'machine-types',
        ],
        enabled: true,
      })
    )
  })

  test('should return empty array when data is undefined', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null })

    const { result } = renderHook(() => useFetchMachineTypes(mockSecret))

    expect(result.current.data).toEqual([])
  })

  test('should return machine type options when query succeeds', () => {
    const mockOptions = [{ id: 'm5.xlarge', value: 'm5.xlarge', label: 'm5.xlarge', description: '4 vCPU 16 GiB RAM' }]
    mockUseQuery.mockReturnValue({ data: mockOptions, isLoading: false, isError: false, error: null })

    const { result } = renderHook(() => useFetchMachineTypes(mockSecret))

    expect(result.current.data).toEqual(mockOptions)
  })

  test('should forward loading state as isFetching', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null })

    const { result } = renderHook(() => useFetchMachineTypes(mockSecret))

    expect(result.current.isFetching).toBe(true)
  })

  test('should return error message string when query errors with an Error instance', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error('IAM denied') })

    const { result } = renderHook(() => useFetchMachineTypes(mockSecret))

    expect(result.current.error).toBe('IAM denied')
  })

  test('should return "Unknown error" when query errors with a non-Error value', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: 'boom' })

    const { result } = renderHook(() => useFetchMachineTypes(mockSecret))

    expect(result.current.error).toBe('Unknown error')
  })

  test('should return null error when query is not in error state', () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false, isError: false, error: null })

    const { result } = renderHook(() => useFetchMachineTypes(mockSecret))

    expect(result.current.error).toBeNull()
  })

  test('should expose a stable fetch function reference', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null })

    const { result, rerender } = renderHook(() => useFetchMachineTypes(mockSecret))
    const firstFetch = result.current.fetch
    rerender()

    expect(result.current.fetch).toBe(firstFetch)
  })

  test('should call getWizardMachineTypes with args from fetch inside queryFn', async () => {
    const { getWizardMachineTypes } = jest.requireMock('~/lib/rosa-hcp-api') as {
      getWizardMachineTypes: jest.Mock
    }
    getWizardMachineTypes.mockResolvedValue({
      items: [{ id: 'm5.xlarge', name: 'm5.xlarge', category: 'general_purpose' }],
    })
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null })

    const { result, rerender } = renderHook(() => useFetchMachineTypes(mockSecret))
    act(() => {
      void result.current.fetch(mockFetchArgs)
    })
    rerender()

    const queryFn = mockUseQuery.mock.calls[mockUseQuery.mock.calls.length - 1][0].queryFn as (ctx: {
      signal?: AbortSignal
    }) => Promise<unknown>
    const data = await queryFn({ signal: undefined })

    expect(getWizardMachineTypes).toHaveBeenCalledWith('test-client-id', 'test-client-secret', undefined, {
      region: 'us-east-1',
      role_arn: 'arn:aws:iam::123456789012:role/Installer',
      availability_zones: ['us-east-1a', 'us-east-1b'],
    })
    expect(data).toEqual([{ id: 'm5.xlarge', value: 'm5.xlarge', label: 'm5.xlarge', description: 'm5.xlarge' }])
  })
})
