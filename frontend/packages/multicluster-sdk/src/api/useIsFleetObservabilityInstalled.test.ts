/* Copyright Contributors to the Open Cluster Management project */
import { waitFor } from '@testing-library/react'
import { useIsFleetObservationInstalled } from './useIsFleetObservabilityInstalled'
import { renderHook } from '@testing-library/react-hooks'

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  consoleFetchJSON: jest.fn(() => Promise.resolve({ isObservabilityInstalled: true })),
}))

describe('useIsFleetObservabilityInstalled', () => {
  it('returns fleet configuration', async () => {
    const { result } = renderHook(() => useIsFleetObservationInstalled())
    await new Promise((resolve) => setTimeout(resolve, 0))
    await waitFor(() => expect(result.current[1]).toBeFalsy())
    expect(result.current[0]).toEqual(true)
  })
})
