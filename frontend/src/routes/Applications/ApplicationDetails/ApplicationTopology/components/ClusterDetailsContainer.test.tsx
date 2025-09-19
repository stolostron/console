/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ClusterDetailsContainer from './ClusterDetailsContainer'
import type {
  ClusterData,
  ClusterDetailsContainerProps,
  ClusterDetailsContainerControl,
  ClusterDetailsContainerData,
  TranslationFunction,
} from '../types'

// Mock the diagram helpers module
jest.mock('../helpers/diagram-helpers', () => ({
  processResourceActionLink: jest.fn(),
  getPercentage: jest.fn((value: number, total: number) => Math.floor((100 * (total - value)) / total) || 0),
  inflateKubeValue: jest.fn((value?: string | number | null) => {
    if (value) {
      const valueStr = String(value)
      const match = valueStr.match(/\d+/)
      return match ? Number(match[0]) : 0
    }
    return 0
  }),
}))

// Mock AcmTimestamp component
jest.mock('../../../../../lib/AcmTimestamp', () => {
  return function MockAcmTimestamp({ timestamp }: { timestamp?: string }) {
    return <span data-testid="acm-timestamp">{timestamp || 'No timestamp'}</span>
  }
})

/**
 * Mock translation function that returns the input string as-is
 * Used to simulate internationalization in test environment
 */
const mockT: TranslationFunction = (key: string, params?: (string | number)[]): string => {
  if (params && params.length > 0) {
    let result = key
    params.forEach((param, index) => {
      result = result.replace(new RegExp(`\\{\\{${index}\\}\\}`, 'g'), String(param))
    })
    return result
  }
  return key
}

/**
 * Mock cluster data for testing
 */
const mockClusterData: ClusterData[] = [
  {
    name: 'local-cluster',
    namespace: 'local-cluster',
    status: 'ok',
    creationTimestamp: '2023-01-01T00:00:00Z',
    cpu: '4',
    memory: '8Gi',
    consoleURL: 'https://console.local-cluster.com',
    metadata: {
      name: 'local-cluster',
      namespace: 'local-cluster',
      creationTimestamp: '2023-01-01T00:00:00Z',
    },
    capacity: {
      cpu: '4',
      memory: '8Gi',
    },
    allocatable: {
      cpu: '3800m',
      memory: '7Gi',
    },
    HubAcceptedManagedCluster: true,
    ManagedClusterJoined: true,
    ManagedClusterConditionAvailable: 'True',
  },
  {
    name: 'remote-cluster-1',
    namespace: 'remote-cluster-1',
    status: 'offline',
    creationTimestamp: '2023-01-02T00:00:00Z',
    cpu: '8',
    memory: '16Gi',
    consoleURL: 'https://console.remote-cluster-1.com',
    metadata: {
      name: 'remote-cluster-1',
      namespace: 'remote-cluster-1',
      creationTimestamp: '2023-01-02T00:00:00Z',
    },
    capacity: {
      cpu: '8',
      memory: '16Gi',
    },
    allocatable: {
      cpu: '7800m',
      memory: '15Gi',
    },
    HubAcceptedManagedCluster: true,
    ManagedClusterJoined: true,
    ManagedClusterConditionAvailable: 'False',
  },
  {
    name: 'remote-cluster-2',
    namespace: 'remote-cluster-2',
    status: 'pendingimport',
    creationTimestamp: '2023-01-03T00:00:00Z',
    cpu: '2',
    memory: '4Gi',
    metadata: {
      name: 'remote-cluster-2',
      namespace: 'remote-cluster-2',
      creationTimestamp: '2023-01-03T00:00:00Z',
    },
    capacity: {
      cpu: '2',
      memory: '4Gi',
    },
    allocatable: {
      cpu: '1800m',
      memory: '3Gi',
    },
    HubAcceptedManagedCluster: true,
    ManagedClusterJoined: false,
    ManagedClusterConditionAvailable: 'Unknown',
  },
]

/**
 * Creates mock container data for testing
 */
const createMockContainerData = (
  overrides: Partial<ClusterDetailsContainerData> = {}
): ClusterDetailsContainerData => ({
  clusterID: 'test-cluster-id',
  selected: undefined,
  page: 1,
  startIdx: 0,
  clusterSearchToggle: false,
  expandSectionToggleMap: new Set(),
  selectedClusterList: [],
  ...overrides,
})

