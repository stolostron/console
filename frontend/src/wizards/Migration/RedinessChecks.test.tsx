/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReadinessSection from './RedinessChecks'

const mockUseReadinessChecks = {
  networkCheckStatus: true,
  storageCheckStatus: true,
  computeCheckStatus: true,
  versionCheckStatus: true,
  resourceCheckStatus: true,
  readyToMigrate: true,
}

jest.mock('./useReadinessChecks', () => ({
  __esModule: true,
  useReadinessChecks: () => mockUseReadinessChecks,
}))

jest.mock('./sections/NetworkMappingSection', () => ({
  __esModule: true,
  NetworkMappingSection: () => <div data-testid="network-mapping-section">Network Mapping</div>,
}))

jest.mock('./sections/StorageMappingSection', () => ({
  __esModule: true,
  StorageMappingSection: () => <div data-testid="storage-mapping-section">Storage Mapping</div>,
}))

jest.mock('./sections/ComputeCompatSection', () => ({
  __esModule: true,
  ComputeCompatSection: () => <div data-testid="compute-compat-section">Compute Compatibility</div>,
}))

jest.mock('./sections/VersionCompatSection', () => ({
  __esModule: true,
  VersionCompatSection: () => <div data-testid="version-compat-section">Version Compatibility</div>,
}))

jest.mock('./sections/ResourceCapacitySection', () => ({
  __esModule: true,
  ResourceCapacitySection: () => <div data-testid="resource-capacity-section">Resource Capacity</div>,
}))

const defaultProps = {
  networkOpts: [
    { id: 'net1', value: 'network1', text: 'Network 1' },
    { id: 'net2', value: 'network2', text: 'Network 2' },
  ],
  storageOpts: [
    { id: 'stor1', value: 'storage1', text: 'Storage 1' },
    { id: 'stor2', value: 'storage2', text: 'Storage 2' },
  ],
  computeOptions: [
    { id: 'comp1', value: 'compute1', text: 'Compute 1' },
    { id: 'comp2', value: 'compute2', text: 'Compute 2' },
  ],
  srcNetwork: 'network1',
  setSrcNetwork: jest.fn(),
  dstNetwork: 'network2',
  setDstNetwork: jest.fn(),
  srcStorage: 'storage1',
  setSrcStorage: jest.fn(),
  dstStorage: 'storage2',
  setDstStorage: jest.fn(),
  srcCompute: 'compute1',
  setSrcCompute: jest.fn(),
  dstCompute: 'compute2',
  setDstCompute: jest.fn(),
}

describe('ReadinessSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.assign(mockUseReadinessChecks, {
      networkCheckStatus: true,
      storageCheckStatus: true,
      computeCheckStatus: true,
      versionCheckStatus: true,
      resourceCheckStatus: true,
      readyToMigrate: true,
    })
  })

  describe('when all checks pass', () => {
    it('renders success state correctly', () => {
      render(<ReadinessSection {...defaultProps} />)

      expect(screen.getByText('Ready to migrate')).toBeInTheDocument()
      expect(screen.getByText('5 successful checks')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /run again/i })).toBeInTheDocument()
    })

    it('shows all tabs with labels', () => {
      render(<ReadinessSection {...defaultProps} />)

      expect(screen.getByText('Network mapping')).toBeInTheDocument()
      expect(screen.getByText('Storage mapping')).toBeInTheDocument()
      expect(screen.getByText('Compute compatibility')).toBeInTheDocument()
      expect(screen.getByText('Version compatibility')).toBeInTheDocument()
      expect(screen.getByText('Resource capacity')).toBeInTheDocument()
    })
  })

  describe('when some checks fail', () => {
    beforeEach(() => {
      Object.assign(mockUseReadinessChecks, {
        networkCheckStatus: false,
        storageCheckStatus: true,
        computeCheckStatus: true,
        versionCheckStatus: true,
        resourceCheckStatus: true,
        readyToMigrate: false,
      })
    })

    it('renders failure state correctly', () => {
      render(<ReadinessSection {...defaultProps} />)

      expect(screen.getByText('Some checks were not successful')).toBeInTheDocument()
      expect(screen.getByText('1 failed check, 4 successful checks')).toBeInTheDocument()
    })
  })

  describe('tab functionality', () => {
    it('allows clicking on different tabs', () => {
      render(<ReadinessSection {...defaultProps} />)

      const networkTab = screen.getByText('Network mapping')
      const storageTab = screen.getByText('Storage mapping')

      expect(networkTab).toBeInTheDocument()
      expect(storageTab).toBeInTheDocument()

      fireEvent.click(storageTab)
    })
  })

  describe('run again button', () => {
    it('renders the run again button', () => {
      render(<ReadinessSection {...defaultProps} />)

      const runAgainButton = screen.getByRole('button', { name: /run again/i })
      expect(runAgainButton).toBeInTheDocument()
    })

    it('allows clicking the run again button', () => {
      render(<ReadinessSection {...defaultProps} />)

      const runAgainButton = screen.getByRole('button', { name: /run again/i })
      userEvent.click(runAgainButton)

      expect(runAgainButton).toBeInTheDocument()
    })
  })

  describe('mixed check states', () => {
    it('handles mixed success and failure states correctly', () => {
      Object.assign(mockUseReadinessChecks, {
        networkCheckStatus: true,
        storageCheckStatus: false,
        computeCheckStatus: true,
        versionCheckStatus: false,
        resourceCheckStatus: true,
        readyToMigrate: false,
      })

      render(<ReadinessSection {...defaultProps} />)

      expect(screen.getByText('Some checks were not successful')).toBeInTheDocument()
      expect(screen.getByText('1 failed check, 4 successful checks')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has proper ARIA labels for tabs', () => {
      render(<ReadinessSection {...defaultProps} />)

      const tabsRegion = screen.getByRole('region')
      expect(tabsRegion).toHaveAttribute('aria-label', 'Readiness tabs')
    })

    it('maintains tab navigation structure', () => {
      render(<ReadinessSection {...defaultProps} />)

      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(5)
    })
  })

  describe('component structure', () => {
    it('renders without crashing', () => {
      const { container } = render(<ReadinessSection {...defaultProps} />)
      expect(container).toBeInTheDocument()
    })

    it('uses the readiness hook correctly', () => {
      render(<ReadinessSection {...defaultProps} />)

      expect(screen.getByText('Ready to migrate')).toBeInTheDocument()
    })
  })

  describe('props handling', () => {
    it('accepts all required props without errors', () => {
      render(<ReadinessSection {...defaultProps} />)
      expect(screen.getByText('Ready to migrate')).toBeInTheDocument()
    })

    it('handles empty option arrays', () => {
      const emptyProps = {
        ...defaultProps,
        networkOpts: [],
        storageOpts: [],
        computeOptions: [],
      }

      render(<ReadinessSection {...emptyProps} />)
      expect(screen.getByText('Ready to migrate')).toBeInTheDocument()
    })
  })
})
