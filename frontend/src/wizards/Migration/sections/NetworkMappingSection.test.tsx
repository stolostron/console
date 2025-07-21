/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, fireEvent } from '@testing-library/react'
import { NetworkMappingSection } from './NetworkMappingSection'

jest.mock('@patternfly/react-core/deprecated', () => ({
  Select: ({ children }: any) => <div data-testid="select">{children}</div>,
  SelectOption: ({ children }: any) => <div>{children}</div>,
  SelectVariant: { single: 'single' },
}))

const defaultProps = {
  srcNetwork: 'source-network-1',
  dstNetwork: '',
  setDstNetwork: jest.fn(),
  options: [
    { id: 'net1', value: 'network1', text: 'Network 1' },
    { id: 'net2', value: 'network2', text: 'Network 2' },
    { id: 'net3', value: 'network3', text: 'Network 3' },
  ],
}

describe('NetworkMappingSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initial rendering', () => {
    it('renders section title correctly', () => {
      render(<NetworkMappingSection {...defaultProps} />)

      expect(screen.getByText('Network mapping')).toBeInTheDocument()
    })

    it('displays source network value', () => {
      render(<NetworkMappingSection {...defaultProps} />)

      expect(screen.getByText('Source network')).toBeInTheDocument()
      expect(screen.getByText('source-network-1')).toBeInTheDocument()
    })

    it('displays target network label', () => {
      render(<NetworkMappingSection {...defaultProps} />)

      expect(screen.getByText('Target network')).toBeInTheDocument()
    })

    it('shows dash when destination network is empty', () => {
      render(<NetworkMappingSection {...defaultProps} />)

      expect(screen.getByText('-')).toBeInTheDocument()
    })

    it('shows destination network value when set', () => {
      const props = { ...defaultProps, dstNetwork: 'target-network-1' }
      render(<NetworkMappingSection {...props} />)

      expect(screen.getByText('target-network-1')).toBeInTheDocument()
    })
  })

  describe('editing functionality', () => {
    it('shows edit button initially', () => {
      render(<NetworkMappingSection {...defaultProps} />)

      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    it('hides edit button when in edit mode', () => {
      render(<NetworkMappingSection {...defaultProps} />)

      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)

      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })
  })

  describe('props validation', () => {
    it('handles empty source network', () => {
      const props = { ...defaultProps, srcNetwork: '' }
      render(<NetworkMappingSection {...props} />)

      expect(screen.getAllByText('-')).toHaveLength(2)
    })

    it('handles pre-selected destination network', () => {
      const props = { ...defaultProps, dstNetwork: 'network2' }
      render(<NetworkMappingSection {...props} />)

      expect(screen.getByText('network2')).toBeInTheDocument()
    })

    it('handles empty options array', () => {
      const props = { ...defaultProps, options: [] }
      render(<NetworkMappingSection {...props} />)

      expect(screen.getByText('Network mapping')).toBeInTheDocument()
    })
  })

  describe('component structure', () => {
    it('renders without crashing', () => {
      const { container } = render(<NetworkMappingSection {...defaultProps} />)
      expect(container).toBeInTheDocument()
    })

    it('maintains consistent layout structure', () => {
      render(<NetworkMappingSection {...defaultProps} />)

      expect(screen.getByText('Source network')).toBeInTheDocument()
      expect(screen.getByText('Target network')).toBeInTheDocument()
      expect(screen.getByText('Network mapping')).toBeInTheDocument()
    })

    it('displays read-only source content correctly', () => {
      render(<NetworkMappingSection {...defaultProps} />)

      expect(screen.getByText('source-network-1')).toBeInTheDocument()
    })
  })

  describe('prop updates', () => {
    it('updates display when props change', () => {
      const { rerender } = render(<NetworkMappingSection {...defaultProps} />)

      expect(screen.getByText('source-network-1')).toBeInTheDocument()

      rerender(<NetworkMappingSection {...defaultProps} srcNetwork="new-source" dstNetwork="new-target" />)

      expect(screen.getByText('new-source')).toBeInTheDocument()
      expect(screen.getByText('new-target')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles special characters in network names', () => {
      const props = {
        ...defaultProps,
        srcNetwork: 'network-with-special_chars!@#',
        dstNetwork: 'target_network-123',
      }
      render(<NetworkMappingSection {...props} />)

      expect(screen.getByText('network-with-special_chars!@#')).toBeInTheDocument()
      expect(screen.getByText('target_network-123')).toBeInTheDocument()
    })
  })
})
