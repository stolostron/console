/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { renderHook } from '@testing-library/react-hooks'
import { useQuerySearchDisabledManagedClusters } from './search'
import * as utils from '../resources/utils'
import * as useLocalHub from '../hooks/use-local-hub'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { RecoilRoot } from 'recoil'

// Mock the dependencies
jest.mock('../resources/utils')
jest.mock('../hooks/use-local-hub')

const mockPostRequest = utils.postRequest as jest.MockedFunction<any>
const mockGetBackendUrl = utils.getBackendUrl as jest.MockedFunction<any>
const mockUseLocalHubName = useLocalHub.useLocalHubName as jest.MockedFunction<any>

describe('useQuerySearchDisabledManagedClusters', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks
    mockGetBackendUrl.mockReturnValue('http://localhost:3000')
    mockUseLocalHubName.mockReturnValue('local-cluster')
    mockPostRequest.mockResolvedValue({
      data: {
        searchResult: [
          {
            items: [
              { name: 'cluster1', addon: 'search-collector=false' },
              { name: 'cluster2', addon: 'search-collector=false' },
            ],
          },
        ],
      },
    } as any)
  })

  const renderHookWithRecoil = (callback: () => any) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => {
      return React.createElement(RecoilRoot, { children })
    }
    return renderHook(callback, { wrapper: Wrapper })
  }

  it('should return a function that makes a search request with correct parameters', async () => {
    const { result } = renderHookWithRecoil(() => useQuerySearchDisabledManagedClusters())

    const queryFunction = result.current
    await queryFunction()

    expect(mockGetBackendUrl).toHaveBeenCalled()
    expect(mockPostRequest).toHaveBeenCalledWith('http://localhost:3000/proxy/search', {
      operationName: 'searchResult',
      variables: {
        input: [
          {
            filters: [
              { property: 'kind', values: ['Cluster'] },
              { property: 'addon', values: ['search-collector=false'] },
              { property: 'name', values: ['!local-cluster'] },
            ],
          },
        ],
      },
      query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}',
    })
  })

  it('should use the local hub name from useLocalHubName hook', async () => {
    mockUseLocalHubName.mockReturnValue('custom-hub')

    const { result } = renderHookWithRecoil(() => useQuerySearchDisabledManagedClusters())

    const queryFunction = result.current
    await queryFunction()

    expect(mockPostRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        variables: {
          input: [
            {
              filters: [
                { property: 'kind', values: ['Cluster'] },
                { property: 'addon', values: ['search-collector=false'] },
                { property: 'name', values: ['!custom-hub'] },
              ],
            },
          ],
        },
      })
    )
  })

  it('should handle different hub names correctly', async () => {
    const testCases = [
      { hubName: 'hub-cluster', expectedName: '!hub-cluster' },
      { hubName: 'my-hub', expectedName: '!my-hub' },
      { hubName: '', expectedName: '!' },
    ]

    for (const testCase of testCases) {
      jest.clearAllMocks()
      mockUseLocalHubName.mockReturnValue(testCase.hubName)

      const { result } = renderHookWithRecoil(() => useQuerySearchDisabledManagedClusters())

      const queryFunction = result.current
      await queryFunction()

      expect(mockPostRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          variables: {
            input: [
              {
                filters: [
                  { property: 'kind', values: ['Cluster'] },
                  { property: 'addon', values: ['search-collector=false'] },
                  { property: 'name', values: [testCase.expectedName] },
                ],
              },
            ],
          },
        })
      )
    }
  })

  it('should return the correct search query structure', async () => {
    const { result } = renderHookWithRecoil(() => useQuerySearchDisabledManagedClusters())

    const queryFunction = result.current
    const response = await queryFunction()

    expect(response).toEqual({
      data: {
        searchResult: [
          {
            items: [
              { name: 'cluster1', addon: 'search-collector=false' },
              { name: 'cluster2', addon: 'search-collector=false' },
            ],
          },
        ],
      },
    })
  })

  it('should handle API errors gracefully', async () => {
    const error = new Error('API Error')
    mockPostRequest.mockRejectedValue(error as any)

    const { result } = renderHookWithRecoil(() => useQuerySearchDisabledManagedClusters())

    const queryFunction = result.current

    await expect(queryFunction()).rejects.toThrow('API Error')
  })

  it('should maintain referential stability when localHubName does not change', () => {
    const { result, rerender } = renderHookWithRecoil(() => useQuerySearchDisabledManagedClusters())

    const firstQueryFunction = result.current

    // Rerender with same hub name
    rerender()

    const secondQueryFunction = result.current

    // The function should be the same reference due to useCallback
    expect(firstQueryFunction).toBe(secondQueryFunction)
  })

  it('should create new function when localHubName changes', () => {
    const { result, rerender } = renderHookWithRecoil(() => useQuerySearchDisabledManagedClusters())

    const firstQueryFunction = result.current

    // Change hub name
    mockUseLocalHubName.mockReturnValue('different-hub')
    rerender()

    const secondQueryFunction = result.current

    // The function should be different due to useCallback dependency
    expect(firstQueryFunction).not.toBe(secondQueryFunction)
  })

  it('should use the correct API endpoint', async () => {
    const { result } = renderHookWithRecoil(() => useQuerySearchDisabledManagedClusters())

    const queryFunction = result.current
    await queryFunction()

    expect(mockPostRequest).toHaveBeenCalledWith('http://localhost:3000/proxy/search', expect.any(Object))
  })

  it('should include all required filters in the search query', async () => {
    const { result } = renderHookWithRecoil(() => useQuerySearchDisabledManagedClusters())

    const queryFunction = result.current
    await queryFunction()

    const callArgs = mockPostRequest.mock.calls[0]
    const searchQuery = callArgs[1] as any

    expect(searchQuery.variables.input[0].filters).toHaveLength(3)
    expect(searchQuery.variables.input[0].filters).toEqual([
      { property: 'kind', values: ['Cluster'] },
      { property: 'addon', values: ['search-collector=false'] },
      { property: 'name', values: ['!local-cluster'] },
    ])
  })
})
