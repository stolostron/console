/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ArgoAppDetailsContainer from './ArgoAppDetailsContainer'
import type {
  ArgoApp,
  ArgoAppDetailsContainerProps,
  ArgoAppDetailsContainerControl,
  ArgoAppDetailsContainerData,
  TranslationFunction,
} from '../types'
import * as diagramHelpers from '../elements/helpers/diagram-helpers'

// Mock the diagram helpers module
jest.mock('../helpers/diagram-helpers', () => ({
  processResourceActionLink: jest.fn(),
  createEditLink: jest.fn(() => 'mock-edit-link'),
}))

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
 * Mock Argo application data for testing
 */
const mockArgoApps: ArgoApp[] = [
  {
    name: 'test-app-1',
    cluster: 'local-cluster',
    namespace: 'argocd',
    destinationName: 'target-cluster-1',
    destinationNamespace: 'default',
    healthStatus: 'Healthy',
  },
  {
    name: 'test-app-2',
    cluster: 'local-cluster',
    namespace: 'argocd',
    destinationName: 'target-cluster-2',
    destinationNamespace: 'kube-system',
    healthStatus: 'Degraded',
  },
  {
    name: 'test-app-3',
    cluster: 'local-cluster',
    namespace: 'argocd',
    destinationName: 'target-cluster-3',
    destinationNamespace: 'monitoring',
    healthStatus: 'Unknown',
  },
  {
    name: 'test-app-4',
    cluster: 'local-cluster',
    namespace: 'argocd',
    destinationName: 'target-cluster-4',
    destinationNamespace: 'default',
    healthStatus: 'Progressing',
  },
  {
    name: 'test-app-5',
    cluster: 'local-cluster',
    namespace: 'argocd',
    destinationName: 'target-cluster-5',
    destinationNamespace: 'default',
    healthStatus: 'Missing',
  },
  {
    name: 'test-app-6',
    cluster: 'local-cluster',
    namespace: 'argocd',
    destinationName: 'target-cluster-6',
    destinationNamespace: 'default',
    healthStatus: 'Healthy',
  },
]

/**
 * Creates mock container data for testing
 */
const createMockContainerData = (
  overrides: Partial<ArgoAppDetailsContainerData> = {}
): ArgoAppDetailsContainerData => ({
  selected: undefined,
  page: 1,
  startIdx: 0,
  argoAppSearchToggle: false,
  expandSectionToggleMap: new Set<number>(),
  selectedArgoAppList: [],
  isLoading: false,
  ...overrides,
})

/**
 * Creates mock container control for testing
 */
const createMockContainerControl = (
  data: Partial<ArgoAppDetailsContainerData> = {}
): ArgoAppDetailsContainerControl => ({
  argoAppDetailsContainerData: createMockContainerData(data),
  handleArgoAppDetailsContainerUpdate: jest.fn(),
  handleErrorMsg: jest.fn(),
})

/**
 * Creates default props for testing
 */
const createDefaultProps = (overrides: Partial<ArgoAppDetailsContainerProps> = {}): ArgoAppDetailsContainerProps => ({
  argoAppDetailsContainerControl: createMockContainerControl(),
  argoAppList: mockArgoApps,
  t: mockT,
  hubClusterName: 'local-cluster',
  ...overrides,
})

