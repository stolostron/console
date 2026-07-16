/* Copyright Contributors to the Open Cluster Management project */
import { renderHook, act } from '@testing-library/react-hooks'
import { useFetchOIDCConfigs } from './useFetchOIDCConfigs'
import { SelectedSecret } from '../constants/types'
const mockUseQuery = jest.fn()
jest.mock('~/hooks/shared-react-query', () => ({
  useSharedReactQuery: () => ({
    useQuery: mockUseQuery,
  }),
}))
jest.mock('~/lib/rosa-hcp-api', () => ({
  getWizardOIDCConfigs: jest.fn(),
}))
const mockSecret: SelectedSecret = {
  client_id: 'test-client-id',
  client_secret: 'test-client-secret',
}
describe('useFetchOIDCConfigs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  test('should return OIDC configs mapped to value/label/issuer_url pairs', () => {
    mockUseQuery.mockReturnValue({
      data: [
        { value: 'oidc-config-1', label: 'oidc-config-1', issuer_url: 'https://issuer-1.example.com' },
        { value: 'oidc-config-2', label: 'oidc-config-2', issuer_url: 'https://issuer-2.example.com' },
      ],
      isLoading: false,
      isError: false,
      error: null,
    })
    const { result } = renderHook(() => useFetchOIDCConfigs(mockSecret))
    expect(result.current.data).toEqual([
      { value: 'oidc-config-1', label: 'oidc-config-1', issuer_url: 'https://issuer-1.example.com' },
      { value: 'oidc-config-2', label: 'oidc-config-2', issuer_url: 'https://issuer-2.example.com' },
    ])
  })
  test('should return empty array when data is undefined', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    })
    const { result } = renderHook(() => useFetchOIDCConfigs(mockSecret))
    expect(result.current.data).toEqual([])
  })
  test('should be disabled when awsAccountId has not been set via fetch', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    })
    renderHook(() => useFetchOIDCConfigs(mockSecret))
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['rosa-hcp-wizard-query-key', 'test-client-id', '', 'oidc-configs'],
        enabled: false,
      })
    )
  })
  test('should enable the query after fetch is called with an awsAccountId', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    })
    const { result, rerender } = renderHook(() => useFetchOIDCConfigs(mockSecret))
    act(() => {
      result.current.fetch('123456789012')
    })
    rerender()
    expect(mockUseQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        queryKey: ['rosa-hcp-wizard-query-key', 'test-client-id', '123456789012', 'oidc-configs'],
        enabled: true,
      })
    )
  })
  test('should forward loading state as isFetching', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    })
    const { result } = renderHook(() => useFetchOIDCConfigs(mockSecret))
    expect(result.current.isFetching).toBe(true)
  })
  test('should return error message string when query errors with an Error instance', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network failure'),
    })
    const { result } = renderHook(() => useFetchOIDCConfigs(mockSecret))
    expect(result.current.error).toBe('Network failure')
  })
  test('should return "Unknown error" when query errors with a non-Error value', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: 'something went wrong',
    })
    const { result } = renderHook(() => useFetchOIDCConfigs(mockSecret))
    expect(result.current.error).toBe('Unknown error')
  })
  test('should return null error when query is not in error state', () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    })
    const { result } = renderHook(() => useFetchOIDCConfigs(mockSecret))
    expect(result.current.error).toBeNull()
  })
  test('should expose a stable fetch function reference', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    })
    const { result, rerender } = renderHook(() => useFetchOIDCConfigs(mockSecret))
    const firstFetch = result.current.fetch
    rerender()
    expect(result.current.fetch).toBe(firstFetch)
  })
})
