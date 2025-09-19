/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react-hooks'
import { waitFor } from '@testing-library/react'
import { useClusterVersion } from './use-cluster-version'
import * as resourceRequestModule from '../resources/utils/resource-request'

// Mock the resource-request module
jest.mock('../resources/utils/resource-request')

const mockedFetchGet = resourceRequestModule.fetchGet as jest.MockedFunction<typeof resourceRequestModule.fetchGet>
const mockedGetBackendUrl = resourceRequestModule.getBackendUrl as jest.MockedFunction<
  typeof resourceRequestModule.getBackendUrl
>

describe('useClusterVersion', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetBackendUrl.mockReturnValue('http://localhost:4000')
  })

  it('should return loading state initially', () => {
    mockedFetchGet.mockImplementation(() => new Promise(() => {})) // Never resolves

    const { result } = renderHook(() => useClusterVersion())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.version).toBeUndefined()
    expect(result.current.error).toBeUndefined()
  })

  it('should return cluster version on successful API call', async () => {
    const mockResponse = {
      headers: new Headers(),
      status: 200,
      data: {
        version: '4.21.0',
      },
    }

    mockedFetchGet.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useClusterVersion())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.version).toBe('4.21.0')
    expect(result.current.error).toBeUndefined()
    expect(mockedFetchGet).toHaveBeenCalledWith('http://localhost:4000/cluster-version', expect.any(AbortSignal))
  })

  it('should handle API errors from backend', async () => {
    const mockResponse = {
      headers: new Headers(),
      status: 200,
      data: {
        error: 'Failed to get cluster version: API request failed',
      },
    }

    mockedFetchGet.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useClusterVersion())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.version).toBeUndefined()
    expect(result.current.error).toBe('Failed to get cluster version: API request failed')
  })

  it('should handle network errors', async () => {
    const mockError = new Error('Network error')
    mockedFetchGet.mockRejectedValue(mockError)

    const { result } = renderHook(() => useClusterVersion())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.version).toBeUndefined()
    expect(result.current.error).toBe('Network error')
  })

  it('should handle non-Error exceptions', async () => {
    mockedFetchGet.mockRejectedValue('String error')

    const { result } = renderHook(() => useClusterVersion())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.version).toBeUndefined()
    expect(result.current.error).toBe('Failed to fetch cluster version')
  })
})
