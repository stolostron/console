/* Copyright Contributors to the Open Cluster Management project */
import { waitFor } from '@testing-library/react'
import { useIsFleetPrometheusAvailable } from './useIsFleetPrometheusAvailable'
import { renderHook } from '@testing-library/react-hooks'

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useK8sWatchResource: (options: any) => {
    if (options.groupVersionKind.kind === 'MultiClusterObservability') {
      return [
        [
          {
            status: {
              conditions: [{ type: 'Ready', status: 'True' }],
            },
          },
        ],
        true,
        null,
      ]
    }
    return [[], false, null]
  },
}))

describe('useIsFleetPrometheusAvailable', () => {
  it('returns true when Prometheus is available', async () => {
    const { result } = renderHook(() => useIsFleetPrometheusAvailable())
    await waitFor(() => expect(result.current[1]).toBeTruthy())
    expect(result.current[0]).toBe(true)
  })
})
