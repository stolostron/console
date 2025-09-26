/* Copyright Contributors to the Open Cluster Management project */
import { act, renderHook } from '@testing-library/react-hooks'
import { useFleetPrometheusPoll } from './useFleetPrometheusPoll'
import { consoleFetch, PrometheusEndpoint, usePrometheusPoll } from '@openshift-console/dynamic-plugin-sdk'
import { useHubClusterName } from './useHubClusterName'
import { useIsFleetObservabilityInstalled } from './useIsFleetObservabilityInstalled'

const mockOpenshiftPrometheusHook = usePrometheusPoll as jest.MockedFunction<typeof usePrometheusPoll>
const mockConsoleFetch = consoleFetch as jest.MockedFunction<typeof consoleFetch>
const mockUseHubClusterName = useHubClusterName as jest.MockedFunction<typeof useHubClusterName>
const mockUseIsFleetObservabilityInstalled = useIsFleetObservabilityInstalled as jest.MockedFunction<
  typeof useIsFleetObservabilityInstalled
>

// Mock the return values for the URL poll
mockOpenshiftPrometheusHook.mockReturnValue([undefined, true, undefined])

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  usePrometheusPoll: jest.fn(),
  consoleFetchJSON: jest.fn(),
  consoleFetch: jest.fn(() => Promise.resolve({ json: () => Promise.resolve({}) })),
  PrometheusPollProps: '',
  PrometheusEndpoint: {
    LABEL: 'api/v1/label',
    QUERY: 'api/v1/query',
    QUERY_RANGE: 'api/v1/query_range',
    RULES: 'api/v1/rules',
    TARGETS: 'api/v1/targets',
  },
}))

jest.mock('./useHubClusterName', () => ({
  useHubClusterName: jest.fn(() => ['hub-cluster', true, undefined]),
}))

jest.mock('./useIsFleetObservabilityInstalled', () => ({
  useIsFleetObservabilityInstalled: jest.fn(() => [true, true, undefined]),
}))

jest.mock('../internal/useURLPoll', () => ({
  useURLPoll: jest.fn(),
}))

jest.mock('./constants', () => ({
  PROMETHEUS_BASE_PATH: '/',
  PROMETHEUS_TENANCY_BASE_PATH: '/',
  ALERTMANAGER_BASE_PATH: '/',
  ALERTMANAGER_USER_WORKLOAD_BASE_PATH: '/',
  ALERTMANAGER_TENANCY_BASE_PATH: 'api/alertmanager-tenancy', // remove it once it get added to SERVER_FLAGS
  DEFAULT_PROMETHEUS_SAMPLES: 60,
  DEFAULT_PROMETHEUS_TIMESPAN: 1000 * 60 * 60,
}))