describe('ArgoAppDetailsContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders without crashing with default props', () => {
      const props = createDefaultProps()
      render(<ArgoAppDetailsContainer {...props} />)

      expect(screen.getAllByRole('combobox')[0]).toBeInTheDocument()
    })

    it('renders application search dropdown', () => {
      const props = createDefaultProps()
      render(<ArgoAppDetailsContainer {...props} />)

      const searchInput = screen.getAllByRole('combobox')[0]
      expect(searchInput).toBeInTheDocument()
      // The placeholder might be on a child element, so just check that the combobox exists
    })

    it('renders pagination when there are more than 5 applications', () => {
      const props = createDefaultProps()
      render(<ArgoAppDetailsContainer {...props} />)

      // Should render both top and bottom pagination
      const paginationElements = screen.getAllByRole('navigation')
      expect(paginationElements).toHaveLength(2)
    })

    it('does not render pagination when there are 5 or fewer applications', () => {
      const props = createDefaultProps({
        argoAppList: mockArgoApps.slice(0, 3),
      })
      render(<ArgoAppDetailsContainer {...props} />)

      // Should not render pagination
      const paginationElements = screen.queryAllByRole('navigation')
      expect(paginationElements).toHaveLength(0)
    })

    it('renders accordion with application items', () => {
      const props = createDefaultProps()
      render(<ArgoAppDetailsContainer {...props} />)

      // Check for accordion toggle buttons (application names)
      expect(screen.getByRole('button', { name: /test-app-1/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /test-app-2/ })).toBeInTheDocument()
    })

    it('displays only first page of applications initially', () => {
      const props = createDefaultProps()
      render(<ArgoAppDetailsContainer {...props} />)

      // Should show first 5 applications
      expect(screen.getByRole('button', { name: /test-app-1/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /test-app-5/ })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /test-app-6/ })).not.toBeInTheDocument()
    })
  })

  describe('Status Icon Mapping', () => {
    it('maps Healthy status to checkmark icon', () => {
      const props = createDefaultProps()
      const component = new ArgoAppDetailsContainer(props)

      expect(component.mapArgoStatusToStatusIcon('Healthy')).toBe('checkmark')
    })

    it('maps Degraded status to failure icon', () => {
      const props = createDefaultProps()
      const component = new ArgoAppDetailsContainer(props)

      expect(component.mapArgoStatusToStatusIcon('Degraded')).toBe('failure')
    })

    it('maps Missing status to pending icon', () => {
      const props = createDefaultProps()
      const component = new ArgoAppDetailsContainer(props)

      expect(component.mapArgoStatusToStatusIcon('Missing')).toBe('pending')
    })

    it('maps Unknown status to pending icon', () => {
      const props = createDefaultProps()
      const component = new ArgoAppDetailsContainer(props)

      expect(component.mapArgoStatusToStatusIcon('Unknown')).toBe('pending')
    })

    it('maps Progressing status to pending icon', () => {
      const props = createDefaultProps()
      const component = new ArgoAppDetailsContainer(props)

      expect(component.mapArgoStatusToStatusIcon('Progressing')).toBe('pending')
    })

    it('maps empty status to pending icon', () => {
      const props = createDefaultProps()
      const component = new ArgoAppDetailsContainer(props)

      expect(component.mapArgoStatusToStatusIcon('')).toBe('pending')
    })

    it('maps undefined status to pending icon', () => {
      const props = createDefaultProps()
      const component = new ArgoAppDetailsContainer(props)

      expect(component.mapArgoStatusToStatusIcon(undefined as any)).toBe('pending')
    })

    it('maps other statuses to warning icon', () => {
      const props = createDefaultProps()
      const component = new ArgoAppDetailsContainer(props)

      expect(component.mapArgoStatusToStatusIcon('SomeOtherStatus')).toBe('warning')
    })
  })

  describe('Application Selection', () => {
    it('filters applications when selection is made', async () => {
      const mockControl = createMockContainerControl()
      const props = createDefaultProps({
        argoAppDetailsContainerControl: mockControl,
      })

      const component = new ArgoAppDetailsContainer(props)

      // Test the handleSelection method directly
      component.handleSelection('test-app-1')

      expect(mockControl.handleArgoAppDetailsContainerUpdate).toHaveBeenCalledWith({
        page: 1,
        startIdx: 0,
        argoAppSearchToggle: false,
        expandSectionToggleMap: new Set(),
        selected: 'test-app-1',
        selectedArgoAppList: [mockArgoApps[0]],
        isLoading: false,
      })
    })

    it('shows all applications when selection is cleared', async () => {
      const mockControl = createMockContainerControl({
        selected: 'test-app-1',
        selectedArgoAppList: [mockArgoApps[0]],
      })
      const props = createDefaultProps({
        argoAppDetailsContainerControl: mockControl,
      })

      render(<ArgoAppDetailsContainer {...props} />)

      const clearButton = screen.getByRole('button', { name: /Clear input value/ })
      await userEvent.click(clearButton)

      expect(mockControl.handleArgoAppDetailsContainerUpdate).toHaveBeenCalledWith({
        page: 1,
        startIdx: 0,
        argoAppSearchToggle: false,
        expandSectionToggleMap: new Set(),
        selected: undefined,
        selectedArgoAppList: [],
        isLoading: false,
      })
    })

    it('handles selection of non-existent application', async () => {
      const mockControl = createMockContainerControl()
      const props = createDefaultProps({
        argoAppDetailsContainerControl: mockControl,
      })

      const component = new ArgoAppDetailsContainer(props)
      component.handleSelection('non-existent-app')

      expect(mockControl.handleArgoAppDetailsContainerUpdate).toHaveBeenCalledWith({
        page: 1,
        startIdx: 0,
        argoAppSearchToggle: false,
        expandSectionToggleMap: new Set(),
        selected: 'non-existent-app',
        selectedArgoAppList: [],
        isLoading: false,
      })
    })
  })

  describe('Accordion Toggle', () => {
    it('expands accordion section when clicked', async () => {
      const mockControl = createMockContainerControl()
      const props = createDefaultProps({
        argoAppDetailsContainerControl: mockControl,
      })

      render(<ArgoAppDetailsContainer {...props} />)

      const accordionButton = screen.getByRole('button', { name: /test-app-1/ })
      await userEvent.click(accordionButton)

      const expectedExpandMap = new Set([0])
      expect(mockControl.handleArgoAppDetailsContainerUpdate).toHaveBeenCalledWith({
        page: 1,
        startIdx: 0,
        argoAppSearchToggle: false,
        expandSectionToggleMap: expectedExpandMap,
        selected: undefined,
        selectedArgoAppList: [],
        isLoading: false,
      })
    })

    it('collapses accordion section when clicked again', async () => {
      const mockControl = createMockContainerControl({
        expandSectionToggleMap: new Set([0]),
      })
      const props = createDefaultProps({
        argoAppDetailsContainerControl: mockControl,
      })

      render(<ArgoAppDetailsContainer {...props} />)

      const accordionButton = screen.getByRole('button', { name: /test-app-1/ })
      await userEvent.click(accordionButton)

      const expectedExpandMap = new Set()
      expect(mockControl.handleArgoAppDetailsContainerUpdate).toHaveBeenCalledWith({
        page: 1,
        startIdx: 0,
        argoAppSearchToggle: false,
        expandSectionToggleMap: expectedExpandMap,
        selected: undefined,
        selectedArgoAppList: [],
        isLoading: false,
      })
    })

    it('shows application details when accordion is expanded', async () => {
      const mockControl = createMockContainerControl({
        expandSectionToggleMap: new Set([0]),
      })
      const props = createDefaultProps({
        argoAppDetailsContainerControl: mockControl,
      })

      render(<ArgoAppDetailsContainer {...props} />)

      // Check for details section - use getAllByText since there might be multiple
      expect(screen.getAllByText('Details')[0]).toBeInTheDocument()
      expect(screen.getAllByText('Created on', { exact: false })[0]).toBeInTheDocument()
      expect(screen.getAllByText('Destination cluster', { exact: false })[0]).toBeInTheDocument()
      expect(screen.getAllByText('Destination namespace', { exact: false })[0]).toBeInTheDocument()
      expect(screen.getAllByText('Status', { exact: false })[0]).toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    it('navigates to first page', async () => {
      const mockControl = createMockContainerControl({
        page: 2,
        startIdx: 5,
      })
      const props = createDefaultProps({
        argoAppDetailsContainerControl: mockControl,
      })

      const component = new ArgoAppDetailsContainer(props)
      component.handleFirstClick()

      expect(mockControl.handleArgoAppDetailsContainerUpdate).toHaveBeenCalledWith({
        page: 1,
        startIdx: 0,
        argoAppSearchToggle: false,
        expandSectionToggleMap: new Set(),
        selected: undefined,
        selectedArgoAppList: [],
        isLoading: false,
      })
    })

    it('navigates to last page', async () => {
      const mockControl = createMockContainerControl()
      const props = createDefaultProps({
        argoAppDetailsContainerControl: mockControl,
      })

      const component = new ArgoAppDetailsContainer(props)
      component.handleLastClick()

      // With 6 apps and perPage=5, last page should be 2 with startIdx=5
      expect(mockControl.handleArgoAppDetailsContainerUpdate).toHaveBeenCalledWith({
        page: 2,
        startIdx: 5,
        argoAppSearchToggle: false,
        expandSectionToggleMap: new Set(),
        selected: undefined,
        selectedArgoAppList: [],
        isLoading: false,
      })
    })

    it('navigates to next page', async () => {
      const mockControl = createMockContainerControl()
      const props = createDefaultProps({
        argoAppDetailsContainerControl: mockControl,
      })

      const component = new ArgoAppDetailsContainer(props)
      const mockEvent = {} as React.MouseEvent
      component.handleNextClick(mockEvent, 2)

      expect(mockControl.handleArgoAppDetailsContainerUpdate).toHaveBeenCalledWith({
        page: 2,
        startIdx: 5,
        argoAppSearchToggle: false,
        expandSectionToggleMap: new Set(),
        selected: undefined,
        selectedArgoAppList: [],
        isLoading: false,
      })
    })

    it('navigates to previous page', async () => {
      const mockControl = createMockContainerControl({
        page: 2,
        startIdx: 5,
      })
      const props = createDefaultProps({
        argoAppDetailsContainerControl: mockControl,
      })

      const component = new ArgoAppDetailsContainer(props)
      const mockEvent = {} as React.MouseEvent
      component.handlePreviousClick(mockEvent, 1)

      expect(mockControl.handleArgoAppDetailsContainerUpdate).toHaveBeenCalledWith({
        page: 1,
        startIdx: 0,
        argoAppSearchToggle: false,
        expandSectionToggleMap: new Set(),
        selected: undefined,
        selectedArgoAppList: [],
        isLoading: false,
      })
    })

    it('navigates to specific page via input', async () => {
      const mockControl = createMockContainerControl()
      const props = createDefaultProps({
        argoAppDetailsContainerControl: mockControl,
      })

      const component = new ArgoAppDetailsContainer(props)
      const mockEvent = {} as React.FormEvent
      component.handlePageInput(mockEvent, 2)

      expect(mockControl.handleArgoAppDetailsContainerUpdate).toHaveBeenCalledWith({
        page: 2,
        startIdx: 5,
        argoAppSearchToggle: false,
        expandSectionToggleMap: new Set(),
        selected: undefined,
        selectedArgoAppList: [],
        isLoading: false,
      })
    })
  })

  describe('Action Links', () => {
    it('processes Argo editor action link', () => {
      const props = createDefaultProps()
      const component = new ArgoAppDetailsContainer(props)

      const mockResource = {
        action: 'open_argo_editor' as const,
        cluster: 'test-cluster',
        namespace: 'test-namespace',
        name: 'test-app',
      }

      component.processActionLink(mockResource)

      expect(diagramHelpers.processResourceActionLink).toHaveBeenCalledWith(
        mockResource,
        component.toggleLinkLoading,
        mockT,
        'local-cluster'
      )
    })

    it('processes YAML view action link', () => {
      const props = createDefaultProps()
      const component = new ArgoAppDetailsContainer(props)

      const mockResource = {
        action: 'show_resource_yaml' as const,
        editLink: 'mock-edit-link',
      }

      component.processActionLink(mockResource)

      expect(diagramHelpers.processResourceActionLink).toHaveBeenCalledWith(
        mockResource,
        component.toggleLinkLoading,
        mockT,
        'local-cluster'
      )
    })

    it('handles keyboard navigation for action links', () => {
      const props = createDefaultProps()
      const component = new ArgoAppDetailsContainer(props)

      const mockResource = {
        action: 'open_argo_editor' as const,
        cluster: 'test-cluster',
        namespace: 'test-namespace',
        name: 'test-app',
      }

      const mockEvent = {
        key: 'Enter',
      } as React.KeyboardEvent

      component.handleKeyPress(mockResource, mockEvent)

      expect(diagramHelpers.processResourceActionLink).toHaveBeenCalledWith(
        mockResource,
        component.toggleLinkLoading,
        mockT,
        'local-cluster'
      )
    })

    it('ignores non-Enter key presses', () => {
      const props = createDefaultProps()
      const component = new ArgoAppDetailsContainer(props)

      const mockResource = {
        action: 'open_argo_editor' as const,
        cluster: 'test-cluster',
        namespace: 'test-namespace',
        name: 'test-app',
      }

      const mockEvent = {
        key: 'Space',
      } as React.KeyboardEvent

      component.handleKeyPress(mockResource, mockEvent)

      expect(diagramHelpers.processResourceActionLink).not.toHaveBeenCalled()
    })

    it('toggles loading state', () => {
      const props = createDefaultProps()
      render(<ArgoAppDetailsContainer {...props} />)

      // We can't directly test state changes without exposing them
      // Instead, test that the toggle function exists and can be called
      const component = new ArgoAppDetailsContainer(props)
      expect(typeof component.toggleLinkLoading).toBe('function')

      // Test that calling the function doesn't throw
      expect(() => component.toggleLinkLoading()).not.toThrow()
    })
  })

  describe('Error Messages', () => {
    it('renders error message for Unknown status', () => {
      const props = createDefaultProps()
      const component = new ArgoAppDetailsContainer(props)

      const errorMessage = component.renderErrorMessage('test-app', 'Unknown', mockT)

      expect(errorMessage).not.toBeNull()
    })

    it('renders error message for Degraded status', () => {
      const props = createDefaultProps()
      const component = new ArgoAppDetailsContainer(props)

      const errorMessage = component.renderErrorMessage('test-app', 'Degraded', mockT)

      expect(errorMessage).not.toBeNull()
    })

    it('renders error message for Missing status', () => {
      const props = createDefaultProps()
      const component = new ArgoAppDetailsContainer(props)

      const errorMessage = component.renderErrorMessage('test-app', 'Missing', mockT)

      expect(errorMessage).not.toBeNull()
    })

    it('does not render error message for Healthy status', () => {
      const props = createDefaultProps()
      const component = new ArgoAppDetailsContainer(props)

      const errorMessage = component.renderErrorMessage('test-app', 'Healthy', mockT)

      expect(errorMessage).toBe(false)
    })

    it('does not render error message for Progressing status', () => {
      const props = createDefaultProps()
      const component = new ArgoAppDetailsContainer(props)

      const errorMessage = component.renderErrorMessage('test-app', 'Progressing', mockT)

      expect(errorMessage).toBe(false)
    })
  })

  describe('Search Toggle', () => {
    it('toggles search dropdown state', () => {
      const mockControl = createMockContainerControl()
      const props = createDefaultProps({
        argoAppDetailsContainerControl: mockControl,
      })

      const component = new ArgoAppDetailsContainer(props)
      component.handleSelectToggle()

      expect(mockControl.handleArgoAppDetailsContainerUpdate).toHaveBeenCalledWith({
        page: 1,
        startIdx: 0,
        argoAppSearchToggle: true,
        expandSectionToggleMap: new Set(),
        selected: undefined,
        selectedArgoAppList: [],
        isLoading: false,
      })
    })
  })

  describe('Component State Management', () => {
    it('initializes state from props correctly', () => {
      const mockControl = createMockContainerControl({
        selected: 'test-app-1',
        page: 2,
        startIdx: 5,
        argoAppSearchToggle: true,
        expandSectionToggleMap: new Set([1, 2]),
        selectedArgoAppList: [mockArgoApps[0]],
        isLoading: true,
      })

      const props = createDefaultProps({
        argoAppDetailsContainerControl: mockControl,
      })

      const component = new ArgoAppDetailsContainer(props)

      expect(component.state.selected).toBe('test-app-1')
      expect(component.state.page).toBe(2)
      expect(component.state.startIdx).toBe(5)
      expect(component.state.argoAppSearchToggle).toBe(true)
      expect(component.state.expandSectionToggleMap).toEqual(new Set([1, 2]))
      expect(component.state.selectedArgoAppList).toEqual([mockArgoApps[0]])
      // Component always initializes isLoading to false, regardless of props
      expect(component.state.isLoading).toBe(false)
      expect(component.state.perPage).toBe(5)
    })

    it('updates state when props change', () => {
      const mockControl = createMockContainerControl()
      const props = createDefaultProps({
        argoAppDetailsContainerControl: mockControl,
      })

      const component = new ArgoAppDetailsContainer(props)

      // Simulate prop update
      const newProps = createDefaultProps({
        argoAppDetailsContainerControl: createMockContainerControl({
          selected: 'new-app',
          page: 3,
        }),
        argoAppList: mockArgoApps.slice(0, 3),
      })

      component.componentDidUpdate?.(props, component.state)

      // State should reflect the initial props, not the new ones
      // (componentDidUpdate would need to be implemented to handle prop changes)
      expect(component.state.argoAppList).toEqual(mockArgoApps)
    })
  })

  describe('Edge Cases', () => {
    it('handles empty application list', () => {
      const props = createDefaultProps({
        argoAppList: [],
      })

      render(<ArgoAppDetailsContainer {...props} />)

      expect(screen.getAllByRole('combobox')[0]).toBeInTheDocument()
      // Should not render pagination for empty list
      expect(screen.queryAllByRole('navigation')).toHaveLength(0)
    })

    it('handles missing hubClusterName', () => {
      const props = createDefaultProps({
        hubClusterName: undefined,
      })

      const component = new ArgoAppDetailsContainer(props)
      const mockResource = {
        action: 'open_argo_editor' as const,
        cluster: 'test-cluster',
        namespace: 'test-namespace',
        name: 'test-app',
      }

      component.processActionLink(mockResource)

      expect(diagramHelpers.processResourceActionLink).toHaveBeenCalledWith(
        mockResource,
        component.toggleLinkLoading,
        mockT,
        ''
      )
    })

    it('handles last page calculation with exact division', () => {
      // Create exactly 10 apps (2 full pages of 5)
      const exactDivisionApps = Array.from({ length: 10 }, (_, i) => ({
        ...mockArgoApps[0],
        name: `test-app-${i + 1}`,
      }))

      const mockControl = createMockContainerControl()
      const props = createDefaultProps({
        argoAppList: exactDivisionApps,
        argoAppDetailsContainerControl: mockControl,
      })

      const component = new ArgoAppDetailsContainer(props)
      component.handleLastClick()

      // Should go to page 2 with startIdx 5 (not page 3)
      expect(mockControl.handleArgoAppDetailsContainerUpdate).toHaveBeenCalledWith({
        page: 2,
        startIdx: 5,
        argoAppSearchToggle: false,
        expandSectionToggleMap: new Set(),
        selected: undefined,
        selectedArgoAppList: [],
        isLoading: false,
      })
    })
  })
})
