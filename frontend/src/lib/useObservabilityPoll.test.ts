/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react-hooks'
import { mockAlertMetrics } from '../routes/Home/Overview/sharedmocks'
import { nockRequest } from './nock-util'
import { ObservabilityEndpoint, useObservabilityPoll } from './useObservabilityPoll'

describe('useObservabilityPoll', () => {
  test('should make a successful QUERY API call and return the response', async () => {
    nockRequest('/api/v1/query?query=ALERTS', mockAlertMetrics)

    const { result, waitForNextUpdate } = renderHook(() =>
      useObservabilityPoll({
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

  test('should handle API call error and set the error state', async () => {
    nockRequest('/api/v1/query?query=ALERTS', mockAlertMetrics, 500)

    const { result, waitForNextUpdate } = renderHook(() =>
      useObservabilityPoll({
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
})
