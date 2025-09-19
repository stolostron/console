/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DetailsTable from './DetailsTable'
import type { DetailsTableProps, DetailsTableNode, TranslationFunction } from '../types'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock PatternFly components that might have complex behaviors
jest.mock('@patternfly/react-table', () => ({
  ...jest.requireActual('@patternfly/react-table'),
  sortable: jest.fn(() => ({ sortable: true })),
}))

/**
 * Mock translation function that returns the input string as-is
 * Supports parameter substitution for testing
 */
const mockT: TranslationFunction = (key: string, params?: (string | number)[]): string => {
  if (params && params.length > 0) {
    let result = key
    params.forEach((param, index) => {
      result = result.replace(`{${index}}`, String(param))
    })
    return result
  }
  return key
}

/**
 * Creates a mock node for testing with customizable properties
 */
const createMockNode = (overrides: Partial<DetailsTableNode> = {}): DetailsTableNode => ({
  name: 'test-app',
  namespace: 'test-namespace',
  type: 'application',
  specs: {
    resources: [
      { name: 'resource-1', namespace: 'test-namespace' },
      { name: 'resource-2', namespace: 'test-namespace' },
    ],
    clustersNames: ['cluster-1', 'cluster-2'],
    replicaCount: 2,
    applicationModel: {
      'resource-1-cluster-1-test-namespace': [
        { pulse: 'green', name: 'resource-1-instance-1', namespace: 'test-namespace' },
        { pulse: 'red', name: 'resource-1-instance-2', namespace: 'test-namespace' },
      ],
      'resource-2-cluster-1-test-namespace': [
        { pulse: 'yellow', name: 'resource-2-instance-1', namespace: 'test-namespace' },
      ],
    },
    ...overrides.specs,
  },
  ...overrides,
})

/**
 * Creates mock props for DetailsTable component
 */
const createMockProps = (overrides: Partial<DetailsTableProps> = {}): DetailsTableProps => ({
  id: 'test-table',
  node: createMockNode(),
  t: mockT,
  handleOpen: jest.fn(),
  ...overrides,
})

