/* Copyright Contributors to the Open Cluster Management project */
import { waitFor } from '@testing-library/react'
import { useFleetConfiguration } from './useFleetConfiguration'
import { renderHook } from '@testing-library/react-hooks'

const fleetConfig = {
  isGlobalHub: true,
  localHubName: 'local-cluster',
  isHubSelfManaged: false,
  isObservabilityInstalled: true,
}
jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  consoleFetch: jest.fn(() => Promise.resolve({ json: () => Promise.resolve(fleetConfig) })),
}))

describe('useFleetConfiguration', () => {
  it('returns fleet configuration', async () => {
    const { result } = renderHook(() => useFleetConfiguration())
    await new Promise((resolve) => setTimeout(resolve, 0))
    await waitFor(() => expect(result.current[1]).toBeTruthy())
    expect(result.current[0]).toEqual(fleetConfig)
  })
})
