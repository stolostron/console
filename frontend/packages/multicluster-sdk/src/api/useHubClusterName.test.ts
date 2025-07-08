/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import * as internal from '../internal/cachedHubClusterName'
import { useHubClusterName } from './useHubClusterName'

jest.mock('../internal/cachedHubClusterName')

describe('testing useHubClusterName Hook', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return cached hub cluster name if cache available', () => {
    void (internal.getCachedHubClusterName as jest.Mock).mockReturnValue('local-cluster')
    const { result } = renderHook(() => useHubClusterName())

    expect(result.current).toEqual(['local-cluster', true, undefined])
  })

  it('should fetch hub cluster name if not cached', async () => {
    void (internal.getCachedHubClusterName as jest.Mock).mockReturnValue(undefined)
    const fetchMock = jest.spyOn(internal, 'fetchHubClusterName').mockResolvedValue('local-cluster')
    const { result, waitForNextUpdate } = renderHook(() => useHubClusterName())
    expect(result.current).toEqual([undefined, false, undefined])
    await waitForNextUpdate()
    expect(fetchMock).toHaveBeenCalled()
    expect(result.current).toEqual(['local-cluster', true, undefined])
  })
})
