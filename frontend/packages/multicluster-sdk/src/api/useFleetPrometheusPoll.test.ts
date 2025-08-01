/* Copyright Contributors to the Open Cluster Management project */
import { act, renderHook } from '@testing-library/react-hooks'
import { useFleetPrometheusPoll } from './useFleetPrometheusPoll'
import { consoleFetch, PrometheusEndpoint, usePrometheusPoll } from '@openshift-console/dynamic-plugin-sdk'

const mockOpenshiftPrometheusHook = usePrometheusPoll as jest.MockedFunction<typeof usePrometheusPoll>
const mockConsoleFetch = consoleFetch as jest.MockedFunction<typeof consoleFetch>

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
  useHubClusterName: jest.fn(() => ['hub-cluster']),
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
      `/api/proxy/plugin/acm/console/multicloud/observability/query?namespace=${useFleetProps.namespace}&query=${useFleetProps.query}`
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
      `/api/proxy/plugin/acm/console/multicloud/observability/query?query=${useFleetProps.query}`
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
})