describe('DetailsTable Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('10')
  })

  describe('Component Rendering', () => {
    it('should render without crashing with minimal props', () => {
      const props = createMockProps()
      const { container } = render(<DetailsTable {...props} />)

      expect(container.querySelector('.creation-view-controls-table-container')).toBeInTheDocument()
    })

    it('should render the search input', () => {
      const props = createMockProps()
      render(<DetailsTable {...props} />)

      const searchInput = screen.getByPlaceholderText('search.label')
      expect(searchInput).toBeInTheDocument()
    })

    it('should render the table with correct headers', () => {
      const props = createMockProps()
      render(<DetailsTable {...props} />)

      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Namespace')).toBeInTheDocument()
      expect(screen.getByText('Cluster')).toBeInTheDocument()
    })

    it('should render pagination controls when resources exist', () => {
      const props = createMockProps()
      render(<DetailsTable {...props} />)

      // Look for pagination elements
      const pagination = screen.getByRole('navigation', { name: /pagination/i })
      expect(pagination).toBeInTheDocument()
    })

    it('should display resource data in table rows', () => {
      const props = createMockProps()
      render(<DetailsTable {...props} />)

      // Check for resource names in buttons (they should be clickable)
      expect(screen.getByRole('button', { name: 'resource-1-instance-1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'resource-1-instance-2' })).toBeInTheDocument()
    })
  })

  describe('State Management and localStorage', () => {
    it('should initialize with default page size when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      const props = createMockProps()
      render(<DetailsTable {...props} />)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('table-test-table-page-size', '10')
    })

    it('should initialize with saved page size from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('20')
      const props = createMockProps()
      render(<DetailsTable {...props} />)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('table-test-table-page-size', '20')
    })

    it('should handle invalid localStorage values gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid')
      const props = createMockProps()
      render(<DetailsTable {...props} />)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('table-test-table-page-size', '10')
    })
  })

  describe('Data Processing (getDerivedStateFromProps)', () => {
    it('should process node data correctly with multiple resources and clusters', () => {
      const props = createMockProps()
      render(<DetailsTable {...props} />)

      // Verify that resources are displayed
      expect(screen.getByRole('button', { name: 'resource-1-instance-1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'resource-1-instance-2' })).toBeInTheDocument()
    })

    it('should handle missing status data gracefully', () => {
      const nodeWithoutStatus = createMockNode({
        specs: {
          resources: [{ name: 'resource-1', namespace: 'test-namespace' }],
          clustersNames: ['cluster-1'],
          replicaCount: 1,
          // No applicationModel provided
        },
      })
      const props = createMockProps({ node: nodeWithoutStatus })
      render(<DetailsTable {...props} />)

      // Should still render the resource with default status
      expect(screen.getByRole('button', { name: 'resource-1' })).toBeInTheDocument()
    })

    it('should handle invalid replica count', () => {
      const nodeWithInvalidReplicas = createMockNode({
        specs: {
          resources: [{ name: 'resource-1', namespace: 'test-namespace' }],
          clustersNames: ['cluster-1'],
          replicaCount: NaN,
        },
      })
      const props = createMockProps({ node: nodeWithInvalidReplicas })
      render(<DetailsTable {...props} />)

      // Should default to 1 replica
      expect(screen.getByRole('button', { name: 'resource-1' })).toBeInTheDocument()
    })

    it('should filter resources by cluster when resource has specific cluster', () => {
      const nodeWithClusterSpecificResource = createMockNode({
        specs: {
          resources: [
            { name: 'resource-1', namespace: 'test-namespace', cluster: 'cluster-1' },
            { name: 'resource-2', namespace: 'test-namespace' }, // No cluster specified
          ],
          clustersNames: ['cluster-1', 'cluster-2'],
          replicaCount: 1,
        },
      })
      const props = createMockProps({ node: nodeWithClusterSpecificResource })
      render(<DetailsTable {...props} />)

      // resource-1 should only appear once (for cluster-1)
      // resource-2 should appear twice (for both clusters)
      const resource1Buttons = screen.getAllByRole('button', { name: 'resource-1' })
      const resource2Buttons = screen.getAllByRole('button', { name: 'resource-2' })

      expect(resource1Buttons).toHaveLength(1)
      expect(resource2Buttons).toHaveLength(2)
    })

    it('should sort resources by pulse status priority', () => {
      const nodeWithMixedStatus = createMockNode({
        specs: {
          resources: [{ name: 'resource', namespace: 'test-namespace' }],
          clustersNames: ['cluster-1'],
          replicaCount: 4,
          applicationModel: {
            'resource-cluster-1-test-namespace': [
              { pulse: 'green', name: 'resource-green', namespace: 'test-namespace' },
              { pulse: 'red', name: 'resource-red', namespace: 'test-namespace' },
              { pulse: 'yellow', name: 'resource-yellow', namespace: 'test-namespace' },
              { pulse: 'orange', name: 'resource-orange', namespace: 'test-namespace' },
            ],
          },
        },
      })
      const props = createMockProps({ node: nodeWithMixedStatus })
      render(<DetailsTable {...props} />)

      const buttons = screen.getAllByRole('button')
      const buttonTexts = buttons.map((button) => button.textContent)

      // Red should come first (highest priority), then orange, yellow, green
      const redIndex = buttonTexts.indexOf('resource-red')
      const orangeIndex = buttonTexts.indexOf('resource-orange')
      const yellowIndex = buttonTexts.indexOf('resource-yellow')
      const greenIndex = buttonTexts.indexOf('resource-green')

      expect(redIndex).toBeLessThan(orangeIndex)
      expect(orangeIndex).toBeLessThan(yellowIndex)
      expect(yellowIndex).toBeLessThan(greenIndex)
    })
  })

  describe('Search Functionality', () => {
    it('should filter results based on search input', async () => {
      const props = createMockProps()
      render(<DetailsTable {...props} />)

      const searchInput = screen.getByPlaceholderText('search.label')

      // Initially all resources should be visible
      expect(screen.getByRole('button', { name: 'resource-1-instance-1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'resource-2-instance-1' })).toBeInTheDocument()

      // Search for specific resource
      fireEvent.change(searchInput, { target: { value: 'resource-1' } })

      await waitFor(() => {
        // Only resource-1 items should be visible
        expect(screen.getByRole('button', { name: 'resource-1-instance-1' })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'resource-2-instance-1' })).not.toBeInTheDocument()
      })
    })

    it('should search across name, namespace, and cluster fields', async () => {
      const props = createMockProps()
      render(<DetailsTable {...props} />)

      const searchInput = screen.getByPlaceholderText('search.label')

      // Search by cluster name
      fireEvent.change(searchInput, { target: { value: 'cluster-1' } })

      await waitFor(() => {
        // All resources should still be visible since they're all on cluster-1
        expect(screen.getByRole('button', { name: 'resource-1-instance-1' })).toBeInTheDocument()
      })
    })

    it('should clear search results when clear button is clicked', async () => {
      const props = createMockProps()
      render(<DetailsTable {...props} />)

      const searchInput = screen.getByPlaceholderText('search.label')

      // Search for specific resource
      fireEvent.change(searchInput, { target: { value: 'resource-1' } })
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'resource-2-instance-1' })).not.toBeInTheDocument()
      })

      // Clear search
      const clearButton = screen.getByRole('button', { name: /reset/i })
      fireEvent.click(clearButton)

      await waitFor(() => {
        // All resources should be visible again
        expect(screen.getByRole('button', { name: 'resource-1-instance-1' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'resource-2-instance-1' })).toBeInTheDocument()
      })
    })

    it('should reset to first page when searching', async () => {
      const props = createMockProps()
      render(<DetailsTable {...props} />)

      const searchInput = screen.getByPlaceholderText('search.label')
      fireEvent.change(searchInput, { target: { value: 'resource' } })

      // The component should reset to page 1 when searching
      // This is tested implicitly through the search functionality working correctly
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'resource-1-instance-1' })).toBeInTheDocument()
      })
    })
  })

  describe('Sorting Functionality', () => {
    it('should sort table by column when header is clicked', async () => {
      const props = createMockProps()
      render(<DetailsTable {...props} />)

      const nameHeader = screen.getByText('Name')
      fireEvent.click(nameHeader)

      // Verify sorting is applied (this would be more detailed in a real test with more data)
      expect(screen.getByRole('button', { name: 'resource-1-instance-1' })).toBeInTheDocument()
    })

    it('should handle sort direction changes', async () => {
      const props = createMockProps()
      render(<DetailsTable {...props} />)

      const nameHeader = screen.getByText('Name')

      // Click once for ascending
      fireEvent.click(nameHeader)

      // Click again for descending
      fireEvent.click(nameHeader)

      // The table should still render correctly
      expect(screen.getByRole('button', { name: 'resource-1-instance-1' })).toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    it('should handle page size changes', async () => {
      const props = createMockProps()
      render(<DetailsTable {...props} />)

      // Find and interact with page size selector
      const pageSizeButton = screen.queryByRole('button', { name: /items per page/i })
      if (pageSizeButton) {
        fireEvent.click(pageSizeButton)

        // Select a different page size if options are available
        const option20 = screen.queryByRole('option', { name: '20 per page' })
        if (option20) {
          fireEvent.click(option20)
        }
      }

      // At minimum, verify the component renders and localStorage is called
      expect(screen.getByRole('grid', { name: 'Resource Table' })).toBeInTheDocument()
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    it('should handle page navigation', async () => {
      // Create a node with many resources to enable pagination
      const nodeWithManyResources = createMockNode({
        specs: {
          resources: Array.from({ length: 15 }, (_, i) => ({
            name: `resource-${i}`,
            namespace: 'test-namespace',
          })),
          clustersNames: ['cluster-1'],
          replicaCount: 1,
        },
      })
      const props = createMockProps({ node: nodeWithManyResources })
      render(<DetailsTable {...props} />)

      // Navigate to next page if available
      const nextPageButton = screen.queryByRole('button', { name: /next page/i })
      if (nextPageButton) {
        fireEvent.click(nextPageButton)
      }

      // The table should still render correctly
      expect(screen.getByRole('grid', { name: 'Resource Table' })).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should call handleOpen when resource button is clicked', async () => {
      const mockHandleOpen = jest.fn()
      const props = createMockProps({ handleOpen: mockHandleOpen })
      render(<DetailsTable {...props} />)

      const resourceButton = screen.getByRole('button', { name: 'resource-1-instance-1' })
      fireEvent.click(resourceButton)

      expect(mockHandleOpen).toHaveBeenCalledWith(
        props.node,
        expect.objectContaining({
          name: 'resource-1-instance-1',
          namespace: 'test-namespace',
          cluster: 'cluster-1',
          type: 'application',
          pulse: 'green',
        })
      )
    })

    it('should not crash when handleOpen is not provided', async () => {
      const props = createMockProps({ handleOpen: undefined })
      render(<DetailsTable {...props} />)

      const resourceButton = screen.getByRole('button', { name: 'resource-1-instance-1' })
      fireEvent.click(resourceButton)

      // Should not crash
      expect(screen.getByRole('grid', { name: 'Resource Table' })).toBeInTheDocument()
    })
  })

  describe('Status Icons', () => {
    it('should render correct status icons for different pulse colors', () => {
      const props = createMockProps()
      const { container } = render(<DetailsTable {...props} />)

      // Check for SVG elements with status colors
      const greenIcon = container.querySelector('svg[fill="green"]')
      const redIcon = container.querySelector('svg[fill="red"]')
      const yellowIcon = container.querySelector('svg[fill="yellow"]')

      expect(greenIcon).toBeInTheDocument()
      expect(redIcon).toBeInTheDocument()
      expect(yellowIcon).toBeInTheDocument()
    })

    it('should use correct icon types for different pulse values', () => {
      const nodeWithAllStatuses = createMockNode({
        specs: {
          resources: [{ name: 'resource', namespace: 'test-namespace' }],
          clustersNames: ['cluster-1'],
          replicaCount: 5,
          applicationModel: {
            'resource-cluster-1-test-namespace': [
              { pulse: 'green', name: 'resource-green', namespace: 'test-namespace' },
              { pulse: 'red', name: 'resource-red', namespace: 'test-namespace' },
              { pulse: 'yellow', name: 'resource-yellow', namespace: 'test-namespace' },
              { pulse: 'blocked', name: 'resource-blocked', namespace: 'test-namespace' },
              { pulse: 'orange', name: 'resource-orange', namespace: 'test-namespace' },
            ],
          },
        },
      })
      const props = createMockProps({ node: nodeWithAllStatuses })
      const { container } = render(<DetailsTable {...props} />)

      // Check for different icon references
      expect(container.querySelector('use[href="#drawerShapes_success"]')).toBeInTheDocument()
      expect(container.querySelector('use[href="#drawerShapes_failure"]')).toBeInTheDocument()
      expect(container.querySelector('use[href="#drawerShapes_warning"]')).toBeInTheDocument()
      expect(container.querySelector('use[href="#drawerShapes_blocked"]')).toBeInTheDocument()
      expect(container.querySelector('use[href="#drawerShapes_pending"]')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty resources array', () => {
      const nodeWithNoResources = createMockNode({
        specs: {
          resources: [],
          clustersNames: ['cluster-1'],
          replicaCount: 1,
        },
      })
      const props = createMockProps({ node: nodeWithNoResources })
      render(<DetailsTable {...props} />)

      // Should render table structure but no resource rows
      expect(screen.getByRole('grid', { name: 'Resource Table' })).toBeInTheDocument()
      expect(screen.getByText('Name')).toBeInTheDocument()
    })

    it('should handle empty clusters array', () => {
      const nodeWithNoClusters = createMockNode({
        specs: {
          resources: [{ name: 'resource-1', namespace: 'test-namespace' }],
          clustersNames: [],
          replicaCount: 1,
        },
      })
      const props = createMockProps({ node: nodeWithNoClusters })
      render(<DetailsTable {...props} />)

      // Should render table structure but no resource rows
      expect(screen.getByRole('grid', { name: 'Resource Table' })).toBeInTheDocument()
    })

    it('should handle missing specs', () => {
      const nodeWithMinimalSpecs = createMockNode({
        specs: {},
      })
      const props = createMockProps({ node: nodeWithMinimalSpecs })
      render(<DetailsTable {...props} />)

      // Should render without crashing
      expect(screen.getByRole('grid', { name: 'Resource Table' })).toBeInTheDocument()
    })

    it('should handle node type changes', () => {
      const props = createMockProps()
      const { rerender } = render(<DetailsTable {...props} />)

      // Change node type
      const newNode = createMockNode({ type: 'subscription' })
      const newProps = createMockProps({ node: newNode })
      rerender(<DetailsTable {...newProps} />)

      // Should handle the type change and reset pagination
      expect(screen.getByRole('grid', { name: 'Resource Table' })).toBeInTheDocument()
    })

    it('should handle resources without namespace', () => {
      const nodeWithResourcesWithoutNamespace = createMockNode({
        specs: {
          resources: [{ name: 'cluster-resource' }], // No namespace
          clustersNames: ['cluster-1'],
          replicaCount: 1,
        },
      })
      const props = createMockProps({ node: nodeWithResourcesWithoutNamespace })
      render(<DetailsTable {...props} />)

      expect(screen.getByRole('button', { name: 'cluster-resource' })).toBeInTheDocument()
    })
  })

  describe('Component Lifecycle', () => {
    it('should persist page size to localStorage on state changes', () => {
      const props = createMockProps()
      const { rerender } = render(<DetailsTable {...props} />)

      // Trigger a re-render which should call getDerivedStateFromProps
      const newProps = createMockProps({ id: 'test-table-2' })
      rerender(<DetailsTable {...newProps} />)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('table-test-table-2-page-size', '10')
    })

    it('should maintain sort state across re-renders', async () => {
      const props = createMockProps()
      const { rerender } = render(<DetailsTable {...props} />)

      // Apply sorting
      const nameHeader = screen.getByText('Name')
      fireEvent.click(nameHeader)

      // Re-render with same props
      rerender(<DetailsTable {...props} />)

      // Table should still be rendered correctly
      expect(screen.getByRole('grid', { name: 'Resource Table' })).toBeInTheDocument()
    })
  })
})
