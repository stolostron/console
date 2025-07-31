/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { useHubClusterName } from './useHubClusterName'
import { useIsFleetAvailable } from './useIsFleetAvailable'
import { waitFor } from '@testing-library/react'
import { NO_FLEET_AVAILABLE_ERROR } from '../internal/constants'

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  consoleFetchJSON: jest.fn(() => Promise.resolve({ localHubName: 'local-cluster' })),
}))

jest.mock('./useIsFleetAvailable', () => ({
  useIsFleetAvailable: jest.fn(),
}))

const mockUseIsFleetAvailable = useIsFleetAvailable as jest.Mock

describe('testing useHubClusterName Hook', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return cached hub cluster name if cache available', async () => {
    mockUseIsFleetAvailable.mockReturnValue(true)
    const { result } = renderHook(() => useHubClusterName())
    await waitFor(() => expect(result.current[1]).toBeTruthy())
    expect(result.current).toEqual(['local-cluster', true, null] as any)
  })

  it('should return error if fleet is not available', async () => {
    mockUseIsFleetAvailable.mockReturnValue(false)
    const { result } = renderHook(() => useHubClusterName())
    expect(result.current).toEqual([undefined, false, new Error(NO_FLEET_AVAILABLE_ERROR)])
  })
})
