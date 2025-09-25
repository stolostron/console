/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { useVirtualMachineDetection } from './useVirtualMachineDetection'
import { useFleetSearchPoll } from '@stolostron/multicluster-sdk'

// Mock the useFleetSearchPoll hook
jest.mock('@stolostron/multicluster-sdk', () => ({
  useFleetSearchPoll: jest.fn(),
}))

const mockUseFleetSearchPoll = useFleetSearchPoll as jest.MockedFunction<typeof useFleetSearchPoll>

describe('useVirtualMachineDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return hasVirtualMachines as true when VMs are found', () => {
    const mockVMs = [{ metadata: { name: 'test-vm' } }]
    mockUseFleetSearchPoll.mockReturnValue([mockVMs, false, undefined, jest.fn()])

    const { result } = renderHook(() => useVirtualMachineDetection())

    expect(result.current.hasVirtualMachines).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeUndefined()
  })

  it('should return hasVirtualMachines as false when no VMs are found', () => {
    mockUseFleetSearchPoll.mockReturnValue([[], false, undefined, jest.fn()])

    const { result } = renderHook(() => useVirtualMachineDetection())

    expect(result.current.hasVirtualMachines).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeUndefined()
  })

  it('should return hasVirtualMachines as false when there is an error', () => {
    const mockError = new Error('Search failed')
    mockUseFleetSearchPoll.mockReturnValue([[], false, mockError, jest.fn()])

    const { result } = renderHook(() => useVirtualMachineDetection())

    expect(result.current.hasVirtualMachines).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(mockError)
  })
})
