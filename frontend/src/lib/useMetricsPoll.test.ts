/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react-hooks'
import { mockAlertMetrics } from '../routes/Home/Overview/sharedmocks'
import { nockRequest } from './nock-util'
import { ObservabilityEndpoint, PrometheusEndpoint, useMetricsPoll } from './useMetricsPoll'

describe('useMetricsPoll', () => {
  test('should make a successful Observability QUERY API call and return the response', async () => {
    nockRequest('/observability/query?query=ALERTS', mockAlertMetrics)

    const { result, waitForNextUpdate } = renderHook(() =>
      useMetricsPoll({
        endpoint: ObservabilityEndpoint.QUERY,
        query: 'ALERTS',
      })
    )

    expect(result.current[0]).toBeUndefined()
    expect(result.current[1]).toBeUndefined()
    expect(result.current[2]).toBe(true)

    await waitForNextUpdate()

    expect(result.current[0]).toEqual(mockAlertMetrics)
    expect(result.current[1]).toBeUndefined()
    expect(result.current[2]).toBe(false)
  })

  test('should handle Observability API call error and set the error state', async () => {
    nockRequest('/observability/query?query=ALERTS', mockAlertMetrics, 500)

    const { result, waitForNextUpdate } = renderHook(() =>
      useMetricsPoll({
        endpoint: ObservabilityEndpoint.QUERY,
        query: 'ALERTS',
      })
    )

    expect(result.current[0]).toBeUndefined()
    expect(result.current[1]).toBeUndefined()
    expect(result.current[2]).toBe(true)

    await waitForNextUpdate()

    expect(result.current[0]).toBeUndefined()
    expect(result.current[1]).toEqual('Internal Server Error')
    expect(result.current[2]).toBe(false)
  })

  test('should make a successful Prometheus QUERY API call and return the response', async () => {
    nockRequest('/prometheus/query?query=ALERTS', mockAlertMetrics)

    const { result, waitForNextUpdate } = renderHook(() =>
      useMetricsPoll({
        endpoint: PrometheusEndpoint.QUERY,
        query: 'ALERTS',
      })
    )

    expect(result.current[0]).toBeUndefined()
    expect(result.current[1]).toBeUndefined()
    expect(result.current[2]).toBe(true)

    await waitForNextUpdate()

    expect(result.current[0]).toEqual(mockAlertMetrics)
    expect(result.current[1]).toBeUndefined()
    expect(result.current[2]).toBe(false)
  })
})
