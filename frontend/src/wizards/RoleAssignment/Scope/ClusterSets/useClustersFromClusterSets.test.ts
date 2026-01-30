/* Copyright Contributors to the Open Cluster Management project */
import { act, renderHook } from '@testing-library/react-hooks'
import { waitFor } from '@testing-library/react'
import { useClustersFromClusterSets } from './useClustersFromClusterSets'
import { testCases } from './useClustersFromClusterSets.fixtures'
import { useAllClusters } from '../../../../routes/Infrastructure/Clusters/ManagedClusters/components/useAllClusters'

jest.mock('../../../../routes/Infrastructure/Clusters/ManagedClusters/components/useAllClusters', () => ({
  useAllClusters: jest.fn(),
}))

const mockUseAllClusters = useAllClusters as jest.MockedFunction<typeof useAllClusters>

describe('useClustersFromClusterSets', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each(testCases)('$description', async ({ selectedClusterSets, mockClusters, expectedResult }) => {
    mockUseAllClusters.mockReturnValue(mockClusters)

    const { result } = renderHook(() => useClustersFromClusterSets(selectedClusterSets))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    await waitFor(
      () => {
        expect(result.current).toEqual(expectedResult)
      },
      { timeout: 500 }
    )
  })
})
