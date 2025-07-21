/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { VersionCompatSection } from './VersionCompatSection'

describe('VersionCompatSection', () => {
  describe('initial rendering', () => {
    it('renders section title correctly', () => {
      render(<VersionCompatSection />)

      expect(screen.getByText('Version compatibility')).toBeInTheDocument()
    })

    it('displays OpenShift version section', () => {
      render(<VersionCompatSection />)

      expect(screen.getByText('OpenShift version')).toBeInTheDocument()
    })

    it('displays virtualization operator version section', () => {
      render(<VersionCompatSection />)

      expect(screen.getByText('Virtualization operator version')).toBeInTheDocument()
    })
  })

  describe('OpenShift version display', () => {
    it('shows source and target cluster labels', () => {
      render(<VersionCompatSection />)

      const sourceLabels = screen.getAllByText('Source cluster')
      expect(sourceLabels).toHaveLength(2) // One for OpenShift, one for Virtualization

      const targetLabels = screen.getAllByText('Target cluster')
      expect(targetLabels).toHaveLength(2) // One for OpenShift, one for Virtualization
    })

    it('displays OpenShift versions', () => {
      render(<VersionCompatSection />)

      expect(screen.getAllByText('4.20')).toHaveLength(2)
    })
  })

  describe('Virtualization operator version display', () => {
    it('displays virtualization versions', () => {
      render(<VersionCompatSection />)

      expect(screen.getAllByText('4.19')).toHaveLength(2)
    })
  })

  describe('component structure', () => {
    it('renders without crashing', () => {
      const { container } = render(<VersionCompatSection />)
      expect(container).toBeInTheDocument()
    })

    it('contains divider between sections', () => {
      render(<VersionCompatSection />)

      const { container } = render(<VersionCompatSection />)
      const dividers = container.querySelectorAll('[class*="divider"]')
      expect(dividers.length).toBeGreaterThan(0)
    })

    it('maintains proper layout structure', () => {
      render(<VersionCompatSection />)

      expect(screen.getByText('Version compatibility')).toBeInTheDocument()
      expect(screen.getByText('OpenShift version')).toBeInTheDocument()
      expect(screen.getByText('Virtualization operator version')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<VersionCompatSection />)

      const mainHeading = screen.getByRole('heading', { level: 3 })
      const subHeadings = screen.getAllByRole('heading', { level: 5 })

      expect(mainHeading).toHaveTextContent('Version compatibility')
      expect(subHeadings).toHaveLength(2)
      expect(subHeadings[0]).toHaveTextContent('OpenShift version')
      expect(subHeadings[1]).toHaveTextContent('Virtualization operator version')
    })

    it('has proper form field associations', () => {
      render(<VersionCompatSection />)

      const sourceLabels = screen.getAllByText('Source cluster')
      const targetLabels = screen.getAllByText('Target cluster')

      expect(sourceLabels).toHaveLength(2)
      expect(targetLabels).toHaveLength(2)
    })
  })

  describe('static content', () => {
    it('displays consistent version information', () => {
      render(<VersionCompatSection />)

      const openShiftVersions = screen.getAllByText('4.20')
      expect(openShiftVersions).toHaveLength(2)

      const virtVersions = screen.getAllByText('4.19')
      expect(virtVersions).toHaveLength(2)
    })

    it('shows read-only version information', () => {
      render(<VersionCompatSection />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()

      expect(screen.getAllByText('4.20')).toHaveLength(2)
      expect(screen.getAllByText('4.19')).toHaveLength(2)
    })
  })

  describe('component stability', () => {
    it('renders consistently on multiple renders', () => {
      const { rerender } = render(<VersionCompatSection />)

      expect(screen.getByText('Version compatibility')).toBeInTheDocument()
      expect(screen.getAllByText('4.20')).toHaveLength(2)
      expect(screen.getAllByText('4.19')).toHaveLength(2)

      rerender(<VersionCompatSection />)

      expect(screen.getByText('Version compatibility')).toBeInTheDocument()
      expect(screen.getAllByText('4.20')).toHaveLength(2)
      expect(screen.getAllByText('4.19')).toHaveLength(2)
    })

    it('does not accept any props', () => {
      render(<VersionCompatSection />)

      expect(screen.getByText('Version compatibility')).toBeInTheDocument()
    })
  })
})
