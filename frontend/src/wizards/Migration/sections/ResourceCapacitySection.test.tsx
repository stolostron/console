/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { ResourceCapacitySection } from './ResourceCapacitySection'

const mockUseMigrationFormState = {
  storageUsed: 111,
  storageReserved: 6,
  storageTotal: 238,
}

jest.mock('../useMigrationFormState', () => ({
  useMigrationFormState: () => mockUseMigrationFormState,
}))

jest.mock('../StorageBulletChart', () => ({
  StorageBulletChart: () => <div data-testid="storage-bullet-chart">Storage Chart</div>,
}))

describe('ResourceCapacitySection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.assign(mockUseMigrationFormState, {
      storageUsed: 111,
      storageReserved: 6,
      storageTotal: 238,
    })
  })

  describe('initial rendering', () => {
    it('renders section title correctly', () => {
      render(<ResourceCapacitySection />)

      expect(screen.getByText('Resource capacity')).toBeInTheDocument()
    })

    it('displays source size section', () => {
      render(<ResourceCapacitySection />)

      expect(screen.getByText('Source size')).toBeInTheDocument()
    })

    it('displays target cluster capacity section', () => {
      render(<ResourceCapacitySection />)

      expect(screen.getByText('Target cluster capacity (Cluster 2)')).toBeInTheDocument()
    })
  })

  describe('source size information', () => {
    it('displays storage information from hook', () => {
      render(<ResourceCapacitySection />)

      expect(screen.getByText('Storage 238 GB')).toBeInTheDocument()
    })

    it('displays placeholder memory information', () => {
      render(<ResourceCapacitySection />)

      expect(screen.getByText('Memory XXX GB')).toBeInTheDocument()
    })

    it('displays placeholder CPU information', () => {
      render(<ResourceCapacitySection />)

      expect(screen.getByText('CPU XXX cores')).toBeInTheDocument()
    })
  })

  describe('storage bullet charts', () => {
    it('displays chart content correctly', () => {
      render(<ResourceCapacitySection />)

      const chartTexts = screen.getAllByText('Storage Chart')
      expect(chartTexts.length).toBeGreaterThan(0)
    })
  })

  describe('hook integration', () => {
    it('uses values from useMigrationFormState hook', () => {
      Object.assign(mockUseMigrationFormState, {
        storageUsed: 200,
        storageReserved: 10,
        storageTotal: 500,
      })

      render(<ResourceCapacitySection />)

      expect(screen.getByText('Storage 500 GB')).toBeInTheDocument()
    })

    it('updates display when hook values change', () => {
      const { rerender } = render(<ResourceCapacitySection />)

      expect(screen.getByText('Storage 238 GB')).toBeInTheDocument()

      Object.assign(mockUseMigrationFormState, {
        storageUsed: 150,
        storageReserved: 25,
        storageTotal: 400,
      })

      rerender(<ResourceCapacitySection />)

      expect(screen.getByText('Storage 400 GB')).toBeInTheDocument()
      expect(screen.queryByText('Storage 238 GB')).not.toBeInTheDocument()
    })
  })

  describe('component structure', () => {
    it('renders without crashing', () => {
      const { container } = render(<ResourceCapacitySection />)
      expect(container).toBeInTheDocument()
    })

    it('maintains proper layout structure', () => {
      render(<ResourceCapacitySection />)

      expect(screen.getByText('Resource capacity')).toBeInTheDocument()
      expect(screen.getByText('Source size')).toBeInTheDocument()
      expect(screen.getByText('Target cluster capacity (Cluster 2)')).toBeInTheDocument()
    })

    it('has divider between sections', () => {
      const { container } = render(<ResourceCapacitySection />)

      const dividers = container.querySelectorAll('[class*="divider"]')
      expect(dividers.length).toBeGreaterThan(0)
    })
  })

  describe('accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<ResourceCapacitySection />)

      const mainHeading = screen.getByRole('heading', { level: 3 })
      const subHeadings = screen.getAllByRole('heading', { level: 5 })

      expect(mainHeading).toHaveTextContent('Resource capacity')
      expect(subHeadings).toHaveLength(2)
      expect(subHeadings[0]).toHaveTextContent('Source size')
      expect(subHeadings[1]).toHaveTextContent('Target cluster capacity (Cluster 2)')
    })
  })

  describe('edge cases', () => {
    it('handles zero storage values', () => {
      Object.assign(mockUseMigrationFormState, {
        storageUsed: 0,
        storageReserved: 0,
        storageTotal: 0,
      })

      render(<ResourceCapacitySection />)

      expect(screen.getByText('Storage 0 GB')).toBeInTheDocument()
    })

    it('handles large storage values', () => {
      Object.assign(mockUseMigrationFormState, {
        storageUsed: 10000,
        storageReserved: 5000,
        storageTotal: 50000,
      })

      render(<ResourceCapacitySection />)

      expect(screen.getByText('Storage 50000 GB')).toBeInTheDocument()
    })
  })
})