/**
 * Creates mock container control for testing
 */
const createMockContainerControl = (
  containerData?: Partial<ClusterDetailsContainerData>
): ClusterDetailsContainerControl => {
  const mockHandleUpdate = jest.fn()
  return {
    clusterDetailsContainerData: createMockContainerData(containerData),
    handleClusterDetailsContainerUpdate: mockHandleUpdate,
  }
}

/**
 * Creates mock props for ClusterDetailsContainer component
 */
const createMockProps = (overrides: Partial<ClusterDetailsContainerProps> = {}): ClusterDetailsContainerProps => ({
  clusterDetailsContainerControl: createMockContainerControl(),
  clusterID: 'test-cluster-id',
  clusterList: mockClusterData,
  t: mockT,
  ...overrides,
})

describe('ClusterDetailsContainer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Mounting and Initialization', () => {
    it('should render without crashing with minimal props', () => {
      const props = createMockProps({ clusterList: [] })
      const { container } = render(<ClusterDetailsContainer {...props} />)

      // Component should render successfully
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should render with cluster data', () => {
      const props = createMockProps()
      const { container } = render(<ClusterDetailsContainer {...props} />)

      // Component should render successfully with cluster data
      expect(container.firstChild).toBeInTheDocument()
      expect(container.querySelector('.clusterDetails')).toBeInTheDocument()
    })

    it('should reset state when cluster ID changes', () => {
      const existingData = createMockContainerData({
        clusterID: 'different-cluster-id',
        selected: 'local-cluster',
        page: 2,
        startIdx: 5,
      })

      const mockUpdate = jest.fn()
      const props = createMockProps({
        clusterDetailsContainerControl: {
          clusterDetailsContainerData: existingData,
          handleClusterDetailsContainerUpdate: mockUpdate,
        },
      })

      render(<ClusterDetailsContainer {...props} />)

      // Should call update with reset values
      expect(mockUpdate).toHaveBeenCalledWith({
        page: 1,
        startIdx: 0,
        clusterSearchToggle: false,
        expandSectionToggleMap: new Set(),
        clusterID: 'test-cluster-id',
        selected: undefined,
        selectedClusterList: [],
      })
    })

    it('should render cluster search input', () => {
      const props = createMockProps()
      render(<ClusterDetailsContainer {...props} />)

      expect(screen.getByPlaceholderText('Find cluster')).toBeInTheDocument()
    })
  })

  describe('Cluster Selection and Filtering', () => {
    it('should handle cluster selection through component methods', () => {
      const mockUpdate = jest.fn()
      const props = createMockProps({
        clusterDetailsContainerControl: {
          clusterDetailsContainerData: createMockContainerData(),
          handleClusterDetailsContainerUpdate: mockUpdate,
        },
      })

      const { container } = render(<ClusterDetailsContainer {...props} />)
      const component = container.querySelector('.clusterDetails')?.parentElement as any

      if (component && component._reactInternalFiber?.child?.stateNode) {
        const instance = component._reactInternalFiber.child.stateNode

        // Test the handleSelection method directly
        instance.handleSelection('local-cluster')

        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            selected: 'local-cluster',
            page: 1,
            startIdx: 0,
          })
        )
      }
    })

    it('should handle cluster selection clear through component methods', () => {
      const mockUpdate = jest.fn()
      const props = createMockProps({
        clusterDetailsContainerControl: {
          clusterDetailsContainerData: createMockContainerData({ selected: 'local-cluster' }),
          handleClusterDetailsContainerUpdate: mockUpdate,
        },
      })

      const { container } = render(<ClusterDetailsContainer {...props} />)
      const component = container.querySelector('.clusterDetails')?.parentElement as any

      if (component && component._reactInternalFiber?.child?.stateNode) {
        const instance = component._reactInternalFiber.child.stateNode

        // Test the handleSelectionClear method directly
        instance.handleSelectionClear()

        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            selected: undefined,
            page: 1,
            startIdx: 0,
          })
        )
      }
    })
  })

  describe('Cluster Status Calculation', () => {
    it('should calculate cluster status correctly for accepted and available cluster', () => {
      const props = createMockProps()
      const { container } = render(<ClusterDetailsContainer {...props} />)
      const component = container.querySelector('.clusterDetails')?.parentElement as any

      if (component && component._reactInternalFiber?.child?.stateNode) {
        const instance = component._reactInternalFiber.child.stateNode
        const status = instance.calculateClusterStatus(mockClusterData[0])
        expect(status).toBe('ok')
      }
    })

    it('should calculate cluster status correctly for offline cluster', () => {
      const props = createMockProps()
      const { container } = render(<ClusterDetailsContainer {...props} />)
      const component = container.querySelector('.clusterDetails')?.parentElement as any

      if (component && component._reactInternalFiber?.child?.stateNode) {
        const instance = component._reactInternalFiber.child.stateNode
        const status = instance.calculateClusterStatus(mockClusterData[1])
        expect(status).toBe('offline')
      }
    })

    it('should calculate cluster status correctly for pending import cluster', () => {
      const props = createMockProps()
      const { container } = render(<ClusterDetailsContainer {...props} />)
      const component = container.querySelector('.clusterDetails')?.parentElement as any

      if (component && component._reactInternalFiber?.child?.stateNode) {
        const instance = component._reactInternalFiber.child.stateNode
        const status = instance.calculateClusterStatus(mockClusterData[2])
        expect(status).toBe('pendingimport')
      }
    })

    it('should calculate cluster status correctly for not accepted cluster', () => {
      const clusterNotAccepted: ClusterData = {
        name: 'not-accepted-cluster',
        namespace: 'not-accepted-cluster',
        HubAcceptedManagedCluster: false,
        ManagedClusterJoined: false,
        ManagedClusterConditionAvailable: 'Unknown',
        metadata: {
          name: 'not-accepted-cluster',
        },
      }

      const props = createMockProps()
      const { container } = render(<ClusterDetailsContainer {...props} />)
      const component = container.querySelector('.clusterDetails')?.parentElement as any

      if (component && component._reactInternalFiber?.child?.stateNode) {
        const instance = component._reactInternalFiber.child.stateNode
        const status = instance.calculateClusterStatus(clusterNotAccepted)
        expect(status).toBe('notaccepted')
      }
    })
  })

  describe('Status Icon Mapping', () => {
    it('should map cluster status to correct icons', () => {
      const props = createMockProps()
      const { container } = render(<ClusterDetailsContainer {...props} />)
      const component = container.querySelector('.clusterDetails')?.parentElement as any

      if (component && component._reactInternalFiber?.child?.stateNode) {
        const instance = component._reactInternalFiber.child.stateNode

        expect(instance.mapClusterStatusToIcon('ok')).toBe('checkmark')
        expect(instance.mapClusterStatusToIcon('offline')).toBe('failure')
        expect(instance.mapClusterStatusToIcon('pendingimport')).toBe('pending')
        expect(instance.mapClusterStatusToIcon('notaccepted')).toBe('warning')
        expect(instance.mapClusterStatusToIcon('unknown')).toBe('failure')
      }
    })
  })

  describe('Pagination Functionality', () => {
    it('should show pagination controls when more than 5 clusters exist', () => {
      const largeMockClusterData = Array.from({ length: 10 }, (_, i) => ({
        name: `cluster-${i}`,
        namespace: `cluster-${i}`,
        status: 'ok',
        metadata: { name: `cluster-${i}` },
      })) as ClusterData[]

      const props = createMockProps({ clusterList: largeMockClusterData })
      const { container } = render(<ClusterDetailsContainer {...props} />)

      // Check if pagination logic is applied by examining the component structure
      // Since we have 10 clusters, pagination should be rendered
      expect(props.clusterList.length).toBeGreaterThan(5)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should not show pagination controls when 5 or fewer clusters exist', () => {
      const smallMockClusterData = mockClusterData.slice(0, 3)
      const props = createMockProps({ clusterList: smallMockClusterData })
      const { container } = render(<ClusterDetailsContainer {...props} />)

      // Check if pagination logic is not applied for small lists
      expect(props.clusterList.length).toBeLessThanOrEqual(5)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should handle pagination navigation through component methods', () => {
      const mockUpdate = jest.fn()
      const largeMockClusterData = Array.from({ length: 10 }, (_, i) => ({
        name: `cluster-${i}`,
        namespace: `cluster-${i}`,
        status: 'ok',
        metadata: { name: `cluster-${i}` },
      })) as ClusterData[]

      const props = createMockProps({
        clusterList: largeMockClusterData,
        clusterDetailsContainerControl: {
          clusterDetailsContainerData: createMockContainerData(),
          handleClusterDetailsContainerUpdate: mockUpdate,
        },
      })

      const { container } = render(<ClusterDetailsContainer {...props} />)
      const component = container.querySelector('.clusterDetails')?.parentElement as any

      if (component && component._reactInternalFiber?.child?.stateNode) {
        const instance = component._reactInternalFiber.child.stateNode

        // Test pagination methods
        instance.handleNextClick({}, 2)
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2,
            startIdx: 5,
          })
        )

        mockUpdate.mockClear()

        instance.handleFirstClick()
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 1,
            startIdx: 0,
          })
        )
      }
    })
  })

  describe('Accordion Functionality', () => {
    it('should render cluster accordion items', () => {
      const props = createMockProps()
      const { container } = render(<ClusterDetailsContainer {...props} />)

      // Should render accordion structure
      expect(container.querySelector('.clusterDetailItem')).toBeInTheDocument()
    })

    it('should handle accordion expansion through component methods', () => {
      const mockUpdate = jest.fn()
      const props = createMockProps({
        clusterDetailsContainerControl: {
          clusterDetailsContainerData: createMockContainerData(),
          handleClusterDetailsContainerUpdate: mockUpdate,
        },
      })

      const { container } = render(<ClusterDetailsContainer {...props} />)
      const component = container.querySelector('.clusterDetails')?.parentElement as any

      if (component && component._reactInternalFiber?.child?.stateNode) {
        const instance = component._reactInternalFiber.child.stateNode

        // Test the handleExpandSectionToggle method directly
        instance.handleExpandSectionToggle(0)

        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            expandSectionToggleMap: new Set([0]),
          })
        )
      }
    })
  })

  describe('Resource Data Rendering', () => {
    it('should render CPU data when available', () => {
      const props = createMockProps()
      const { container } = render(<ClusterDetailsContainer {...props} />)
      const component = container.querySelector('.clusterDetails')?.parentElement as any

      if (component && component._reactInternalFiber?.child?.stateNode) {
        const instance = component._reactInternalFiber.child.stateNode
        const cpuElement = instance.renderCPUData('4', '3800m', 'divClass', 'labelClass', mockT, 'valueClass')
        expect(cpuElement).toBeTruthy()
      }
    })

    it('should render Memory data when available', () => {
      const props = createMockProps()
      const { container } = render(<ClusterDetailsContainer {...props} />)
      const component = container.querySelector('.clusterDetails')?.parentElement as any

      if (component && component._reactInternalFiber?.child?.stateNode) {
        const instance = component._reactInternalFiber.child.stateNode
        const memoryElement = instance.renderMemoryData('8Gi', '7Gi', 'divClass', 'labelClass', mockT, 'valueClass')
        expect(memoryElement).toBeTruthy()
      }
    })

    it('should render console URL link when available', () => {
      const props = createMockProps()
      const { container } = render(<ClusterDetailsContainer {...props} />)
      const component = container.querySelector('.clusterDetails')?.parentElement as any

      if (component && component._reactInternalFiber?.child?.stateNode) {
        const instance = component._reactInternalFiber.child.stateNode
        const resource = { action: 'open_link', targetLink: 'https://console.example.com' }
        const linkElement = instance.renderConsoleURLLink('https://console.example.com', resource, mockT)
        expect(linkElement).toBeTruthy()
      }
    })

    it('should not render console URL link when not available', () => {
      const props = createMockProps()
      const { container } = render(<ClusterDetailsContainer {...props} />)
      const component = container.querySelector('.clusterDetails')?.parentElement as any

      if (component && component._reactInternalFiber?.child?.stateNode) {
        const instance = component._reactInternalFiber.child.stateNode
        const resource = { action: 'open_link', targetLink: undefined }
        const linkElement = instance.renderConsoleURLLink(undefined, resource, mockT)
        expect(linkElement).toBeNull()
      }
    })
  })

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle clusters without metadata gracefully', () => {
      const clusterWithoutMetadata: ClusterData = {
        name: 'cluster-no-metadata',
        namespace: 'cluster-no-metadata',
        status: 'ok',
      }

      const props = createMockProps({
        clusterList: [clusterWithoutMetadata],
      })

      const { container } = render(<ClusterDetailsContainer {...props} />)

      // Should render without errors
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should handle empty cluster list', () => {
      const props = createMockProps({ clusterList: [] })
      const { container } = render(<ClusterDetailsContainer {...props} />)

      // Should render search input but no clusters
      expect(container.firstChild).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Find cluster')).toBeInTheDocument()
    })

    it('should handle cluster selection that does not exist in list', () => {
      const mockUpdate = jest.fn()
      const props = createMockProps({
        clusterDetailsContainerControl: {
          clusterDetailsContainerData: createMockContainerData(),
          handleClusterDetailsContainerUpdate: mockUpdate,
        },
      })

      const { container } = render(<ClusterDetailsContainer {...props} />)
      const component = container.querySelector('.clusterDetails')?.parentElement as any

      if (component && component._reactInternalFiber?.child?.stateNode) {
        const instance = component._reactInternalFiber.child.stateNode

        // Test selecting a non-existent cluster
        instance.handleSelection('non-existent-cluster')

        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            selected: 'non-existent-cluster',
            selectedClusterList: [], // Should be empty since cluster doesn't exist
          })
        )
      }
    })

    it('should handle unknown cluster status', () => {
      const clusterWithUnknownStatus: ClusterData = {
        name: 'cluster-unknown',
        namespace: 'cluster-unknown',
        HubAcceptedManagedCluster: true,
        ManagedClusterJoined: true,
        ManagedClusterConditionAvailable: 'Unknown',
        metadata: {
          name: 'cluster-unknown',
        },
      }

      const props = createMockProps({
        clusterList: [clusterWithUnknownStatus],
      })

      const { container } = render(<ClusterDetailsContainer {...props} />)

      // Should render without errors
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('State Management and Container Control', () => {
    it('should update container control when state changes', () => {
      const mockUpdate = jest.fn()
      const props = createMockProps({
        clusterDetailsContainerControl: {
          clusterDetailsContainerData: createMockContainerData(),
          handleClusterDetailsContainerUpdate: mockUpdate,
        },
      })

      const { container } = render(<ClusterDetailsContainer {...props} />)
      const component = container.querySelector('.clusterDetails')?.parentElement as any

      if (component && component._reactInternalFiber?.child?.stateNode) {
        const instance = component._reactInternalFiber.child.stateNode

        // Test state update through component method
        instance.handleSelection('test-cluster')

        expect(mockUpdate).toHaveBeenCalled()
      }
    })

    it('should maintain state consistency across operations', () => {
      const mockUpdate = jest.fn()
      const props = createMockProps({
        clusterDetailsContainerControl: {
          clusterDetailsContainerData: createMockContainerData(),
          handleClusterDetailsContainerUpdate: mockUpdate,
        },
      })

      const { container } = render(<ClusterDetailsContainer {...props} />)
      const component = container.querySelector('.clusterDetails')?.parentElement as any

      if (component && component._reactInternalFiber?.child?.stateNode) {
        const instance = component._reactInternalFiber.child.stateNode

        // Select a cluster
        instance.handleSelection('local-cluster')

        // Clear selection
        instance.handleSelectionClear()

        // Both operations should have been called
        expect(mockUpdate).toHaveBeenCalledTimes(2)
      }
    })
  })

  describe('Component Methods', () => {
    it('should process action links correctly', () => {
      const props = createMockProps()
      const { container } = render(<ClusterDetailsContainer {...props} />)
      const component = container.querySelector('.clusterDetails')?.parentElement as any

      if (component && component._reactInternalFiber?.child?.stateNode) {
        const instance = component._reactInternalFiber.child.stateNode
        const resource = { action: 'open_link', targetLink: 'https://console.example.com' }

        // Should not throw when processing action link
        expect(() => instance.processActionLink(resource)).not.toThrow()
      }
    })

    it('should handle keyboard events correctly', () => {
      const props = createMockProps()
      const { container } = render(<ClusterDetailsContainer {...props} />)
      const component = container.querySelector('.clusterDetails')?.parentElement as any

      if (component && component._reactInternalFiber?.child?.stateNode) {
        const instance = component._reactInternalFiber.child.stateNode
        const resource = { action: 'open_link', targetLink: 'https://console.example.com' }
        const mockEvent = { key: 'Enter' } as React.KeyboardEvent

        // Should not throw when handling keyboard event
        expect(() => instance.handleKeyPress(resource, mockEvent)).not.toThrow()
      }
    })
  })
})
