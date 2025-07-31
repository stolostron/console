/* Copyright Contributors to the Open Cluster Management project */
import { waitFor } from '@testing-library/react'
import { useIsFleetObservabilityInstalled } from './useIsFleetObservabilityInstalled'
import { renderHook } from '@testing-library/react-hooks'

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  consoleFetchJSON: jest.fn(() => Promise.resolve({ isObservabilityInstalled: true })),
}))

jest.mock('./useIsFleetAvailable', () => ({
  useIsFleetAvailable: jest.fn(() => true),
}))

describe('useIsFleetObservabilityInstalled', () => {
  it('returns fleet configuration', async () => {
    const { result } = renderHook(() => useIsFleetObservabilityInstalled())
    await waitFor(() => expect(result.current[1]).toBeTruthy())
    expect(result.current[0]).toEqual(true)
  })
})
