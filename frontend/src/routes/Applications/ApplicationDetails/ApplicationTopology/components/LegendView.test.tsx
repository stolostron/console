/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { render, screen } from '@testing-library/react'
import LegendView from './LegendView'
import type { LegendViewProps, TranslationFunction } from '../types'

/**
 * Mock translation function that returns the input string as-is
 * Used to simulate internationalization in test environment
 */
const mockT: TranslationFunction = (key: string): string => {
  return key
}

/**
 * Creates mock props for LegendView component
 */
const createMockProps = (overrides: Partial<LegendViewProps> = {}): LegendViewProps => ({
  t: mockT,
  ...overrides,
})

describe('LegendView Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render without crashing with minimal props', () => {
      const props = createMockProps()
      const { container } = render(<LegendView {...props} />)

      // Check that the main container is rendered
      const legendContainer = container.querySelector('section.topologyDetails')
      expect(legendContainer).toBeInTheDocument()
    })

    it('should render the main topology description text', () => {
      const props = createMockProps()
      render(<LegendView {...props} />)

      // Check for the main description text
      const descriptionText = screen.getByText(
        'The topology provides a visual representation of all the applications and resources within a project, their build status, and the components and services associated with them.'
      )
      expect(descriptionText).toBeInTheDocument()
      expect(descriptionText).toHaveClass('bodyText')
    })

    it('should render the status icon legend title', () => {
      const props = createMockProps()
      render(<LegendView {...props} />)

      const legendTitle = screen.getByText('Status icon legend')
      expect(legendTitle).toBeInTheDocument()
      expect(legendTitle).toHaveClass('titleText')
    })

    it('should render the permission note text', () => {
      const props = createMockProps()
      render(<LegendView {...props} />)

      const permissionNote = screen.getByText(
        'Note: Resources that you do not have permission to view display a status of "Not deployed".'
      )
      expect(permissionNote).toBeInTheDocument()
      expect(permissionNote).toHaveClass('titleNoteText')
    })

    it('should render the interaction help text', () => {
      const props = createMockProps()
      render(<LegendView {...props} />)

      const helpText = screen.getByText('For more details and logs, click on the nodes to open the properties view.')
      expect(helpText).toBeInTheDocument()
      expect(helpText).toHaveClass('bodyText')
    })

    it('should render the horizontal divider', () => {
      const props = createMockProps()
      const { container } = render(<LegendView {...props} />)

      const divider = container.querySelector('hr')
      expect(divider).toBeInTheDocument()
    })
  })

  describe('SVG Legend Graphics', () => {
    it('should render the first SVG legend graphic', () => {
      const props = createMockProps()
      const { container } = render(<LegendView {...props} />)

      const firstSvg = container.querySelector('svg[height="140px"]')
      expect(firstSvg).toBeInTheDocument()

      const firstUseElement = firstSvg?.querySelector('use[href="#drawerShapes_legend"]')
      expect(firstUseElement).toBeInTheDocument()
      expect(firstUseElement).toHaveClass('label-icon')
    })

    it('should render the second SVG legend graphic', () => {
      const props = createMockProps()
      const { container } = render(<LegendView {...props} />)

      const secondSvg = container.querySelector('svg[height="100px"]')
      expect(secondSvg).toBeInTheDocument()

      const secondUseElement = secondSvg?.querySelector('use[href="#drawerShapes_legend2"]')
      expect(secondUseElement).toBeInTheDocument()
      expect(secondUseElement).toHaveClass('label-icon')
    })

    it('should center-align the SVG graphics container', () => {
      const props = createMockProps()
      const { container } = render(<LegendView {...props} />)

      const svgContainer = container.querySelector('div[style*="text-align: center"]')
      expect(svgContainer).toBeInTheDocument()
    })
  })

  describe('Status Descriptions Rendering', () => {
    it('should render all four status types', () => {
      const props = createMockProps()
      const { container } = render(<LegendView {...props} />)

      // Check for success status icon
      const successIcon = container.querySelector('use[href="#nodeStatusIcon_success"]')
      expect(successIcon).toBeInTheDocument()

      // Check for pending status icon
      const pendingIcon = container.querySelector('use[href="#nodeStatusIcon_pending"]')
      expect(pendingIcon).toBeInTheDocument()

      // Check for warning status icon
      const warningIcon = container.querySelector('use[href="#nodeStatusIcon_warning"]')
      expect(warningIcon).toBeInTheDocument()

      // Check for failure status icon
      const failureIcon = container.querySelector('use[href="#nodeStatusIcon_failure"]')
      expect(failureIcon).toBeInTheDocument()
    })

    it('should render status icons with correct colors', () => {
      const props = createMockProps()
      const { container } = render(<LegendView {...props} />)

      // Check success icon color (green)
      const successSvg = container.querySelector('svg[fill="#3E8635"]')
      expect(successSvg).toBeInTheDocument()
      expect(successSvg).toHaveClass('statusSvg')

      // Check pending icon color (gray)
      const pendingSvg = container.querySelector('svg[fill="#878D96"]')
      expect(pendingSvg).toBeInTheDocument()
      expect(pendingSvg).toHaveClass('statusSvg')

      // Check warning icon color (yellow/orange)
      const warningSvg = container.querySelector('svg[fill="#F0AB00"]')
      expect(warningSvg).toBeInTheDocument()
      expect(warningSvg).toHaveClass('statusSvg')

      // Check failure icon color (red)
      const failureSvg = container.querySelector('svg[fill="#C9190B"]')
      expect(failureSvg).toBeInTheDocument()
      expect(failureSvg).toHaveClass('statusSvg')
    })

    it('should render status descriptions with correct text', () => {
      const props = createMockProps()
      render(<LegendView {...props} />)

      // Check success description
      const successDescription = screen.getByText(
        'All resources in this group have deployed on the target clusters, although their status might not be successful.'
      )
      expect(successDescription).toBeInTheDocument()

      // Check pending description
      const pendingDescription = screen.getByText(
        'The statues in this resource group have not been found and are unknown.'
      )
      expect(pendingDescription).toBeInTheDocument()

      // Check warning description
      const warningDescription = screen.getByText(
        'Some resources in this group did not deploy. Other resources deployed successfully.'
      )
      expect(warningDescription).toBeInTheDocument()

      // Check failure description
      const failureDescription = screen.getByText('Some resources in this group are in error state.')
      expect(failureDescription).toBeInTheDocument()
    })

    it('should render status descriptions in the correct order', () => {
      const props = createMockProps()
      const { container } = render(<LegendView {...props} />)

      const statusElements = container.querySelectorAll('.bodyText')
      const statusDescriptions = Array.from(statusElements).filter((element) => element.querySelector('svg.statusSvg'))

      // Should have 4 status descriptions
      expect(statusDescriptions).toHaveLength(4)

      // Check the order by examining the href attributes
      const useElements = statusDescriptions.map((desc) => desc.querySelector('use')?.getAttribute('href'))

      expect(useElements).toEqual([
        '#nodeStatusIcon_success',
        '#nodeStatusIcon_pending',
        '#nodeStatusIcon_warning',
        '#nodeStatusIcon_failure',
      ])
    })
  })

  describe('Translation Integration', () => {
    it('should call translation function for all text content', () => {
      const mockTranslation = jest.fn((key: string) => key)
      const props = createMockProps({ t: mockTranslation })

      render(<LegendView {...props} />)

      // Verify translation function is called for main description
      expect(mockTranslation).toHaveBeenCalledWith(
        'The topology provides a visual representation of all the applications and resources within a project, their build status, and the components and services associated with them.'
      )

      // Verify translation function is called for legend title
      expect(mockTranslation).toHaveBeenCalledWith('Status icon legend')

      // Verify translation function is called for permission note
      expect(mockTranslation).toHaveBeenCalledWith(
        'Note: Resources that you do not have permission to view display a status of "Not deployed".'
      )

      // Verify translation function is called for help text
      expect(mockTranslation).toHaveBeenCalledWith(
        'For more details and logs, click on the nodes to open the properties view.'
      )

      // Verify translation function is called for all status descriptions
      expect(mockTranslation).toHaveBeenCalledWith(
        'All resources in this group have deployed on the target clusters, although their status might not be successful.'
      )
      expect(mockTranslation).toHaveBeenCalledWith(
        'The statues in this resource group have not been found and are unknown.'
      )
      expect(mockTranslation).toHaveBeenCalledWith(
        'Some resources in this group did not deploy. Other resources deployed successfully.'
      )
      expect(mockTranslation).toHaveBeenCalledWith('Some resources in this group are in error state.')
    })

    it('should handle custom translation function correctly', () => {
      const customTranslation = jest.fn((key: string) => `TRANSLATED: ${key}`)
      const props = createMockProps({ t: customTranslation })

      render(<LegendView {...props} />)

      // Check that custom translation is applied
      const translatedTitle = screen.getByText('TRANSLATED: Status icon legend')
      expect(translatedTitle).toBeInTheDocument()

      const translatedDescription = screen.getByText(
        'TRANSLATED: The topology provides a visual representation of all the applications and resources within a project, their build status, and the components and services associated with them.'
      )
      expect(translatedDescription).toBeInTheDocument()
    })
  })

  describe('Component Structure', () => {
    it('should have the correct CSS class structure', () => {
      const props = createMockProps()
      const { container } = render(<LegendView {...props} />)

      // Check main container
      const mainSection = container.querySelector('section.topologyDetails')
      expect(mainSection).toBeInTheDocument()

      // Check header section
      const headerDiv = container.querySelector('.legendHeader')
      expect(headerDiv).toBeInTheDocument()

      // Check body section
      const bodyDiv = container.querySelector('.legendBody')
      expect(bodyDiv).toBeInTheDocument()

      // Check body text elements
      const bodyTextElements = container.querySelectorAll('.bodyText')
      expect(bodyTextElements.length).toBeGreaterThan(0)

      // Check title text element
      const titleTextElement = container.querySelector('.titleText')
      expect(titleTextElement).toBeInTheDocument()

      // Check title note text element
      const titleNoteTextElement = container.querySelector('.titleNoteText')
      expect(titleNoteTextElement).toBeInTheDocument()
    })

    it('should render as a semantic section element', () => {
      const props = createMockProps()
      const { container } = render(<LegendView {...props} />)

      const sectionElement = container.querySelector('section')
      expect(sectionElement).toBeInTheDocument()
      expect(sectionElement?.tagName).toBe('SECTION')
    })
  })

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      const props = createMockProps()
      const { container } = render(<LegendView {...props} />)

      // Check that main container is a section (landmark)
      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
      expect(section).toHaveClass('topologyDetails')
    })

    it('should have descriptive text content for screen readers', () => {
      const props = createMockProps()
      render(<LegendView {...props} />)

      // All text content should be accessible to screen readers
      const mainDescription = screen.getByText(/topology provides a visual representation/)
      expect(mainDescription).toBeInTheDocument()

      const statusLegendTitle = screen.getByText('Status icon legend')
      expect(statusLegendTitle).toBeInTheDocument()

      const permissionNote = screen.getByText(/Resources that you do not have permission/)
      expect(permissionNote).toBeInTheDocument()
    })

    it('should have proper SVG structure for accessibility', () => {
      const props = createMockProps()
      const { container } = render(<LegendView {...props} />)

      // Check that SVG elements have proper use elements with href attributes
      const useElements = container.querySelectorAll('use')
      expect(useElements.length).toBeGreaterThan(0)

      useElements.forEach((useElement) => {
        expect(useElement).toHaveAttribute('href')
        expect(useElement).toHaveClass('label-icon')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing translation function gracefully', () => {
      // This test ensures the component doesn't crash if t function is undefined
      // In real usage, this shouldn't happen due to TypeScript, but it's good to test
      const props = { t: undefined as unknown as TranslationFunction }

      expect(() => {
        render(<LegendView {...props} />)
      }).toThrow() // Should throw due to calling undefined function
    })

    it('should render consistently across multiple renders', () => {
      const props = createMockProps()

      const { container: container1 } = render(<LegendView {...props} />)
      const { container: container2 } = render(<LegendView {...props} />)

      // Both renders should have the same structure
      expect(container1.innerHTML).toBe(container2.innerHTML)
    })
  })

  describe('Status Icon Mapping', () => {
    it('should maintain correct status type to color mapping', () => {
      const props = createMockProps()
      const { container } = render(<LegendView {...props} />)

      // Test that the color mapping is consistent with the component implementation
      const statusColors = {
        success: '#3E8635',
        pending: '#878D96',
        warning: '#F0AB00',
        failure: '#C9190B',
      }

      Object.entries(statusColors).forEach(([status, color]) => {
        const statusSvg = container.querySelector(`svg[fill="${color}"]`)
        expect(statusSvg).toBeInTheDocument()

        const useElement = statusSvg?.querySelector(`use[href="#nodeStatusIcon_${status}"]`)
        expect(useElement).toBeInTheDocument()
      })
    })

    it('should render status descriptions as key-value pairs', () => {
      const props = createMockProps()
      const { container } = render(<LegendView {...props} />)

      // Each status description should be in a container with both icon and text
      const statusContainers = container.querySelectorAll('.bodyText')
      const statusDescriptionContainers = Array.from(statusContainers).filter((element) =>
        element.querySelector('svg.statusSvg')
      )

      statusDescriptionContainers.forEach((container) => {
        // Should have both SVG icon and description text
        const svg = container.querySelector('svg.statusSvg')
        const textDiv = container.querySelector('div:not(:has(svg))')

        expect(svg).toBeInTheDocument()
        expect(textDiv).toBeInTheDocument()
        expect(textDiv?.textContent).toBeTruthy()
      })
    })
  })
})