describe('useFleetPrometheusPoll', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Set default mock return values
    mockUseHubClusterName.mockReturnValue(['hub-cluster', true, undefined])
    mockUseIsFleetObservabilityInstalled.mockReturnValue([true, true, undefined])

    // Set up useURLPoll mock to call consoleFetch when URL is provided
    const { useURLPoll } = jest.requireMock('../internal/useURLPoll')
    useURLPoll.mockImplementation((url: string | null) => {
      if (url && typeof url === 'string') {
        mockConsoleFetch(url)
      }
      return [undefined, true, undefined]
    })
  })

  it('useFleet on cluster', async () => {
    const useFleetProps = {
      delay: 1000,
      endpoint: PrometheusEndpoint.QUERY,
      namespace: 'default',
      query: 'test_query',
      cluster: 'test-cluster',
      allClusters: false,
    }

    await act(() => {
      renderHook(() => useFleetPrometheusPoll(useFleetProps))
    })

    expect(mockOpenshiftPrometheusHook).toHaveBeenCalledWith(
      expect.objectContaining({
        query: undefined,
      })
    )

    expect(mockConsoleFetch.mock.calls[0][0]).toBe(
      `/api/proxy/plugin/mce/console/multicloud/observability/query?namespace=${useFleetProps.namespace}&query=${useFleetProps.query}`
    )
  })

  it('useFleet on all clusters', async () => {
    const useFleetProps = {
      delay: 1000,
      endpoint: PrometheusEndpoint.QUERY,
      query: 'test_query',
      cluster: undefined,
      allClusters: true,
    }

    await act(() => {
      renderHook(() => useFleetPrometheusPoll(useFleetProps))
    })

    expect(mockOpenshiftPrometheusHook).toHaveBeenCalledWith(
      expect.objectContaining({
        query: undefined,
      })
    )

    expect(mockConsoleFetch.mock.calls[0][0]).toBe(
      `/api/proxy/plugin/mce/console/multicloud/observability/query?query=${useFleetProps.query}`
    )
  })

  it('query hub cluster', async () => {
    const useFleetProps = {
      delay: 1000,
      endpoint: PrometheusEndpoint.QUERY,
      query: 'test_query',
      cluster: 'hub-cluster',
      allClusters: false,
    }

    await act(() => {
      renderHook(() => useFleetPrometheusPoll(useFleetProps))
    })

    expect(mockOpenshiftPrometheusHook).toHaveBeenCalledWith(
      expect.objectContaining({
        query: useFleetProps.query,
      })
    )

    expect(mockConsoleFetch).not.toHaveBeenCalled()
  })

  it('use Openshift sdk prometheus', async () => {
    const useFleetProps = {
      delay: 1000,
      endpoint: PrometheusEndpoint.QUERY,
      query: 'test_query',
      cluster: undefined,
      allClusters: false,
    }

    await act(() => {
      renderHook(() => useFleetPrometheusPoll(useFleetProps))
    })

    expect(mockOpenshiftPrometheusHook).toHaveBeenCalledWith(
      expect.objectContaining({
        query: useFleetProps.query,
      })
    )

    expect(mockConsoleFetch).not.toHaveBeenCalled()
  })

  it('should return error when observability is not installed for fleet queries', async () => {
    mockUseIsFleetObservabilityInstalled.mockReturnValue([false, true, undefined])

    const useFleetProps = {
      delay: 1000,
      endpoint: PrometheusEndpoint.QUERY,
      namespace: 'default',
      query: 'test_query',
      cluster: 'test-cluster',
      allClusters: false,
    }

    const { result } = renderHook(() => useFleetPrometheusPoll(useFleetProps))

    // Should return error when observability is not installed for fleet queries
    expect(result.current).toEqual([undefined, false, 'Multicluster observability is not installed on this cluster'])
  })

  it('should return loading state when observability installation status is loading for fleet queries', async () => {
    mockUseIsFleetObservabilityInstalled.mockReturnValue([undefined, false, undefined])

    const useFleetProps = {
      delay: 1000,
      endpoint: PrometheusEndpoint.QUERY,
      namespace: 'default',
      query: 'test_query',
      cluster: 'test-cluster',
      allClusters: false,
    }

    const { result } = renderHook(() => useFleetPrometheusPoll(useFleetProps))

    // Should return loading state (false loaded) when observability status is loading for fleet queries
    expect(result.current).toEqual([undefined, false, undefined])
  })

  it('should return error when fetching observability status fails for fleet queries', async () => {
    const observabilityError = new Error('Failed to fetch observability status')
    mockUseIsFleetObservabilityInstalled.mockReturnValue([undefined, false, observabilityError])

    const useFleetProps = {
      delay: 1000,
      endpoint: PrometheusEndpoint.QUERY,
      namespace: 'default',
      query: 'test_query',
      cluster: 'test-cluster',
      allClusters: false,
    }

    const { result } = renderHook(() => useFleetPrometheusPoll(useFleetProps))

    // Should return the error when fetching observability status fails for fleet queries
    expect(result.current).toEqual([undefined, false, observabilityError])
  })

  it('should return loading state when hub cluster name is loading', async () => {
    mockUseHubClusterName.mockReturnValue([undefined, false, undefined])

    const useFleetProps = {
      delay: 1000,
      endpoint: PrometheusEndpoint.QUERY,
      namespace: 'default',
      query: 'test_query',
      cluster: 'test-cluster',
      allClusters: false,
    }

    const { result } = renderHook(() => useFleetPrometheusPoll(useFleetProps))

    expect(result.current).toEqual([undefined, false, undefined])
  })

  it('should return error when fetching hub cluster name fails', async () => {
    const hubClusterError = new Error('Failed to fetch hub cluster name')
    mockUseHubClusterName.mockReturnValue([undefined, false, hubClusterError])

    const useFleetProps = {
      delay: 1000,
      endpoint: PrometheusEndpoint.QUERY,
      namespace: 'default',
      query: 'test_query',
      cluster: 'test-cluster',
      allClusters: false,
    }

    const { result } = renderHook(() => useFleetPrometheusPoll(useFleetProps))

    expect(result.current).toEqual([undefined, false, hubClusterError])
  })

  it('should return error when observability is not installed for allClusters queries', async () => {
    mockUseIsFleetObservabilityInstalled.mockReturnValue([false, true, undefined])

    const useFleetProps = {
      delay: 1000,
      endpoint: PrometheusEndpoint.QUERY,
      query: 'test_query',
      cluster: undefined,
      allClusters: true,
    }

    const { result } = renderHook(() => useFleetPrometheusPoll(useFleetProps))

    // Should return error when observability is not installed for allClusters queries
    expect(result.current).toEqual([undefined, false, 'Multicluster observability is not installed on this cluster'])
  })
})
