/* Copyright Contributors to the Open Cluster Management project */
import { waitFor } from '@testing-library/react'
import { useIsFleetPrometheusInstalled } from './useIsFleetPrometheusInstalled'
import { renderHook } from '@testing-library/react-hooks'
import { REQUIRED_PROVIDER_FLAG } from './constants'

const useFlagResult: boolean | undefined = true

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useFlag: (flag: string) => (flag === REQUIRED_PROVIDER_FLAG ? useFlagResult : undefined),
  consoleFetchJSON: jest.fn(
    () => Promise.resolve({ items: [{ metadata: { name: 'observability-controller' } }] }) as any
  ),
}))

describe('useIsFleetPrometheusInstalled', () => {
  it('returns true when Prometheus is available', async () => {
    const { result } = renderHook(() => useIsFleetPrometheusInstalled())
    await waitFor(() => expect(result.current[1]).toBeTruthy())
    expect(result.current[0]).toBe(true)
  })
})
