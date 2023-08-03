/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react-hooks'
import { mockAlertMetrics } from '../routes/Home/Overview/sharedTestMockData'
import { nockRequest } from './nock-util'
import { PrometheusEndpoint, usePrometheusPoll } from './usePrometheusPoll'

// Mock the window.SERVER_FLAGS.prometheusBaseURL
const mockServerFlags = { prometheusBaseURL: '/api/prometheus' }
window.SERVER_FLAGS = mockServerFlags

describe('usePrometheusPoll', () => {
  test('should make a successful QUERY API call and return the response', async () => {
    nockRequest('/api/prometheus/api/v1/query?query=ALERTS', mockAlertMetrics)

    const { result, waitForNextUpdate } = renderHook(() =>
      usePrometheusPoll({
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

  test('should handle API call error and set the error state', async () => {
    nockRequest('/api/prometheus/api/v1/query?query=ALERTS', mockAlertMetrics, 500)

    const { result, waitForNextUpdate } = renderHook(() =>
      usePrometheusPoll({
        endpoint: PrometheusEndpoint.QUERY,
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
})
