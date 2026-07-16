/* Copyright Contributors to the Open Cluster Management project */

import { renderHook, act } from '@testing-library/react-hooks'
import { useClusterNameUniquenessCheck } from './useCheckClusterNameUniquness'
import { getWizardClusterNameUniqueness } from '~/lib/rosa-hcp-api'
import type { SelectedSecret } from '../constants/types'
import type { ClusterNameUniquenessResponse } from '~/resources'

jest.mock('~/lib/rosa-hcp-api', () => ({
  getWizardClusterNameUniqueness: jest.fn(),
}))

const mockGetWizardClusterNameUniqueness = getWizardClusterNameUniqueness as jest.MockedFunction<
  typeof getWizardClusterNameUniqueness
>

const mockSecret: SelectedSecret = {
  client_id: 'test-client-id',
  client_secret: 'test-client-secret',
}

const uniqueNameResponse: ClusterNameUniquenessResponse = {
  kind: 'ClusterList',
  page: 1,
  size: 0,
  total: 0,
  items: [],
}

const takenNameResponse: ClusterNameUniquenessResponse = {
  kind: 'ClusterList',
  page: 1,
  size: 1,
  total: 1,
  items: [
    {
      kind: 'Cluster',
      id: 'cluster-123',
      name: 'taken-cluster',
      external_id: 'ext-123',
      display_name: 'taken-cluster',
    },
  ],
}

describe('useClusterNameUniquenessCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should initialize with no error and not fetching', () => {
    const { result } = renderHook(() => useClusterNameUniquenessCheck(mockSecret))

    expect(result.current.clusterNameValidation).toEqual({
      error: null,
      isFetching: false,
    })
  })

  test('should return null error when cluster name is unique', async () => {
    mockGetWizardClusterNameUniqueness.mockResolvedValue(uniqueNameResponse)

    const { result } = renderHook(() => useClusterNameUniquenessCheck(mockSecret))

    let error: string | null = null
    await act(async () => {
      error = await result.current.checkClusterNameUniqueness('unique-cluster')
    })

    expect(error).toBeNull()
    expect(result.current.clusterNameValidation).toEqual({
      error: null,
      isFetching: false,
    })
    expect(mockGetWizardClusterNameUniqueness).toHaveBeenCalledWith('test-client-id', 'test-client-secret', {
      cluster_name: 'unique-cluster',
      region: undefined,
    })
  })

  test('should return error message when cluster name is taken', async () => {
    mockGetWizardClusterNameUniqueness.mockResolvedValue(takenNameResponse)

    const { result } = renderHook(() => useClusterNameUniquenessCheck(mockSecret))

    let error: string | null = null
    await act(async () => {
      error = await result.current.checkClusterNameUniqueness('taken-cluster')
    })

    expect(error).toBe('Cluster name "taken-cluster" already exists. Choose a different name.')
    expect(result.current.clusterNameValidation).toEqual({
      error: 'Cluster name "taken-cluster" already exists. Choose a different name.',
      isFetching: false,
    })
  })

  test('should pass region to API when provided', async () => {
    mockGetWizardClusterNameUniqueness.mockResolvedValue(uniqueNameResponse)

    const { result } = renderHook(() => useClusterNameUniquenessCheck(mockSecret))

    await act(async () => {
      await result.current.checkClusterNameUniqueness('my-cluster', 'us-east-1')
    })

    expect(mockGetWizardClusterNameUniqueness).toHaveBeenCalledWith('test-client-id', 'test-client-secret', {
      cluster_name: 'my-cluster',
      region: 'us-east-1',
    })
  })

  test('should set error and rethrow when API call fails', async () => {
    const apiError = new Error('Network failure')
    mockGetWizardClusterNameUniqueness.mockRejectedValue(apiError)

    const { result } = renderHook(() => useClusterNameUniquenessCheck(mockSecret))

    await act(async () => {
      await expect(result.current.checkClusterNameUniqueness('my-cluster')).rejects.toThrow('Network failure')
    })

    expect(result.current.clusterNameValidation).toEqual({
      error: 'Network failure',
      isFetching: false,
    })
  })

  test('should use fallback message for non-Error exceptions', async () => {
    mockGetWizardClusterNameUniqueness.mockRejectedValue('unexpected string error')

    const { result } = renderHook(() => useClusterNameUniquenessCheck(mockSecret))

    await act(async () => {
      await expect(result.current.checkClusterNameUniqueness('my-cluster')).rejects.toBe('unexpected string error')
    })

    expect(result.current.clusterNameValidation).toEqual({
      error: 'Failed to check cluster name availability',
      isFetching: false,
    })
  })

  test('should clear previous error when a new check starts', async () => {
    mockGetWizardClusterNameUniqueness
      .mockResolvedValueOnce(takenNameResponse)
      .mockResolvedValueOnce(uniqueNameResponse)

    const { result } = renderHook(() => useClusterNameUniquenessCheck(mockSecret))

    await act(async () => {
      await result.current.checkClusterNameUniqueness('taken-cluster')
    })
    expect(result.current.clusterNameValidation.error).not.toBeNull()

    await act(async () => {
      await result.current.checkClusterNameUniqueness('unique-cluster')
    })
    expect(result.current.clusterNameValidation).toEqual({
      error: null,
      isFetching: false,
    })
  })

  test('should maintain stable callback reference across renders', () => {
    const { result, rerender } = renderHook(() => useClusterNameUniquenessCheck(mockSecret))

    const firstCallback = result.current.checkClusterNameUniqueness
    rerender()
    expect(result.current.checkClusterNameUniqueness).toBe(firstCallback)
  })
})
